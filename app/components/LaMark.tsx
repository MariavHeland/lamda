'use client';

interface LaMarkProps {
  size?: number;
  color?: string;
}

export default function LaMark({ size = 120, color = '#c8a96e' }: LaMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Outer ring */}
      <circle cx="50" cy="50" r="47" stroke={color} strokeWidth="0.6" opacity="0.35" />

      {/* Mid ring */}
      <circle cx="50" cy="50" r="38" stroke={color} strokeWidth="0.5" opacity="0.45" />

      {/* Inner ring */}
      <circle cx="50" cy="50" r="28" stroke={color} strokeWidth="0.6" opacity="0.55" />

      {/* Innermost ring */}
      <circle cx="50" cy="50" r="16" stroke={color} strokeWidth="0.7" opacity="0.65" />

      {/* Eight radial spokes — outer to mid */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 50 + 38 * Math.cos(rad);
        const y1 = 50 + 38 * Math.sin(rad);
        const x2 = 50 + 47 * Math.cos(rad);
        const y2 = 50 + 47 * Math.sin(rad);
        return (
          <line
            key={angle}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth="0.5" opacity="0.3"
          />
        );
      })}

      {/* Four diagonal spokes — mid to inner */}
      {[45, 135, 225, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 50 + 28 * Math.cos(rad);
        const y1 = 50 + 28 * Math.sin(rad);
        const x2 = 50 + 38 * Math.cos(rad);
        const y2 = 50 + 38 * Math.sin(rad);
        return (
          <line
            key={angle}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth="0.5" opacity="0.4"
          />
        );
      })}

      {/* Four cardinal spokes — inner to center */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 50 + 16 * Math.cos(rad);
        const y1 = 50 + 16 * Math.sin(rad);
        const x2 = 50 + 28 * Math.cos(rad);
        const y2 = 50 + 28 * Math.sin(rad);
        return (
          <line
            key={angle}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color} strokeWidth="0.5" opacity="0.4"
          />
        );
      })}

      {/* Diamond at cardinal points on mid ring */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 50 + 38 * Math.cos(rad);
        const cy = 50 + 38 * Math.sin(rad);
        const d = 2.2;
        return (
          <polygon
            key={angle}
            points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`}
            fill={color}
            opacity="0.5"
          />
        );
      })}

      {/* Small dots at 45° on inner ring */}
      {[45, 135, 225, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 50 + 16 * Math.cos(rad);
        const cy = 50 + 16 * Math.sin(rad);
        return (
          <circle key={angle} cx={cx} cy={cy} r="0.9" fill={color} opacity="0.55" />
        );
      })}

      {/* Lambda Λ at centre */}
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fontSize="14"
        fontFamily="Georgia, serif"
        fontWeight="300"
        fill={color}
        opacity="0.85"
        letterSpacing="0"
      >
        Λ
      </text>
    </svg>
  );
}
