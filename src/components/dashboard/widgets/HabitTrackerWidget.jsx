import React from 'react';
import WidgetResizer from '../WidgetResizer';

export default function HabitTrackerWidget({
  habitProgress,
  setHabitProgress,
  widgetSettings,
  widgetPositions,
  widgetSizes,
  widgetHeights,
  changeWidgetWidth,
  changeWidgetHeight,
  handleDragStart,
  handleDragOver,
  handleDrop
}) {
  const habitDailyPct =
    widgetSettings.habitDailyMax > 0
      ? Math.round((habitProgress.dailyCount / widgetSettings.habitDailyMax) * 100)
      : 0;
  const habitWeeklyPct = Math.round((habitProgress.weeklyDays.length / 7) * 100);
  const currentPct = widgetSettings.habitType === 'napi' ? habitDailyPct : habitWeeklyPct;

  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.habitTracker?.c || 1} / span ${widgetSizes.habitTracker}`,
        gridRow: `${widgetPositions.habitTracker?.r || 1} / span ${widgetHeights.habitTracker}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'habitTracker')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'habitTracker')}
    >
      <WidgetResizer
        widgetKey="habitTracker"
        w={widgetSizes.habitTracker}
        h={widgetHeights.habitTracker}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title">
          <span>{widgetSettings.habitName}</span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--theme-red)' }}>{currentPct}%</span>
        </div>

        {/* Progress Bar */}
        <div className="progress-bg" style={{ height: '6px', marginBottom: '16px' }}>
          <div className="progress-fill" style={{ width: `${currentPct}%`, background: 'var(--theme-red)' }}></div>
        </div>

        {widgetSettings.habitType === 'napi' ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            {Array.from({ length: widgetSettings.habitDailyMax }).map((_, i) => (
              <div
                key={i}
                onClick={() =>
                  setHabitProgress({
                    ...habitProgress,
                    dailyCount: i + 1 === habitProgress.dailyCount ? i : i + 1
                  })
                }
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '2px solid var(--theme-red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: i < habitProgress.dailyCount ? 'var(--theme-red)' : 'transparent',
                  color: i < habitProgress.dailyCount ? '#fff' : 'transparent',
                  transition: 'all 0.2s',
                  boxShadow: i < habitProgress.dailyCount ? '0 2px 8px rgba(204, 0, 0, 0.3)' : 'none'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between', flex: 1, alignItems: 'center' }}>
            {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map((day, i) => {
              const isActive = habitProgress.weeklyDays.includes(i);
              return (
                <div
                  key={i}
                  onClick={() => {
                    const newDays = isActive
                      ? habitProgress.weeklyDays.filter((d) => d !== i)
                      : [...habitProgress.weeklyDays, i];
                    setHabitProgress({ ...habitProgress, weeklyDays: newDays });
                  }}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: '6px',
                    border: isActive ? '1px solid var(--theme-red)' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: isActive ? 'var(--theme-red)' : 'var(--bg-secondary)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    fontSize: widgetSizes.habitTracker === 1 ? '11px' : '13px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 2px 8px rgba(204, 0, 0, 0.3)' : 'none'
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
