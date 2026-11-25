import React from 'react';

export default function WidgetResizer({
  widgetKey,
  w,
  h,
  editMode,
  changeWidgetWidth,
  changeWidgetHeight
}) {
  if (!editMode) return null;

  return (
    <div
      className="widget-corner-resizer"
      title="Átméretezés (jobb alsó sarokpont)"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget;
        try {
          target.setPointerCapture(e.pointerId);
        } catch {}

        let currentW = w;
        let currentH = h;
        let lastStepX = e.clientX;
        let lastStepY = e.clientY;

        const STEP_X = 45; // pixelküszöb szélességváltáshoz
        const STEP_Y = 35; // pixelküszöb magasságváltáshoz

        const handlePointerMove = (moveEvent) => {
          const diffX = moveEvent.clientX - lastStepX;
          const diffY = moveEvent.clientY - lastStepY;

          if (diffX > STEP_X) {
            if (currentW < 6) {
              currentW += 1;
              changeWidgetWidth(widgetKey, currentW);
            }
            lastStepX = moveEvent.clientX;
          } else if (diffX < -STEP_X) {
            if (currentW > 1) {
              currentW -= 1;
              changeWidgetWidth(widgetKey, currentW);
            }
            lastStepX = moveEvent.clientX;
          }

          if (diffY > STEP_Y) {
            if (currentH < 10) {
              currentH += 1;
              changeWidgetHeight(widgetKey, currentH);
            }
            lastStepY = moveEvent.clientY;
          } else if (diffY < -STEP_Y) {
            if (currentH > 1) {
              currentH -= 1;
              changeWidgetHeight(widgetKey, currentH);
            }
            lastStepY = moveEvent.clientY;
          }
        };

        const cleanup = (upEvent) => {
          try {
            if (upEvent && upEvent.pointerId) {
              target.releasePointerCapture(upEvent.pointerId);
            }
          } catch {}
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', cleanup);
          window.removeEventListener('pointercancel', cleanup);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', cleanup);
        window.addEventListener('pointercancel', cleanup);
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ pointerEvents: 'none' }}>
        <path d="M11 3L3 11M11 7L7 11M11 11L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
