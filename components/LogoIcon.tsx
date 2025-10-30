import React from 'react';

interface LogoIconProps {
  className?: string;
}

const LogoIcon: React.FC<LogoIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="new-logo-coin">
        <stop offset="0%" stopColor="#fdd835" />
        <stop offset="100%" stopColor="#f57f17" />
      </radialGradient>
      <filter id="new-logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
      </filter>
      <clipPath id="new-logo-clip">
        <rect x="10" y="10" width="80" height="80" rx="18" />
      </clipPath>
      <marker
        id="new-logo-arrow"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="white" />
      </marker>
    </defs>

    <g filter="url(#new-logo-shadow)">
      {/* Background Base */}
      <rect x="5" y="5" width="90" height="90" rx="22" fill="#20505A" />
      
      {/* Background split colors */}
      <g clip-path="url(#new-logo-clip)">
        <rect x="10" y="10" width="80" height="40" fill="#45a18c" />
        <rect x="10" y="50" width="80" height="40" fill="#28667c" />
      </g>
      
      {/* Inner highlight/bevel effect */}
      <rect x="10" y="10" width="80" height="80" rx="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />


      {/* Coin */}
      <circle cx="50" cy="36" r="17" fill="url(#new-logo-coin)" />
      <text
        x="50"
        y="46"
        fontFamily="Arial, sans-serif"
        fontSize="20"
        fontWeight="bold"
        fill="#B76A0C"
        textAnchor="middle"
      >
        $
      </text>

      {/* Book */}
      <path
        d="M23,87 Q50,78 77,87 L77,48 L50,61 L23,48 Z"
        fill="#f3dfb8" // Yellowish cover
      />
      
      {/* Bar chart inside book */}
      <g>
        <rect x="28" y="65" width="7" height="15" fill="#45a18c" />
        <rect x="38" y="60" width="7" height="20" fill="#45a18c" />
        <rect x="48" y="68" width="7" height="12" fill="#45a18c" />
        <rect x="58" y="64" width="7" height="16" fill="#28667c" />
        <rect x="68" y="58" width="7" height="22" fill="#28667c" />
      </g>
      
      {/* Book Outline with glossy highlight */}
       <path
        d="M18,90 Q50,80 82,90 L82,45 L50,60 L18,45 Z"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      
      {/* Graph line */}
      <path
        d="M30,70 C40,55 55,55 65,65 L82,45"
        stroke="white"
        strokeWidth="4"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        markerEnd="url(#new-logo-arrow)"
      />
    </g>
  </svg>
);

export default LogoIcon;
