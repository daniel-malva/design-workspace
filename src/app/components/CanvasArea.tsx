import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreVertical, ChevronRight, Cloud, Save, RefreshCw,
  ChevronDown, Minus, Plus, Maximize2, Check, X, MessageCircle, Send,
} from 'lucide-react';
import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';
import type { CanvasPage, FeedVariant, CanvasComment, CanvasElement } from '../store/useDesignWorkspaceStore';
import { CanvasFrame } from './CanvasFrame';
import { PageStrip, MiniCanvas } from './PageStrip';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { UndoRedoButtons } from './UndoRedoButtons';
import { zoomBridge } from '../utils/canvasZoomBridge';
import { getInitialCanvasOffset } from '../utils/getInitialCanvasOffset';
import {
  BREADCRUMB_LEFT_PANE_OPEN,
  BREADCRUMB_LEFT_PANE_CLOSED,
  ACTION_BUTTONS_RIGHT,
  PANEL_INNER_GAP,
  PANEL_GAP,
  TIMELINE_HEIGHT,
  TIMELINE_HEIGHT_EXPANDED,
  PAGE_STRIP_HEIGHT,
} from '../constants/layout';

const PADDING = 60; // px — breathing room around canvas on fit-to-screen

// ─── Floating breadcrumb ───────────────────────────────────────────
function BreadcrumbNav({ templateName }: { templateName: string }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#E2E2E2]">
      <span className="text-[11px] text-[#6B6B6B]">Design Workspace</span>
      <ChevronRight size={11} className="text-[#6B6B6B]" />
      <span className="text-[11px] text-[#111111] font-medium">{templateName}</span>
    </div>
  );
}

