import { forwardRef } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  { value, onChange },
  ref,
) {
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <Search className="h-4 w-4 text-slate-400" />
      <input
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search project or port..."
        className="w-full bg-transparent text-[15px] text-white placeholder:text-slate-500 focus:outline-none"
      />
      <div className="hidden items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-2 py-1 text-[11px] text-slate-400 sm:flex">
        <span>⌘</span>
        <span>K</span>
      </div>
    </div>
  );
});

