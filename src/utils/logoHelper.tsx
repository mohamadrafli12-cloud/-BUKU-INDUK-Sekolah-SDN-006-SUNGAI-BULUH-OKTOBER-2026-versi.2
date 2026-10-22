import React from 'react';
import { safeLocalStorageSet } from './storageHelper';

/**
 * High-fidelity Vector SVG for Official TUT WURI HANDAYANI SD (Sekolah Dasar) Kemdikbudristek RI
 */
export const TutWuriHandayaniSDLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-10", 
  size 
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo Tut Wuri Handayani SD"
    >
      {/* Outer Golden Border & Base Circle */}
      <circle cx="100" cy="100" r="96" fill="#003399" stroke="#F59E0B" strokeWidth="4" />
      <circle cx="100" cy="100" r="88" fill="#0B409C" stroke="#FDE047" strokeWidth="2" strokeDasharray="3 3" />
      
      {/* Inner White Badge ring */}
      <circle cx="100" cy="100" r="76" fill="#002D80" stroke="#FBBF24" strokeWidth="2" />
      
      {/* Pentagon / Perisai Segi Lima Kemdikbud */}
      <polygon
        points="100,32 165,74 142,148 58,148 35,74"
        fill="#0047BA"
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Sayap Garuda / Golden Wings */}
      <path
        d="M100 88 C82 66, 52 70, 48 94 C60 92, 75 97, 86 108 C74 108, 62 114, 58 126 C72 120, 88 124, 96 134 C94 122, 94 106, 100 88 Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="1.5"
      />
      <path
        d="M100 88 C118 66, 148 70, 152 94 C140 92, 125 97, 114 108 C126 108, 138 114, 142 126 C128 120, 112 124, 104 134 C106 122, 106 106, 100 88 Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="1.5"
      />

      {/* Belencong / Api Suci Pendidikan */}
      <path
        d="M100 48 C104 56, 110 62, 108 72 C104 68, 102 65, 100 60 C98 65, 96 68, 92 72 C90 62, 96 56, 100 48 Z"
        fill="#EF4444"
        stroke="#FDE047"
        strokeWidth="1"
      />
      <circle cx="100" cy="62" r="3.5" fill="#FDE047" />

      {/* Buku Terbuka (Buku Pengetahuan Dasar) */}
      <path
        d="M100 128 C92 124, 80 125, 68 131 L68 141 C80 135, 92 134, 100 138 C108 134, 120 135, 132 141 L132 131 C120 125, 108 124, 100 128 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="100" y1="128" x2="100" y2="138" stroke="#1E293B" strokeWidth="1.5" />

      {/* SD Bottom Banner / Ribbon (Red) */}
      <path
        d="M62 152 Q100 162 138 152 L134 170 Q100 180 66 170 Z"
        fill="#DC2626"
        stroke="#FEF08A"
        strokeWidth="2"
      />
      <text
        x="100"
        y="166"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="13"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="2"
      >
        SD
      </text>

      {/* Curved Circular Text "TUT WURI HANDAYANI" */}
      <path id="textPathTutWuriSD" d="M 38 100 A 62 62 0 0 1 162 100" fill="none" />
      <text fill="#FEF08A" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.8">
        <textPath href="#textPathTutWuriSD" startOffset="50%" textAnchor="middle">
          TUT WURI HANDAYANI
        </textPath>
      </text>
    </svg>
  );
};

/**
 * Official TUT WURI HANDAYANI SMP (Sekolah Menengah Pertama)
 */
export const TutWuriHandayaniSMPLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-10", 
  size 
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo Tut Wuri Handayani SMP"
    >
      <circle cx="100" cy="100" r="96" fill="#002D80" stroke="#F59E0B" strokeWidth="4" />
      <circle cx="100" cy="100" r="88" fill="#0A3A8B" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="76" fill="#002266" stroke="#FBBF24" strokeWidth="2" />
      
      <polygon
        points="100,32 165,74 142,148 58,148 35,74"
        fill="#1E40AF"
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M100 88 C82 66, 52 70, 48 94 C60 92, 75 97, 86 108 C74 108, 62 114, 58 126 C72 120, 88 124, 96 134 C94 122, 94 106, 100 88 Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="1.5"
      />
      <path
        d="M100 88 C118 66, 148 70, 152 94 C140 92, 125 97, 114 108 C126 108, 138 114, 142 126 C128 120, 112 124, 104 134 C106 122, 106 106, 100 88 Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="1.5"
      />

      <path
        d="M100 48 C104 56, 110 62, 108 72 C104 68, 102 65, 100 60 C98 65, 96 68, 92 72 C90 62, 96 56, 100 48 Z"
        fill="#EF4444"
        stroke="#FDE047"
        strokeWidth="1"
      />
      <circle cx="100" cy="62" r="3.5" fill="#FDE047" />

      <path
        d="M100 128 C92 124, 80 125, 68 131 L68 141 C80 135, 92 134, 100 138 C108 134, 120 135, 132 141 L132 131 C120 125, 108 124, 100 128 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="100" y1="128" x2="100" y2="138" stroke="#1E293B" strokeWidth="1.5" />

      {/* SMP Bottom Ribbon (Navy Blue) */}
      <path
        d="M60 152 Q100 162 140 152 L136 170 Q100 180 64 170 Z"
        fill="#1E3A8A"
        stroke="#93C5FD"
        strokeWidth="2"
      />
      <text
        x="100"
        y="166"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="12.5"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.5"
      >
        SMP
      </text>

      <path id="textPathTutWuriSMP" d="M 38 100 A 62 62 0 0 1 162 100" fill="none" />
      <text fill="#FEF08A" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.8">
        <textPath href="#textPathTutWuriSMP" startOffset="50%" textAnchor="middle">
          TUT WURI HANDAYANI
        </textPath>
      </text>
    </svg>
  );
};

/**
 * Official TUT WURI HANDAYANI SMA / SMK
 */
