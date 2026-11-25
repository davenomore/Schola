/**
 * Utilities for smart widget placement in ClassroomScreen.
 * Finds the best available empty screen space for new widgets
 * to prevent unnecessary overlapping and clutter.
 */

export const WIDGET_DEFAULT_SIZES = {
  'Pontos idő': { width: 340, height: 260 },
  'Óra': { width: 340, height: 260 },
  'Idő': { width: 340, height: 260 },
  'Időzítő': { width: 350, height: 380 },
  'Stopper': { width: 350, height: 380 },
  'Naptár': { width: 340, height: 380 },
  'Zajszintmérő': { width: 380, height: 430 },
  'Zajszint': { width: 380, height: 430 },
  'Munkamód': { width: 340, height: 400 },
  'Munkaszimbólumok': { width: 340, height: 400 },
  'Munkaforma': { width: 340, height: 400 },
  'Véletlen Diák': { width: 380, height: 440 },
  'Sorsolás': { width: 380, height: 440 },
  'Csoportalkotó': { width: 580, height: 460 },
  'Csoportok': { width: 580, height: 460 },
  'Szövegdoboz': { width: 640, height: 380 },
  'Szöveg': { width: 640, height: 380 },
  'Rajztábla': { width: 460, height: 380 },
  'Rajz': { width: 460, height: 380 },
  'QR Kód': { width: 640, height: 480 },
  'QR kód': { width: 640, height: 480 },
  'Faliújság': { width: 680, height: 480 },
  'Faliújság (Padlet)': { width: 680, height: 480 },
  'Padlet': { width: 680, height: 480 },
  'Mentimeter': { width: 680, height: 500 },
  'Szavazás': { width: 680, height: 500 },
  'Szavazás (Mentimeter)': { width: 680, height: 500 },
  'Kvíz Aréna': { width: 760, height: 580 },
  'Kvíz': { width: 760, height: 580 },
  'Munkafüzet': { width: 720, height: 580 },
  'PDF': { width: 720, height: 580 },
  'Feladatlap': { width: 720, height: 580 }
};

/**
 * Returns default dimensions for a given widget type.
 */
export function getWidgetDefaultSize(type) {
  return WIDGET_DEFAULT_SIZES[type] || { width: 420, height: 360 };
}

/**
 * Checks if a candidate rectangle overlaps with an existing widget box.
 */
function rectsOverlap(r1, r2, padding = 12) {
  return !(
    r1.x + r1.width + padding <= r2.x ||
    r1.x >= r2.x + r2.width + padding ||
    r1.y + r1.height + padding <= r2.y ||
    r1.y >= r2.y + r2.height + padding
  );
}

/**
 * Calculates intersection area between two rectangles.
 */
function intersectionArea(r1, r2) {
  const xOverlap = Math.max(0, Math.min(r1.x + r1.width, r2.x + r2.width) - Math.max(r1.x, r2.x));
  const yOverlap = Math.max(0, Math.min(r1.y + r1.height, r2.y + r2.height) - Math.max(r1.y, r2.y));
  return xOverlap * yOverlap;
}

/**
 * Finds an optimal, non-overlapping empty space for a new widget on the screen.
 * 
 * @param {Array} existingWidgets Array of currently active widgets
 * @param {number} targetWidth Desired width for new widget
 * @param {number} targetHeight Desired height for new widget
 * @returns {{ x: number, y: number }} Best coordinates
 */
export function findEmptySpaceForWidget(existingWidgets = [], targetWidth = 400, targetHeight = 350) {
  const screenWidth = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 1440;
  const screenHeight = typeof window !== 'undefined' && window.innerHeight > 0 ? window.innerHeight : 900;

  const leftMargin = 24;
  const topMargin = 24;
  const rightMargin = 24;
  const bottomMargin = 110; // keep clear of bottom toolbar and collapse button
  const gap = 16;

  const maxX = Math.max(leftMargin, screenWidth - rightMargin - targetWidth);
  const maxY = Math.max(topMargin, screenHeight - bottomMargin - targetHeight);

  if (!existingWidgets || existingWidgets.length === 0) {
    return { x: leftMargin, y: topMargin };
  }

  // Extract bounding boxes for active widgets
  const boxes = existingWidgets.map((w) => {
    const size = getWidgetDefaultSize(w.type);
    return {
      x: typeof w.x === 'number' ? w.x : leftMargin,
      y: typeof w.y === 'number' ? w.y : topMargin,
      width: typeof w.width === 'number' ? w.width : size.width,
      height: typeof w.height === 'number' ? w.height : size.height
    };
  });

  // Generate strategic candidate coordinates
  const candidateCoords = [
    { x: leftMargin, y: topMargin }
  ];

  for (const b of boxes) {
    // Right of existing box
    candidateCoords.push({ x: b.x + b.width + gap, y: b.y });
    candidateCoords.push({ x: b.x + b.width + gap, y: topMargin });

    // Below existing box
    candidateCoords.push({ x: b.x, y: b.y + b.height + gap });
    candidateCoords.push({ x: leftMargin, y: b.y + b.height + gap });

    // Diagonal step
    candidateCoords.push({ x: b.x + b.width + gap, y: b.y + b.height + gap });
  }

  // Add grid scan samples across the screen in 32px increments
  for (let y = topMargin; y <= maxY; y += 48) {
    for (let x = leftMargin; x <= maxX; x += 48) {
      candidateCoords.push({ x, y });
    }
  }

  // Filter candidates that are completely in bounds and have zero overlap
  const validEmptySlots = [];

  for (const coord of candidateCoords) {
    // Clamp to valid screen bounds
    const cx = Math.min(Math.max(coord.x, leftMargin), maxX);
    const cy = Math.min(Math.max(coord.y, topMargin), maxY);

    const candRect = { x: cx, y: cy, width: targetWidth, height: targetHeight };

    let hasCollision = false;
    for (const box of boxes) {
      if (rectsOverlap(candRect, box, gap)) {
        hasCollision = true;
        break;
      }
    }

    if (!hasCollision) {
      // Natural reading order score: topmost first, then leftmost
      const score = cy * 2000 + cx;
      validEmptySlots.push({ x: cx, y: cy, score });
    }
  }

  if (validEmptySlots.length > 0) {
    validEmptySlots.sort((a, b) => a.score - b.score);
    return { x: validEmptySlots[0].x, y: validEmptySlots[0].y };
  }

  // If no 100% collision-free slot is found, find the candidate with minimum overlap area
  let bestCandidate = null;
  let minOverlap = Infinity;

  for (const coord of candidateCoords) {
    const cx = Math.min(Math.max(coord.x, leftMargin), maxX);
    const cy = Math.min(Math.max(coord.y, topMargin), maxY);
    const candRect = { x: cx, y: cy, width: targetWidth, height: targetHeight };

    let totalOverlap = 0;
    for (const box of boxes) {
      totalOverlap += intersectionArea(candRect, box);
    }

    if (totalOverlap < minOverlap) {
      minOverlap = totalOverlap;
      bestCandidate = { x: cx, y: cy };
      if (totalOverlap === 0) break;
    }
  }

  if (bestCandidate) {
    return bestCandidate;
  }

  // Final fallback: gentle cascade with wrap-around
  const offset = (existingWidgets.length % 6) * 32;
  return {
    x: Math.min(leftMargin + offset, maxX),
    y: Math.min(topMargin + offset, maxY)
  };
}
