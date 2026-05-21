import { useState, useRef, useEffect } from 'react';

export default function MultiSelectDropdown({ title, options, namePrefix }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState({});
  const containerRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  const handleSelect = (option) => {
    setSelected(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="relative flex flex-col gap-1 w-full" ref={containerRef}>
      <label className="text-[10px] md:text-xs text-slate-500 font-mono print:hidden">
        {title}
      </label>
      
      {/* Screen UI: Dropdown Button */}
      <button 
        type="button" 
        onClick={toggleDropdown}
        className="print:hidden h-8 px-2 rounded bg-white border border-slate-300 text-xs text-slate-900 flex items-center justify-between focus:outline-none focus:border-primary"
      >
        <span className="truncate">{selectedCount > 0 ? `${selectedCount} selected` : 'Select...'}</span>
        <span className="text-[10px] text-slate-400">▼</span>
      </button>

      {/* Screen UI: Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-300 rounded-md shadow-xl max-h-60 overflow-y-auto print:hidden">
          {options.map((opt, idx) => (
            <label key={idx} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
              <input 
                type="checkbox" 
                name={`${namePrefix}_${idx}`} 
                checked={!!selected[opt]}
                onChange={() => handleSelect(opt)}
                className="accent-primary w-3 h-3" 
              />
              <span className="leading-tight">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* Print UI: Only show selected options */}
      <div className="hidden print:flex flex-col gap-1">
        <p className="text-[10px] font-bold text-black border-b border-slate-300 pb-0.5 mb-1">{title}</p>
        {options.map((opt, idx) => {
          if (!selected[opt]) return null;
          return (
            <div key={idx} className="flex items-start gap-1 text-[10px] text-black">
              <span className="font-bold text-black mt-0.5">✓</span>
              <span>{opt}</span>
            </div>
          );
        })}
        {selectedCount === 0 && <span className="text-[10px] text-gray-500 italic">None selected</span>}
      </div>
    </div>
  );
}
