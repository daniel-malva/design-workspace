import { useDesignWorkspace } from '../store/useDesignWorkspaceStore';

export function PreviewToggle() {
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
