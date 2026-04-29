import React, { useState } from 'react';
import {
  X, Search, Upload, ChevronRight, Plus, SlidersHorizontal,
  Star, Heart, Home, Cloud, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Play, AlertTriangle, Square, Circle, CheckCircle, PlusCircle,
  User, Users, Smile, Settings, Trophy, Lightbulb, Plane, Anchor, Clock,
  ChevronsLeftRight, Triangle, Maximize2, Mountain, Image as ImageIcon,
  UserPlus, UserMinus, UserCheck, Bot, Coffee, Bug, Infinity, Accessibility,
  Landmark, Zap, Check,
} from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { InsertMenuItem } from '../store/useDesignWorkspaceStore';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Separator } from './ui/separator';

// ─── Figma asset imports ──────────────────────────────────────────
import imgComp0 from 'figma:asset/e07aa9dfb912416d1925f3797381d95379aa7fdc.png';
import imgComp1 from 'figma:asset/f4c10d27ad77dd4ad739e7671045b4f48cab2d12.png';
import imgComp2 from 'figma:asset/0e0d627718e69186742696c855133c2c1fa24768.png';
import imgComp3 from 'figma:asset/c839a8b30898a49ea15b62c48381acbbc5c5dbf1.png';
import imgComp4 from 'figma:asset/6361a5b461521f03aec2a264161c8b1bd3c3cb63.png';
import imgComp5 from 'figma:asset/2ecd0a55b2c186ff212c9220e8ff8601ed93ec01.png';
import imgComp6 from 'figma:asset/4771a2444ede7b93e055588c6a9fabddb7f4d53d.png';
import imgComp7 from 'figma:asset/4c8cc774bdab3dedcf8d7da486b5a560ac3e7ed3.png';
import imgComp8 from 'figma:asset/a73aed9e8eac4fef4a3a4ad59a14785aa83dfca3.png';

import imgIcon0  from 'figma:asset/2a86c6539609a715db9492c7c5859ae5d3639b21.png';
import imgIcon1  from 'figma:asset/1879fdb667cf79d7ec328d0c41a77171f2bdc8b1.png';
import imgIcon2  from 'figma:asset/50a5aef4cf4aab5ef26b8e9e478845ad211bade6.png';
import imgIcon3  from 'figma:asset/fe8631b8301e07d8f72a60deb79975f35af70b23.png';
import imgIcon4  from 'figma:asset/2e1088c06280f7fc8ac4dcf4d439379ce60df276.png';
import imgIcon5  from 'figma:asset/3be0b31967a6a315fd5bfe3aaed26574991f5d2f.png';
import imgIcon6  from 'figma:asset/2cefb9e6bb861db35d22cc44b2aac71e9a486547.png';
import imgIcon7  from 'figma:asset/52a3220978d6c83a0368dad6b9f9b92cb91bc386.png';
import imgIcon8  from 'figma:asset/06ec534dde7db444fb5c62068a9025224e9fe114.png';
import imgIcon9  from 'figma:asset/3593dbe45fa53d88dc8e13d56168ea915afcaec9.png';
import imgIcon10 from 'figma:asset/bb0e72c22ce8824ccfb47f22504bbf288faabd80.png';
import imgIcon11 from 'figma:asset/6a8c1acb758e7437c5ea7638b1ed62949409cd2a.png';
import imgIcon12 from 'figma:asset/272dc897e5353296fe31a41f64dcb3d56f7fdda8.png';
import imgIcon13 from 'figma:asset/37c524ac1529fbe611fe32b41cedd1666c377e0c.png';
import imgIcon14 from 'figma:asset/b7ceca7beb01dadf97d2d9fdd91921c4c995525c.png';
import imgIcon15 from 'figma:asset/0040ffdfbab6d488923bd47ba358bc72e53aa139.png';
import imgIcon16 from 'figma:asset/3844463592a637b7f7c82d1080632a2f3d7e9f2e.png';
import imgIcon17 from 'figma:asset/357e0bdc7f40bf77091ee4bd985361c811af7364.png';
import imgIcon18 from 'figma:asset/a29d89c166135cfddca0ba453fddada0f15c8891.png';
import imgIcon19 from 'figma:asset/04cafa4f1a667aa110ad28ae706f15f77f6c96db.png';
import imgIcon20 from 'figma:asset/5ecf743714c75b83dd0aaddd5798d4ee543ee2fd.png';
import imgIcon21 from 'figma:asset/eeaac3f62d908b73f53419a2c7833f48e8ac471b.png';
import imgIcon22 from 'figma:asset/f11ea1720fc88934ca44f7fb437730311f2ce9da.png';
import imgIcon23 from 'figma:asset/a0627333b50a9dbb82e8602f28d9379d271da3e9.png';
import imgIcon24 from 'figma:asset/97edbf3008236925421c5e81b184eb20bb68b83b.png';
import imgIcon25 from 'figma:asset/89ce7a4e4fb37a9b887edba29f787017e1175d00.png';
import imgIcon26 from 'figma:asset/7a35d23ad8bf97d7d20b0b5ce9ee62e636ba0894.png';
import imgIcon27 from 'figma:asset/eb905b7f3b8fc19971d22b0fd53057dae011e94b.png';

