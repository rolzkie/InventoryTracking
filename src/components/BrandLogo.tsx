export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 960 260"
      role="img"
      aria-label="Inventory System"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Inventory System</title>
      <g fill="currentColor">
        <rect x="16" y="16" width="240" height="236" />
      </g>
      <rect x="8" y="8" width="240" height="236" fill="#F9A825" stroke="currentColor" strokeWidth="8" />
      <g fill="#1B5E20" stroke="currentColor" strokeWidth="6">
        <rect x="48" y="48" width="160" height="40" />
        <rect x="48" y="104" width="110" height="40" />
        <rect x="48" y="160" width="136" height="40" />
      </g>
      <text
        x="330"
        y="120"
        fill="currentColor"
        fontFamily="Space Grotesk, Archivo, Arial, sans-serif"
        fontSize="94"
        fontWeight="800"
        letterSpacing="-3"
        textLength="580"
        lengthAdjust="spacingAndGlyphs"
      >
        INVENTORY
      </text>
      <path d="M330 148H950" stroke="currentColor" strokeWidth="8" />
      <text
        x="330"
        y="218"
        fill="#1B5E20"
        fontFamily="Space Grotesk, Archivo, Arial, sans-serif"
        fontSize="67"
        fontWeight="800"
        letterSpacing="17"
      >
        SYSTEM
      </text>
    </svg>
  );
}
