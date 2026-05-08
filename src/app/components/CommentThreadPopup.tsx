import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send } from 'lucide-react';
import type { CanvasComment, CanvasElement } from '../store/useDesignWorkspaceStore';

// Portal-rendered conversation balloon that opens when a comment is clicked
// (either from a canvas balloon or from the Comments panel).
export function CommentThreadPopup({
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
