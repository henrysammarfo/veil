type VeilLogoProps = {
  /** mark = icon only, full = icon + wordmark */
  variant?: "mark" | "full";
  className?: string;
  /** Use light palette (dark text) for light backgrounds */
  theme?: "dark" | "light";
};

export function VeilLogo({ variant = "full", className = "", theme = "dark" }: VeilLogoProps) {
  const fg = theme === "dark" ? "#FAFAFA" : "#0A0A0A";
  const accent = theme === "dark" ? "#F5B400" : "#C89200";
  const markBg = theme === "dark" ? "#0A0A0A" : "#FAFAFA";
  const markStroke = theme === "dark" ? "#FAFAFA" : "#0A0A0A";

  const mark = (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 shrink-0"
      aria-hidden
    >
      <rect width="32" height="32" rx="7" fill={markBg} stroke={theme === "light" ? "#E5E5E5" : "none"} />
      <path
        d="M9.8 9.2L16 24.8L22.2 9.2"
        stroke={markStroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.8 16.8C10.4 15.2 14 14.6 17.6 15.4C21.2 16.2 24 17.2 25.2 17.8"
        stroke={accent}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === "mark") {
    return <span className={`inline-flex ${className}`}>{mark}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark}
      <span
        className="font-display text-2xl leading-none tracking-tight md:text-[1.65rem]"
        style={{ color: fg }}
      >
        Veil
        <sup className="align-super text-[10px]">®</sup>
      </span>
    </span>
  );
}
