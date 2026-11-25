import React from 'react';
import WidgetResizer from '../WidgetResizer';
import { getWeatherDetails } from '../../../utils/weatherIcons';

export default function WeatherWidget({
  weatherData,
  weatherLocation,
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
  const weather = getWeatherDetails(weatherData?.weathercode);

  return (
    <section
      className="card glass-panel animate-fade-in delay-2"
      style={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gridColumn: `${widgetPositions.weather?.c || 1} / span ${widgetSizes.weather}`,
        gridRow: `${widgetPositions.weather?.r || 1} / span ${widgetHeights.weather}`,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: '#fff'
      }}
      draggable={widgetSettings.editMode}
      onDragStart={(e) => handleDragStart(e, 'weather')}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, 'weather')}
    >
      <WidgetResizer
        widgetKey="weather"
        w={widgetSizes.weather}
        h={widgetHeights.weather}
        editMode={widgetSettings.editMode}
        changeWidgetWidth={changeWidgetWidth}
        changeWidgetHeight={changeWidgetHeight}
      />
      <div className="widget-content-wrapper" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="card-title" style={{ color: 'rgba(255,255,255,0.85)' }}>
          <span>Időjárás</span>
          {weatherLocation && (
            <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 'normal', textTransform: 'none', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {weatherLocation}
            </span>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '38px', lineHeight: 1 }}>{weather.icon}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {weatherData ? Math.round(weatherData.temperature) : '--'}°C
            </div>
          </div>
          <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.85, fontWeight: '500' }}>
            {weather.desc}
          </div>
        </div>
      </div>
    </section>
  );
}