// ─── Shared: Sub-panel header with X close button ────────────────
export function InsertSubPanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E2E2] shrink-0">
      <span className="text-[13px] font-semibold text-[#111111]">{title}</span>
      <button
        onClick={onClose}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#f5f5f5] text-[#6B6B6B] hover:text-[#111111] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Shared: Search input ─────────────────────────────────────────
function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-[#E2E2E2] rounded-lg px-3 h-8">
      <Search size={13} className="text-[#9CA3AF] shrink-0" />
      <input
        className="flex-1 min-w-0 text-[12px] outline-none bg-transparent placeholder:text-[#9CA3AF] text-[#111111]"
        placeholder={placeholder}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 1. TEXT PANEL
// ══════════════════════════════════════════════════════════════════

interface TextTemplate {
  id: string;
  preview: React.ReactNode;
}

const textTemplates: TextTemplate[] = [
  {
    id: 'job-listing',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">Looking for</p>
        <p className="text-lg font-bold text-gray-800 leading-tight">Operations Manager</p>
        <p className="text-gray-400 mt-1">Praesent blandit odio aaa apendas ratrum...</p>
      </div>
    ),
  },
  {
    id: 'dynamic-model',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">Summer Sale</p>
        <p className="text-xl font-bold text-gray-800 font-mono">{'{'}<span>model</span>{'}'}</p>
      </div>
    ),
  },
  {
    id: 'congratulations',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-lg font-bold italic text-gray-800">Congratulations</p>
        <p className="text-gray-500">you're a big brother</p>
      </div>
    ),
  },
  {
    id: 'marketing-proposal',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">MMK and CO</p>
        <p className="text-base font-bold text-gray-800 leading-tight">Marketing Proposal</p>
        <p className="text-gray-400">Praesent blandit odio aaa...</p>
      </div>
    ),
  },
  {
    id: 'minimalism',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400 uppercase text-[8px]">The future of</p>
        <p className="text-xl font-black text-gray-800 uppercase leading-none">Minimalism</p>
      </div>
    ),
  },
  {
    id: 'end-of-season-sale',
    preview: (
      <div className="text-[9px] leading-tight text-right">
        <p className="text-gray-400 uppercase text-[8px]">End of</p>
        <p className="text-gray-400 uppercase text-[8px]">Season</p>
        <p className="text-2xl font-black text-gray-800 uppercase">SALE</p>
      </div>
    ),
  },
  {
    id: 'youre-invited',
    preview: (
      <div className="flex gap-1 text-[9px] leading-tight">
        <p className="text-xl font-black text-gray-800 uppercase leading-none">YOU'RE INVITED</p>
        <p className="text-gray-400">Praesent blandit odio non apendas ratrum...</p>
      </div>
    ),
  },
  {
    id: 'job-listing-2',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">Looking for</p>
        <p className="text-base font-bold text-gray-800">Operations Manager</p>
        <p className="text-gray-400">Praesent blandit...</p>
      </div>
    ),
  },
  {
    id: 'price-list',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="font-semibold text-gray-700">PRICE LIST: MARKETING PACKAGE</p>
        <p className="text-gray-500">$42</p>
        <p className="font-semibold text-gray-700">ADVERTISING PACKAGE</p>
        <p className="text-gray-500">$16</p>
        <p className="font-semibold text-gray-700">CONTENT PACKAGE</p>
        <p className="text-gray-500">$36</p>
      </div>
    ),
  },
  {
    id: 'adventure',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">Life is an</p>
        <p className="text-lg italic font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
          Adventure
        </p>
      </div>
    ),
  },
  {
    id: 'marketing-proposal-2',
    preview: (
      <div className="text-[9px] leading-tight">
        <p className="text-gray-400">MMK and CO</p>
        <p className="text-base font-bold text-gray-800">Marketing Proposal</p>
        <p className="text-gray-400">Praesent blandit...</p>
      </div>
    ),
  },
  {
    id: 'end-of-season-sale-2',
    preview: (
      <div className="text-right text-[9px]">
        <p className="text-gray-400 uppercase text-[8px]">End of Season</p>
        <p className="text-2xl font-black text-gray-800 uppercase">SALE</p>
      </div>
    ),
  },
  {
    id: 'youre-invited-2',
    preview: (
      <div className="flex gap-1 text-[9px]">
        <p className="text-xl font-black text-gray-800 uppercase">YOU'RE INVITED</p>
        <p className="text-gray-400">Praesent blandit odio non apendas nibb...</p>
      </div>
    ),
  },
];

