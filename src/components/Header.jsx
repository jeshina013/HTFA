import { useState, useRef, useEffect } from 'react';

export default function Header({ reportId, userEmail, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = () => {
    if (!userEmail) return 'BF';
    const parts = userEmail.split('@')[0];
    if (parts.length >= 2) {
      return parts.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  return (
    <header
      className="
        sticky top-0 z-50
        flex items-center justify-between
        px-4 py-3
        md:px-8
        bg-white/80 backdrop-blur-md
        border-b border-slate-200/60
        print:hidden
      "
    >
      <a href="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center font-bold text-white">
          HT
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-900">Hi-Tech Fuel</span>
      </a>
      
      <div className="flex items-center gap-4">
        <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-primary font-bold">
          {reportId || 'RPT-000001'}
        </span>
        
        {/* User Account Menu with Sign Out */}
        <div className="relative" ref={menuRef}>
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="User menu" 
            aria-haspopup="true" 
            className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center text-slate-700 hover:border-primary/50 transition-colors focus:outline-none"
          >
            <span className="text-xs font-bold">{getInitials()}</span>
          </button>
          
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-fade-in text-left">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Signed in as</p>
                <p className="text-xs font-semibold text-slate-700 truncate">{userEmail || 'admin@hitech.com'}</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onSignOut) onSignOut();
                }}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
