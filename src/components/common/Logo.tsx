import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true, className = '' }) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Sleek Fiber Emblem */}
      <div className={`relative ${iconSizes[size]} shrink-0 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-cyan-500/20 ring-1 ring-white/20 flex items-center justify-center overflow-hidden`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.4),transparent)]" />
        
        {/* Optical signal emblem */}
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full text-white p-1.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Signal wave arcs */}
          <path
            d="M8 29C13 23 27 23 32 29"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
          <path
            d="M12 24C15.5 19.5 24.5 19.5 28 24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
          <path
            d="M16 19C18 16 22 16 24 19"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Center core pulse */}
          <circle cx="20" cy="12" r="3.2" fill="#38bdf8" />
          <circle cx="20" cy="12" r="6" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="2 2" />
          {/* Base fiber pulse line */}
          <path d="M20 18V32" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold tracking-tight text-white ${titleSizes[size]}`}>
            RADIAN
          </span>
          <span className="font-extrabold tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] md:text-xs">
            JOGJA
          </span>
        </div>
        {showSubtitle && (
          <span className={`font-medium tracking-wider text-slate-400 uppercase ${subSizes[size]}`}>
            Internet Wifi Rumahan &bull; Istimewa
          </span>
        )}
      </div>
    </div>
  );
};