interface TextTemplateCardProps {
  template: TextTemplate;
  onInsert: () => void;
}

function TextTemplateCard({ template, onInsert }: TextTemplateCardProps) {
  return (
    <div
      className="relative w-full bg-white rounded-lg border border-[#E2E2E2] cursor-pointer select-none overflow-hidden hover:border-[#5B4EFF] hover:shadow-sm active:scale-[0.98] transition-all duration-150"
      style={{ minHeight: '110px' }}
      onClick={onInsert}
      draggable
    >
      <div className="p-2 h-full flex flex-col justify-center">
        {template.preview}
      </div>
    </div>
  );
}

function VariableTextContent() {
  return (
    <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
      <p className="text-[12px] text-[#9CA3AF]">
        Variable text templates will appear here.
      </p>
    </div>
  );
}

const DEFAULT_X = 300;
const DEFAULT_Y = 300;

function StaticTextContent() {
  const { insertElement } = useDesignWorkspace();

  const insertHeader = () => {
    insertElement({ type: 'text-header', x: DEFAULT_X - 100, y: DEFAULT_Y - 20, width: 200, height: 40, content: 'Create header', style: { fontSize: 32, fontWeight: '700', color: '#111111' } });
  };
  const insertSubheader = () => {
    insertElement({ type: 'text-subheader', x: DEFAULT_X - 80, y: DEFAULT_Y - 12, width: 160, height: 28, content: 'Create sub header', style: { fontSize: 18, fontWeight: '600', color: '#111111' } });
  };
  const insertBody = () => {
    insertElement({ type: 'text-body', x: DEFAULT_X - 60, y: DEFAULT_Y - 10, width: 120, height: 20, content: 'Create body text', style: { fontSize: 14, fontWeight: '400', color: '#374151' } });
  };
  const insertTemplate = (id: string) => {
    insertElement({ type: 'text-template', x: DEFAULT_X - 80, y: DEFAULT_Y - 55, width: 160, height: 110, content: id, style: { fontSize: 14, color: '#111111' } });
  };

  return (
    <div className="flex flex-col overflow-hidden">

      {/* Quick-insert buttons */}
      <div className="flex flex-col gap-0.5 px-1 py-2 shrink-0">
        <button
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={insertHeader}
        >
          <span className="text-2xl font-bold text-gray-800 leading-tight">
            Create header
          </span>
        </button>
        <button
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={insertSubheader}
        >
          <span className="text-base font-semibold text-gray-700">
            Create sub header
          </span>
        </button>
        <button
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={insertBody}
        >
          <span className="text-sm text-gray-500">
            Create body text
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-3 shrink-0" />

      {/* Template gallery */}
      <div className="overflow-y-auto overflow-x-hidden px-3 py-3" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        <div className="grid grid-cols-2 gap-2 w-full">
          {textTemplates.map(template => (
            <TextTemplateCard
              key={template.id}
              template={template}
              onInsert={() => insertTemplate(template.id)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}

export function InsertTextPanel() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Tabs defaultValue="static" className="w-full flex flex-col flex-1 overflow-hidden gap-0">

        {/* Tab bar — same pattern as SettingsPanel */}
        <div className="shrink-0 relative">
          <TabsList className="w-full justify-start rounded-none bg-transparent px-0 h-auto pb-0 border-b-0">
            {([
              { value: 'static',   label: 'Static Text'  },
              { value: 'variable', label: 'Variable Text' },
            ] as const).map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="
                  relative px-4 py-[9px] rounded-none
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
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Separator flush below tabs — ::after bottom-0 touches this exactly */}
          <Separator className="m-0" />
        </div>

        {/* Static Text tab */}
        <TabsContent value="static" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <StaticTextContent />
        </TabsContent>

        {/* Variable Text tab */}
        <TabsContent value="variable" className="flex-1 overflow-y-auto overflow-x-hidden mt-0">
          <VariableTextContent />
        </TabsContent>

      </Tabs>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 2. DYNAMIC PLACEHOLDER PANEL
// ══════════════════════════════════════════════════════════════════

interface PlaceholderItem {
  id: 'logo' | 'background' | 'jellybean' | 'media' | 'audio';
  label: string;
  borderColor: string;
  badgeColor: string;
  /** Default insertion size (background is overridden to 600×600 in the store) */
  defaultW: number;
  defaultH: number;
}

const placeholders: PlaceholderItem[] = [
  { id: 'logo',       label: 'Logo',       borderColor: '#7B2FFF', badgeColor: '#7B2FFF', defaultW: 150, defaultH: 150 },
  { id: 'background', label: 'Background', borderColor: '#22C55E', badgeColor: '#22C55E', defaultW: 600, defaultH: 600 },
  { id: 'jellybean',  label: 'Jellybean',  borderColor: '#3B82F6', badgeColor: '#3B82F6', defaultW: 160, defaultH: 120 },
  { id: 'media',      label: 'Media',      borderColor: '#3B82F6', badgeColor: '#3B82F6', defaultW: 200, defaultH: 150 },
  { id: 'audio',      label: 'Audio',      borderColor: '#F97316', badgeColor: '#F97316', defaultW: 200, defaultH:  80 },
];

export function InsertDynamicPlaceholderPanel() {
  const { insertElement, canvasElements } = useDesignWorkspace();

  // Only one Background is allowed per canvas
  const hasBackground = canvasElements.some(
    el => el.placeholderVariant === 'background'
  );

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
      <div className="grid grid-cols-2 gap-2 w-full">
        {placeholders.map(p => {
          const isBackground = p.id === 'background';
          const disabled     = isBackground && hasBackground;

          return (
            <div
              key={p.id}
              className="relative"
              title={disabled ? 'Only one Background per template' : undefined}
            >
              <button
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  insertElement({
                    type:               `placeholder-${p.id}` as 'placeholder-logo',
                    placeholderVariant: p.id,
                    // Background: x/y/w/h are overridden in the store to 0,0,600,600
                    x: DEFAULT_X - p.defaultW / 2,
                    y: DEFAULT_Y - p.defaultH / 2,
                    width:  p.defaultW,
                    height: p.defaultH,
                  });
                }}
                className={[
                  'relative flex items-center justify-center rounded-xl bg-[#f5f5f5] h-[110px] w-full transition-opacity',
                  disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer hover:opacity-80',
                ].join(' ')}
                style={{ border: `2px dashed ${p.borderColor}` }}
              >
                <span
                  className="text-[11px] font-semibold text-white px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: p.badgeColor }}
                >
                  {p.label}
                </span>

                {/* "Already added" badge overlay */}
                {disabled && (
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-[#22C55E] font-semibold whitespace-nowrap">
                    Already added
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 3. IMAGES / VIDEO PANEL (placeholder)
// ══════════════════════════════════════════════════════════════════

export function InsertImagesVideoPanel() {
  const { setActivePanel } = useDesignWorkspace();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <SearchInput placeholder="search images and video" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#f5f5f5] flex items-center justify-center">
          <ImageIcon size={24} className="text-[#9CA3AF]" />
        </div>
        <p className="text-[12px] text-[#6B6B6B]">Upload images or video to add to your template</p>
        <button
          onClick={() => setActivePanel(null)}
          className="flex items-center gap-2 bg-[#5B4EFF] hover:bg-[#4a3fd4] text-white text-[12px] font-medium rounded-full px-4 py-2 transition-colors"
        >
          <Upload size={13} /> Upload Media
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 4. COMPONENT PANEL
// ══════════════════════════════════════════════════════════════════

const componentThumbs = [imgComp0, imgComp1, imgComp2, imgComp3, imgComp4, imgComp5, imgComp6, imgComp7, imgComp8];
const componentNames  = [
  'Themed-Black · 1080×1080',
  'Themed-White · 1080×1080',
  'Modern Feed · 600×600',
  'Social Story · 1080×1920',
  'Banner Wide · 1200×628',
  'Square Promo · 600×600',
  'Carousel Card · 1080×1080',
  'Email Header · 600×200',
  'Display Ad · 300×250',
];

export function InsertComponentPanel() {
  const { setActivePanel } = useDesignWorkspace();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0 flex items-center gap-2">
        <div className="flex-1">
          <SearchInput placeholder="search components" />
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2E2E2] bg-white hover:bg-[#f5f5f5] shrink-0 transition-colors">
          <SlidersHorizontal size={13} className="text-[#6B6B6B]" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
        <div className="grid grid-cols-2 gap-2 w-full">
          {componentThumbs.map((src, i) => (
            <button
              key={i}
              onClick={() => setActivePanel(null)}
              className="rounded-lg border border-[#E2E2E2] bg-white overflow-hidden cursor-pointer hover:border-[#5B4EFF] transition-colors text-left"
            >
              <div className="relative">
                <img src={src} alt={componentNames[i]} className="w-full aspect-[4/3] object-cover" />
                <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-[#5B4EFF]" />
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[10px] text-[#111111] truncate">{componentNames[i].split('·')[0].trim()}</p>
                <p className="text-[9px] text-[#6B6B6B]">{componentNames[i].split('·')[1]?.trim()}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 5. ANNOTATION PANEL
// ══════════════════════════════════════════════════════════════════

export function InsertAnnotationPanel() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto overflow-x-hidden flex-1">
      <button className="flex items-center gap-2 text-[13px] text-[#111111] hover:text-[#5B4EFF] font-medium transition-colors">
        <Upload size={15} />
        Upload
      </button>

      <button className="w-full border border-[#f87171] text-[#ef4444] text-[12px] rounded-lg py-2 hover:bg-red-50 transition-colors">
        + Add new annotation
      </button>

      {/* Line arrow */}
      <div className="flex items-center w-full py-1 cursor-pointer group">
        <div className="flex-1 h-px bg-[#f87171] group-hover:bg-[#5B4EFF] transition-colors" />
        <ChevronRight size={14} className="text-[#f87171] group-hover:text-[#5B4EFF] shrink-0 transition-colors" />
      </div>

      {/* Text preview */}
      <div className="flex flex-col gap-1 mt-1">
        <span className="text-[20px] font-black text-[#111111]">Create header</span>
        <span className="text-[14px] font-semibold text-[#6B6B6B]">Create sub header</span>
        <span className="text-[12px] text-[#9CA3AF]">Create body text</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 6. SHAPES PANEL
// ══════════════════════════════════════════════════════════════════

interface ShapeDef { id: string; icon: React.ReactNode }

const shapeGroups: ShapeDef[] = [
  { id: 'star-f',   icon: <Star size={16} fill="currentColor" /> },
  { id: 'star',     icon: <Star size={16} /> },
  { id: 'heart',    icon: <Heart size={16} /> },
  { id: 'home',     icon: <Home size={16} /> },
  { id: 'cloud',    icon: <Cloud size={16} /> },
  { id: 'arr-up',   icon: <ArrowUp size={16} /> },
  { id: 'arr-dn',   icon: <ArrowDown size={16} /> },
  { id: 'arr-lt',   icon: <ArrowLeft size={16} /> },
  { id: 'arr-rt',   icon: <ArrowRight size={16} /> },
  { id: 'dbl-arr',  icon: <ChevronsLeftRight size={16} /> },
  { id: 'tri-up',   icon: <Triangle size={16} /> },
  { id: 'play',     icon: <Play size={16} /> },
  { id: 'warn',     icon: <AlertTriangle size={16} /> },
  { id: 'warn-o',   icon: <AlertTriangle size={16} strokeDasharray="2 1" /> },
  { id: 'square-f', icon: <Square size={16} fill="currentColor" /> },
  { id: 'square',   icon: <Square size={16} /> },
  { id: 'minimize', icon: <Maximize2 size={16} /> },
  { id: 'circle-f', icon: <Circle size={16} fill="currentColor" /> },
  { id: 'play-c',   icon: <Play size={16} /> },
  { id: 'chk-c',    icon: <CheckCircle size={16} /> },
  { id: 'chk-c-o',  icon: <Check size={16} /> },
  { id: 'plus-c',   icon: <PlusCircle size={16} /> },
  { id: 'mtn',      icon: <Mountain size={16} /> },
  { id: 'img',      icon: <ImageIcon size={16} /> },
  { id: 'person',   icon: <User size={16} /> },
  { id: 'per-add',  icon: <UserPlus size={16} /> },
  { id: 'persons',  icon: <Users size={16} /> },
  { id: 'per-rm',   icon: <UserMinus size={16} /> },
  { id: 'per-chk',  icon: <UserCheck size={16} /> },
  { id: 'per-o',    icon: <User size={16} strokeDasharray="2 1" /> },
  { id: 'emoji-a',  icon: <Smile size={16} /> },
  { id: 'emoji',    icon: <Bot size={16} /> },
  { id: 'settings', icon: <Settings size={16} /> },
  { id: 'trophy',   icon: <Trophy size={16} /> },
  { id: 'bulb',     icon: <Lightbulb size={16} /> },
  { id: 'symbols',  icon: <Zap size={16} /> },
  { id: 'mug',      icon: <Coffee size={16} /> },
  { id: 'walk',     icon: <Accessibility size={16} /> },
  { id: 'bug',      icon: <Bug size={16} /> },
  { id: 'bank',     icon: <Landmark size={16} /> },
  { id: 'inf',      icon: <Infinity size={16} /> },
  { id: 'plane',    icon: <Plane size={16} /> },
  { id: 'anchor',   icon: <Anchor size={16} /> },
  { id: 'clock',    icon: <Clock size={16} /> },
];

const lineVariants = [
  { id: 'solid',    el: <div className="w-full h-px bg-[#6B6B6B] group-hover:bg-[#5B4EFF] transition-colors" /> },
  { id: 'dashed',   el: <div className="w-full border-t border-dashed border-[#6B6B6B] group-hover:border-[#5B4EFF] transition-colors" /> },
  { id: 'dotted',   el: <div className="w-full border-t border-dotted border-[#6B6B6B] group-hover:border-[#5B4EFF] transition-colors" /> },
  {
    id: 'arrow',
    el: (
      <div className="flex items-center w-full">
        <div className="flex-1 h-px bg-[#6B6B6B] group-hover:bg-[#5B4EFF] transition-colors" />
        <ChevronRight size={12} className="text-[#6B6B6B] group-hover:text-[#5B4EFF] shrink-0 transition-colors" />
      </div>
    ),
  },
  {
    id: 'dbl-arrow',
    el: (
      <div className="flex items-center w-full">
        <ChevronRight size={12} className="rotate-180 text-[#6B6B6B] group-hover:text-[#5B4EFF] shrink-0 transition-colors" />
        <div className="flex-1 h-px bg-[#6B6B6B] group-hover:bg-[#5B4EFF] transition-colors" />
        <ChevronRight size={12} className="text-[#6B6B6B] group-hover:text-[#5B4EFF] shrink-0 transition-colors" />
      </div>
    ),
  },
];

export function InsertShapesPanel() {
  const { insertElement } = useDesignWorkspace();
  const [query, setQuery] = useState('');
  const filtered = shapeGroups.filter(s => query === '' || s.id.includes(query.toLowerCase()));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2 bg-white border border-[#E2E2E2] rounded-lg px-3 h-8">
          <Search size={13} className="text-[#9CA3AF] shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-[12px] outline-none bg-transparent placeholder:text-[#9CA3AF] text-[#111111]"
            placeholder="search lines and shapes"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
        {/* Lines section */}
        <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Lines</p>
        <div className="flex flex-col gap-3 mb-5">
          {lineVariants.map(v => (
            <button
              key={v.id}
              onClick={() => {
                insertElement({ type: 'line', lineVariant: v.id as 'solid' | 'dashed' | 'dotted' | 'arrow', x: DEFAULT_X - 80, y: DEFAULT_Y, width: 160, height: 16, style: { color: '#6B7280' } });
              }}
              className="group w-full py-1.5 cursor-pointer"
            >
              {v.el}
            </button>
          ))}
        </div>

        {/* Shapes section */}
        <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Shapes</p>
        <div className="grid grid-cols-4 gap-1 w-full">
          {filtered.map(shape => (
            <button
              key={shape.id}
              onClick={() => {
                insertElement({ type: 'shape', shapeVariant: shape.id, x: DEFAULT_X - 40, y: DEFAULT_Y - 40, width: 80, height: 80, style: { color: '#6B7280' } });
              }}
              className="w-10 h-10 flex items-center justify-center rounded-md text-[#6B6B6B] hover:bg-[#f5f5f5] hover:text-[#5B4EFF] transition-colors cursor-pointer"
            >
              {shape.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 7. ICONS PANEL
// ══════════════════════════════════════════════════════════════════

const brandIcons = [
  imgIcon0, imgIcon1, imgIcon2, imgIcon3, imgIcon4, imgIcon5, imgIcon6,
  imgIcon7, imgIcon8, imgIcon9, imgIcon10, imgIcon11, imgIcon12, imgIcon13,
  imgIcon14, imgIcon15, imgIcon16, imgIcon17, imgIcon18, imgIcon19, imgIcon20,
  imgIcon21, imgIcon22, imgIcon23, imgIcon24, imgIcon25, imgIcon26, imgIcon27,
];

export function InsertIconsPanel() {
  const { insertElement } = useDesignWorkspace();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <SearchInput placeholder="search icons" />
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
        <div className="grid grid-cols-3 gap-2 w-full">
          {brandIcons.map((src, i) => (
            <button
              key={i}
              onClick={() => {
                insertElement({ type: 'icon', iconSrc: src, x: DEFAULT_X - 32, y: DEFAULT_Y - 32, width: 64, height: 64 });
              }}
              className="aspect-square rounded-lg border border-[#E2E2E2] bg-white overflow-hidden flex items-center justify-center hover:border-[#5B4EFF] transition-colors cursor-pointer p-1.5"
            >
              <img src={src} alt={`brand-icon-${i}`} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 8. AUDIO PANEL
// ══════════════════════════════════════════════════════════════════

interface AudioFile { id: string; name: string; duration: string }

const audioFiles: AudioFile[] = [
  { id: '1', name: 'Audio File Name 1.mp4',               duration: '1:30'  },
  { id: '2', name: 'Audio File Name 2.aiff',              duration: '1:30'  },
  { id: '3', name: 'Audio File Name 3.wav',               duration: '00:07' },
  { id: '4', name: 'Audio File Name 4.wav',               duration: '00:04' },
  { id: '5', name: 'Audio File Really Very Long Name...', duration: '00:12' },
  { id: '6', name: 'Audio File Name 5.aiff',              duration: '01:22' },
  { id: '7', name: 'Audio File Name 6.acc',               duration: '00:34' },
  { id: '8', name: 'Audio File Name 7.aiff',              duration: '00:13' },
  { id: '9', name: 'Audio File Name 8.aiff',              duration: '00:17' },
];

export function InsertAudioPanel() {
  const { setActivePanel } = useDesignWorkspace();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Upload */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <button className="w-full flex items-center justify-center gap-2 bg-[#5B4EFF] text-white text-[12px] font-medium rounded-full py-2 hover:bg-[#4a3fd4] transition-colors">
          <Upload size={13} /> Upload Media
        </button>
        <p className="text-[10px] text-[#9CA3AF] text-center mt-1">ACC, AIFF, MP3 or WAV (Max. 3MB)</p>
      </div>

      {/* Search */}
      <div className="px-3 pb-1 shrink-0">
        <SearchInput placeholder="search audio files" />
      </div>

      {/* Insert placeholder */}
      <div className="px-3 pb-2 shrink-0">
        <button className="text-[12px] font-medium text-[#5B4EFF] hover:underline">
          Insert placeholder
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
        {audioFiles.map(file => (
          <button
            key={file.id}
            onClick={() => setActivePanel(null)}
            className="flex items-center justify-between w-full py-2 border-b border-[#f0f0f0] hover:bg-[#f9f9f9] transition-colors px-1 rounded"
          >
            <span className="text-[12px] text-[#111111] truncate text-left flex-1 min-w-0">{file.name}</span>
            <span className="text-[11px] text-[#9CA3AF] shrink-0 ml-2 font-mono">{file.duration}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 9. AI VOICE PANEL
// ══════════════════════════════════════════════════════════════════

interface AIVoice { id: string; name: string; duration: string }

const aiVoices: AIVoice[] = [
  { id: '1', name: 'AI Voice Over 1', duration: '0:20' },
  { id: '2', name: 'AI Voice Over 2', duration: '0:30' },
  { id: '3', name: 'AI Voice Over 3', duration: '0:45' },
  { id: '4', name: 'AI Voice Over 4', duration: '0:45' },
];

export function InsertAIVoicePanel() {
  const { setActivePanel } = useDesignWorkspace();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 flex items-center gap-2 bg-white border border-[#E2E2E2] rounded-lg px-3 h-8 min-w-0">
            <Search size={13} className="text-[#9CA3AF] shrink-0" />
            <input
              className="flex-1 min-w-0 text-[12px] outline-none bg-transparent placeholder:text-[#9CA3AF] text-[#111111]"
              placeholder="search AI Voices"
            />
          </div>
          <button className="w-8 h-8 rounded-full bg-[#5B4EFF] flex items-center justify-center shrink-0 hover:bg-[#4a3fd4] transition-colors">
            <Plus size={14} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-2 shrink-0">
        <span className="text-[11px] text-[#9CA3AF]">240 items</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3">
        {aiVoices.map(voice => (
          <button
            key={voice.id}
            onClick={() => setActivePanel(null)}
            className="flex items-center justify-between w-full py-3 border-b border-[#f0f0f0] hover:bg-[#f9f9f9] transition-colors px-1 rounded"
          >
            <span className="text-[13px] text-[#111111] text-left">{voice.name}</span>
            <span className="text-[11px] text-[#9CA3AF] shrink-0 font-mono">{voice.duration}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROUTER — InsertSubPanel
// ══════════════════════════════════════════════════════════════════

const labelMap: Record<InsertMenuItem, string> = {
  text:               'Text',
  dynamicPlaceholder: 'Dynamic Placeholder',
  imagesVideo:        'Images / Video',
  component:          'Component',
  annotation:         'Annotation',
  shapes:             'Shapes',
  icons:              'Icons',
  audio:              'Audio',
  aiVoice:            'AI Voice',
};

export function InsertSubPanel() {
  const { activeInsertItem, setActiveInsertItem } = useDesignWorkspace();

  if (!activeInsertItem) return null;

  const panelMap: Record<InsertMenuItem, React.ReactNode> = {
    text:               <InsertTextPanel />,
    dynamicPlaceholder: <InsertDynamicPlaceholderPanel />,
    imagesVideo:        <InsertImagesVideoPanel />,
    component:          <InsertComponentPanel />,
    annotation:         <InsertAnnotationPanel />,
    shapes:             <InsertShapesPanel />,
    icons:              <InsertIconsPanel />,
    audio:              <InsertAudioPanel />,
    aiVoice:            <InsertAIVoicePanel />,
  };

  return (
    <div className="flex flex-col h-full">
      <InsertSubPanelHeader
        title={labelMap[activeInsertItem]}
        onClose={() => setActiveInsertItem(null)}
      />
      <div className="flex-1 overflow-hidden flex flex-col">
        {panelMap[activeInsertItem]}
      </div>
    </div>
  );
}