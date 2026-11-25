import React from 'react';

export default function ScheduleWidget({
  schedule,
  loadingSchedule,
  selectedDayIndex,
  setSelectedDayIndex,
  fetchSchedule,
  scheduleDay,
  currentTime,
  widgetSettings,
  widgetPositions,
  handleDragStart,
  handleDragOver,
  handleDrop,
  liveScheduleInfo
}) {
  const getDaysOfWeek = () => {
    let today = new Date();
    const currentDay = today.getDay();

    // Ha szombat vagy vasárnap van, a tanár már a jövő heti órarendet szeretné látni!
    if (currentDay === 0 || currentDay === 6) {
      today.setDate(today.getDate() + (currentDay === 6 ? 2 : 1));
    }

    const activeDay = today.getDay();
    const diff = today.getDate() - activeDay + (activeDay === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));

    const dayNames = ['H', 'K', 'Sze', 'Cs', 'P'];
    const fullNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek'];

    return dayNames.map((name, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dIdx = i + 1; // Hétfő = 1, Péntek = 5

      const isActive =
        selectedDayIndex !== null
          ? selectedDayIndex === dIdx
          : scheduleDay === fullNames[i] || (scheduleDay === '' && i === 0);

      return {
        name,
        date: d.getDate(),
        dayIndex: dIdx,
        active: isActive
      };
    });
  };

  const getCalendarTitle = () => {
    let today = new Date();
    const currentDay = today.getDay();
    if (currentDay === 0 || currentDay === 6) {
      today.setDate(today.getDate() + (currentDay === 6 ? 2 : 1));
    }

    const month = today.toLocaleString('hu-HU', { month: 'long' });
    const year = today.getFullYear();

    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    const weekType = weekNumber % 2 === 0 ? 'B' : 'A';

    return `${year}. ${month} - ${weekNumber}. hét (${weekType})`;
  };

  const info = liveScheduleInfo;
  const showCurrent = widgetSettings.showClassProgress && (info.current || info.breakTime);
  const showNext = widgetSettings.showUpNext && info.next;
  const isBreak = !!info.breakTime;
  const currentTitle = isBreak
    ? info.breakTime.label
    : info.current
    ? `${info.current.hourNumber}. óra (${info.current.subject})`
    : '';
  const progress = isBreak ? info.breakTime.progress : info.current ? info.progress : 0;

  let classTimeLeft = 0;
  if (info.current && !isBreak) {
    const endStr = info.current.duration.split(' - ')[1];
    const endMin = parseInt(endStr.split(':')[0], 10) * 60 + parseInt(endStr.split(':')[1], 10);
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    classTimeLeft = Math.max(0, endMin - currentMinutes);
  }

  const timeDisplay = isBreak
    ? `${info.breakTime.timeLeft} perc`
    : info.current
    ? `${classTimeLeft} perc (${Math.round(100 - progress)}%)`
    : '';

  let minsLeft = 0;
  if (showNext) {
    const startStr = info.next.duration.split(' - ')[0];
    const startMin = parseInt(startStr.split(':')[0], 10) * 60 + parseInt(startStr.split(':')[1], 10);
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    minsLeft = startMin - currentMinutes;
  }

  const isDuplicate =
    showCurrent &&
    showNext &&
    ((info.current && info.current.subject === info.next.subject) ||
      (isBreak && info.breakTime.label.includes(info.next.subject)) ||
      (currentTitle.toLowerCase().includes('lyukasóra') && info.next.subject.toLowerCase().includes('lyukasóra')));

  const hasLiveBanner = (showCurrent || showNext) && (widgetSettings.showClassProgress || widgetSettings.showUpNext);

  return (
    <section
      className="card glass-panel animate-fade-in delay-1"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        gridColumn: `${widgetPositions.schedule?.c || 1} / span 2`,
        gridRow: `${widgetPositions.schedule?.r || 1} / span 6`,
        position: 'relative',
        zIndex: 1
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'schedule')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'schedule')}
    >
      <div className="card-title">Órarend</div>
      {hasLiveBanner && (
        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: '700',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '6px'
            }}
          >
            {showCurrent ? 'Folyamatban' : 'Következő'}
          </div>
          <div
            style={{
              background: '#1c1c1e',
              borderRadius: '4px',
              padding: '12px',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              justifyContent: 'center'
            }}
          >
            {/* Jelenlegi státusz / Progress */}
            {showCurrent && (
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  <span style={{ color: '#fff' }}>{currentTitle}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{timeDisplay}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--theme-red)', transition: 'width 1s linear' }}></div>
                </div>
              </div>
            )}

            {/* Elválasztó */}
            {showCurrent && showNext && !isDuplicate && (
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', width: '100%', position: 'relative', zIndex: 2 }}></div>
            )}

            {/* Következő óra */}
            {showNext && !isDuplicate && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
                <div>
                  {showCurrent && <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Következik</div>}
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{info.next.subject}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>
                    {info.next.details} • {info.next.room}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: 1 }}>{minsLeft > 0 ? `${minsLeft}'` : 'Most'}</div>
                  <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Kezdés</div>
                </div>
              </div>
            )}

            {/* Decor circle */}
            <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', zIndex: 1 }}></div>
          </div>
        </div>
      )}

      <div className="calendar-header">
        <button className="btn-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div className="calendar-title">{getCalendarTitle()}</div>
        <button className="btn-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <div className="days-row">
        {getDaysOfWeek().map((day) => (
          <div
            key={day.name}
            className={`day-selector ${day.active ? 'active' : ''}`}
            onClick={() => {
              setSelectedDayIndex(day.dayIndex);
              fetchSchedule(day.dayIndex);
            }}
          >
            <span className="day-name">{day.name}</span>
            <span className="day-date">{day.date}</span>
          </div>
        ))}
      </div>

      <div className="schedule-list">
        {loadingSchedule ? (
          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Órarend betöltése a Kréta rendszerből...
          </div>
        ) : schedule.length > 0 ? (
          schedule.map((ora) => (
            <div key={ora.id} className={`schedule-item ${ora.isActive ? 'active' : ''}`}>
              <div className="time" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{ora.hourNumber}. óra</span>
                {ora.duration && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', fontSize: '10px', fontWeight: '400', letterSpacing: '0px', color: 'var(--text-secondary)' }}>
                    <span>{ora.duration.split(' - ')[0]}</span>
                    <span>{ora.duration.split(' - ')[1]}</span>
                  </div>
                )}
              </div>
              <div className="class-info">
                <h4>{ora.subject}</h4>
                <p>{ora.details}</p>
              </div>
              <div className="room-badge">{ora.room}</div>
            </div>
          ))
        ) : (
          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nincs megjeleníthető óra.
          </div>
        )}
      </div>
    </section>
  );
}
