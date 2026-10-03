import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const DefaultLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md select-none shrink-0 overflow-hidden ${sizeMap[size]} ${className}`}
    >
      {/* Subtle medical badge background */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full p-1.5 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield background */}
        <path
          d="M50 5 L85 20 C85 55 50 90 50 90 C50 90 15 55 15 20 Z"
          fill="rgba(255,255,255,0.15)"
        />
        {/* Pharmacy Cross */}
        <rect x="42" y="24" width="16" height="42" rx="4" fill="#ffffff" />
        <rect x="29" y="37" width="42" height="16" rx="4" fill="#ffffff" />
        {/* Heartbeat pulse in center */}
        <path
          d="M32 45 L43 45 L47 38 L51 52 L55 42 L58 45 L68 45"
          fill="none"
          stroke="#059669"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Subtle corner badge for "SHER" */}
      <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[8px] font-black px-1 rounded-tl shadow">
        SMS
      </div>
    </div>
  );
};

export const StoreLogoImage: React.FC<{
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}> = ({ logoUrl, size = 'md', className = '', alt = 'Sher Medical Store Logo' }) => {
  const sizeMap = {
    sm: 'w-8 h-8 max-h-8',
    md: 'w-10 h-10 max-h-10',
    lg: 'w-16 h-16 max-h-16',
    xl: 'w-24 h-24 max-h-24',
  };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={alt}
        className={`object-contain rounded-lg border border-slate-200 bg-white shadow-xs p-0.5 shrink-0 ${sizeMap[size]} ${className}`}
      />
    );
  }

  return <DefaultLogo size={size} className={className} />;
};
