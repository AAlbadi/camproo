import React from 'react';

interface MascotBadgeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'badge' | 'icon' | 'square';
  showText?: boolean;
  tagline?: string;
  className?: string;
}

export const MascotBadge: React.FC<MascotBadgeProps> = ({
  size = 'md',
  variant = 'horizontal',
  showText = true,
  tagline = 'WHERE RVERS HELP RVERS',
  className = '',
}) => {
  // Variant 1: Official Horizontal Logo (Roo Mascot + Campervan + CampRoo + Tagline)
  if (variant === 'horizontal') {
    const heights = {
      sm: 'h-8 sm:h-9',
      md: 'h-10 sm:h-12',
      lg: 'h-14 sm:h-16',
      xl: 'h-20 sm:h-24',
    };

    return (
      <div className={`flex items-center select-none ${className}`}>
        <img
          src="/images/camproo_logo_horizontal.png"
          alt="CampRoo - Find a spot. Share a spot. Keep roaming."
          className={`${heights[size]} w-auto object-contain transition-transform hover:scale-[1.02] mix-blend-multiply`}
          loading="eager"
        />
      </div>
    );
  }

  // Variant 2: Official Badge Seal (Circular emblem with sunset & campervan)
  if (variant === 'badge') {
    const badgeSizes = {
      sm: 'w-10 h-10',
      md: 'w-14 h-14',
      lg: 'w-20 h-20',
      xl: 'w-28 h-28',
    };

    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        <img
          src="/images/camproo_badge.jpg"
          alt="CampRoo Keep Roaming Official Seal"
          className={`${badgeSizes[size]} rounded-full object-cover shadow-sm transition-transform hover:scale-105 border-2 border-roo-500/20`}
        />
        {showText && (
          <div className="flex flex-col">
            <span className="font-black text-dark-900 tracking-tight leading-none text-xl sm:text-2xl">
              Camp<span className="text-roo-500">Roo</span>
            </span>
            {tagline && (
              <span className="font-bold tracking-widest text-dark-600 mt-1 uppercase text-[10px]">
                {tagline}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Variant 3: Official Square Logo (Detailed camper, pine trees, saguaro cactus & birds)
  if (variant === 'square') {
    const squareSizes = {
      sm: 'w-16 h-16',
      md: 'w-24 h-24',
      lg: 'w-36 h-36',
      xl: 'w-48 h-48',
    };

    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        <img
          src="/images/camproo_logo_square.jpg"
          alt="CampRoo - Find a spot. Share a spot. Keep roaming."
          className={`${squareSizes[size]} rounded-3xl object-contain shadow-md transition-transform hover:scale-105`}
        />
      </div>
    );
  }

  // Variant 4: App Icon / Mascot Head
  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img
        src="/images/camproo_app_icon.jpg"
        alt="CampRoo Roo Mascot"
        className={`${iconSizes[size]} object-cover shadow-sm transition-transform hover:scale-105 border border-roo-200`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="font-black tracking-tight leading-none text-dark-900 text-xl">
            Camp<span className="text-roo-500">Roo</span>
          </span>
          {tagline && (
            <span className="font-bold tracking-widest text-dark-600 mt-1 uppercase text-[10px]">
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

