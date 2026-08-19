import React from "react";

interface LogoMabitProps {
  collapsed?: boolean;
  className?: string;
}

export function LogoMabit({ collapsed = false, className = "" }: LogoMabitProps) {
  if (collapsed) {
    return (
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm ${className}`}
        title="Mábit Pessoal"
      >
        <svg viewBox="0 0 60 50" width="100%" height="100%" fill="none">
          {/* M Vermelho Mábit */}
          <path d="M4 35 L12 35 L12 25 L4 25 Z" fill="#E60000" />
          <path d="M4 25 L12 18 L12 35 L4 35 Z" fill="#FF0000" />
          <rect x="15" y="8" width="8" height="28" rx="1" fill="#E60000" />
          <path d="M23 10 L35 36 L30 36 L19 14 Z" fill="#FF1E27" />
          <path d="M35 10 L23 36 L28 36 L39 14 Z" fill="#FF1E27" />
          <rect x="36" y="8" width="8" height="28" rx="1" fill="#E60000" />
          {/* P de Pessoal */}
          <text
            x="48"
            y="35"
            fontFamily="'Arial Black', 'Montserrat', sans-serif"
            fontWeight="900"
            fontSize="26"
            fill="#C084FC"
          >
            P
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center rounded-lg bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur-sm ${className}`}
    >
      <svg
        viewBox="0 0 240 85"
        className="h-10 w-auto max-w-[160px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ícone M Vermelho da Mábit */}
        <g id="mabit-icon">
          <path d="M10 40 L18 40 L18 26 L10 26 Z" fill="#E60000" />
          <path d="M10 26 L18 18 L18 40 L10 40 Z" fill="#FF0000" />
          <rect x="21" y="8" width="9" height="32" rx="1.5" fill="#E60000" />
          <path d="M30 10 L43 38 L37.5 38 L25.5 14 Z" fill="#FF1E27" />
          <path d="M43 10 L30 38 L35.5 38 L47.5 14 Z" fill="#FF1E27" />
          <rect x="44.5" y="8" width="9" height="32" rx="1.5" fill="#E60000" />
        </g>

        {/* Texto MÁBIT */}
        <g id="mabit-text">
          <text
            x="60"
            y="38"
            fontFamily="'Arial Black', 'Montserrat', 'Impact', sans-serif"
            fontWeight="900"
            fontSize="35"
            fill="#002296"
            letterSpacing="-0.5"
          >
            MÁBIT
          </text>
        </g>

        {/* Texto PESSOAL */}
        <g id="pessoal-text">
          <text
            x="10.5"
            y="76.5"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            fontSize="38"
            fill="#7E22CE"
            opacity="0.35"
            letterSpacing="0.5"
          >
            PESSOAL
          </text>
          <text
            x="10"
            y="75"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            fontWeight="900"
            fontSize="38"
            fill="#C084FC"
            letterSpacing="0.5"
          >
            PESSOAL
          </text>
        </g>
      </svg>
    </div>
  );
}
