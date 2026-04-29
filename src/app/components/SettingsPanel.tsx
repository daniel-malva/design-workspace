import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Separator } from './ui/separator';
import { BrandKitSelector } from './BrandKitSelector';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';

// ══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
//   Border:  1px solid rgba(0,0,0,0.12)   → border-[rgba(0,0,0,0.12)]
//   Radius:  12px                           → rounded-xl
//   Padding: 12px                           → p-3
//   Gap:     12px                           → gap-3
//   Input h: 36px                           → h-9
//   Input bg: #f9fafa
//   Border outlined: #dddce0
//   Border standard: #cac9cf
//   Accent:  #473bab
//   Helper:  #686576  12px tracking-[0.4px]
//   Label:   #686576  12px tracking-[0.15px]
// ══════════════════════════════════════════════════════════════════

// ── Chevron SVG ──────────────────────────────────────────────���────
function Chevron() {
  return (
    <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M1 1L5 5L9 1" stroke="#111014" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Spinner arrows (number input) ─────────────────────────────────
function SpinnerArrows({ onUp, onDown }: { onUp: () => void; onDown: () => void }) {
  return (
    <div className="pointer-events-none absolute right-0 top-0 bottom-0 flex flex-col items-center justify-center w-5">
      <button
        type="button"
        className="pointer-events-auto flex items-center justify-center w-4 h-[14px] hover:text-[#473bab] transition-colors"
        onClick={onUp}
        tabIndex={-1}
      >
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
          <path d="M1 4L4 1L7 4" stroke="currentColor" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        className="pointer-events-auto flex items-center justify-center w-4 h-[14px] hover:text-[#473bab] transition-colors"
        onClick={onDown}
        tabIndex={-1}
      >
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
          <path d="M1 1L4 4L7 1" stroke="currentColor" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// ── Native Select ─────────────────────────────────────────────────
interface NativeSelectProps {
  children?: ReactNode;
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
  outlined?: boolean;
}

function NativeSelect({ children, value, onChange, className = '', outlined = false }: NativeSelectProps) {
  const borderClass = outlined ? 'border-[#dddce0]' : 'border-[#cac9cf]';
  return (
    <div className={`relative w-full h-9 bg-[#f9fafa] border ${borderClass} rounded-[4px] flex items-center px-2 ${className}`}>
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full h-full bg-transparent text-[12px] text-[#1f1d25] tracking-[0.17px] outline-none appearance-none pr-5"
      >
        {children}
      </select>
      <Chevron />
    </div>
  );
}

// ── Native Input ──────────────────────────────────────────────────
function NativeInput({
  value,
  onChange,
  placeholder = '',
  outlined = false,
  className = '',
}: {
  value?: string | number;
  onChange?: (v: string) => void;
  placeholder?: string;
  outlined?: boolean;
  className?: string;
}) {
  const borderClass = outlined ? 'border-[#dddce0]' : 'border-[#cac9cf]';
  return (
    <input
      value={value ?? ''}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-9 bg-[#f9fafa] border ${borderClass} rounded-[4px] px-2 text-[12px] text-[#1f1d25] tracking-[0.17px] outline-none focus:border-[#473bab] transition-colors ${className}`}
    />
  );
}

// ── Settings Field — label + children ─────────────────────────────
interface SettingsFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}

function SettingsField({ label, required, children }: SettingsFieldProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center gap-0.5 px-1">
        {required && <span className="text-[12px] text-[#d2323f] leading-3">*</span>}
        <span className="text-[12px] text-[#686576] tracking-[0.15px] leading-3">{label}</span>
      </div>
      {children}
    </div>
  );
}

// ── Labelled Field (used in Duration side-by-side layout) ─────────
function LabelledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-1 min-w-0">
      <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">{label}</label>
      {children}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 w-full border border-[rgba(0,0,0,0.12)] rounded-xl p-3">
      <p className="text-[14px] text-[#1f1d25] tracking-[0.1px] leading-[1.57]" style={{ fontWeight: 500 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Styled Checkbox ───────────────────────────────────────────────
function StyledCheckbox({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div
        className="relative w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        style={{
          borderColor:     checked ? '#473bab' : '#9e9aad',
          backgroundColor: checked ? '#473bab' : 'transparent',
        }}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
      </div>
      <label htmlFor={id} className="text-[14px] text-[#1f1d25] tracking-[0.15px] leading-[1.5] cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STATIC — Dimensions Section
// ══════════════════════════════════════════════════════════════════

type StaticPlatform = 'custom' | 'instagram' | 'facebook' | 'youtube';

interface StaticPreset {
  key:      string;
  label:    string;
  w:        number;
  h:        number;
  platform: StaticPlatform;
}

const STATIC_PRESETS: StaticPreset[] = [
  { key: 'custom',        label: 'Custom',     w: 0,    h: 0,    platform: 'custom'    },
  // Instagram
  { key: 'ig-feed-ad',   label: 'Feed or Ad', w: 1080, h: 1080, platform: 'instagram' },
  { key: 'ig-story',     label: 'Story',      w: 1080, h: 1920, platform: 'instagram' },
  // Facebook
  { key: 'fb-ad',        label: 'Ad',         w: 1200, h: 628,  platform: 'facebook'  },
  { key: 'fb-story',     label: 'Story',      w: 1080, h: 1920, platform: 'facebook'  },
  { key: 'fb-post',      label: 'Post',       w: 1200, h: 1200, platform: 'facebook'  },
  { key: 'fb-cover',     label: 'Cover',      w: 640,  h: 360,  platform: 'facebook'  },
  { key: 'fb-profile',   label: 'Profile',    w: 761,  h: 761,  platform: 'facebook'  },
  // YouTube
  { key: 'yt-video',     label: 'Video',      w: 1080, h: 1920, platform: 'youtube'   },
  { key: 'yt-thumbnail', label: 'Thumbnail',  w: 1280, h: 720,  platform: 'youtube'   },
];

function StaticCustomIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect width="20" height="20" rx="4" fill="#ededf0"/>
      <path d="M10 6v8M6 10h8" stroke="#9e9aad" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}

function StaticInstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="ig-static-grad" x1="0" y1="20" x2="20" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFDC80"/>
          <stop offset="25%"  stopColor="#FCAF45"/>
          <stop offset="50%"  stopColor="#F77737"/>
          <stop offset="75%"  stopColor="#C13584"/>
          <stop offset="100%" stopColor="#833AB4"/>
        </linearGradient>
      </defs>
      <rect width="20" height="20" rx="4" fill="url(#ig-static-grad)"/>
      <rect x="5" y="5.5" width="10" height="9" rx="2.5" stroke="white" strokeWidth="1.3"/>
      <circle cx="10" cy="10" r="2.5" stroke="white" strokeWidth="1.3"/>
      <circle cx="13.5" cy="6.5" r="0.8" fill="white"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect width="20" height="20" rx="4" fill="#1877F2"/>
      <path d="M11.5 10.5H13l.5-2h-2V7c0-.55.27-1 1-1H14V4h-1.5C10.42 4 9.5 5.42 9.5 7v1.5h-2v2h2V17h2v-6.5z" fill="white"/>
    </svg>
  );
}

function StaticYouTubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect width="20" height="20" rx="4" fill="#FF0000"/>
      <rect x="3.5" y="5.5" width="13" height="9" rx="2" fill="white"/>
      <path d="M8.5 7.8l4.5 2.2-4.5 2.2V7.8z" fill="#FF0000"/>
    </svg>
  );
}

function StaticPresetBadge({ preset }: { preset: StaticPreset }) {
  if (preset.platform === 'custom')    return <StaticCustomIcon />;
  if (preset.platform === 'instagram') return <StaticInstagramIcon />;
  if (preset.platform === 'facebook')  return <FacebookIcon />;
  if (preset.platform === 'youtube')   return <StaticYouTubeIcon />;
  return null;
}

function StaticDimensionSelect({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});

  const selected = STATIC_PRESETS.find(p => p.key === value) ?? STATIC_PRESETS[0];

  function openDropdown() {
    if (open) { setOpen(false); return; }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDropStyle({ top: rect.bottom + 2, left: rect.left, width: rect.width });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !dropRef.current?.contains(t)) setOpen(false);
    }
    window.addEventListener('mousedown', onOutside);
    return () => window.removeEventListener('mousedown', onOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onScroll(e: Event) {
      if (!dropRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={openDropdown}
        className="relative w-full h-9 bg-[#f9fafa] border border-[#cac9cf] rounded-[4px] flex items-center gap-2 pl-2 pr-7 cursor-pointer select-none"
      >
        <StaticPresetBadge preset={selected} />
        <span className="flex-1 min-w-0 text-[12px] text-[#1f1d25] tracking-[0.17px] truncate">
          {selected.label}
        </span>
        {selected.w > 0 && (
          <span className="text-[11px] text-[#9e9aad] shrink-0 tabular-nums">
            {selected.w}x{selected.h}
          </span>
        )}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <path d="M1 1L5 5L9 1" stroke="#111014" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {open && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', zIndex: 9999, maxHeight: 260, overflowY: 'auto', ...dropStyle }}
          className="bg-white border border-[#dddce0] rounded-[6px] shadow-[0px_3px_14px_2px_rgba(0,0,0,0.12),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_5px_5px_-3px_rgba(0,0,0,0.2)] py-1"
        >
          {STATIC_PRESETS.map(p => (
            <div
              key={p.key}
              onClick={() => { onChange(p.key); setOpen(false); }}
              className={`flex items-center gap-2 pl-4 pr-1 py-1 min-h-[36px] cursor-pointer transition-colors ${p.key === value ? 'bg-[#eeecff]' : 'hover:bg-[#f3f2ff]'}`}
            >
              <StaticPresetBadge preset={p} />
              <span className="flex-1 min-w-0 text-[12px] text-[#1f1d25] tracking-[0.17px] truncate">
                {p.label}
              </span>
              {p.w > 0 && (
                <span className="text-[11px] text-[#9c99a9] shrink-0 tabular-nums pr-2">
                  {p.w}x{p.h}
                </span>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

function SettingsDimensionsSection() {
  const { settings, updateSettings } = useDesignWorkspace();
  const isCustom = settings.dimensionPreset === 'custom';

  function handlePresetChange(key: string) {
    if (key === 'custom') {
      updateSettings({ dimensionPreset: 'custom' });
    } else {
      const p = STATIC_PRESETS.find(p => p.key === key);
      if (p) updateSettings({ dimensionPreset: key, dimensionW: p.w, dimensionH: p.h });
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <SettingsField label="Dimensions">
        <StaticDimensionSelect value={settings.dimensionPreset} onChange={handlePresetChange} />
      </SettingsField>

      {/* W / H inputs — read-only when a preset is selected */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex flex-1 items-center min-w-0">
          <div className="w-8 shrink-0 flex items-center justify-center">
            <span className="text-[12px] text-[#1f1d25] tracking-[0.15px]">W</span>
          </div>
          <div className="relative flex-1 min-w-0">
            <NativeInput
              value={settings.dimensionW}
              onChange={v => isCustom && !isNaN(Number(v)) && updateSettings({ dimensionW: Number(v) })}
              outlined
              className={isCustom ? '' : 'opacity-60 cursor-default'}
            />
            {isCustom && (
              <SpinnerArrows
                onUp={() => updateSettings({ dimensionW: settings.dimensionW + 1 })}
                onDown={() => updateSettings({ dimensionW: Math.max(1, settings.dimensionW - 1) })}
              />
            )}
          </div>
        </div>
        <div className="flex flex-1 items-center min-w-0">
          <div className="w-8 shrink-0 flex items-center justify-center">
            <span className="text-[12px] text-[#1f1d25] tracking-[0.15px]">H</span>
          </div>
          <div className="relative flex-1 min-w-0">
            <NativeInput
              value={settings.dimensionH}
              onChange={v => isCustom && !isNaN(Number(v)) && updateSettings({ dimensionH: Number(v) })}
              outlined
              className={isCustom ? '' : 'opacity-60 cursor-default'}
            />
            {isCustom && (
              <SpinnerArrows
                onUp={() => updateSettings({ dimensionH: settings.dimensionH + 1 })}
                onDown={() => updateSettings({ dimensionH: Math.max(1, settings.dimensionH - 1) })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// VIDEO — Dimension Section (with Aspect Ratio filter + platform logos)
// ══════════════════════════════════════════════════════════════════

type VideoAspectRatio = 'all' | '16:9' | '9:16' | '1:1' | '4:5';
type VideoPlatform = 'custom' | 'generic' | 'meta' | 'linkedin' | 'tiktok' | 'youtube' | 'x' | 'instagram' | 'snapchat';

interface VideoPreset {
  key:         string;
  label:       string;
  w:           number;
  h:           number;
  aspectRatio: VideoAspectRatio;
  platform:    VideoPlatform;
}

/** All video dimension presets derived from the Figma design. */
const VIDEO_PRESETS: VideoPreset[] = [
  { key: 'custom',                label: 'Custom',                      w: 0,    h: 0,    aspectRatio: 'all',  platform: 'custom'    },
  // Generic shapes (no ratio suffix)
  { key: 'horizontal',            label: 'Horizontal',                  w: 1920, h: 1080, aspectRatio: '16:9', platform: 'generic'   },
  { key: 'vertical',              label: 'Vertical',                    w: 1080, h: 1920, aspectRatio: '9:16', platform: 'generic'   },
  { key: 'square',                label: 'Square',                      w: 1080, h: 1080, aspectRatio: '1:1',  platform: 'generic'   },
  // Meta
  { key: 'meta-feed-landscape',   label: 'Feed Landscape - 16:9',       w: 1920, h: 1080, aspectRatio: '16:9', platform: 'meta'      },
  { key: 'meta-feed-square',      label: 'Feed Square - 1:1',           w: 1080, h: 1080, aspectRatio: '1:1',  platform: 'meta'      },
  { key: 'meta-feed-portrait',    label: 'Feed Portrait - 4:5',         w: 1080, h: 1350, aspectRatio: '4:5',  platform: 'meta'      },
  { key: 'meta-reels',            label: 'Reels - 9:16',                w: 1080, h: 1920, aspectRatio: '9:16', platform: 'meta'      },
  { key: 'meta-story',            label: 'Story - 9:16',                w: 1080, h: 1920, aspectRatio: '9:16', platform: 'meta'      },
  { key: 'meta-video-landscape',  label: 'Video Landscape - 16:9',      w: 1920, h: 1080, aspectRatio: '16:9', platform: 'meta'      },
  // LinkedIn
  { key: 'linkedin-feed-square',  label: 'Feed Square - 1:1',           w: 1080, h: 1080, aspectRatio: '1:1',  platform: 'linkedin'  },
  { key: 'linkedin-feed-portrait',label: 'Feed Portrait - 4:5',         w: 1080, h: 1350, aspectRatio: '4:5',  platform: 'linkedin'  },
  { key: 'linkedin-story',        label: 'Story - 9:16',                w: 1080, h: 1920, aspectRatio: '9:16', platform: 'linkedin'  },
  // TikTok
  { key: 'tiktok-in-feed',        label: 'Main In-Feed - 9:16',         w: 1080, h: 1920, aspectRatio: '9:16', platform: 'tiktok'    },
  { key: 'tiktok-takeover',       label: 'Takeover & Top-view - 9:16',  w: 1080, h: 1920, aspectRatio: '9:16', platform: 'tiktok'    },
  // YouTube
  { key: 'youtube-short',         label: 'Short - 9:16',                w: 1080, h: 1920, aspectRatio: '9:16', platform: 'youtube'   },
  { key: 'youtube-landscape',     label: 'Video Landscape - 16:9',      w: 1920, h: 1080, aspectRatio: '16:9', platform: 'youtube'   },
  // X (Twitter)
  { key: 'x-feed-landscape',      label: 'Feed Landscape - 16:9',       w: 1920, h: 1080, aspectRatio: '16:9', platform: 'x'         },
  { key: 'x-feed-square',         label: 'Feed Square - 1:1',           w: 1080, h: 1080, aspectRatio: '1:1',  platform: 'x'         },
  { key: 'x-feed-portrait',       label: 'Feed Portrait - 4:5',         w: 1080, h: 1350, aspectRatio: '4:5',  platform: 'x'         },
  { key: 'x-story',               label: 'Story - 9:16',                w: 1080, h: 1920, aspectRatio: '9:16', platform: 'x'         },
  // Instagram
  { key: 'ig-feed-square',        label: 'Feed Square - 1:1',           w: 1080, h: 1080, aspectRatio: '1:1',  platform: 'instagram' },
  { key: 'ig-feed-portrait',      label: 'Feed Portrait - 4:5',         w: 1080, h: 1350, aspectRatio: '4:5',  platform: 'instagram' },
  { key: 'ig-story',              label: 'Story - 9:16',                w: 1080, h: 1920, aspectRatio: '9:16', platform: 'instagram' },
  // Snapchat
  { key: 'snap-story',            label: 'Story - 9:16',                w: 1080, h: 1920, aspectRatio: '9:16', platform: 'snapchat'  },
];

/** Derive the ordered unique aspect ratio values present in VIDEO_PRESETS (excluding 'all'). */
const VIDEO_ASPECT_RATIOS: VideoAspectRatio[] = (() => {
  const order: VideoAspectRatio[] = ['16:9', '9:16', '1:1', '4:5'];
  const used = new Set(VIDEO_PRESETS.filter(p => p.aspectRatio !== 'all').map(p => p.aspectRatio));
  return order.filter(r => used.has(r));
})();

// ── Platform name labels (shown as prefix text beside badge) ──────
const PLATFORM_NAMES: Record<VideoPlatform, string> = {
  custom:    '',
  generic:   '',
  meta:      'Meta',
  linkedin:  'LinkedIn',
  tiktok:    'TikTok',
  youtube:   'YouTube',
  x:         'X',
  instagram: 'Instagram',
  snapchat:  'Snapchat',
};

// ── Shape badge — shows aspect ratio as a small rectangle icon ────
function ShapeBadge({ aspectRatio }: { aspectRatio: VideoAspectRatio }) {
  const shapes: Record<string, { w: number; h: number }> = {
    '16:9': { w: 16, h: 9  },
    '9:16': { w: 9,  h: 16 },
    '1:1':  { w: 12, h: 12 },
    '4:5':  { w: 11, h: 14 },
  };
  const s = shapes[aspectRatio] ?? { w: 12, h: 12 };
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect
        x={(20 - s.w) / 2} y={(20 - s.h) / 2}
        width={s.w} height={s.h}
        rx="1.5" fill="#9e9aad"
      />
    </svg>
  );
}

// ── Platform logo badges — 20×20 rounded square SVGs ─────────────
function MetaLogoBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect width="20" height="20" rx="4" fill="#0866FF"/>
      <path d="M4.5 13.5V6.5L8 11L10 7.5L12 11L15.5 6.5V13.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function LinkedInLogoBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect width="20" height="20" rx="4" fill="#0A66C2"/>
      <circle cx="6" cy="6" r="1.3" fill="white"/>
      <rect x="4.8" y="8.5" width="2.5" height="6" rx="0.5" fill="white"/>
      <path d="M9.5 8.5h2.4v1a3 3 0 0 1 2.5-1.2c1.8 0 2.6 1.2 2.6 3.2V14.5h-2.5v-2.6c0-.9-.3-1.5-1.1-1.5-.9 0-1.4.6-1.4 1.6V14.5H9.5V8.5z" fill="white"/>
    </svg>
  );
}

function TikTokLogoBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect width="20" height="20" rx="4" fill="#010101"/>
      <path d="M13 5c.4 1.1 1.3 2 2.8 2.2v2.2c-.9 0-1.9-.3-2.8-.9V12a3.4 3.4 0 1 1-3.4-3.4c.2 0 .4 0 .6.03v2.3a1.1 1.1 0 1 0 .8 1.07V5H13z" fill="white"/>
    </svg>
  );
}

function YouTubeLogoBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect width="20" height="20" rx="4" fill="#FF0000"/>
      <rect x="3" y="5.5" width="14" height="9" rx="2.5" fill="white"/>
      <path d="M8.5 8l5 2-5 2V8z" fill="#FF0000"/>
    </svg>
  );
}

function XLogoBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect width="20" height="20" rx="4" fill="#000000"/>
      <path d="M5 5L10 10m0 0l5 5M10 10L15 5M10 10L5 15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function InstagramLogoBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="20" x2="20" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFDC80"/>
          <stop offset="25%"  stopColor="#FCAF45"/>
          <stop offset="50%"  stopColor="#F77737"/>
          <stop offset="75%"  stopColor="#C13584"/>
          <stop offset="100%" stopColor="#833AB4"/>
        </linearGradient>
      </defs>
      <rect width="20" height="20" rx="4" fill="url(#ig-grad)"/>
      <rect x="5" y="5.5" width="10" height="9" rx="2.5" stroke="white" strokeWidth="1.3"/>
      <circle cx="10" cy="10" r="2.5" stroke="white" strokeWidth="1.3"/>
      <circle cx="13.5" cy="6.5" r="0.8" fill="white"/>
    </svg>
  );
}

function SnapchatLogoBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect width="20" height="20" rx="4" fill="#FFFC00"/>
      <path d="M10 3.5c-2.5 0-4 1.7-4 3.7V11l-1.2.9c.2.7.9.9 1.6.8-.1.5-.7 1-1.6 1.3.4.8 1.8 1.1 2.9.8L10 15.5l2.3.3c1.1-.3 2.5-.7 2.9-1.5-1-.3-1.5-.8-1.6-1.3.7.1 1.4-.1 1.6-.8L14 11V7.2C14 5.2 12.5 3.5 10 3.5z" fill="#010101"/>
    </svg>
  );
}

// ── Dispatch: pick the right badge icon for a preset ─────────────
function VideoPresetBadge({ preset }: { preset: VideoPreset }) {
  if (preset.platform === 'custom') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
        <rect width="20" height="20" rx="4" fill="#ededf0"/>
        <path d="M10 6v8M6 10h8" stroke="#9e9aad" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    );
  }
  if (preset.platform === 'generic') return <ShapeBadge aspectRatio={preset.aspectRatio} />;
  if (preset.platform === 'meta')      return <MetaLogoBadge />;
  if (preset.platform === 'linkedin')  return <LinkedInLogoBadge />;
  if (preset.platform === 'tiktok')    return <TikTokLogoBadge />;
  if (preset.platform === 'youtube')   return <YouTubeLogoBadge />;
  if (preset.platform === 'x')         return <XLogoBadge />;
  if (preset.platform === 'instagram') return <InstagramLogoBadge />;
  if (preset.platform === 'snapchat')  return <SnapchatLogoBadge />;
  return null;
}

// ── Custom dropdown that uses position:fixed to escape scrollable containers
interface VideoDimensionSelectProps {
  value:    string;
  presets:  VideoPreset[];
  onChange: (key: string) => void;
}

function VideoDimensionSelect({ value, presets, onChange }: VideoDimensionSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});

  const selected = presets.find(p => p.key === value) ?? presets[0];

  function openDropdown() {
    if (open) { setOpen(false); return; }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDropStyle({ top: rect.bottom + 2, left: rect.left, width: rect.width });
    setOpen(true);
  }

  // Close on outside mousedown
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !dropRef.current?.contains(t)) setOpen(false);
    }
    window.addEventListener('mousedown', onOutside);
    return () => window.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Close when the panel scrolls (keeps fixed dropdown from drifting)
  useEffect(() => {
    if (!open) return;
    function onScroll(e: Event) {
      if (!dropRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open]);

  function selectPreset(key: string) {
    onChange(key);
    setOpen(false);
  }

  return (
    <>
      {/* ── Trigger ── */}
      <div
        ref={triggerRef}
        onClick={openDropdown}
        className="relative w-full h-9 bg-[#f9fafa] border border-[#cac9cf] rounded-[4px] flex items-center gap-2 pl-2 pr-7 cursor-pointer select-none"
      >
        <VideoPresetBadge preset={selected} />
        <span className="flex-1 min-w-0 text-[12px] text-[#1f1d25] tracking-[0.17px] truncate">
          {selected.label}
        </span>
        {selected.w > 0 && (
          <span className="text-[11px] text-[#9c99a9] shrink-0 tabular-nums">
            ({selected.w}×{selected.h})
          </span>
        )}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <path d="M1 1L5 5L9 1" stroke="#111014" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* ── Dropdown — portal to body so it escapes overflow:auto and any transforms ── */}
      {open && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', zIndex: 9999, maxHeight: 260, overflowY: 'auto', ...dropStyle }}
          className="bg-white border border-[#dddce0] rounded-[6px] shadow-[0px_3px_14px_2px_rgba(0,0,0,0.12),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_5px_5px_-3px_rgba(0,0,0,0.2)] py-1"
        >
          {presets.map(p => {
            const active = p.key === value;
            return (
              <div
                key={p.key}
                onClick={() => selectPreset(p.key)}
                className={`flex items-center gap-2 pl-4 pr-1 py-1 min-h-[36px] cursor-pointer transition-colors ${active ? 'bg-[#eeecff]' : 'hover:bg-[#f3f2ff]'}`}
              >
                <VideoPresetBadge preset={p} />
                <span className="flex-1 min-w-0 text-[12px] text-[#1f1d25] tracking-[0.17px] truncate">
                  {p.label}
                </span>
                {p.w > 0 && (
                  <span className="text-[11px] text-[#9c99a9] shrink-0 tabular-nums pr-2">
                    ({p.w}×{p.h})
                  </span>
                )}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

function VideoAspectRatioOption({ value, label }: { value: string; label: string }) {
  return <option value={value}>{label}</option>;
}

function SettingsDimensionVideoSection() {
  const { settings, updateSettings } = useDesignWorkspace();
  const isCustom = settings.dimensionVideoPreset === 'custom';

  // Presets visible under the current aspect ratio filter
  const visiblePresets = settings.aspectRatio === 'all'
    ? VIDEO_PRESETS
    : VIDEO_PRESETS.filter(p => p.key === 'custom' || p.aspectRatio === settings.aspectRatio);

  function handleAspectRatioChange(ratio: string) {
    // Reset the dimension preset to custom whenever the filter changes so the
    // current selection is never hidden inside the filtered list.
    updateSettings({ aspectRatio: ratio, dimensionVideoPreset: 'custom' });
  }

  function handlePresetChange(key: string) {
    if (key === 'custom') {
      updateSettings({ dimensionVideoPreset: 'custom' });
    } else {
      const p = VIDEO_PRESETS.find(p => p.key === key);
      if (p) updateSettings({ dimensionVideoPreset: key, dimensionVideoW: p.w, dimensionVideoH: p.h });
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Aspect Ratio filter */}
      <SettingsField label="Aspect Ratio">
        <NativeSelect
          value={settings.aspectRatio}
          onChange={handleAspectRatioChange}
          outlined
        >
          <VideoAspectRatioOption value="all" label="All" />
          {VIDEO_ASPECT_RATIOS.map(r => (
            <VideoAspectRatioOption key={r} value={r} label={r} />
          ))}
        </NativeSelect>
      </SettingsField>

      {/* Dimension preset — custom dropdown with platform logos */}
      <SettingsField label="Dimensions">
        <VideoDimensionSelect
          value={settings.dimensionVideoPreset}
          presets={visiblePresets}
          onChange={handlePresetChange}
        />
      </SettingsField>

      {/* W / H — read-only when a preset is selected */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex flex-1 items-center min-w-0">
          <div className="w-8 shrink-0 flex items-center justify-center">
            <span className="text-[12px] text-[#1f1d25] tracking-[0.15px]">W</span>
          </div>
          <div className="relative flex-1 min-w-0">
            <NativeInput
              value={settings.dimensionVideoW}
              onChange={v => isCustom && !isNaN(Number(v)) && updateSettings({ dimensionVideoW: Number(v) })}
              outlined
              className={isCustom ? '' : 'opacity-60 cursor-default'}
            />
            {isCustom && (
              <SpinnerArrows
                onUp={() => updateSettings({ dimensionVideoW: settings.dimensionVideoW + 1 })}
                onDown={() => updateSettings({ dimensionVideoW: Math.max(1, settings.dimensionVideoW - 1) })}
              />
            )}
          </div>
        </div>
        <div className="flex flex-1 items-center min-w-0">
          <div className="w-8 shrink-0 flex items-center justify-center">
            <span className="text-[12px] text-[#1f1d25] tracking-[0.15px]">H</span>
          </div>
          <div className="relative flex-1 min-w-0">
            <NativeInput
              value={settings.dimensionVideoH}
              onChange={v => isCustom && !isNaN(Number(v)) && updateSettings({ dimensionVideoH: Number(v) })}
              outlined
              className={isCustom ? '' : 'opacity-60 cursor-default'}
            />
            {isCustom && (
              <SpinnerArrows
                onUp={() => updateSettings({ dimensionVideoH: settings.dimensionVideoH + 1 })}
                onDown={() => updateSettings({ dimensionVideoH: Math.max(1, settings.dimensionVideoH - 1) })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// VIDEO — Duration Section
// ══════════════════════════════════════════════════════════════════

function SettingsDurationSection() {
  const { settings, updateSettings } = useDesignWorkspace();

  return (
    <SectionCard title="Duration">
      <div className="flex items-start gap-3 w-full">
        {/* Duration Type */}
        <LabelledField label="Duration Type">
          <NativeSelect
            value={settings.durationType}
            onChange={v => updateSettings({ durationType: v })}
          >
            <option value="time">Time</option>
            <option value="frames">Frames</option>
          </NativeSelect>
        </LabelledField>

        {/* Duration input */}
        <LabelledField label="Duration">
          <NativeInput
            value={settings.duration}
            onChange={v => updateSettings({ duration: v })}
            placeholder="00:10.999"
            outlined
          />
          <p className="text-[12px] text-[#686576] tracking-[0.4px] leading-[1.66] px-1">
            Format: mm:ss.SSS
          </p>
        </LabelledField>
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// VIDEO — Frame System Section
// ══════════════════════════════════════════════════════════════════

function parseDuration(d: string): number {
  // Accepts mm:ss.SSS or mm:ss or just seconds
  const parts = d.split(':');
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10) || 0;
    const sec = parseFloat(parts[1]) || 0;
    return min * 60 + sec;
  }
  return parseFloat(d) || 0;
}

function SettingsFrameSystemSection() {
  const { settings, updateSettings } = useDesignWorkspace();

  const fps         = parseFloat(settings.frames) || 24;
  const totalSec    = parseDuration(settings.duration);
  const frameCount  = Math.round(totalSec * fps);
  const helperText  = `${settings.duration} (mm:ss.SSS) = ${frameCount} frames @ ${settings.frames}fps`;

  return (
    <SectionCard title="Frame System">
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[12px] text-[#686576] tracking-[0.15px] px-1">Frames</label>
        <NativeSelect
          value={settings.frames}
          onChange={v => updateSettings({ frames: v })}
        >
          <option value="24">24</option>
          <option value="25">25</option>
          <option value="30">30</option>
          <option value="60">60</option>
        </NativeSelect>
        <p className="text-[12px] text-[#686576] tracking-[0.4px] leading-[1.66] px-1">
          {helperText}
        </p>
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// VIDEO — Advanced Section (3 checkboxes)
// ══════════════════════════════════════════════════════════════════

function SettingsAdvancedSection() {
  const { settings, updateSettings } = useDesignWorkspace();

  return (
    <SectionCard title="Advanced">
      <div className="flex flex-col w-full">
        <StyledCheckbox
          id="lock-duration"
          checked={settings.lockDuration}
          onChange={v => updateSettings({ lockDuration: v })}
          label="Lock duration to template"
        />
        <StyledCheckbox
          id="loop-playback"
          checked={settings.loopPlayback}
          onChange={v => updateSettings({ loopPlayback: v })}
          label="Loop playback"
        />
        <StyledCheckbox
          id="snap-to-frames"
          checked={settings.snapToFrames}
          onChange={v => updateSettings({ snapToFrames: v })}
          label="Snap to frames"
        />
      </div>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// METADATA SECTION (shared)
// ══════════════════════════════════════════════════════════════════

function SettingsMetadataSection() {
  const { settings, updateSettings } = useDesignWorkspace();

  return (
    <SectionCard title="Metadata">
      <SettingsField label="Tags">
        <NativeSelect
          value={settings.tags}
          onChange={v => updateSettings({ tags: v })}
        >
          {/* future tag options */}
        </NativeSelect>
      </SettingsField>

      <SettingsField label="Offer Types">
        <NativeSelect
          value={settings.offerTypes}
          onChange={v => updateSettings({ offerTypes: v })}
        >
          {/* future offer type options */}
        </NativeSelect>
      </SettingsField>

      <button
        className="flex items-center gap-1.5 text-[13px] text-[#473bab] tracking-[0.46px] capitalize px-1 py-1 rounded-full hover:bg-[#473bab14] transition-colors w-fit"
        style={{ fontWeight: 500 }}
      >
        <Plus size={14} className="text-[#473bab]" />
        Add Field
      </button>
    </SectionCard>
  );
}

// ══════════════════════════════════════════════════════════════════
// FORMAT-SPECIFIC CONTENT BLOCKS
// ══════════════════════════════════════════════════════════════════

function SettingsStaticContent() {
  return <SettingsDimensionsSection />;
}

function SettingsVideoContent() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <SettingsDimensionVideoSection />
      <SettingsDurationSection />
      <SettingsFrameSystemSection />
      <SettingsAdvancedSection />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TEMPLATE TAB — top-level form with format router
// ══════════════════════════════════════════════════════════════════

function SettingsTemplateTab() {
  const { settings, updateSettings } = useDesignWorkspace();
  const format = settings.format;

  return (
    <div className="flex flex-col gap-3 w-full px-4 py-3">

      {/* Template Name */}
      <SettingsField label="Template Name" required>
        <div className="relative w-full h-9 bg-[#f9fafa] border border-[#dddce0] rounded-[4px] flex items-center px-2">
          <input
            value={settings.templateName}
            onChange={e => updateSettings({ templateName: e.target.value })}
            className="w-full h-full bg-transparent text-[12px] text-[#1f1d25] tracking-[0.17px] outline-none"
          />
        </div>
      </SettingsField>

      {/* Asset Type */}
      <SettingsField label="Asset Type" required>
        <NativeSelect
          value={settings.assetType}
          onChange={v => updateSettings({ assetType: v })}
        >
          {/* future asset types */}
        </NativeSelect>
      </SettingsField>

      {/* Brand */}
      <BrandKitSelector
        value={settings.brand}
        onChange={v => updateSettings({ brand: v })}
        label="Brand"
      />

      {/* Accounts */}
      <SettingsField label="Accounts">
        <NativeSelect
          value={settings.accounts}
          onChange={v => updateSettings({ accounts: v })}
        >
          {/* future accounts */}
        </NativeSelect>
      </SettingsField>

      {/* Format — radio group */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-[14px] text-[#1f1d25] tracking-[0.15px]">Format</label>
        <div className="flex items-center gap-4">
          {(['static', 'video'] as const).map(val => (
            <label key={val} className="flex items-center gap-2 cursor-pointer select-none">
              {/* Custom radio */}
              <div
                className="relative flex items-center justify-center w-[20px] h-[20px] rounded-full border-2 shrink-0 transition-colors"
                style={{
                  borderColor:     format === val ? '#473bab' : '#9e9aad',
                  backgroundColor: format === val ? '#473bab' : 'transparent',
                }}
                onClick={() => updateSettings({ format: val })}
              >
                {format === val && (
                  <div className="w-[8px] h-[8px] rounded-full bg-white" />
                )}
              </div>
              <span
                className="text-[14px] text-[#1f1d25] tracking-[0.15px]"
                onClick={() => updateSettings({ format: val })}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Dynamic content block ──────────────────────────────────── */}
      {format === 'static' ? <SettingsStaticContent /> : <SettingsVideoContent />}

      {/* ── Metadata — always shown ────────────────────────────────── */}
      <SettingsMetadataSection />

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// COMPONENTS TAB — placeholder
// ══════════════════════════════════════════════════════════════════

function SettingsComponentsTab() {
  return (
    <div className="flex flex-col items-center justify-center h-32 px-6 text-center">
      <p className="text-[12px] text-[#9ca3af]">
        Components settings will appear here.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FOOTER BUTTONS
// ══════════════════════════════════════════════════════════════════

function SettingsCancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        px-4 py-1.5 rounded-full
        border border-[rgba(99,86,225,0.5)]
        text-[14px] text-[#473bab] tracking-[0.4px] leading-6
        hover:bg-[rgba(99,86,225,0.06)] transition-colors
      "
      style={{ fontWeight: 500 }}
    >
      Cancel
    </button>
  );
}

function SettingsSaveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        px-4 py-1.5 rounded-full
        bg-[#473bab]
        text-[14px] text-white tracking-[0.4px] leading-6
        hover:bg-[#3b3090] transition-colors
      "
      style={{ fontWeight: 500 }}
    >
      Save
    </button>
  );
}

function SettingsPanelFooter({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="shrink-0 bg-white">
      <Separator className="m-0" />
      <div className="flex items-center justify-end gap-2 px-4 pt-2 pb-2">
        <SettingsCancelButton onClick={onCancel} />
        <SettingsSaveButton onClick={onSave} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SETTINGS PANEL — root component rendered in RightPanel
// ══════════════════════════════════════════════════════════════════

export function SettingsPanel() {
  const { setActivePanel, settings, setCanvasDimensions, fitCanvasToScreen } = useDesignWorkspace();

  function handleClose() {
    setActivePanel(null);
  }

  function handleSave() {
    const newW = settings.format === 'static' ? settings.dimensionW  : settings.dimensionVideoW;
    const newH = settings.format === 'static' ? settings.dimensionH  : settings.dimensionVideoH;
    if (newW > 0 && newH > 0) setCanvasDimensions(newW, newH);
    setActivePanel(null);
    // Wait for panel to close and browser to repaint before fitting, so the
    // canvas container rect reflects the full available space.
    if (newW > 0 && newH > 0) {
      requestAnimationFrame(() => requestAnimationFrame(() => fitCanvasToScreen()));
    }
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">

      {/* ── Header: title + close button ─────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-[13px] text-[#1f1d25]" style={{ fontWeight: 600 }}>Settings</span>
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <Separator className="m-0" />

      {/* ── Tabs — flex-1 so the footer always stays at the bottom ── */}
      <Tabs defaultValue="template" className="flex flex-col flex-1 overflow-hidden">

        <div className="shrink-0 relative">
          <TabsList className="w-full justify-start rounded-none bg-transparent px-0 h-auto pb-0 border-b-0">
            {(['template', 'components'] as const).map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="
                  relative px-4 py-[9px] rounded-none capitalize
                  text-[14px] tracking-[0.4px] leading-6
                  bg-transparent shadow-none border-0
                  data-[state=active]:text-[#473bab]
                  data-[state=inactive]:text-[#686576]
                  hover:text-[#473bab] transition-colors
                  data-[state=active]:after:content-['']
                  data-[state=active]:after:absolute
                  data-[state=active]:after:bottom-0
                  data-[state=active]:after:left-0
                  data-[state=active]:after:right-0
                  data-[state=active]:after:h-[2px]
                  data-[state=active]:after:bg-[#473bab]
                  data-[state=active]:after:z-10
                "
                style={{ fontWeight: 500 }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <Separator className="m-0" />
        </div>

        {/* Template tab — scrollable */}
        <TabsContent value="template" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <SettingsTemplateTab />
        </TabsContent>

        <TabsContent value="components" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <SettingsComponentsTab />
        </TabsContent>

      </Tabs>

      {/* ── Footer: Cancel + Save — always visible, never scrolls ── */}
      <SettingsPanelFooter onCancel={handleClose} onSave={handleSave} />

    </div>
  );
}