// ─── Save split button ─────────────────────────────────────────────
function SaveSplitButton() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="relative flex">
      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 bg-[#5B4EFF] hover:bg-[#4a3ee0] text-white text-[11px] font-medium pl-3 pr-2 py-1.5 rounded-l-lg transition-colors"
      >
        <Cloud size={12} />
        {saved ? 'Saved!' : 'Save'}
      </button>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center bg-[#5B4EFF] hover:bg-[#4a3ee0] text-white px-1.5 py-1.5 rounded-r-lg border-l border-white/25 transition-colors"
      >
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#E2E2E2] py-1 w-48 z-50">
          <button onClick={() => { handleSave(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[#111111] hover:bg-[#f5f5f5] transition-colors">
            <Save size={12} className="text-[#6B6B6B]" /> Save new version
          </button>
          <button onClick={() => setOpen(false)} className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[#111111] hover:bg-[#f5f5f5] transition-colors">
            <RefreshCw size={12} className="text-[#6B6B6B]" /> Push changes
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Preview toggle ────────────────────────────────────────────────
function PreviewToggle() {
  const { isPreviewMode, setIsPreviewMode } = useDesignWorkspace();
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#E2E2E2]">
      <span className="text-[11px] text-[#6B6B6B]">Preview</span>
      <button
        onClick={() => setIsPreviewMode(!isPreviewMode)}
        className={`relative w-8 h-4 rounded-full transition-colors ${isPreviewMode ? 'bg-[#5B4EFF]' : 'bg-[#D0D0D0]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${isPreviewMode ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

// ─── Canvas context menu option ───────────────────────────────────
function CanvasMenuOption({ label, onSelect, disabled }: { label: string; onSelect: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${
        disabled
          ? 'text-[#BBBBBB] cursor-not-allowed'
          : 'text-[#111111] hover:bg-[#f5f5f5]'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Single page header (name + kebab) ────────────────────────────
const PAGE_GAP = 80; // px between the bottom of one canvas and the top of the next

function CanvasPageHeader({
  page,
  isActive,
  canvasWidth,
  canvasHeight,
  canvasPages,
  activeVariantId,
  variants,
  addCanvasPage,
  duplicateCanvasPage,
  deleteCanvasPage,
  renameCanvasPage,
}: {
  page:               CanvasPage;
  isActive:           boolean;
  canvasWidth:        number;
  canvasHeight:       number;
  canvasPages:        CanvasPage[];
  activeVariantId:    string | null;
  variants:           FeedVariant[];
  addCanvasPage:      () => void;
  duplicateCanvasPage:(id: string) => void;
  deleteCanvasPage:   (id: string) => void;
  renameCanvasPage:   (id: string, name: string) => void;
}) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [renaming,    setRenaming]    = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeVariant = variants.find(v => v.id === activeVariantId) ?? null;
  // Show feed variant name only when this is the active page and we're on a variant
  const displayName = isActive && activeVariantId !== null
    ? (activeVariant?.name ?? 'Variant')
    : page.name;

  function startRename() {
    setMenuOpen(false);
    setRenameValue(page.name);
    setRenaming(true);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed) renameCanvasPage(page.id, trimmed);
    setRenaming(false);
  }

  function cancelRename() { setRenaming(false); }

  // Auto-focus the input once it appears in the DOM
  useEffect(() => {
    if (renaming) {
      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
      return () => clearTimeout(t);
    }
  }, [renaming]);

  const showKebab = activeVariantId === null; // kebab only on master template view

  return (
    <div className="flex items-center justify-between gap-2 h-8">
      {/* Name or rename input */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {renaming ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  { e.preventDefault(); commitRename(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
              }}
              onBlur={commitRename}
              className="text-[11px] font-medium text-[#111111] bg-white border border-[#5B4EFF] rounded px-1.5 py-0.5 outline-none"
              style={{ width: Math.min(canvasWidth * 0.4, 160) }}
            />
            <button
              onMouseDown={e => { e.preventDefault(); commitRename(); }}
              className="w-4 h-4 flex items-center justify-center text-[#5B4EFF] hover:text-[#4a3ee0] shrink-0"
            >
              <Check size={10} />
            </button>
            <button
              onMouseDown={e => { e.preventDefault(); cancelRename(); }}
              className="w-4 h-4 flex items-center justify-center text-[#6B6B6B] hover:text-[#111111] shrink-0"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <span
            className="text-[11px] text-[#111111] font-medium truncate cursor-default select-none"
            onDoubleClick={showKebab ? startRename : undefined}
            title={showKebab ? `${displayName} (double-click to rename)` : displayName}
          >
            {displayName}
          </span>
        )}
        {isActive && activeVariant?.isDetached && (
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full leading-none shrink-0"
            style={{ color: '#92400e', backgroundColor: '#fef3c7' }}
          >
            modified
          </span>
        )}
      </div>

      {/* Kebab menu — only on master template pages */}
      {showKebab && (
        <div className="relative shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 text-[#111111] transition-colors"
          >
            <MoreVertical size={13} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-[#E2E2E2] py-1 w-44 z-50">
              <CanvasMenuOption label="Rename canvas"    onSelect={startRename} />
              <CanvasMenuOption
                label="Duplicate canvas"
                onSelect={() => { setMenuOpen(false); duplicateCanvasPage(page.id); }}
              />
              <CanvasMenuOption
                label="Delete canvas"
                onSelect={() => { setMenuOpen(false); deleteCanvasPage(page.id); }}
                disabled={canvasPages.length <= 1}
              />
              <CanvasMenuOption
                label="Add new canvas"
                onSelect={() => { setMenuOpen(false); addCanvasPage(); }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── All canvas pages — stacked vertically ────────────────────────
function AllCanvasFrames() {
  const {
    canvasWidth, canvasHeight,
    canvasPages, activePageId,
    activeVariantId, variants,
    canvasElements,
    addCanvasPage, duplicateCanvasPage, deleteCanvasPage, renameCanvasPage,
    switchCanvasPage,
  } = useDesignWorkspace();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: PAGE_GAP, alignItems: 'flex-start' }}>
      {canvasPages.map(page => {
        const isActive = page.id === activePageId;
        // Active page: live canvasElements. Others: their last-saved snapshot.
        const elements = isActive ? canvasElements : page.elementSnapshot;

        return (
          <div
            key={page.id}
            style={{ width: canvasWidth }}
          >
            {/*
              ── Page header ───────────────────────────────
              position:relative + zIndex:100 creates a stacking context that
              sits ABOVE CanvasFrame (which comes later in the DOM and would
              otherwise paint over the dropdown, swallowing all pointer events).
            */}
            <div style={{ position: 'relative', zIndex: 100 }}>
              <CanvasPageHeader
                page={page}
                isActive={isActive}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                canvasPages={canvasPages}
                activeVariantId={activeVariantId}
                variants={variants}
                addCanvasPage={addCanvasPage}
                duplicateCanvasPage={duplicateCanvasPage}
                deleteCanvasPage={deleteCanvasPage}
                renameCanvasPage={renameCanvasPage}
              />
            </div>

            {/* 4px gap between header and canvas */}
            <div style={{ height: 4 }} />

            {/* ── Canvas box ──────────────────────────────── */}
            {isActive ? (
              // Active page: full interactive canvas
              <CanvasFrame />
            ) : (
              // Inactive page: static preview, click to switch
              <div
                role="button"
                tabIndex={0}
                aria-label={`Switch to ${page.name}`}
                onClick={e => { e.stopPropagation(); switchCanvasPage(page.id); }}
                onKeyDown={e => e.key === 'Enter' && switchCanvasPage(page.id)}
                className="relative bg-white shadow-xl select-none cursor-pointer"
                style={{
                  width:  canvasWidth,
                  height: canvasHeight,
                  overflow: 'hidden',
                  outline: '2px solid transparent',
                  transition: 'outline-color 120ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.outlineColor = '#5B4EFF55')}
                onMouseLeave={e => (e.currentTarget.style.outlineColor = 'transparent')}
              >
                <MiniCanvas
                  elements={elements}
                  canvasW={canvasWidth}
                  canvasH={canvasHeight}
                  thumbW={canvasWidth}
                  thumbH={canvasHeight}
                />
                {/* Subtle "click to activate" overlay on hover */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ background: 'rgba(91,78,255,0.04)' }}
                />
              </div>
            )}

            {/* ── Size label ──────────────────────────────── */}
            <div className="text-center mt-2">
              <span className="text-[10px] text-[#6B6B6B] font-medium">
                {canvasWidth}px × {canvasHeight}px
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Zoom Toolbar ──────────────────────────────────────────────────
// Horizontally fixed: always spans from LeftRail's right edge to the screen's right edge.
// Only the vertical axis (bottom) reacts to timeline state.
function ZoomToolbar({ fitToScreen }: { fitToScreen: () => void }) {
  const {
    isTimelineVisible, isTimelineExpanded,
    canvasScale,
    variants,
    // ⚠️ activePanel deliberately NOT used — horizontal position never changes
  } = useDesignWorkspace();

  const hasPageStrip = variants.length > 0;

  // Vertical only — the one dynamic axis
  const timelineHeight = isTimelineExpanded ? TIMELINE_HEIGHT_EXPANDED : TIMELINE_HEIGHT;
  const baseBottom = isTimelineVisible
    ? PANEL_GAP + timelineHeight + PANEL_GAP   // 8 + height + 8
    : PANEL_GAP;                               // 8px from bottom edge
  const toolbarBottom = hasPageStrip
    ? baseBottom + PAGE_STRIP_HEIGHT + PANEL_GAP
    : baseBottom;

  return (
    <div
      className="absolute z-30 flex items-center justify-center pointer-events-none"
      style={{
        left: 0,    // fixed: left edge of canvas container = right edge of LeftRail
        right: 0,   // fixed: right edge of screen
        bottom: toolbarBottom,
        height: 32,
        transition: 'bottom 200ms ease-in-out', // horizontal axis intentionally excluded
      }}
    >
      <div className="pointer-events-auto flex items-center gap-2 bg-white rounded-xl shadow-md px-3 h-8 border border-[#E2E2E2]">
        {/* Zoom out */}
        <button
          className="text-[#6B6B6B] hover:text-[#111111] transition-colors"
          onClick={() => zoomBridge.zoomBy(-0.1)}
          title="Zoom out (Cmd/Ctrl + −)"
        >
          <Minus size={12} />
        </button>

        {/* Slider — min 5%, max 400% */}
        <Slider
          className="w-24"
          min={5}
          max={400}
          step={5}
          value={[Math.round(canvasScale * 100)]}
          onValueChange={([v]) => zoomBridge.zoomTo(v / 100)}
        />

        {/* Zoom in */}
        <button
          className="text-[#6B6B6B] hover:text-[#111111] transition-colors"
          onClick={() => zoomBridge.zoomBy(0.1)}
          title="Zoom in (Cmd/Ctrl + =)"
        >
          <Plus size={12} />
        </button>

        <Separator orientation="vertical" className="h-4 mx-1" />

        <span className="text-[11px] text-[#6B6B6B] w-10 text-center font-mono tabular-nums">
          {Math.round(canvasScale * 100)}%
        </span>

        <Separator orientation="vertical" className="h-4 mx-1" />

        {/* Fit to screen / re-centre (⌘⇧H) — Cmd+0 resets to 100% */}
        <button
          className="text-[#6B6B6B] hover:text-[#111111] transition-colors"
          onClick={fitToScreen}
          title="Fit to screen (Cmd/Ctrl + Shift + H)"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Comment thread popup ──────────────────────────────────────────
// Portal-rendered conversation balloon that opens when a comment is clicked
// (either from a canvas balloon or from the Comments panel).
function CommentThreadPopup({
  comment,
  canvasOffset,
  canvasScale,
  topY,
  containerRect,
  canvasElements,
  onClose,
  addCommentReply,
}: {
  comment:         CanvasComment;
  canvasOffset:    { x: number; y: number };
  canvasScale:     number;
  topY:            number;
  containerRect:   DOMRect;
  canvasElements:  CanvasElement[];
  onClose:         () => void;
  addCommentReply: (commentId: string, text: string) => void;
}) {
  const [replyText, setReplyText] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on click outside the popup
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [onClose]);

  // Compute anchor: right edge of the element (or selection rect)
  let anchorScreenX = containerRect.left + canvasOffset.x + 320 * canvasScale;
  let anchorScreenY = containerRect.top  + canvasOffset.y + 60;

  if (comment.selectionRect) {
    anchorScreenX = containerRect.left + canvasOffset.x + (comment.selectionRect.x + comment.selectionRect.width) * canvasScale;
    anchorScreenY = containerRect.top  + canvasOffset.y + (topY + comment.selectionRect.y) * canvasScale;
  } else if (comment.elementId) {
    const el = canvasElements.find(e => e.id === comment.elementId);
    if (el) {
      anchorScreenX = containerRect.left + canvasOffset.x + (el.x + el.width) * canvasScale;
      anchorScreenY = containerRect.top  + canvasOffset.y + (topY + el.y)      * canvasScale;
    }
  }

  const POPUP_W   = 284;
  const POPUP_MXH = 380;
  const GAP       = 14;

  // Prefer right; flip left if too close to the right viewport edge
  let left = anchorScreenX + GAP;
  if (left + POPUP_W > window.innerWidth - 12) {
    left = anchorScreenX - POPUP_W - GAP;
  }
  // Clamp vertically
  let top = Math.min(anchorScreenY, window.innerHeight - POPUP_MXH - 12);
  top = Math.max(12, top);

  function submitReply() {
    if (!replyText.trim()) return;
    addCommentReply(comment.id, replyText.trim());
    setReplyText('');
  }

  const hasReplies = (comment.replies?.length ?? 0) > 0;

  return createPortal(
    <div
      ref={popupRef}
      style={{
        position:      'fixed',
        left,
        top,
        width:         POPUP_W,
        maxHeight:     POPUP_MXH,
        zIndex:        10001,
        background:    'white',
        borderRadius:  14,
        boxShadow:     '0 8px 32px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
        border:        '1px solid #E2E2E2',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* ── Original comment ──────────────────────────────────── */}
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #f0f0f0' }}>
        {/* Context badge */}
        {comment.selectionRect ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
            <div style={{ width: 7, height: 7, border: '1.5px dashed #5B4EFF', borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: '#5B4EFF', fontWeight: 600 }}>
              {comment.selectionElementCount === 0
                ? 'Area selection'
                : `${comment.selectionElementCount} element${comment.selectionElementCount !== 1 ? 's' : ''}`}
            </span>
          </div>
        ) : comment.elementName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#5B4EFF' }} />
            <span style={{ fontSize: 10, color: '#5B4EFF', fontWeight: 600 }}>{comment.elementName}</span>
          </div>
        ) : null}

        {/* Author row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            backgroundColor: comment.authorColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>{comment.authorInitials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1f1d25' }}>Lucas</span>
              <span style={{ fontSize: 10, color: '#9c99a9' }}>{comment.timestamp}</span>
            </div>
            <p style={{ fontSize: 12, color: '#686576', lineHeight: 1.4, wordBreak: 'break-word', margin: 0 }}>
              {comment.text}
            </p>
          </div>
        </div>
      </div>

      {/* ── Replies ───────────────────────────────────────────── */}
      {hasReplies && (
        <div style={{ overflowY: 'auto', maxHeight: 160, padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
          {comment.replies!.map(reply => (
            <div key={reply.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 14px' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: reply.authorColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>{reply.authorInitials}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1f1d25' }}>Lucas</span>
                  <span style={{ fontSize: 10, color: '#9c99a9' }}>{reply.timestamp}</span>
                </div>
                <p style={{ fontSize: 12, color: '#686576', lineHeight: 1.4, wordBreak: 'break-word', margin: 0 }}>
                  {reply.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Reply input ───────────────────────────────────────── */}
      <div style={{ padding: '10px 14px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            backgroundColor: '#7BB3E0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
          }}>
            <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>LM</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(); }
                if (e.key === 'Escape') { e.preventDefault(); onClose(); }
              }}
              placeholder={hasReplies ? 'Reply…' : 'Reply to this comment…'}
              rows={2}
              style={{
                width: '100%', resize: 'none', fontSize: 12, color: '#1f1d25',
                backgroundColor: '#f9fafa', border: '1px solid #dddce0',
                borderRadius: 8, padding: '6px 10px', outline: 'none',
                lineHeight: 1.4, fontFamily: 'inherit', display: 'block',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#473bab';
                e.target.style.boxShadow  = '0 0 0 1px #473bab';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#dddce0';
                e.target.style.boxShadow  = 'none';
              }}
            />
            {replyText.trim().length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontSize: 10, color: '#b5b3bf' }}>Shift+Enter for new line</span>
                <button
                  onClick={submitReply}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', backgroundColor: '#473bab', color: 'white',
                    fontSize: 11, fontWeight: 600, border: 'none', borderRadius: 20, cursor: 'pointer',
                  }}
                >
                  <Send size={10} />
                  Reply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Page geometry helpers ─────────────────────────────────────────
// These must stay in sync with AllCanvasFrames's flex layout.
const HEADER_H  = 32;  // CanvasPageHeader h-8
const SPACER_H  = 4;   // explicit height:4 div
const LABEL_H   = 24;  // mt-2 (8px) + ~16px text

/** Y position (in transform-space) of the top of the canvas box for page at index i */
function canvasBoxTopY(index: number, canvasHeight: number): number {
  const unitH = HEADER_H + SPACER_H + canvasHeight + LABEL_H;
  return index * (unitH + PAGE_GAP) + HEADER_H + SPACER_H;
}

// ─── Animated pan helper ───────────────────────────────────────────
// Easing: ease-out-quart — quick start, cushioned stop. Feels natural for
// spatial navigation in canvas tools. Duration ~300 ms.
const PAN_DURATION = 300; // ms

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Smoothly animates canvasOffset from the current value to (toX, toY).
 * Returns a cancel function — call it if a newer animation starts.
 */
function animatePan(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  setter: (offset: { x: number; y: number }) => void,
): () => void {
  const start = performance.now();
  let rafId: number;

  function tick(now: number) {
    const t    = Math.min((now - start) / PAN_DURATION, 1);
    const ease = easeOutQuart(t);
    setter({
      x: fromX + (toX - fromX) * ease,
      y: fromY + (toY - fromY) * ease,
    });
    if (t < 1) rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

// ─── Main CanvasArea ───────────────────────────────────────────────
export function CanvasArea() {
  const {
    templateName, selectElement, setSelection, setActivePanel,
    activePanel, canvasScale, setCanvasScale,
    selectedElementIds, activityPanelOpen, activityPanelTab,
    setActivityPanelOpen, setActivityPanelTab,
    canvasOffset, setCanvasOffset,
    fitCanvasToScreen,
    canvasWidth, canvasHeight,
    canvasPages, activePageId, canvasElements,
    commentMode, canvasComments, highlightedCommentId,
    setCommentMode, addCanvasComment, setHighlightedCommentId, addCommentReply,
  } = useDesignWorkspace();

  // Live refs so stable callbacks read current canvas dimensions
  const canvasWRef = useRef(canvasWidth);
  canvasWRef.current = canvasWidth;
  const canvasHRef = useRef(canvasHeight);
  canvasHRef.current = canvasHeight;

  const isLeftPaneVisible = activePanel !== null && activePanel !== 'settings' && activePanel !== 'configure';
  const breadcrumbLeft = isLeftPaneVisible
    ? BREADCRUMB_LEFT_PANE_OPEN
    : BREADCRUMB_LEFT_PANE_CLOSED;

  // RightPanel is visible under the same conditions as RightPanel.tsx
  const isRightPanelVisible =
    activePanel === 'settings' ||
    activePanel === 'configure' ||
    selectedElementIds.length > 0 ||
    activityPanelOpen;

  const buttonsRight = isRightPanelVisible
    ? ACTION_BUTTONS_RIGHT
    : PANEL_INNER_GAP;

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Live refs — wheel/zoom closures always read current values without stale captures
  const scaleRef = useRef(canvasScale);
  scaleRef.current = canvasScale;
  const offsetRef = useRef(canvasOffset);
  offsetRef.current = canvasOffset;

  // ── Comment mode state ────────────────────────────────────────────────────
  const commentModeRef = useRef(commentMode);
  commentModeRef.current = commentMode;

  // Live refs so global listeners always read the latest canvas data
  const canvasElementsLocalRef = useRef(canvasElements);
  canvasElementsLocalRef.current = canvasElements;
  const canvasPagesLocalRef = useRef(canvasPages);
  canvasPagesLocalRef.current = canvasPages;
  const activePageIdLocalRef = useRef(activePageId);
  activePageIdLocalRef.current = activePageId;

  // Pending comment state — covers both single-click and drag-area modes
  const [pendingComment, setPendingComment] = useState<{
    screenX: number; screenY: number;
    // Single element
    elementId?: string; elementName?: string;
    // Area selection
    selectionRect?: { x: number; y: number; width: number; height: number };
    selectionElementIds?: string[];
    selectionElementCount?: number;
  } | null>(null);
  const pendingCommentRef = useRef(pendingComment);
  pendingCommentRef.current = pendingComment;

  const [pendingText, setPendingText] = useState('');

  // Cursor follower position (updated by global listener)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // ID of the comment whose thread popup is currently open (null = closed)
  const [openThreadCommentId, setOpenThreadCommentId] = useState<string | null>(null);

  // Drag state: start position stored in a ref (no re-render on move), visual rect in state
  const commentDragStartRef = useRef<{ containerX: number; containerY: number } | null>(null);
  const [commentSelRect, setCommentSelRect] = useState<{
    left: number; top: number; width: number; height: number;
  } | null>(null);

  // ── Combined comment-mode global listeners (cursor + drag) ────────────────
  // Activated when commentMode turns on; cleaned up when it turns off.
  useEffect(() => {
    if (!commentMode) {
      setCursorPos(null);
      return;
    }

    function onMove(e: MouseEvent) {
      // Cursor follower
      setCursorPos({ x: e.clientX, y: e.clientY });

      // Selection rectangle (during drag)
      if (!commentDragStartRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      const { containerX: sx, containerY: sy } = commentDragStartRef.current;
      if (Math.abs(curX - sx) > 3 || Math.abs(curY - sy) > 3) {
        setCommentSelRect({
          left:   Math.min(sx, curX),
          top:    Math.min(sy, curY),
          width:  Math.abs(curX - sx),
          height: Math.abs(curY - sy),
        });
      }
    }

    function onUp(e: MouseEvent) {
      if (!commentDragStartRef.current) return;
      const start = commentDragStartRef.current;
      commentDragStartRef.current = null;
      // NOTE: do NOT clear commentSelRect here for the drag case —
      // it stays visible until the user submits or cancels the comment.

      const rect   = containerRef.current?.getBoundingClientRect();
      const offset = offsetRef.current;
      if (!rect || !offset) return;

      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;
      const dist  = Math.hypot(curX - start.containerX, curY - start.containerY);
      const scale = scaleRef.current;
      const pages = canvasPagesLocalRef.current;
      const pid   = activePageIdLocalRef.current;
      const topY  = canvasBoxTopY(pages.findIndex(p => p.id === pid), canvasHRef.current);
      const els   = canvasElementsLocalRef.current;

      if (dist < 5) {
        // Single click — clear any lingering drag rect, hit-test the topmost element
        setCommentSelRect(null);
        const cx = (start.containerX - offset.x) / scale;
        const cy = (start.containerY - offset.y) / scale - topY;
        const hit = [...els].reverse().find(el =>
          cx >= el.x && cx <= el.x + el.width && cy >= el.y && cy <= el.y + el.height
        );
        setPendingComment({
          screenX: e.clientX, screenY: e.clientY,
          elementId: hit?.id, elementName: hit?.name,
        });
      } else {
        // Drag — area selection
        const x1 = (Math.min(start.containerX, curX) - offset.x) / scale;
        const y1 = (Math.min(start.containerY, curY) - offset.y) / scale - topY;
        const x2 = (Math.max(start.containerX, curX) - offset.x) / scale;
        const y2 = (Math.max(start.containerY, curY) - offset.y) / scale - topY;
        const selRect = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
        // Center-point test (same rule as the live drag highlight)
        const selEls  = els.filter(el => {
          const ecx = el.x + el.width  / 2;
          const ecy = el.y + el.height / 2;
          return ecx >= x1 && ecx <= x2 && ecy >= y1 && ecy <= y2;
        });
        setPendingComment({
          screenX: e.clientX, screenY: e.clientY,
          selectionRect: selRect,
          selectionElementIds:   selEls.map(el => el.id),
          selectionElementCount: selEls.length,
        });
      }
      setPendingText('');
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      setCursorPos(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentMode]);

  // Clear comment highlight when the activity panel is closed (so no stale overlay lingers)
  useEffect(() => {
    if (!activityPanelOpen) {
      setHighlightedCommentId(null);
      setOpenThreadCommentId(null);
    }
  }, [activityPanelOpen, setHighlightedCommentId]);

  // When a comment is highlighted (from panel or balloon), open its thread popup
  useEffect(() => {
    if (highlightedCommentId !== null) {
      setOpenThreadCommentId(highlightedCommentId);
    } else {
      setOpenThreadCommentId(null);
    }
  }, [highlightedCommentId]);

  // C key → enter comment mode; Escape → dismiss popover or exit mode
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!commentModeRef.current) {
          setCommentMode(true);
          setActivityPanelOpen(true);
          setActivityPanelTab('comments');
        } else {
          // C pressed again → same full teardown as Escape
          setCommentMode(false);
          setPendingComment(null);
          setPendingText('');
          setOpenThreadCommentId(null);
          setHighlightedCommentId(null);
          setActivityPanelOpen(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        if (pendingCommentRef.current) {
          // First Escape: dismiss the pending popover only
          setPendingComment(null);
          setPendingText('');
          setCommentSelRect(null);
        } else if (commentModeRef.current) {
          // Second (or sole) Escape: fully exit comment mode
          setCommentMode(false);
          setOpenThreadCommentId(null);
          setHighlightedCommentId(null);
          setActivityPanelOpen(false);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCommentMode, setActivityPanelOpen, setActivityPanelTab, setHighlightedCommentId]);

  // ── V66: ResizeObserver-based fit-to-screen on first mount ───────────────
  // Runs after paint — guarantees real DOM dimensions are available.
  // Falls back to ResizeObserver when getBoundingClientRect() returns 0
  // (e.g. when the component mounts before layout is complete).
  const initializedRef = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function initializeOffset(width: number, height: number) {
      if (initializedRef.current) return;
      if (width === 0 || height === 0) return;
      initializedRef.current = true;
      const fitScale = Math.min(
        (width  - PADDING * 2) / canvasWRef.current,
        (height - PADDING * 2) / canvasHRef.current,
        1, // never upscale beyond 100%
      );
      setCanvasScale(fitScale);
      setCanvasOffset(getInitialCanvasOffset(width, height, fitScale));
    }

    // Try immediately — usually has real dimensions after first paint
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      initializeOffset(rect.width, rect.height);
      return; // already initialized — ResizeObserver not needed
    }

    // Fallback: fire when container acquires real dimensions
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          initializeOffset(width, height);
          observer.disconnect();
          break;
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animated pan to active canvas page when activePageId changes ─────────
  // Skips the initial mount (fit-to-screen handles that).
  // On add / duplicate / delete / panel click it smoothly slides to the newly
  // active page, keeping the current zoom level.
  const prevActivePageIdRef = useRef(activePageId);
  const cancelPanRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (activePageId === prevActivePageIdRef.current) return;
    prevActivePageIdRef.current = activePageId;

    const pageIndex = canvasPages.findIndex(p => p.id === activePageId);
    if (pageIndex < 0) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scale   = scaleRef.current;
    const topY    = canvasBoxTopY(pageIndex, canvasHRef.current);
    const targetX = rect.width  / 2 - (canvasWRef.current / 2) * scale;
    const targetY = rect.height / 2 - (topY + canvasHRef.current / 2) * scale;

    // Cancel any animation still in flight
    cancelPanRef.current?.();

    const from = offsetRef.current ?? { x: targetX, y: targetY };
    cancelPanRef.current = animatePan(from.x, from.y, targetX, targetY, setCanvasOffset);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId]);

  // ── V62: Zoom helpers — all keep a visible focal point fixed ──────────────
  const zoomBy = useCallback((delta: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width  / 2 : 400;
    const cy = rect ? rect.height / 2 : 400;
    const prevScale = scaleRef.current;
    const nextScale = Math.min(4, Math.max(0.05, prevScale + delta));
    const ratio = nextScale / prevScale;
    const prev = offsetRef.current ?? { x: 0, y: 0 };
    setCanvasOffset({
      x: cx - (cx - prev.x) * ratio,
      y: cy - (cy - prev.y) * ratio,
    });
    setCanvasScale(nextScale);
  }, [setCanvasScale, setCanvasOffset]);

  const zoomTo = useCallback((targetScale: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width  / 2 : 400;
    const cy = rect ? rect.height / 2 : 400;
    const prevScale = scaleRef.current;
    const nextScale = Math.min(4, Math.max(0.05, targetScale));
    const ratio = nextScale / prevScale;
    const prev = offsetRef.current ?? { x: 0, y: 0 };
    setCanvasOffset({
      x: cx - (cx - prev.x) * ratio,
      y: cy - (cy - prev.y) * ratio,
    });
    setCanvasScale(nextScale);
  }, [setCanvasScale, setCanvasOffset]);

  const fitToScreen = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const newScale = Math.min(
      (rect.width  - PADDING * 2) / canvasWRef.current,
      (rect.height - PADDING * 2) / canvasHRef.current,
      1,
    );
    setCanvasScale(newScale);
    setCanvasOffset(getInitialCanvasOffset(rect.width, rect.height, newScale));
  }, [setCanvasScale, setCanvasOffset]);

  const resetZoom = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cw = rect?.width  ?? 800;
    const ch = rect?.height ?? 600;
    setCanvasScale(1);
    setCanvasOffset(getInitialCanvasOffset(cw, ch, 1));
  }, [setCanvasScale, setCanvasOffset]);

  // Register zoom actions with the bridge so keyboard shortcuts and the
  // ZoomToolbar can call them without needing a ref chain.
  useEffect(() => {
    zoomBridge.zoomBy      = zoomBy;
    zoomBridge.zoomTo      = zoomTo;
    zoomBridge.fitToScreen = fitToScreen;
    zoomBridge.resetZoom   = resetZoom;
  }, [zoomBy, zoomTo, fitToScreen, resetZoom]);

  // ── V62: Native wheel handler ─────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();

      const isMod = e.ctrlKey || e.metaKey;
      const prev = offsetRef.current;
      if (!prev) return; // guard: canvas not yet initialised

      if (isMod) {
        const rect   = el!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomDelta = e.deltaMode === 0
          ? -e.deltaY * 0.005
          : -e.deltaY * 0.05;

        const prevScale = scaleRef.current;
        const nextScale = Math.min(4, Math.max(0.05, prevScale + zoomDelta));
        const ratio     = nextScale / prevScale;

        setCanvasOffset({
          x: mouseX - (mouseX - prev.x) * ratio,
          y: mouseY - (mouseY - prev.y) * ratio,
        });
        setCanvasScale(nextScale);

      } else {
        const multiplier = e.deltaMode === 1 ? 20 : 1;
        setCanvasOffset({
          x: prev.x - e.deltaX * multiplier,
          y: prev.y - e.deltaY * multiplier,
        });
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setCanvasOffset, setCanvasScale]);

  // ── Mouse-drag pan (gray background only) ──────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.button !== 0) return;
    const curr = offsetRef.current;
    if (!curr) return; // guard: canvas not yet initialised
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: curr.x, originY: curr.y };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setCanvasOffset({
      x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.originY + (e.clientY - dragRef.current.startY),
    });
  }, [isDragging, setCanvasOffset]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  function handleBackgroundClick() {
    if (commentModeRef.current) return; // comment mode captures canvas clicks
    setActivePanel(null);
    selectElement(null);
    setActivityPanelOpen(!activityPanelOpen);
  }

  // Start a comment drag/click on mousedown — global listeners (registered in the
  // commentMode effect above) handle mousemove + mouseup to finalize the action.
  function handleCommentMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    commentDragStartRef.current = {
      containerX: e.clientX - rect.left,
      containerY: e.clientY - rect.top,
    };
  }

  function submitComment() {
    if (!pendingCommentRef.current || !pendingText.trim()) return;
    const p = pendingCommentRef.current;
    addCanvasComment(
      pendingText.trim(),
      p.elementId,
      p.elementName,
      p.selectionRect,
      p.selectionElementIds,
    );
    setPendingComment(null);
    setPendingText('');
    setCommentSelRect(null);
    setActivityPanelOpen(true);
    setActivityPanelTab('comments');
  }

  function dismissPendingComment() {
    setPendingComment(null);
    setPendingText('');
    setCommentSelRect(null);
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#E8E8E8]">
      {/* Dot grid + pan/zoom surface — containerRef always mounted so
          ResizeObserver can measure dimensions even before canvas is shown */}
      <div
        ref={containerRef}
        data-canvas-container
        className={`absolute inset-0 select-none ${
          isDragging ? 'cursor-grabbing' : commentMode ? 'cursor-none' : 'cursor-grab'
        }`}
        style={{
          backgroundImage: 'radial-gradient(circle, #B4B4B4 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleBackgroundClick}
      >
        {/*
          V66 guard: only render canvas content once offset is known.
          canvasOffset starts as null — on first mount the ResizeObserver
          calculates the correct centred offset and sets it.  Until that
          point we render the grey dotted background only (no flash at 0,0).

          transform: translate(ox, oy) scale(s)   ← translate BEFORE scale
          transformOrigin: '0 0'                  ← scale from top-left corner
          No willChange here — it would cause the browser to rasterize the
          subtree into a bitmap before scaling, making text and SVGs blurry
          at high zoom. Without it the browser re-renders vector content at
          each zoom level, preserving sharpness.
        */}
        {canvasOffset !== null && (() => {
          const activePageIndex = canvasPages.findIndex(p => p.id === activePageId);
          const topY = canvasBoxTopY(activePageIndex, canvasHeight);

          return (
            <>
              {/* Scaled canvas content */}
              <div
                style={{
                  position:        'absolute',
                  left:            0,
                  top:             0,
                  transform:       `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
                  transformOrigin: '0 0',
                }}
              >
                <AllCanvasFrames />
              </div>

              {/* ── Comment mode overlay — covers active canvas only ── */}
              {commentMode && (
                <div
                  style={{
                    position: 'absolute',
                    left:     canvasOffset.x,
                    top:      canvasOffset.y + topY * canvasScale,
                    width:    canvasWidth  * canvasScale,
                    height:   canvasHeight * canvasScale,
                    zIndex:   30,
                    cursor:   'none',
                  }}
                  onMouseDown={handleCommentMouseDown}
                />
              )}

              {/* ── Drag selection rectangle + element highlight feedback ── */}
              {commentMode && commentSelRect && commentSelRect.width > 3 && commentSelRect.height > 3 && (() => {
                // commentSelRect is already in container-space coords — NO canvasOffset needed.
                // Convert to canvas-space so we can intersect-test elements.
                const cx1 = (commentSelRect.left                          - canvasOffset.x) / canvasScale;
                const cy1 = (commentSelRect.top                           - canvasOffset.y) / canvasScale - topY;
                const cx2 = (commentSelRect.left + commentSelRect.width   - canvasOffset.x) / canvasScale;
                const cy2 = (commentSelRect.top  + commentSelRect.height  - canvasOffset.y) / canvasScale - topY;

                // Center-point test: element's center must be inside the drag rect.
                // Much more precise than AABB overlap — avoids picking up large elements
                // (e.g. background) that merely touch the rect boundary.
                const hovered = canvasElements.filter(el => {
                  const ecx = el.x + el.width  / 2;
                  const ecy = el.y + el.height / 2;
                  return ecx >= cx1 && ecx <= cx2 && ecy >= cy1 && ecy <= cy2;
                });

                return (
                  <>
                    {/* Selection marquee */}
                    <div
                      style={{
                        position:      'absolute',
                        left:          commentSelRect.left,
                        top:           commentSelRect.top,
                        width:         commentSelRect.width,
                        height:        commentSelRect.height,
                        border:        '2px dashed #5B4EFF',
                        background:    'rgba(91,78,255,0.07)',
                        borderRadius:  3,
                        zIndex:        31,
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Per-element highlight overlays */}
                    {hovered.map(el => {
                      const elLeft = canvasOffset.x + el.x            * canvasScale;
                      const elTop  = canvasOffset.y + (topY + el.y)   * canvasScale;
                      const elW    = el.width  * canvasScale;
                      const elH    = el.height * canvasScale;
                      return (
                        <div
                          key={el.id}
                          style={{
                            position:      'absolute',
                            left:          elLeft,
                            top:           elTop,
                            width:         elW,
                            height:        elH,
                            border:        '2px solid #5B4EFF',
                            background:    'rgba(91,78,255,0.13)',
                            borderRadius:  2,
                            zIndex:        32,
                            pointerEvents: 'none',
                          }}
                        />
                      );
                    })}
                  </>
                );
              })()}

              {/* ── Avatar balloons — visible in comment mode OR when Comments tab is active ── */}
              {(commentMode || (activityPanelOpen && activityPanelTab === 'comments')) &&
                canvasComments
                  .filter(c => !c.resolved && (
                    (c.elementId && canvasElements.some(e => e.id === c.elementId)) ||
                    c.selectionRect
                  ))
                  .map(comment => {
                    // Anchor: element top-left (single) or selection rect top-left (area)
                    let bx: number, by: number;
                    if (comment.selectionRect) {
                      bx = canvasOffset.x + comment.selectionRect.x * canvasScale;
                      by = canvasOffset.y + (topY + comment.selectionRect.y) * canvasScale;
                    } else {
                      const el = canvasElements.find(e => e.id === comment.elementId)!;
                      bx = canvasOffset.x + el.x * canvasScale;
                      by = canvasOffset.y + (topY + el.y) * canvasScale;
                    }
                    const isArea      = !!comment.selectionRect;
                    const threadCount = 1 + (comment.replies?.length ?? 0);
                    const hasReplies  = threadCount > 1;
                    return (
                      <button
                        key={comment.id}
                        style={{
                          position:   'absolute',
                          left:       bx - 12,
                          top:        by - 26,
                          zIndex:     21,
                          cursor:     'pointer',
                          padding:    0,
                          border:     'none',
                          background: 'none',
                        }}
                        title={comment.text}
                        onClick={e => {
                          e.stopPropagation();
                          // Highlight only — no selectElement() so Properties panel doesn't take over
                          setHighlightedCommentId(comment.id);
                          setActivityPanelOpen(true);
                          setActivityPanelTab('comments');
                        }}
                      >
                        {/* Wrapper — relative so the count badge can be absolutely positioned */}
                        <div style={{ position: 'relative', display: 'inline-flex' }}>
                          {/* Balloon body — rounded pill for area, circle for single */}
                          <div style={{
                            minWidth:        24,
                            height:          24,
                            paddingInline:   isArea ? 6 : 0,
                            borderRadius:    isArea ? '12px 12px 12px 4px' : '50% 50% 50% 4px',
                            backgroundColor: comment.authorColor,
                            border:          '2px solid white',
                            boxShadow:       '0 2px 8px rgba(0,0,0,0.25)',
                            display:         'flex',
                            alignItems:      'center',
                            justifyContent:  'center',
                            gap:             3,
                          }}>
                            <span style={{ fontSize: 8, color: 'white', fontWeight: 700, letterSpacing: '-0.5px' }}>
                              {comment.authorInitials}
                            </span>
                            {isArea && comment.selectionElementCount !== undefined && (
                              <span style={{ fontSize: 8, color: 'white', fontWeight: 600 }}>
                                ·{comment.selectionElementCount}
                              </span>
                            )}
                          </div>

                          {/* Thread-count badge — only visible when there are replies */}
                          {hasReplies && (
                            <div style={{
                              position:        'absolute',
                              top:             -5,
                              right:           -5,
                              minWidth:        14,
                              height:          14,
                              paddingInline:   3,
                              borderRadius:    7,
                              backgroundColor: '#1f1d25',
                              border:          '1.5px solid white',
                              display:         'flex',
                              alignItems:      'center',
                              justifyContent:  'center',
                              boxSizing:       'border-box',
                            }}>
                              <span style={{ fontSize: 7, color: 'white', fontWeight: 700, lineHeight: 1 }}>
                                {threadCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
              }

              {/* ── Highlighted comment — canvas overlay for referenced element(s) ──
                  Driven by highlightedCommentId set when the user clicks a comment row
                  or a balloon. Does NOT call selectElement(), so the Comments tab stays
                  visible (RightPanel hides ActivityPanel when selectedElementIds > 0).   */}
              {highlightedCommentId && (() => {
                const hc = canvasComments.find(c => c.id === highlightedCommentId);
                if (!hc) return null;

                // Collect element IDs to highlight
                const ids: string[] = hc.selectionElementIds?.length
                  ? hc.selectionElementIds
                  : hc.elementId ? [hc.elementId] : [];

                const highlights = ids
                  .map(id => canvasElements.find(el => el.id === id))
                  .filter(Boolean) as typeof canvasElements;

                if (highlights.length === 0) return null;

                return highlights.map(el => {
                  const hlLeft = canvasOffset.x + el.x          * canvasScale;
                  const hlTop  = canvasOffset.y + (topY + el.y) * canvasScale;
                  const hlW    = el.width  * canvasScale;
                  const hlH    = el.height * canvasScale;
                  return (
                    <div
                      key={`hl-${el.id}`}
                      style={{
                        position:      'absolute',
                        left:          hlLeft - 3,
                        top:           hlTop  - 3,
                        width:         hlW + 6,
                        height:        hlH + 6,
                        border:        '2px solid #5B4EFF',
                        background:    'rgba(91,78,255,0.08)',
                        borderRadius:  4,
                        boxShadow:     '0 0 0 4px rgba(91,78,255,0.15)',
                        zIndex:        19,
                        pointerEvents: 'none',
                      }}
                    />
                  );
                });
              })()}
            </>
          );
        })()}
      </div>

      {/* ── Floating shell overlays — only shown once canvas is ready ── */}
      {canvasOffset !== null && (
        <>
          {/* Breadcrumb — left-anchored, slides with left pane */}
          <div
            className="absolute top-1 z-30 flex items-center gap-2 h-8 pointer-events-none"
            style={{ left: breadcrumbLeft, transition: 'left 0.18s ease-out' }}
          >
            {/* Undo / Redo */}
            <div className="pointer-events-auto" onClick={e => e.stopPropagation()}>
              <UndoRedoButtons />
            </div>

            {/* Breadcrumb pill */}
            <div className="pointer-events-auto" onClick={e => e.stopPropagation()}>
              <BreadcrumbNav templateName={templateName} />
            </div>
          </div>

          {/* Save + Preview */}
          <div
            className="absolute top-1 z-30 flex items-center gap-2 h-8 transition-all duration-200 ease-in-out"
            style={{ right: buttonsRight }}
            onClick={e => e.stopPropagation()}
          >
            <PreviewToggle />
            <SaveSplitButton />
          </div>

          {/* Page strip — sits above the Timeline, below the ZoomToolbar */}
          <PageStrip />

          {/* Zoom toolbar — above PageStrip (or Timeline if no variants) */}
          <ZoomToolbar fitToScreen={fitToScreen} />

          {/* ── Comment mode: "C" indicator badge ── */}
          {commentMode && (
            <div
              className="absolute z-40 pointer-events-none"
              style={{ bottom: 48, left: '50%', transform: 'translateX(-50%)' }}
            >
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#5B4EFF] text-white rounded-full shadow-lg text-[11px] font-medium">
                <MessageCircle size={12} />
                Comment mode — click an element · <kbd className="bg-white/20 px-1 rounded text-[10px]">C</kbd> or <kbd className="bg-white/20 px-1 rounded text-[10px]">Esc</kbd> to exit
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Speech-bubble cursor follower (portal → body) ── */}
      {commentMode && cursorPos && createPortal(
        <div
          style={{
            position:      'fixed',
            left:          cursorPos.x,
            top:           cursorPos.y,
            pointerEvents: 'none',
            zIndex:        9999,
            transform:     'translate(2px, 2px)',
          }}
        >
          <MessageCircle
            size={22}
            fill="#5B4EFF"
            color="white"
            strokeWidth={1.5}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          />
        </div>,
        document.body,
      )}

      {/* ── Pending comment popover (portal → body) ── */}
      {pendingComment && createPortal(
        <div
          style={{
            position:     'fixed',
            left:         Math.min(pendingComment.screenX, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 284),
            top:          pendingComment.screenY + 12,
            width:        272,
            zIndex:       10000,
            background:   'white',
            borderRadius: 14,
            boxShadow:    '0 8px 32px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
            border:       '1px solid #E2E2E2',
            padding:      14,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Context badge */}
          {pendingComment.selectionRect ? (
            // Area selection mode
            <div className="flex items-center gap-1.5 mb-2.5">
              <div
                className="shrink-0 rounded"
                style={{ width: 8, height: 8, border: '2px dashed #5B4EFF' }}
              />
              <span className="text-[11px] text-[#5B4EFF] font-semibold">
                {pendingComment.selectionElementCount === 0
                  ? 'Empty area selected'
                  : `${pendingComment.selectionElementCount} element${pendingComment.selectionElementCount !== 1 ? 's' : ''} selected`}
              </span>
            </div>
          ) : pendingComment.elementName ? (
            // Single element hit
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-[#5B4EFF] shrink-0" />
              <span className="text-[11px] text-[#5B4EFF] font-semibold truncate">
                {pendingComment.elementName}
              </span>
            </div>
          ) : (
            // Click on empty canvas
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-[#9c99a9] shrink-0" />
              <span className="text-[11px] text-[#9c99a9] font-medium">Canvas (no element)</span>
            </div>
          )}

          {/* Textarea */}
          <textarea
            autoFocus
            value={pendingText}
            onChange={e => setPendingText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                dismissPendingComment();
              }
            }}
            placeholder="Add a comment… (Enter to send)"
            rows={3}
            className="w-full resize-none text-[12px] text-[#1f1d25] placeholder:text-[#9c99a9] leading-[1.5] bg-[#f9fafa] border border-[#dddce0] rounded-lg px-3 py-2 outline-none focus:border-[#473bab] focus:ring-1 focus:ring-[#473bab] transition-colors overflow-x-hidden"
          />

          {/* Actions */}
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[10px] text-[#b5b3bf]">Shift+Enter for new line</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={dismissPendingComment}
                className="px-2.5 py-1 text-[11px] text-[#686576] hover:text-[#1f1d25] rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitComment}
                disabled={!pendingText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#473bab] hover:bg-[#3a2f8f] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold rounded-full transition-colors"
              >
                <Send size={10} />
                Send
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── Comment thread popup (portal → body) ── */}
      {openThreadCommentId && canvasOffset !== null && (() => {
        const hc = canvasComments.find(c => c.id === openThreadCommentId);
        if (!hc) return null;
        const activePageIndex = canvasPages.findIndex(p => p.id === activePageId);
        const tY = canvasBoxTopY(activePageIndex, canvasHeight);
        const cRect = containerRef.current?.getBoundingClientRect();
        if (!cRect) return null;
        return (
          <CommentThreadPopup
            comment={hc}
            canvasOffset={canvasOffset}
            canvasScale={canvasScale}
            topY={tY}
            containerRect={cRect}
            canvasElements={canvasElements}
            onClose={() => setOpenThreadCommentId(null)}
            addCommentReply={addCommentReply}
          />
        );
      })()}
    </div>
  );
}