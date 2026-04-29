import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

// ─── Icons — SVG paths sourced directly from the Figma import ─────

// Albums / Portal icon (viewBox 0 0 21.3333 21.3333)
const PORTAL_PATH =
  'M3.33301 5.11114V16.2222M6.88856 4.22225V17.1111M17.9997 5.42899V15.9044' +
  'C17.9997 16.3245 17.7056 16.6872 17.2946 16.7741L11.5168 17.9955' +
  'C10.9642 18.1123 10.4441 17.6907 10.4441 17.1258V4.20758' +
  'C10.4441 3.64268 10.9642 3.22108 11.5168 3.33791' +
  'L17.2946 4.55932C17.7056 4.6462 17.9997 5.00892 17.9997 5.42899Z';

// Upload icon (viewBox 0 0 18 18)
const UPLOAD_PATH =
  'M8.99999 0.75V12M8.99999 0.75L13.5 5.25M8.99999 0.75L4.5 5.25' +
  'M17.25 9.75V16.25C17.25 16.8023 16.8023 17.25 16.25 17.25' +
  'H1.75C1.19772 17.25 0.75 16.8023 0.75 16.25V9.75';

function PortalIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 21.3333 21.3333" fill="none">
      <path
        d={PORTAL_PATH}
        stroke="#1f1d25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
      <path
        d={UPLOAD_PATH}
        stroke="#1f1d25"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// ─── Single menu item ─────────────────────────────────────────────

interface ImagesVideoMenuItemProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function ImagesVideoMenuItem({ icon, label, onClick }: ImagesVideoMenuItemProps) {
  return (
    <button
      className="w-full flex items-center px-4 py-[6px] hover:bg-gray-100 transition-colors duration-100 cursor-pointer"
      onClick={onClick}
    >
      {/* Icon slot — 36px min-width matches Figma Left Slot */}
      <div className="flex items-center justify-start min-w-[36px] shrink-0">
        <div className="w-6 h-6 flex items-center justify-center text-[#1f1d25]">
          {icon}
        </div>
      </div>

      {/* Label */}
      <span
        className="text-[14px] text-[#1f1d25] whitespace-nowrap"
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 400,
          lineHeight: 1.5,
          letterSpacing: '0.15px',
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Overflow menu — rendered via createPortal to escape overflow:hidden ──

interface ImagesVideoOverflowMenuProps {
  isOpen: boolean;
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
}

export function ImagesVideoOverflowMenu({
  isOpen,
  anchorRef,
  onClose,
}: ImagesVideoOverflowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click — delayed so the opening click doesn't immediately close it
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const rect = anchorRef.current?.getBoundingClientRect();

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] w-[220px] bg-white rounded-[4px] py-2 overflow-hidden"
      style={{
        top: rect ? rect.top : 0,
        left: rect ? rect.right + 8 : 0,
        boxShadow:
          '0px 3px 14px 2px rgba(0,0,0,0.12), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 5px 5px -3px rgba(0,0,0,0.20)',
      }}
      // Prevent this click from reaching the canvas background handler
      onClick={e => e.stopPropagation()}
    >
      <ImagesVideoMenuItem
        icon={<PortalIcon />}
        label="Portal"
        onClick={onClose}
      />
      <ImagesVideoMenuItem
        icon={<UploadIcon />}
        label="Upload"
        onClick={onClose}
      />
    </div>,
    document.body,
  );
}
