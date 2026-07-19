export default function OsIcon({ osId, accent, size }: { osId: string; accent?: string; size?: number }) {
  const s = size || 28;
  const c = accent || "#888";
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      {osId === "ubuntu" && (
        <>
          <circle cx="16" cy="16" r="15" fill={c} />
          <circle cx="16" cy="3.5" r="4.5" fill="#1a1a1a" />
          <circle cx="5" cy="25.7" r="4.5" fill="#1a1a1a" />
          <circle cx="27" cy="25.7" r="4.5" fill="#1a1a1a" />
        </>
      )}
      {osId === "windows" && (
        <>
          <rect x="2" y="2" width="13" height="13" rx="1" fill={c} />
          <rect x="17" y="2" width="13" height="13" rx="1" fill={c} />
          <rect x="2" y="17" width="13" height="13" rx="1" fill={c} />
          <rect x="17" y="17" width="13" height="13" rx="1" fill={c} />
        </>
      )}
      {osId === "zorin" && (
        <>
          <circle cx="16" cy="16" r="15" fill={c} />
          <path d="M9 9h14l-7 7 7 7H9" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {osId === "mint" && (
        <>
          <circle cx="16" cy="16" r="15" fill={c} />
          <circle cx="16" cy="16" r="6" fill="#1a1a1a" />
          <path d="M16 7l1 3h3l-2.5 2 1 3L16 13l-2.5 2 1-3L12 10h3z" fill={c} />
        </>
      )}
      {osId === "arch" && (
        <>
          <polygon points="16,3 5,29 12,26 16,31 20,26 27,29" fill={c} />
        </>
      )}
      {osId === "debian" && (
        <>
          <circle cx="16" cy="16" r="15" fill={c} />
          <path d="M16 8c-1.5 0-3 .5-4 1.5C10.5 11 10 13 10 16s.5 5 2 6.5c1 1 2.5 1.5 4 1.5s3-.5 4-1.5c1.5-1.5 2-3.5 2-6.5s-.5-5-2-6.5C19 8.5 17.5 8 16 8z" stroke="white" strokeWidth="1.5" fill="none" />
          <circle cx="16" cy="16" r="3" fill="white" />
        </>
      )}
      {osId === "fedora" && (
        <>
          <circle cx="16" cy="16" r="15" fill={c} />
          <path d="M11 11h7c2.2 0 4 1.8 4 4s-1.8 4-4 4h-3v-4h3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}
