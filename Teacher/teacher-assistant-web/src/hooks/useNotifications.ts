import { useEffect } from 'react';
import type { Todo, Group } from '../components/Groups';
import { getUserData, saveUserData } from '../lib/db';

export function useNotifications() {
  useEffect(() => {
    const checkReminders = async () => {
      const todos = (await getUserData('teacher_todos') || {}) as Record<string, Todo[]>;
      const groups = (await getUserData('teacher_groups') || []) as Group[];
      
      let changed = false;
      const now = new Date().getTime();

      Object.keys(todos).forEach(groupId => {
        const groupTodos = todos[groupId];
        if (!groupTodos) return;
        
        groupTodos.forEach(todo => {
          if (todo.completed || todo.notified || !todo.date || !todo.time) return;

          const [year, month, day] = todo.date.split('-').map(Number);
          const [hour, minute] = todo.time.split(':').map(Number);
          const targetDate = new Date(year, month - 1, day, hour, minute).getTime();

          let triggerTime = targetDate;
          
          if (todo.reminderValue !== undefined && todo.reminderUnit) {
             const multiplier = todo.reminderUnit === 'min' ? 60 * 1000 :
                                todo.reminderUnit === 'hour' ? 60 * 60 * 1000 :
                                24 * 60 * 60 * 1000;
             triggerTime = targetDate - (todo.reminderValue * multiplier);
          } else if (todo.reminderType) {
             if (todo.reminderType === '10_min') triggerTime -= 10 * 60 * 1000;
             else if (todo.reminderType === '1_hour') triggerTime -= 60 * 60 * 1000;
             else if (todo.reminderType === '1_day') triggerTime -= 24 * 60 * 60 * 1000;
             else if (todo.reminderType === '2_days') triggerTime -= 2 * 24 * 60 * 60 * 1000;
          }

          if (now >= triggerTime) {
            // Send notification
            const groupName = groups.find(g => g.id === groupId)?.name || 'Csoport';
            let reminderText = 'Most esedékes';
            
            if (todo.reminderValue) {
               reminderText = `${todo.reminderValue} ${todo.reminderUnit === 'min' ? 'perc' : todo.reminderUnit === 'hour' ? 'óra' : 'nap'} múlva esedékes`;
            } else if (todo.reminderType && todo.reminderType !== 'at_time') {
               reminderText = todo.reminderType === '10_min' ? '10 perc múlva esedékes' :
                              todo.reminderType === '1_hour' ? '1 óra múlva esedékes' : 
                              todo.reminderType === '1_day' ? 'Holnap esedékes' : '2 nap múlva esedékes';
            }

            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification(`Emlékeztető: ${groupName}`, {
                body: `${todo.text}\n(${reminderText})`,
                icon: '/favicon.ico' // optional
              });
            }
            
            window.dispatchEvent(new CustomEvent('app-notification', { 
               detail: { title: `Emlékeztető: ${groupName}`, body: `${todo.text}\n(${reminderText})` } 
            }));

            // Mark as notified
            todo.notified = true;
            changed = true;
          }
        });
      });

      if (changed) {
        await saveUserData('teacher_todos', todos);
      }
    };

    // Check every 30 seconds
    const intervalId = setInterval(() => { checkReminders().catch(console.error); }, 30000);
    // Initial check
    setTimeout(() => { checkReminders().catch(console.error); }, 2000);

    return () => clearInterval(intervalId);
  }, []);
}
