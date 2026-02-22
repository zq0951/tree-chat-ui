'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface CustomSelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export function CustomSelect({ value, options, onChange, placeholder, disabled }: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className="relative flex-1 nodrag">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-lg pl-3 pr-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-black/60 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] bottom-full left-0 right-0 mb-1 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden py-1 max-h-48 overflow-y-auto custom-scroller nowheel nodrag">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors ${value === opt.value ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-300'}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span className="truncate block">{opt.label}</span>
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-zinc-500 text-center">No options available</div>
          )}
        </div>
      )}
    </div>
  );
}
