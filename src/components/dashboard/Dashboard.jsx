import React from 'react';
import ScheduleWidget from './widgets/ScheduleWidget';
import DigitalClockWidget from './widgets/DigitalClockWidget';
import RandomStudentWidget from './widgets/RandomStudentWidget';
import VacationWidget from './widgets/VacationWidget';
import MiniCalendarWidget from './widgets/MiniCalendarWidget';
import MiniTimerWidget from './widgets/MiniTimerWidget';
import MessagesWidget from './widgets/MessagesWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import QuoteWidget from './widgets/QuoteWidget';
import TodosWidget from './widgets/TodosWidget';
import PostitWidget from './widgets/PostitWidget';
import HabitTrackerWidget from './widgets/HabitTrackerWidget';
import HydrationTrackerWidget from './widgets/HydrationTrackerWidget';
import BookmarksWidget from './widgets/BookmarksWidget';
import WeatherWidget from './widgets/WeatherWidget';
import SmartNotificationWidget from './widgets/SmartNotificationWidget';

export default function Dashboard({
  schedule,
  loadingSchedule,
  scheduleDay,
  selectedDayIndex,
  setSelectedDayIndex,
  fetchSchedule,
  currentTime,
  liveScheduleInfo,
  vacation,
  widgetSettings,
  widgetPositions,
  setWidgetPositions,
  widgetSizes,
  changeWidgetWidth,
  widgetHeights,
  changeWidgetHeight,
  selectedStudent,
  isPickingStudent,
  pickedGroup,
  handlePickRandomStudent,
  miniTimerLeft,
  setMiniTimerLeft,
  miniTimerRunning,
  setMiniTimerRunning,
  dailyQuote,
  quoteType,
  setQuoteType,
  setQuoteOffset,
  todos,
  setTodos,
  setTodoModalOpen,
  postit,
  setPostit,
  habitProgress,
  setHabitProgress,
  hydrationProgress,
  setHydrationProgress,
  bookmarks,
  weatherData,
  weatherLocation,
  setActiveTab,
  topSmartNotification,
  handleActionNotification,
  handleDismissNotification,
  openNotificationDrawer,
  totalNotificationsCount = 1,
  onRecheckTasks,
  isCheckingTasks = false
}) {
  const handleDragStart = (e, key) => {
    if (!widgetSettings.editMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', key);
  };

  const handleDragOver = (e) => {
    if (!widgetSettings.editMode) return;
    e.preventDefault();
  };

  const handleDropEmpty = (e, c, r) => {
    if (!widgetSettings.editMode) return;
    const sourceKey = e.dataTransfer.getData('text/plain');
    if (!sourceKey || !widgetPositions[sourceKey]) return;
    setWidgetPositions((prev) => {
      const n = { ...prev, [sourceKey]: { c, r } };
      localStorage.setItem('ekreta_widget_positions', JSON.stringify(n));
      return n;
    });
  };

  const handleDrop = (e, targetKey) => {
    if (!widgetSettings.editMode) return;
    const sourceKey = e.dataTransfer.getData('text/plain');
    if (sourceKey === targetKey || !sourceKey || !widgetPositions[sourceKey] || !widgetPositions[targetKey]) return;
    setWidgetPositions((prev) => {
      const n = { ...prev };
      const temp = n[targetKey];
      n[targetKey] = n[sourceKey];
      n[sourceKey] = temp;
      localStorage.setItem('ekreta_widget_positions', JSON.stringify(n));
      return n;
    });
  };

  const sharedWidgetProps = {
    widgetSettings,
    widgetPositions,
    widgetSizes,
    widgetHeights,
    changeWidgetWidth,
    changeWidgetHeight,
    handleDragStart,
    handleDragOver,
    handleDrop
  };

  return (
    <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
          gap: '12px',
          alignContent: 'stretch',
          flex: 1,
          height: '100%',
          minHeight: 0,
          position: 'relative',
          ...(widgetSettings.editMode ? { borderRadius: '4px' } : {})
        }}
        onDragOver={(e) => {
          if (widgetSettings.editMode) e.preventDefault();
        }}
      >
        {/* Intelligens Értesítés (SNE) Csempe piros kerettel */}
        {widgetSettings.showSmartNotification !== false && (
          <SmartNotificationWidget
            notification={topSmartNotification}
            onAction={handleActionNotification}
            onDismiss={handleDismissNotification}
            onOpenDrawer={openNotificationDrawer}
            totalNotificationsCount={totalNotificationsCount}
            onRefresh={onRecheckTasks}
            isChecking={isCheckingTasks}
            {...sharedWidgetProps}
          />
        )}
        {/* Schedule Section */}
        <ScheduleWidget
          schedule={schedule}
          loadingSchedule={loadingSchedule}
          selectedDayIndex={selectedDayIndex}
          setSelectedDayIndex={setSelectedDayIndex}
          fetchSchedule={fetchSchedule}
          scheduleDay={scheduleDay}
          currentTime={currentTime}
          widgetSettings={widgetSettings}
          widgetPositions={widgetPositions}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          liveScheduleInfo={liveScheduleInfo}
        />

        {/* Grid Background/Drop Targets in Edit Mode */}
        {widgetSettings.editMode &&
          Array.from({ length: 36 }).map((_, i) => {
            const r = Math.floor(i / 6) + 1;
            const c = (i % 6) + 1;
            return (
              <div
                key={`cell-${c}-${r}`}
                style={{
                  gridColumn: c,
                  gridRow: r,
                  border: '2px dashed var(--panel-border)',
                  borderRadius: '4px',
                  zIndex: 0,
                  minHeight: 0
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropEmpty(e, c, r)}
              />
            );
          })}

        {/* Digitális Óra Widget */}
        {widgetSettings.showDigitalClock && (
          <DigitalClockWidget currentTime={currentTime} {...sharedWidgetProps} />
        )}

        {/* Véletlen Diák Widget */}
        {widgetSettings.showRandomStudent && (
          <RandomStudentWidget
            selectedStudent={selectedStudent}
            isPickingStudent={isPickingStudent}
            pickedGroup={pickedGroup}
            handlePickRandomStudent={handlePickRandomStudent}
            {...sharedWidgetProps}
          />
        )}

        {/* Vakáció-számláló Widget */}
        {widgetSettings.showVacationCountdown && vacation && (
          <VacationWidget vacation={vacation} {...sharedWidgetProps} />
        )}

        {/* Naptár Widget */}
        {widgetSettings.showMiniCalendar && (
          <MiniCalendarWidget {...sharedWidgetProps} />
        )}

        {/* Időzítő Widget */}
        {widgetSettings.showMiniTimer && (
          <MiniTimerWidget
            miniTimerLeft={miniTimerLeft}
            setMiniTimerLeft={setMiniTimerLeft}
            miniTimerRunning={miniTimerRunning}
            setMiniTimerRunning={setMiniTimerRunning}
            {...sharedWidgetProps}
          />
        )}

        {/* Messages */}
        {widgetSettings.showMessages && (
          <MessagesWidget setActiveTab={setActiveTab} {...sharedWidgetProps} />
        )}

        {/* Quick Actions */}
        {widgetSettings.showQuickActions && (
          <QuickActionsWidget setActiveTab={setActiveTab} {...sharedWidgetProps} />
        )}

        {/* Napi Motiváció Widget */}
        {widgetSettings.showQuote && (
          <QuoteWidget
            dailyQuote={dailyQuote}
            quoteType={quoteType}
            setQuoteType={setQuoteType}
            setQuoteOffset={setQuoteOffset}
            {...sharedWidgetProps}
          />
        )}

        {/* Gyors Teendők (To-Do) Widget */}
        {widgetSettings.showTodos && (
          <TodosWidget
            todos={todos}
            setTodos={setTodos}
            setTodoModalOpen={setTodoModalOpen}
            {...sharedWidgetProps}
          />
        )}

        {/* Post-it / Gyors Jegyzet Widget */}
        {widgetSettings.showPostit && (
          <PostitWidget postit={postit} setPostit={setPostit} {...sharedWidgetProps} />
        )}

        {/* Szokáskövető Widget */}
        {widgetSettings.showHabitTracker && (
          <HabitTrackerWidget
            habitProgress={habitProgress}
            setHabitProgress={setHabitProgress}
            {...sharedWidgetProps}
          />
        )}

        {/* Folyadékpótlás Widget */}
        {widgetSettings.showHydrationTracker && (
          <HydrationTrackerWidget
            hydrationProgress={hydrationProgress}
            setHydrationProgress={setHydrationProgress}
            liveScheduleInfo={liveScheduleInfo}
            {...sharedWidgetProps}
          />
        )}

        {/* Könyvjelzők Widget */}
        {widgetSettings.showBookmarks && (
          <BookmarksWidget bookmarks={bookmarks} {...sharedWidgetProps} />
        )}

        {/* Időjárás Widget */}
        {widgetSettings.showWeather && (
          <WeatherWidget
            weatherData={weatherData}
            weatherLocation={weatherLocation}
            {...sharedWidgetProps}
          />
        )}
      </div>
    </div>
  );
}
