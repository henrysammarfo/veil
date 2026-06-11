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
      className="relative min-h-screen w-full overflow-hidden bg-black"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Background video slot (z-0) — drop your <video> element here later */}
      <div className="absolute inset-0 z-0 bg-black" aria-hidden="true">
        {/* TODO: <video autoPlay muted playsInline className="h-full w-full object-cover" /> */}
      </div>

      {/* Gradient overlay over video */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black via-transparent to-black" />

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
        className="relative z-10 flex flex-col items-center justify-center px-6 pb-40 text-center"
        style={{ paddingTop: "calc(8rem - 75px)" }}
      >
        <h1
          className="animate-fade-rise max-w-7xl text-5xl font-normal text-white sm:text-7xl md:text-8xl"
          style={{
            fontFamily: '"Instrument Serif", serif',
            lineHeight: 0.95,
            letterSpacing: "-2.46px",
          }}
        >
          Beyond{" "}
          <em className="italic" style={{ color: "#6F6F6F" }}>
            silence,
          </em>{" "}
          we build{" "}
          <em className="italic" style={{ color: "#6F6F6F" }}>
            the eternal.
          </em>
        </h1>

        <p
          className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ color: "#6F6F6F" }}
        >
          Building platforms for brilliant minds, fearless makers, and thoughtful
          souls. Through the noise, we craft digital havens for deep work and pure
          flows.
        </p>

        <button
          type="button"
          className="animate-fade-rise-delay-2 mt-12 rounded-full bg-white px-14 py-5 text-base text-black transition-transform duration-200 hover:scale-[1.03]"
        >
          Begin Journey
        </button>
      </section>
    </div>
  );
}
