import { ChevronRight } from 'lucide-react';

export function BreadcrumbNav({ templateName }: { templateName: string }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#E2E2E2]">
      <span className="text-[11px] text-[#6B6B6B]">Design Workspace</span>
      <ChevronRight size={11} className="text-[#6B6B6B]" />
      <span className="text-[11px] text-[#111111] font-medium">{templateName}</span>
    </div>
  );
}
