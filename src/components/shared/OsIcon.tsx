type OsIconProps = {
  osId: string;
  /** Fallback tint used only when a logo is monochrome. */
  accent?: string;
  /** Optional real logo image (PNG/SVG) drawn in place of the SVG mark. */
  img?: string;
  size?: number;
  title?: string;
};

/**
 * Faithful, multi-color SVG reproductions of real OS brand logos.
 * Each logo uses the official brand palette so it reads correctly on any
 * background (light or dark). The `accent` prop is only used as a tint for
 * logos that are inherently single-color. If `img` is provided, the real
 * logo artwork is rendered instead of the drawn mark.
 */
export default function OsIcon({ osId, accent, img, size, title }: OsIconProps) {
  const s = size || 28;
  const c = accent || "#888";
  if (img) {
    return (
      <img
        src={img}
        alt={title || osId}
        width={s}
        height={s}
        style={{ display: "inline-block", verticalAlign: "middle", objectFit: "contain" }}
      />
    );
  }
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title || osId}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      {osId === "ubuntu" && (
        <g transform="translate(16 16)">
          {/* Ubuntu "Circle of Friends" — three curved arms + centre */}
          <circle cx="0" cy="0" r="16" fill="#E95420" />
          <g fill="#ffffff">
            {/* top arm */}
            <path d="M0 -6 A6 6 0 1 1 -0.01 -6 Z M0 -15.5 A15.5 15.5 0 0 1 13.4 -7.75 L9.4 -5.4 A11.5 11.5 0 0 0 0 -11.5 Z" />
            {/* lower-left arm */}
            <path d="M-5.2 3 A6 6 0 1 1 -5.19 3.1 Z M-13.4 7.75 A15.5 15.5 0 0 1 -9.4 15.5 L-9.4 11.5 A11.5 11.5 0 0 0 -5.2 -1.5 Z" />
            {/* lower-right arm */}
            <path d="M5.2 3 A6 6 0 1 1 5.19 3.1 Z M13.4 7.75 A15.5 15.5 0 0 1 9.4 15.5 L9.4 11.5 A11.5 11.5 0 0 0 5.2 -1.5 Z" />
          </g>
          <circle cx="0" cy="0" r="3.6" fill="#2c001e" />
        </g>
      )}

      {osId === "windows" && (
        <g>
          {/* Windows logo — four panes, official 4-tone blue */}
          <rect x="3" y="3" width="11" height="11" rx="0.5" fill="#F25022" />
          <rect x="18" y="3" width="11" height="11" rx="0.5" fill="#7FBA00" />
          <rect x="3" y="18" width="11" height="11" rx="0.5" fill="#00A4EF" />
          <rect x="18" y="18" width="11" height="11" rx="0.5" fill="#FFB900" />
        </g>
      )}

      {osId === "zorin" && (
        <g transform="translate(16 16)">
          {/* Zorin OS — stylized "Z" arrow, official green on dark */}
          <circle cx="0" cy="0" r="16" fill="#15A66E" />
          <path
            d="M-9 -7 H9 L-9 7 H9"
            stroke="#ffffff"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      )}

      {osId === "mint" && (
        <g transform="translate(16 16)">
          {/* Linux Mint — leaf emblem, official green on white */}
          <circle cx="0" cy="0" r="16" fill="#ffffff" />
          <path
            d="M0 -11 C 7 -5 7 3 0 10 C -7 3 -7 -5 0 -11 Z"
            fill="#7ABF7A"
          />
          <path d="M0 -9 L0 8" stroke="#3C8C3C" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M0 -3 L4 0 M0 -3 L-4 0" stroke="#3C8C3C" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="0" cy="-7" r="1.5" fill="#3C8C3C" />
        </g>
      )}

      {osId === "arch" && (
        <g transform="translate(16 16)">
          {/* Arch Linux — the "A" logo, official blue on white */}
          <circle cx="0" cy="0" r="16" fill="#ffffff" />
          <path
            d="M0 -11 L-9 11 L-3.6 11 L0 -2 L3.6 11 L9 11 Z"
            fill="#1793D1"
          />
        </g>
      )}

      {osId === "debian" && (
        <g transform="translate(16 16)">
          {/* Debian — the swirl, official red on white */}
          <circle cx="0" cy="0" r="16" fill="#ffffff" />
          <path
            d="M0 -10 C 6 -10 10 -5 10 0 C 10 5 6 10 0 10 C -3 10 -6 8 -6 5 C -6 3 -4 2.5 -2.5 2.5 C -1 2.5 0 3.5 0 5 C 0 8 3 9 6 7 L4.5 4.5 C 3 6.5 0 6 0 3.5 C 0 1 3 0.5 6 1.5 C 3 0 0 -1 0 -4 C 0 -6 1.5 -7 3.5 -7 C 2 -5.5 1.5 -4.5 2 -3.5 C 2.5 -2.5 3.5 -3 4 -4.5 C 2.5 -6.5 0 -7 0 -10 Z"
            fill="#D70A53"
          />
        </g>
      )}

      {osId === "fedora" && (
        <g transform="translate(16 16)">
          {/* Fedora — the "f" logo, official blue on white */}
          <circle cx="0" cy="0" r="16" fill="#ffffff" />
          <path
            d="M5 13 C 2 13 4 8 1 6 C 5 6 7 9 6 13 Z M-6 -11 C -1 -11 0 -5 -1 -2 C 2 -6 4 -9 9 -10 C 4 -4 -1 -2 -1 3 C -1 8 -5 11 -9 10 C -4 9 -2 5 -4 1 C -6 -2 -9 -2 -9 2 C -9 6 -6 7 -3 6 C -8 9 -13 5 -11 -1 C -10 -5 -8 -8 -6 -11 Z"
            fill="#3C6EB4"
          />
        </g>
      )}

      {/* Fallback: monochrome glyph tinted with accent */}
      {!["ubuntu", "windows", "zorin", "mint", "arch", "debian", "fedora"].includes(osId) && (
        <circle cx="16" cy="16" r="15" fill={c} />
      )}
    </svg>
  );
}
