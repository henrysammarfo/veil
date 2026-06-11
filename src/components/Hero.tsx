const navItems = [
  { label: "Home", active: true },
  { label: "Studio" },
  { label: "About" },
  { label: "Journal" },
  { label: "Reach Us" },
];

export function Hero() {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Gradient overlay over background canvas */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-black/80" />


      {/* Navigation */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        <a
          href="#"
          className="text-3xl tracking-tight text-white"
          style={{ fontFamily: '"Instrument Serif", serif' }}
        >
          Veil<sup className="text-xs align-super">®</sup>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <li key={item.label}>
              <a
                href="#"
                className="text-sm transition-colors hover:text-white"
                style={{ color: item.active ? "#FFFFFF" : "#6F6F6F" }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="rounded-full bg-white px-6 py-2.5 text-sm text-black transition-transform duration-200 hover:scale-[1.03]"
        >
          Begin Journey
        </button>
      </nav>

      {/* Hero */}
      <section
        className="relative z-10 mx-auto flex max-w-7xl flex-col px-8 pb-24"
        style={{ paddingTop: "calc(8rem - 75px)" }}
        aria-labelledby="hero-heading"
      >
        <p className="animate-fade-rise mb-6 text-xs uppercase tracking-[0.4em] text-[#6F6F6F]">
          Veil · Stealth Execution Layer
        </p>
        <h1
          id="hero-heading"
          className="animate-fade-rise max-w-5xl text-5xl font-normal text-white sm:text-7xl md:text-[8rem]"
          style={{
            fontFamily: '"Instrument Serif", serif',
            lineHeight: 0.92,
            letterSpacing: "-2.46px",
          }}
        >
          Trade smarter.{" "}
          <em className="italic" style={{ color: "#6F6F6F" }}>
            Stay invisible.
          </em>
        </h1>

        <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <p
            className="animate-fade-rise-delay max-w-xl text-base leading-relaxed sm:text-lg"
            style={{ color: "#9a9a9a" }}
          >
            The intelligent stealth execution layer for DeepBook on Sui. Your
            order stays private inside a Nautilus TEE until it&rsquo;s done —
            cryptographically proven, permanently archived.
          </p>

          <div className="animate-fade-rise-delay-2 flex items-center gap-4">
            <button
              type="button"
              className="rounded-full bg-white px-10 py-4 text-sm text-black transition-transform duration-200 hover:scale-[1.03]"
            >
              Begin Journey
            </button>
            <button
              type="button"
              className="rounded-full border border-white/30 px-10 py-4 text-sm text-white transition-colors hover:bg-white/5"
            >
              Read the bible
            </button>
          </div>
        </div>

        <div className="animate-fade-rise-delay-2 mt-24 flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-[#6F6F6F]">
          <span className="h-px w-8 bg-[#6F6F6F]" />
          Scroll to enter
        </div>
      </section>
    </div>
  );
}
