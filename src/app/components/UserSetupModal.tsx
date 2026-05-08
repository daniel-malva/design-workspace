import { useState, useEffect, useRef } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';

/**
 * First-visit modal that asks the user for their name.
 * Renders nothing once a name is stored in localStorage.
 */
export function UserSetupModal() {
  const { needsSetup, setName } = useCurrentUser();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when the modal appears
  useEffect(() => {
    if (needsSetup) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [needsSetup]);

  if (!needsSetup) return null;

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    setName(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    // Backdrop
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 13, 26, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      {/* Card */}
      <div
        style={{
          background: 'white',
          borderRadius: 18,
          padding: '32px 36px 28px',
          width: 380,
          boxShadow: '0 24px 60px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#1f1d25', letterSpacing: '-0.3px' }}>
            Welcome to Design Workspace
          </span>
          <span style={{ fontSize: 13, color: '#686576', lineHeight: 1.5 }}>
            Enter your name so comments and activity are attributed to you.
          </span>
        </div>

        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#4a4860' }}>
            Your name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Lucas Mendes"
            maxLength={48}
            style={{
              width: '100%',
              fontSize: 14,
              color: '#1f1d25',
              background: '#f9fafa',
              border: '1.5px solid #dddce0',
              borderRadius: 10,
              padding: '10px 14px',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#473bab')}
            onBlur={e => (e.currentTarget.style.borderColor = '#dddce0')}
          />
        </div>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          style={{
            background: value.trim() ? '#473bab' : '#e0dff4',
            color: value.trim() ? 'white' : '#9b99c4',
            border: 'none',
            borderRadius: 10,
            padding: '11px 0',
            fontSize: 14,
            fontWeight: 600,
            cursor: value.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            if (value.trim()) e.currentTarget.style.background = '#3a2f8f';
          }}
          onMouseLeave={e => {
            if (value.trim()) e.currentTarget.style.background = '#473bab';
          }}
        >
          Get started
        </button>
      </div>
    </div>
  );
}
