import { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, SkipBack, SkipForward,
  ChevronUp, ChevronDown, Minus, Plus, Settings, Music,
} from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import {
  TIMELINE_HEIGHT,
  TIMELINE_HEIGHT_EXPANDED,
  FLOATING_LEFT_PANE_OPEN,
  FLOATING_LEFT_PANE_CLOSED,
  FLOATING_RIGHT,
  PANEL_GAP,
} from '../constants/layout';

export function Timeline() {
  const {
    isTimelineVisible,
    isTimelineExpanded,
    setIsTimelineExpanded,
    audioPlaceholderInTimeline,
    layers,
    activePanel,
    selectedElementIds,
    activityPanelOpen,
  } = useDesignWorkspace();

  const [isPlaying, setIsPlaying]       = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [zoomLevel, setZoomLevel]       = useState(40);
  const [audioFlash, setAudioFlash]     = useState(false);

  const prevAudioRef = useRef(false);

  // Pulse the timeline ring once (3 beats) whenever audio is first added
  useEffect(() => {
    if (audioPlaceholderInTimeline && !prevAudioRef.current) {
      setAudioFlash(true);
      const t = setTimeout(() => setAudioFlash(false), 1800);
      return () => clearTimeout(t);
    }
    prevAudioRef.current = audioPlaceholderInTimeline;
  }, [audioPlaceholderInTimeline]);

  const totalFrames = 240;

  // ─── Horizontal positioning — reacts to both panels ──────────────
  // The Timeline lives inside the canvas container (already offset past LeftRail),
  // so FLOATING_LEFT_PANE_OPEN/CLOSED and FLOATING_RIGHT are container-relative.

  const isLeftPaneVisible   = activePanel !== null && activePanel !== 'settings' && activePanel !== 'configure';

  // Mirror the exact same 3-condition logic as RightPanel + CanvasArea
  const isRightPanelVisible =
    activePanel === 'settings' ||
    activePanel === 'configure' ||
    selectedElementIds.length > 0 ||
    activityPanelOpen;

  const leftPosition  = isLeftPaneVisible   ? FLOATING_LEFT_PANE_OPEN  : FLOATING_LEFT_PANE_CLOSED;
  const rightPosition = isRightPanelVisible ? FLOATING_RIGHT            : PANEL_GAP;

  // ─── Vertical ────────────────────────────────────────────────────
  const height = isTimelineExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT;

  const formatTime = (frames: number) => {
    const secs = frames / 24;
    const m  = Math.floor(secs / 60).toString().padStart(2, '0');
    const s  = Math.floor(secs % 60).toString().padStart(2, '0');
    const ms = Math.floor((secs % 1) * 1000).toString().padStart(3, '0');
    return `${m}:${s}.${ms}`;
  };

  if (!isTimelineVisible) return null;

  return (
    <>
    <style>{`
      @keyframes tl-audio-ring {
        0%,100% { box-shadow: 0 10px 15px -3px rgba(0,0,0,.10), 0 4px 6px -4px rgba(0,0,0,.10); }
        15%,55% { box-shadow: 0 0 0 2.5px #ff7043, 0 0 18px rgba(255,112,67,.28), 0 10px 15px -3px rgba(0,0,0,.10); }
        35%,75% { box-shadow: 0 10px 15px -3px rgba(0,0,0,.10), 0 4px 6px -4px rgba(0,0,0,.10); }
      }
    `}</style>
    <div
      className="absolute z-20 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col"
      style={{
        bottom: PANEL_GAP,
        left: leftPosition,
        right: rightPosition,
        height,
        transition: 'left 200ms ease-in-out, right 200ms ease-in-out, height 200ms ease-in-out',
        animation: audioFlash ? 'tl-audio-ring 1.8s ease-in-out' : undefined,
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* ── Controls row — always visible ── */}
      <div className="flex items-center justify-between px-4 shrink-0" style={{ height: TIMELINE_HEIGHT }}>
        {/* Playback + timecodes */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentFrame(0)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f5] text-[#6B6B6B] transition-colors"
          >
            <SkipBack size={13} />
          </button>

          <button
            onClick={() => setIsPlaying(p => !p)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#5B4EFF] hover:bg-[#4a3ee0] text-white transition-colors"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <button
            onClick={() => setCurrentFrame(totalFrames)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f5] text-[#6B6B6B] transition-colors"
          >
            <SkipForward size={13} />
          </button>

          <div className="w-px h-5 bg-[#E2E2E2] mx-1.5" />

          {/* Current timecode */}
          <div className="flex items-center px-2.5 py-1 bg-[#f5f5f5] border border-[#E2E2E2] rounded-lg">
            <span className="text-[11px] text-[#111111] font-mono">{formatTime(currentFrame)}</span>
            <span className="text-[10px] text-[#6B6B6B] ml-1.5">({currentFrame}f)</span>
          </div>

          <div className="w-px h-5 bg-[#E2E2E2] mx-1.5" />

          {/* Total timecode */}
          <div className="flex items-center px-2.5 py-1">
            <span className="text-[11px] text-[#6B6B6B] font-mono">{formatTime(totalFrames)}</span>
            <span className="text-[10px] text-[#AAAAAA] ml-1.5">({totalFrames}f)</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Zoom slider */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel(z => Math.max(10, z - 10))}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#f5f5f5] text-[#6B6B6B]"
            >
              <Minus size={11} />
            </button>
            <div
              className="w-16 h-1.5 bg-[#E2E2E2] rounded-full relative cursor-pointer"
              onClick={e => {
                const r = e.currentTarget.getBoundingClientRect();
                setZoomLevel(Math.round(((e.clientX - r.left) / r.width) * 100));
              }}
            >
              <div className="absolute left-0 top-0 h-full bg-[#5B4EFF] rounded-full" style={{ width: `${zoomLevel}%` }} />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#5B4EFF] rounded-full shadow"
                style={{ left: `${zoomLevel}%` }}
              />
            </div>
            <button
              onClick={() => setZoomLevel(z => Math.min(100, z + 10))}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#f5f5f5] text-[#6B6B6B]"
            >
              <Plus size={11} />
            </button>
          </div>

          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f5] text-[#6B6B6B] transition-colors">
            <Settings size={13} />
          </button>

          {/* Expand / collapse */}
          <button
            onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f5] text-[#6B6B6B] transition-colors"
          >
            {isTimelineExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* ── Track area — visible only when expanded ── */}
      {isTimelineExpanded && (
        <div className="flex flex-1 overflow-hidden border-t border-[#E2E2E2]">
          {/* Layer names column */}
          <div className="w-44 shrink-0 border-r border-[#E2E2E2] overflow-y-auto flex flex-col">
            {layers.map(layer => (
              <div
                key={layer.id}
                className="flex items-center gap-2 px-3 h-8 border-b border-[#f0f0f0] hover:bg-[#f9f9f9] shrink-0"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background:
                      layer.type === 'dynamicPlaceholder' ? '#5B4EFF'
                      : layer.type === 'image'            ? '#7b1fa2'
                      : '#3949ab',
                  }}
                />
                <span className="text-[11px] text-[#6B6B6B] truncate">{layer.name}</span>
              </div>
            ))}

            {/* Audio Placeholder layer — pinned at bottom, light orange bg */}
            {audioPlaceholderInTimeline && (
              <div
                className="flex items-center gap-2 px-3 h-8 border-b border-[rgba(255,112,67,0.2)] shrink-0 mt-auto"
                style={{ backgroundColor: 'rgba(255,112,67,0.08)' }}
              >
                <Music size={10} className="shrink-0" style={{ color: '#ff7043' }} />
                <span className="text-[11px] font-medium truncate" style={{ color: '#ff7043' }}>
                  Audio Placeholder
                </span>
              </div>
            )}
          </div>

          {/* Track lanes */}
          <div className="flex-1 relative overflow-x-auto flex flex-col">
            {/* Ruler */}
            <div className="flex h-5 border-b border-[#E2E2E2] bg-[#fafafa] shrink-0">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-[#f0f0f0] px-1">
                  <span className="text-[9px] text-[#AAAAAA]">{i}s</span>
                </div>
              ))}
            </div>

            {/* Tracks */}
            {layers.map(layer => {
              const color =
                layer.type === 'dynamicPlaceholder' ? '#5B4EFF'
                : layer.type === 'image'            ? '#7b1fa2'
                : '#3949ab';
              return (
                <div key={layer.id} className="flex h-8 border-b border-[#f0f0f0] relative shrink-0">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className="flex-1 border-r border-[#f5f5f5]" />
                  ))}
                  {/* Keyframe track bar */}
                  <div
                    className="absolute h-3 top-1/2 -translate-y-1/2 rounded-sm opacity-30"
                    style={{ left: '5%', width: '58%', background: color }}
                  />
                  {/* Keyframe diamonds */}
                  {[0.05, 0.33, 0.63].map((pct, ki) => (
                    <div
                      key={ki}
                      className="absolute w-2 h-2"
                      style={{
                        left: `calc(${pct * 100}% - 4px)`,
                        top: '50%',
                        transform: 'translateY(-50%) rotate(45deg)',
                        background: color,
                      }}
                    />
                  ))}
                </div>
              );
            })}

            {/* Audio Placeholder track — full-width bar, pinned at bottom */}
            {audioPlaceholderInTimeline && (
              <div
                className="flex h-8 border-b relative shrink-0 mt-auto"
                style={{
                  borderColor: 'rgba(255,112,67,0.2)',
                  backgroundColor: 'rgba(255,112,67,0.06)',
                }}
              >
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} className="flex-1 border-r border-[rgba(255,112,67,0.1)]" />
                ))}
                {/* Continuous audio bar spanning the full template */}
                <div
                  className="absolute h-3 top-1/2 -translate-y-1/2 rounded-sm"
                  style={{ left: '2%', right: '2%', backgroundColor: 'rgba(255,112,67,0.45)' }}
                />
              </div>
            )}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-px bg-red-400 pointer-events-none z-10"
              style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
            >
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-400" />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}