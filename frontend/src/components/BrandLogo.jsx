function BrandLogo({ className = "" }) {
  return (
    <span className={`brand-logo-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 72 72" role="img">
        <defs>
          <linearGradient id="vdLogoGold" x1="18" y1="8" x2="58" y2="62">
            <stop offset="0" stopColor="#f7c36c" />
            <stop offset="0.52" stopColor="#c58a35" />
            <stop offset="1" stopColor="#8c5518" />
          </linearGradient>
          <linearGradient id="vdLogoCream" x1="20" y1="10" x2="54" y2="58">
            <stop offset="0" stopColor="#fff8ea" />
            <stop offset="1" stopColor="#f0d6ad" />
          </linearGradient>
        </defs>
        <rect width="72" height="72" rx="22" fill="url(#vdLogoGold)" />
        <path
          d="M21.5 21.7c4.5-5 10.8-2.7 14.5.4 3.8-3.1 10.3-5.4 14.7-.3 4.1 4.8 2.7 13.7-.3 22.2-2.5 7.3-5.5 13-9.6 12.3-3.3-.6-2.9-6.1-4.8-8.8-1.9 2.7-1.5 8.2-4.8 8.8-4.1.7-7.1-5-9.7-12.3-3-8.5-4.2-17.4 0-22.3Z"
          fill="url(#vdLogoCream)"
          opacity="0.98"
        />
        <path
          d="M18.5 29.2 29.7 50h4.7l9.5-18.2h-5.7l-6.1 12-6.3-12H23l-4.5-2.6Zm30.7 2.6h-8.4v18.1h8.7c5.6 0 9.7-3.7 9.7-9.1 0-5.2-4.1-9-10-9Zm-.3 4.6c2.8 0 4.7 1.7 4.7 4.5 0 2.9-1.9 4.6-4.7 4.6h-2.7v-9.1h2.7Z"
          fill="#8a5218"
        />
        <circle cx="24" cy="18" r="5" fill="#fff8ea" opacity="0.86" />
      </svg>
    </span>
  );
}

export default BrandLogo;