export const TutWuriHandayaniSMALogo: React.FC<{ className?: string; size?: number; label?: string }> = ({ 
  className = "w-10 h-10", 
  size,
  label = "SMA"
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Logo Tut Wuri Handayani ${label}`}
    >
      <circle cx="100" cy="100" r="96" fill="#1E293B" stroke="#F59E0B" strokeWidth="4" />
      <circle cx="100" cy="100" r="88" fill="#334155" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="76" fill="#0F172A" stroke="#FBBF24" strokeWidth="2" />
      
      <polygon
        points="100,32 165,74 142,148 58,148 35,74"
        fill="#0284C7"
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M100 88 C82 66, 52 70, 48 94 C60 92, 75 97, 86 108 C74 108, 62 114, 58 126 C72 120, 88 124, 96 134 C94 122, 94 106, 100 88 Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="1.5"
      />
      <path
        d="M100 88 C118 66, 148 70, 152 94 C140 92, 125 97, 114 108 C126 108, 138 114, 142 126 C128 120, 112 124, 104 134 C106 122, 106 106, 100 88 Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="1.5"
      />

      <path
        d="M100 48 C104 56, 110 62, 108 72 C104 68, 102 65, 100 60 C98 65, 96 68, 92 72 C90 62, 96 56, 100 48 Z"
        fill="#EF4444"
        stroke="#FDE047"
        strokeWidth="1"
      />
      <circle cx="100" cy="62" r="3.5" fill="#FDE047" />

      <path
        d="M100 128 C92 124, 80 125, 68 131 L68 141 C80 135, 92 134, 100 138 C108 134, 120 135, 132 141 L132 131 C120 125, 108 124, 100 128 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="1.5"
      />
      <line x1="100" y1="128" x2="100" y2="138" stroke="#1E293B" strokeWidth="1.5" />

      {/* SMA / SMK Ribbon */}
      <path
        d="M58 152 Q100 162 142 152 L138 170 Q100 180 62 170 Z"
        fill="#475569"
        stroke="#FDE047"
        strokeWidth="2"
      />
      <text
        x="100"
        y="166"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="12"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.5"
      >
        {label}
      </text>

      <path id="textPathTutWuriSMA" d="M 38 100 A 62 62 0 0 1 162 100" fill="none" />
      <text fill="#FEF08A" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.8">
        <textPath href="#textPathTutWuriSMA" startOffset="50%" textAnchor="middle">
          TUT WURI HANDAYANI
        </textPath>
      </text>
    </svg>
  );
};

/**
 * Official Kemdikbudristek Tut Wuri Handayani Gold Crest
 */
export const TutWuriHandayaniKemdikbudLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-10", 
  size 
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lambang Kemdikbudristek Tut Wuri Handayani"
    >
      <circle cx="100" cy="100" r="94" fill="#003399" stroke="#EAB308" strokeWidth="5" />
      <polygon
        points="100,28 172,76 146,156 54,156 28,76"
        fill="#0241AB"
        stroke="#FACC15"
        strokeWidth="3.5"
      />
      {/* Wings */}
      <path
        d="M100 84 C76 60, 44 68, 38 96 C54 94, 70 100, 84 114 C70 114, 56 122, 50 136 C68 128, 86 132, 96 144 C94 128, 94 108, 100 84 Z"
        fill="#FBBF24"
        stroke="#92400E"
        strokeWidth="2"
      />
      <path
        d="M100 84 C124 60, 156 68, 162 96 C146 94, 130 100, 116 114 C130 114, 144 122, 150 136 C132 128, 114 132, 104 144 C106 128, 106 108, 100 84 Z"
        fill="#FBBF24"
        stroke="#92400E"
        strokeWidth="2"
      />
      {/* Flame */}
      <path
        d="M100 42 C106 52, 114 60, 110 74 C104 70, 102 65, 100 58 C98 65, 96 70, 90 74 C86 60, 94 52, 100 42 Z"
        fill="#EF4444"
        stroke="#FEF08A"
        strokeWidth="1.5"
      />
      <circle cx="100" cy="58" r="4" fill="#FEF08A" />
      {/* Book */}
      <path
        d="M100 134 C90 130, 76 131, 62 138 L62 150 C76 143, 90 142, 100 146 C110 142, 124 143, 138 150 L138 138 C124 131, 110 130, 100 134 Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="2"
      />
      {/* Motto */}
      <path id="textPathKemdikbud" d="M 32 100 A 68 68 0 0 1 168 100" fill="none" />
      <text fill="#FEF08A" fontSize="10.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="2">
        <textPath href="#textPathKemdikbud" startOffset="50%" textAnchor="middle">
          TUT WURI HANDAYANI
        </textPath>
      </text>
    </svg>
  );
};

/**
 * Madrasah / Kementerian Agama RI Logo
 */
export const KemenagMadrasahLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-10", 
  size 
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo Kemenag Madrasah"
    >
      <circle cx="100" cy="100" r="94" fill="#047857" stroke="#F59E0B" strokeWidth="5" />
      <polygon
        points="100,28 172,76 146,156 54,156 28,76"
        fill="#065F46"
        stroke="#FDE047"
        strokeWidth="3"
      />
      <circle cx="100" cy="95" r="42" fill="#047857" stroke="#FBBF24" strokeWidth="2" />
      {/* Star and Crescent / Bintang Sudut Lima */}
      <polygon
        points="100,68 104,78 114,79 106,86 109,96 100,90 91,96 94,86 86,79 96,78"
        fill="#FDE047"
      />
      {/* Book / Al-Quran */}
      <path
        d="M100 115 C90 110, 76 112, 65 118 L65 128 C76 122, 90 120, 100 125 C110 120, 124 122, 135 128 L135 118 C124 112, 110 110, 100 115 Z"
        fill="#FFFFFF"
        stroke="#064E3B"
        strokeWidth="2"
      />
      {/* Text IKHLAS BERAMAL */}
      <path id="textPathKemenag" d="M 38 100 A 62 62 0 0 1 162 100" fill="none" />
      <text fill="#FEF08A" fontSize="10" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.5">
        <textPath href="#textPathKemenag" startOffset="50%" textAnchor="middle">
          IKHLAS BERAMAL
        </textPath>
      </text>
    </svg>
  );
};

/**
 * Garuda Pancasila - Lambang Negara Republik Indonesia
 */
export const GarudaPancasilaLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-10", 
  size 
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lambang Garuda Pancasila"
    >
      <circle cx="100" cy="100" r="95" fill="#78350F" stroke="#F59E0B" strokeWidth="4" />
      <circle cx="100" cy="100" r="88" fill="#92400E" stroke="#FDE047" strokeWidth="2" strokeDasharray="3 3" />
      
      {/* Garuda Wings Golden */}
      <path
        d="M100 65 C60 30, 20 60, 25 110 C45 105, 65 115, 75 130 C60 130, 45 135, 40 148 C60 142, 80 145, 90 158 L100 145 L110 158 C120 145, 140 142, 160 148 C155 135, 140 130, 125 130 C135 115, 155 105, 175 110 C180 60, 140 30, 100 65 Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="2"
      />
      {/* Head */}
      <path
        d="M100 38 C105 32, 115 32, 120 38 C115 45, 110 48, 100 48 C90 48, 85 45, 80 38 C85 32, 95 32, 100 38 Z"
        fill="#FDE047"
        stroke="#B45309"
        strokeWidth="1.5"
      />
      {/* Beak */}
      <polygon points="120,38 128,42 120,44" fill="#D97706" />

      {/* Perisai Garuda 5 Sila */}
      <polygon
        points="100,75 130,95 125,138 100,150 75,138 70,95"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="3"
      />
      {/* Red-White Quadrants */}
      <path d="M72 96 L100 96 L100 115 L71 115 Z" fill="#DC2626" />
      <path d="M100 96 L128 96 L127 115 L100 115 Z" fill="#FFFFFF" />
      <path d="M72 115 L100 115 L100 148 L76 137 Z" fill="#FFFFFF" />
      <path d="M100 115 L127 115 L124 137 L100 148 Z" fill="#DC2626" />
      
      {/* Center Black Shield with Star */}
      <polygon points="100,103 112,112 108,126 92,126 88,112" fill="#0F172A" />
      <polygon points="100,108 103,114 109,114 104,118 106,124 100,120 94,124 96,118 91,114 97,114" fill="#FDE047" />

      {/* Bhinneka Tunggal Ika Ribbon */}
      <path
        d="M45 160 Q100 172 155 160 L150 174 Q100 186 50 174 Z"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.5"
      />
      <text
        x="100"
        y="171"
        textAnchor="middle"
        fill="#0F172A"
        fontSize="7"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="0.8"
      >
        BHINNEKA TUNGGAL IKA
      </text>
    </svg>
  );
};

/**
 * Customizable Vector Emblem Generator Component
 */
export const CustomVectorEmblem: React.FC<{
  className?: string;
  size?: number;
  ribbonText?: string;
  ribbonColor?: string;
  shieldColor?: string;
  outerColor?: string;
  mottoText?: string;
}> = ({
  className = "w-10 h-10",
  size,
  ribbonText = "SD",
  ribbonColor = "#DC2626",
  shieldColor = "#0047BA",
  outerColor = "#003399",
  mottoText = "TUT WURI HANDAYANI"
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="100" r="96" fill={outerColor} stroke="#F59E0B" strokeWidth="4" />
      <circle cx="100" cy="100" r="88" fill={outerColor} stroke="#FDE047" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="76" fill={outerColor} stroke="#FBBF24" strokeWidth="2" />
      
      <polygon
        points="100,32 165,74 142,148 58,148 35,74"
        fill={shieldColor}
        stroke="#F59E0B"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M100 88 C82 66, 52 70, 48 94 C60 92, 75 97, 86 108 C74 108, 62 114, 58 126 C72 120, 88 124, 96 134 C94 122, 94 106, 100 88 Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="1.5"
      />
      <path
        d="M100 88 C118 66, 148 70, 152 94 C140 92, 125 97, 114 108 C126 108, 138 114, 142 126 C128 120, 112 124, 104 134 C106 122, 106 106, 100 88 Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="1.5"
      />

      <path
        d="M100 48 C104 56, 110 62, 108 72 C104 68, 102 65, 100 60 C98 65, 96 68, 92 72 C90 62, 96 56, 100 48 Z"
        fill="#EF4444"
        stroke="#FDE047"
        strokeWidth="1"
      />
      <circle cx="100" cy="62" r="3.5" fill="#FDE047" />

      <path
        d="M100 128 C92 124, 80 125, 68 131 L68 141 C80 135, 92 134, 100 138 C108 134, 120 135, 132 141 L132 131 C120 125, 108 124, 100 128 Z"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="1.5"
      />
      <line x1="100" y1="128" x2="100" y2="138" stroke="#1E293B" strokeWidth="1.5" />

      {ribbonText && (
        <>
          <path
            d="M58 152 Q100 162 142 152 L138 170 Q100 180 62 170 Z"
            fill={ribbonColor}
            stroke="#FEF08A"
            strokeWidth="2"
          />
          <text
            x="100"
            y="166"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={ribbonText.length > 5 ? 10 : 12.5}
            fontWeight="900"
            fontFamily="sans-serif"
            letterSpacing="1.5"
          >
            {ribbonText}
          </text>
        </>
      )}

      {mottoText && (
        <>
          <path id="textPathCustom" d="M 38 100 A 62 62 0 0 1 162 100" fill="none" />
          <text fill="#FEF08A" fontSize="9" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.5">
            <textPath href="#textPathCustom" startOffset="50%" textAnchor="middle">
              {mottoText}
            </textPath>
          </text>
        </>
      )}
    </svg>
  );
};

export interface NationalLogoItem {
  id: string;
  name: string;
  category: 'sd' | 'smp' | 'sma' | 'smk' | 'kemenag' | 'kemdikbud' | 'garuda' | 'kustom';
  description: string;
  badgeLabel: string;
  badgeColor?: string;
  imageUrl?: string; // Data URL or Image URL
  isBuiltin?: boolean;
  vectorStyle?: {
    ribbonText?: string;
    ribbonColor?: string;
    shieldColor?: string;
    outerColor?: string;
    mottoText?: string;
  };
}

export const DEFAULT_NATIONAL_LOGOS: NationalLogoItem[] = [
  {
    id: 'preset:tut-wuri-sd',
    name: 'Tut Wuri Handayani SD (Resmi)',
    category: 'sd',
    description: 'Logo resmi Sekolah Dasar Kemdikbudristek dengan pita merah bertuliskan SD',
    badgeLabel: 'SD',
    badgeColor: 'bg-red-600 text-white',
    isBuiltin: true,
  },
  {
    id: 'preset:tut-wuri-emas',
    name: 'Tut Wuri Handayani Kemendikbudristek',
    category: 'kemdikbud',
    description: 'Lambang resmi Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi',
    badgeLabel: 'KEMDIKBUD',
    badgeColor: 'bg-amber-500 text-slate-950 font-black',
    isBuiltin: true,
  },
  {
    id: 'preset:kemenag-mi',
    name: 'Madrasah Ibtidaiyah (Kemenag RI)',
    category: 'kemenag',
    description: 'Lambang Ikhlas Beramal Kementerian Agama untuk MI / MTs / MA',
    badgeLabel: 'KEMENAG',
    badgeColor: 'bg-emerald-600 text-white',
    isBuiltin: true,
  },
  {
    id: 'preset:tut-wuri-smp',
    name: 'Tut Wuri Handayani SMP',
    category: 'smp',
    description: 'Logo resmi Sekolah Menengah Pertama dengan pita biru tua bertuliskan SMP',
    badgeLabel: 'SMP',
    badgeColor: 'bg-blue-800 text-white',
    isBuiltin: true,
  },
  {
    id: 'preset:tut-wuri-sma',
    name: 'Tut Wuri Handayani SMA',
    category: 'sma',
    description: 'Logo resmi Sekolah Menengah Atas dengan pita abu-abu bertuliskan SMA',
    badgeLabel: 'SMA',
    badgeColor: 'bg-slate-700 text-white',
    isBuiltin: true,
  },
  {
    id: 'preset:tut-wuri-smk',
    name: 'Tut Wuri Handayani SMK',
    category: 'smk',
    description: 'Logo resmi Sekolah Menengah Kejuruan dengan pita bertuliskan SMK',
    badgeLabel: 'SMK',
    badgeColor: 'bg-orange-600 text-white',
    isBuiltin: true,
  },
  {
    id: 'preset:garuda',
    name: 'Garuda Pancasila RI',
    category: 'garuda',
    description: 'Lambang Negara Kesatuan Republik Indonesia - Bhinneka Tunggal Ika',
    badgeLabel: 'GARUDA',
    badgeColor: 'bg-amber-600 text-white font-black',
    isBuiltin: true,
  },
];

const STORAGE_KEY_NATIONAL_LOGOS = 'buku_induk_national_logos_v2';

/**
 * Helper to get all saved national logos (defaults + user additions/modifications)
 */
export function getSavedNationalLogos(): NationalLogoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NATIONAL_LOGOS);
    if (!raw) return DEFAULT_NATIONAL_LOGOS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load custom national logos', e);
  }
  return DEFAULT_NATIONAL_LOGOS;
}

/**
 * Helper to save all national logos to localStorage
 */
export function saveNationalLogos(logos: NationalLogoItem[]): void {
  try {
    safeLocalStorageSet(STORAGE_KEY_NATIONAL_LOGOS, JSON.stringify(logos));
  } catch (e) {
    console.error('Failed to save custom national logos', e);
  }
}

/**
 * Universal Official National Logo Renderer
 */
export const OfficialNationalLogo: React.FC<{
  logoIdOrUrl?: string;
  className?: string;
  size?: number;
  customLogos?: NationalLogoItem[];
}> = ({
  logoIdOrUrl,
  className = "w-10 h-10",
  size,
  customLogos
}) => {
  const effectiveId = logoIdOrUrl || 'preset:tut-wuri-sd';

  // Standard Presets Built-in
  if (effectiveId === 'preset:tut-wuri-sd' || effectiveId === 'tut-wuri-sd') {
    return <TutWuriHandayaniSDLogo className={className} size={size} />;
  }
  if (effectiveId === 'preset:tut-wuri-emas' || effectiveId === 'tut-wuri-emas') {
    return <TutWuriHandayaniKemdikbudLogo className={className} size={size} />;
  }
  if (effectiveId === 'preset:kemenag-mi' || effectiveId === 'kemenag-mi') {
    return <KemenagMadrasahLogo className={className} size={size} />;
  }
  if (effectiveId === 'preset:tut-wuri-smp' || effectiveId === 'tut-wuri-smp') {
    return <TutWuriHandayaniSMPLogo className={className} size={size} />;
  }
  if (effectiveId === 'preset:tut-wuri-sma' || effectiveId === 'tut-wuri-sma') {
    return <TutWuriHandayaniSMALogo className={className} size={size} label="SMA" />;
  }
  if (effectiveId === 'preset:tut-wuri-smk' || effectiveId === 'tut-wuri-smk') {
    return <TutWuriHandayaniSMALogo className={className} size={size} label="SMK" />;
  }
  if (effectiveId === 'preset:garuda' || effectiveId === 'garuda') {
    return <GarudaPancasilaLogo className={className} size={size} />;
  }

  // Look in custom logos list
  const list = customLogos || getSavedNationalLogos();
  const matched = list.find(l => l.id === effectiveId);
  if (matched) {
    if (matched.imageUrl) {
      return (
        <img 
          src={matched.imageUrl} 
          alt={matched.name} 
          className={`${className} object-contain`} 
          style={size ? { width: size, height: size } : undefined}
          referrerPolicy="no-referrer"
        />
      );
    }
    if (matched.vectorStyle) {
      return (
        <CustomVectorEmblem
          className={className}
          size={size}
          ribbonText={matched.vectorStyle.ribbonText || matched.badgeLabel}
          ribbonColor={matched.vectorStyle.ribbonColor}
          shieldColor={matched.vectorStyle.shieldColor}
          outerColor={matched.vectorStyle.outerColor}
          mottoText={matched.vectorStyle.mottoText}
        />
      );
    }
  }

  // If it's a base64 / data URL or web HTTP URL directly
  if (effectiveId.startsWith('data:image/') || effectiveId.startsWith('http://') || effectiveId.startsWith('https://')) {
    return (
      <img 
        src={effectiveId} 
        alt="Lambang Nasional" 
        className={`${className} object-contain`} 
        style={size ? { width: size, height: size } : undefined}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Fallback to official SD Logo
  return <TutWuriHandayaniSDLogo className={className} size={size} />;
};

/**
 * Backward compatibility for legacy LOGO_PRESETS
 */
export interface LogoPreset {
  id: string;
  name: string;
  category: 'sd' | 'kemdikbud' | 'kemenag' | 'smp' | 'sma' | 'smk' | 'garuda' | 'custom';
  description: string;
  component: React.FC<{ className?: string; size?: number }>;
}

export const LOGO_PRESETS: LogoPreset[] = [
  {
    id: 'preset:tut-wuri-sd',
    name: 'Tut Wuri Handayani SD (Resmi)',
    category: 'sd',
    description: 'Logo resmi Sekolah Dasar Kemdikbudristek dengan pita merah SD',
    component: TutWuriHandayaniSDLogo,
  },
  {
    id: 'preset:tut-wuri-emas',
    name: 'Tut Wuri Handayani Kemendikbudristek',
    category: 'kemdikbud',
    description: 'Lambang resmi Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi',
    component: TutWuriHandayaniKemdikbudLogo,
  },
  {
    id: 'preset:kemenag-mi',
    name: 'Madrasah Ibtidaiyah (Kemenag RI)',
    category: 'kemenag',
    description: 'Lambang Ikhlas Beramal Kementerian Agama untuk MI / MTs',
    component: KemenagMadrasahLogo,
  },
  {
    id: 'preset:tut-wuri-smp',
    name: 'Tut Wuri Handayani SMP',
    category: 'smp',
    description: 'Logo resmi Sekolah Menengah Pertama dengan pita biru SMP',
    component: TutWuriHandayaniSMPLogo,
  },
  {
    id: 'preset:tut-wuri-sma',
    name: 'Tut Wuri Handayani SMA',
    category: 'sma',
    description: 'Logo resmi Sekolah Menengah Atas dengan pita abu-abu SMA',
    component: TutWuriHandayaniSMALogo,
  },
  {
    id: 'preset:garuda',
    name: 'Garuda Pancasila RI',
    category: 'garuda',
    description: 'Lambang Negara Kesatuan Republik Indonesia',
    component: GarudaPancasilaLogo,
  },
];
