import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';

export default function NoiseMeterWidget({ widget, removeWidget, updateWidgetBounds }) {
  const [position, setPosition] = useState({ x: widget.x || 160, y: widget.y || 80 });
  const [size, setSize] = useState({ width: 380, height: 430 });
  const [isMaximized, setIsMaximized] = useState(false);
  const prevDims = useRef({ position: { x: widget.x || 160, y: widget.y || 80 }, size: { width: 380, height: 430 } });

  // Audio state
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0); // 0 - 100
  const [peak, setPeak] = useState(0);
  const [threshold, setThreshold] = useState(65); // 0 - 100
  const [sensitivity, setSensitivity] = useState(2.5); // Multiplier 1 - 5
  const [warningCount, setWarningCount] = useState(0);
  const [isOverThreshold, setIsOverThreshold] = useState(false);
  const [soundAlert, setSoundAlert] = useState(true);
  const [micError, setMicError] = useState(null);
  const [meterType, setMeterType] = useState('gauge'); // 'gauge' | 'bar'

  // Refs to decouple audio loop from React re-renders and slider changes
  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;

  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;

  const soundAlertRef = useRef(soundAlert);
  soundAlertRef.current = soundAlert;

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastAlertTimeRef = useRef(0);
  const thresholdExceededTimerRef = useRef(null);
  const smoothedVolRef = useRef(0);
  const peakVolRef = useRef(0);
  const lastRenderTimeRef = useRef(0);

  // Play warning chime when noise is exceeded
  const playAlertDing = () => {
    if (!soundAlertRef.current) return;
    try {
      const now = Date.now();
      if (now - lastAlertTimeRef.current < 2500) return; // Debounce 2.5s
      lastAlertTimeRef.current = now;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.setValueAtTime(330, audioCtx.currentTime + 0.15); // E4
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // AudioContext unavailable
    }
  };

  // Start microphone
  const startListening = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      smoothedVolRef.current = 0;
      peakVolRef.current = 0;
      lastRenderTimeRef.current = 0;
      setIsListening(true);
    } catch (err) {
      console.warn('Microphone access failed:', err);
      setMicError('A mikrofonhoz való hozzáférés nem sikerült vagy le van tiltva.');
    }
  };

  // Stop microphone
  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
    setVolume(0);
    setPeak(0);
    setIsOverThreshold(false);
    smoothedVolRef.current = 0;
    peakVolRef.current = 0;
  };

  // Audio processing loop with VU ballistics (fast attack, smooth release)
  useEffect(() => {
    if (!isListening || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkAudio = () => {
      analyser.getByteTimeDomainData(dataArray);

      // Compute RMS
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const norm = (dataArray[i] - 128) / 128;
        sum += norm * norm;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Acoustic noise gate & response curve
      const noiseFloor = 0.006;
      const adjustedRms = Math.max(0, rms - noiseFloor);
      const rawVol = Math.min(100, Math.round(Math.pow(adjustedRms * 10, 0.78) * sensitivityRef.current * 16));

      // Standard VU Ballistics:
      // Fast attack (~30ms) to immediately reflect spoken sound
      // Smooth decay (~250ms) to glide naturally without vibrating violently
      if (rawVol > smoothedVolRef.current) {
        smoothedVolRef.current = smoothedVolRef.current * 0.2 + rawVol * 0.8;
      } else {
        smoothedVolRef.current = smoothedVolRef.current * 0.86 + rawVol * 0.14;
      }

      if (smoothedVolRef.current < 0.4) smoothedVolRef.current = 0;

      // Peak-hold decay
      if (rawVol > peakVolRef.current) {
        peakVolRef.current = rawVol;
      } else {
        peakVolRef.current = Math.max(0, peakVolRef.current - 0.7);
      }

      // Throttle React renders to ~30 FPS (~33ms) for silky-smooth animation without queue lag
      const now = performance.now();
      if (now - lastRenderTimeRef.current >= 32) {
        lastRenderTimeRef.current = now;
        const currentVol = Math.round(smoothedVolRef.current);
        const currentPeak = Math.round(peakVolRef.current);

        setVolume(currentVol);
        setPeak(currentPeak);

        const curThreshold = thresholdRef.current;
        if (currentVol >= curThreshold) {
          setIsOverThreshold(true);
          playAlertDing();
          if (!thresholdExceededTimerRef.current) {
            thresholdExceededTimerRef.current = setTimeout(() => {
              setWarningCount((c) => c + 1);
              thresholdExceededTimerRef.current = null;
            }, 750);
          }
        } else {
          setIsOverThreshold(false);
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    animationFrameRef.current = requestAnimationFrame(checkAudio);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Toggle maximize
  const toggleMaximize = () => {
    if (!isMaximized) {
      prevDims.current = { position, size };
      setPosition({ x: 30, y: 30 });
      setSize({ width: 'calc(100% - 60px)', height: 'calc(100% - 90px)' });
      setIsMaximized(true);
    } else {
      setPosition(prevDims.current.position);
      setSize(prevDims.current.size);
      setIsMaximized(false);
    }
  };

  // Status computation
  const getStatus = () => {
    if (!isListening) return { text: 'Készenlét', color: 'var(--text-secondary, #71717a)', bg: 'var(--hover-bg)' };
    if (volume >= threshold) return { text: 'TÚL HANGOS!', color: 'var(--theme-red, #cc0000)', bg: 'rgba(204,0,0,0.1)' };
    if (volume >= threshold * 0.75) return { text: 'Mérsékelt', color: '#d97706', bg: 'rgba(217,119,6,0.1)' };
    return { text: 'Csendes', color: '#16a34a', bg: 'rgba(22,163,74,0.1)' };
  };

  const status = getStatus();

  // Active color for gauge / bar
  const activeColor = volume >= threshold
    ? 'var(--theme-red, #cc0000)'
    : volume >= threshold * 0.75
    ? '#d97706'
    : '#16a34a';

  // Gauge calculations
  // Center: (110, 115), Radius: 85
  // Semicircle arc length = PI * 85 = 267.035
  const arcLength = 267.035;
  const clampedVol = Math.min(Math.max(volume, 0), 100);
  const arcOffset = arcLength * (1 - clampedVol / 100);
  const needleDeg = isListening ? (clampedVol / 100) * 180 - 90 : -90;

  // Threshold angle and marker coordinates
  const threshAngle = Math.PI - (threshold / 100) * Math.PI;
  const threshInnerX = 110 + 72 * Math.cos(threshAngle);
  const threshInnerY = 115 - 72 * Math.sin(threshAngle);
  const threshOuterX = 110 + 98 * Math.cos(threshAngle);
  const threshOuterY = 115 - 98 * Math.sin(threshAngle);

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={(e, d) => {
        setPosition({ x: d.x, y: d.y });
        updateWidgetBounds?.(widget.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, pos) => {
        const newW = ref.offsetWidth;
        const newH = ref.offsetHeight;
        setSize({ width: newW, height: newH });
        setPosition(pos);
        updateWidgetBounds?.(widget.id, { ...pos, width: newW, height: newH });
      }}
      minWidth={320}
      minHeight={400}
      bounds="parent"
      dragHandleClassName="noise-drag-handle"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      style={{ zIndex: isMaximized ? 85 : 25 }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--panel-bg, #ffffff)',
          color: 'var(--text-primary, #18181b)',
          borderRadius: '8px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
          border: '1px solid var(--panel-border, #e4e4e7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div
          className="noise-drag-handle"
          style={{
            padding: '8px 14px',
            background: 'var(--hover-bg, rgba(0,0,0,0.02))',
            borderBottom: '1px solid var(--panel-border, #e4e4e7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            cursor: 'grab'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ opacity: 0.5, display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="3" r="1.5" />
                <circle cx="11" cy="3" r="1.5" />
                <circle cx="5" cy="8" r="1.5" />
                <circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="13" r="1.5" />
                <circle cx="11" cy="13" r="1.5" />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <span>ZAJSZINTMÉRŐ</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Warning sound toggle */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => setSoundAlert(!soundAlert)}
              title={soundAlert ? 'Figyelmeztető hang bekapcsolva' : 'Figyelmeztető hang némítva'}
              style={{ opacity: soundAlert ? 0.9 : 0.4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {soundAlert ? (
                  <>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </>
                ) : (
                  <>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
                    <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                )}
              </svg>
            </button>

            {/* Meter view toggle */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => setMeterType(meterType === 'gauge' ? 'bar' : 'gauge')}
              title={meterType === 'gauge' ? 'LED oszlopos nézet' : 'Műszerfali óra nézet'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>

            {/* Maximize */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={toggleMaximize}
              title={isMaximized ? 'Visszaállítás' : 'Teljes méret'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                {isMaximized ? (
                  <>
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                ) : (
                  <>
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </>
                )}
              </svg>
            </button>

            {/* Close */}
            <button
              type="button"
              className="rich-text-toolbar-btn"
              onClick={() => removeWidget(widget.id)}
              title="Bezárás"
              style={{ color: 'var(--theme-red, #cc0000)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', overflowY: 'auto' }}>
          {/* Status Badge */}
          <div
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              background: status.bg,
              color: status.color,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.25s ease',
              border: `1px solid ${status.color}33`
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: status.color }} />
            <span>{status.text}</span>
          </div>

          {/* Meter Display Area */}
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
            {meterType === 'gauge' ? (
              /* Half-Circle Physical Gauge */
              <div style={{ position: 'relative', width: '240px', height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <svg viewBox="0 0 220 135" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Background Track Arc (Radius 85, Center 110, 115) */}
                  <path
                    d="M 25 115 A 85 85 0 0 1 195 115"
                    fill="none"
                    stroke="var(--panel-border, #e4e4e7)"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />

                  {/* Tick Marks along the arc */}
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((t) => {
                    const ang = Math.PI - (t / 100) * Math.PI;
                    const isMajor = t % 50 === 0;
                    const r1 = isMajor ? 68 : 72;
                    const r2 = 78;
                    const x1 = 110 + r1 * Math.cos(ang);
                    const y1 = 115 - r1 * Math.sin(ang);
                    const x2 = 110 + r2 * Math.cos(ang);
                    const y2 = 115 - r2 * Math.sin(ang);
                    return (
                      <line
                        key={t}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="var(--text-secondary, #71717a)"
                        strokeWidth={isMajor ? '1.5' : '1'}
                        opacity={isMajor ? 0.6 : 0.3}
                      />
                    );
                  })}

                  {/* Active Value Arc - using SVG stroke-dashoffset for butter-smooth animation */}
                  <path
                    d="M 25 115 A 85 85 0 0 1 195 115"
                    fill="none"
                    stroke={activeColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={arcLength}
                    strokeDashoffset={arcOffset}
                    style={{
                      transition: 'stroke-dashoffset 0.08s ease-out, stroke 0.25s ease',
                      opacity: isListening && volume > 0 ? 1 : 0
                    }}
                  />

                  {/* Threshold Marker Pin */}
                  <line
                    x1={threshInnerX}
                    y1={threshInnerY}
                    x2={threshOuterX}
                    y2={threshOuterY}
                    stroke="var(--theme-red, #cc0000)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={threshOuterX}
                    cy={threshOuterY}
                    r="3.5"
                    fill="var(--theme-red, #cc0000)"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />

                  {/* Physical Gauge Needle */}
                  <g
                    style={{
                      transform: `rotate(${needleDeg}deg)`,
                      transformOrigin: '110px 115px',
                      transition: 'transform 0.08s cubic-bezier(0.2, 0.8, 0.4, 1)'
                    }}
                  >
                    <line
                      x1="110"
                      y1="115"
                      x2="110"
                      y2="38"
                      stroke="var(--text-primary, #18181b)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="110" cy="40" r="3" fill={activeColor} />
                  </g>

                  {/* Hub Pivot */}
                  <circle
                    cx="110"
                    cy="115"
                    r="8"
                    fill="var(--panel-border, #e4e4e7)"
                    stroke="var(--panel-bg, #ffffff)"
                    strokeWidth="2"
                  />
                  <circle cx="110" cy="115" r="4" fill="var(--text-primary, #18181b)" />

                  {/* Scale Labels */}
                  <text x="25" y="130" fontSize="9" fontWeight="600" fill="var(--text-secondary, #71717a)" textAnchor="middle">0</text>
                  <text x="110" y="24" fontSize="9" fontWeight="600" fill="var(--text-secondary, #71717a)" textAnchor="middle">50</text>
                  <text x="195" y="130" fontSize="9" fontWeight="600" fill="var(--text-secondary, #71717a)" textAnchor="middle">100</text>
                </svg>

                {/* Digital Readout */}
                <div style={{ position: 'absolute', bottom: '-4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.5px' }}>
                    {isListening ? volume : '--'}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary, #71717a)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                    Zajszint / 100
                  </div>
                </div>
              </div>
            ) : (
              /* Segmented LED VU Bar View */
              <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>0 csend</span>
                  <span style={{ color: 'var(--theme-red, #cc0000)', fontWeight: 600 }}>Küszöb: {threshold}%</span>
                  <span>100</span>
                </div>

                {/* Segmented LED Bar */}
                <div style={{ position: 'relative', width: '100%', padding: '4px 0' }}>
                  {/* Threshold Arrow Indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${threshold}%`,
                      top: '-10px',
                      transform: 'translateX(-50%)',
                      color: 'var(--theme-red, #cc0000)',
                      fontSize: '10px',
                      fontWeight: 800,
                      lineHeight: 1
                    }}
                  >
                    ▼
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '3px',
                      width: '100%',
                      height: '24px',
                      background: 'var(--hover-bg, rgba(0,0,0,0.06))',
                      padding: '3px',
                      borderRadius: '6px',
                      border: '1px solid var(--panel-border, #e4e4e7)'
                    }}
                  >
                    {Array.from({ length: 24 }).map((_, idx) => {
                      const segPercent = ((idx + 1) / 24) * 100;
                      const isActive = isListening && volume >= (idx / 24) * 100;
                      const isSegOverThresh = segPercent >= threshold;
                      const isSegWarning = segPercent >= threshold * 0.75;

                      const segColor = isSegOverThresh
                        ? 'var(--theme-red, #cc0000)'
                        : isSegWarning
                        ? '#d97706'
                        : '#16a34a';

                      return (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            borderRadius: '2px',
                            background: isActive ? segColor : 'rgba(128,128,128,0.12)',
                            boxShadow: isActive ? `0 0 6px ${segColor}88` : 'none',
                            transition: 'background 0.08s ease-out, box-shadow 0.08s ease-out'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '26px', fontWeight: 800, marginTop: '2px' }}>
                  {isListening ? `${volume} / 100` : '--'}
                </div>
              </div>
            )}
          </div>

          {/* Warning counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--hover-bg, rgba(0,0,0,0.02))',
              border: '1px solid var(--panel-border, #e4e4e7)',
              fontSize: '11px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: warningCount > 0 ? 'var(--theme-red, #cc0000)' : 'inherit', fontWeight: 600 }}>
                ⚠️ Figyelmeztetések:
              </span>
              <span style={{ fontWeight: 800, fontSize: '13px' }}>{warningCount}</span>
            </div>
            {warningCount > 0 && (
              <button
                type="button"
                onClick={() => setWarningCount(0)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #71717a)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}
              >
                Nullázás
              </button>
            )}
          </div>

          {/* Controls: Sliders for Threshold & Sensitivity */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {/* Threshold Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                <span>Megengedett zajküszöb</span>
                <span>{threshold}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--theme-red, #cc0000)', marginTop: '3px', cursor: 'pointer' }}
              />
            </div>

            {/* Sensitivity Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                <span>Mikrofon érzékenység</span>
                <span>{sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="0.5"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-color, #18181b)', marginTop: '3px', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Main Action Button */}
          <div style={{ width: '100%', marginTop: '10px' }}>
            {!isListening ? (
              <button
                type="button"
                onClick={startListening}
                style={{
                  width: '100%',
                  padding: '9px 16px',
                  borderRadius: '4px',
                  background: 'var(--accent-color, #18181b)',
                  color: 'var(--badge-color, #ffffff)',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span>Mikrofon Indítása</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopListening}
                className="btn-outline"
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: 'var(--theme-red, #cc0000)',
                  borderColor: 'var(--theme-red, #cc0000)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                <span>Mérés Leállítása</span>
              </button>
            )}

            {micError && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--theme-red, #cc0000)', textAlign: 'center', lineHeight: 1.3 }}>
                {micError}
              </div>
            )}
          </div>
        </div>
      </div>
    </Rnd>
  );
}
