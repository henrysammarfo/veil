import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP-powered word-by-word scroll reveal.
 * Rotation eases to 0, each word fades from baseOpacity → 1 and
 * un-blurs as it scrolls into view. All three tweens are scrubbed.
 */
export function ScrollReveal({
  children,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = "",
  textClassName = "",
}: {
  children: string;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
}) {
  const containerRef = useRef<HTMLHeadingElement | null>(null);

  const splitText = useMemo<ReactNode[]>(() => {
    return children.split(/(\s+)/).map((word, i) =>
      /^\s+$/.test(word) ? (
        word
      ) : (
        <span className="word inline-block whitespace-pre" key={i}>
          {word}
        </span>
      ),
    );
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>(".word");
    const tweens: gsap.core.Tween[] = [];

    tweens.push(
      gsap.fromTo(
        el,
        { transformOrigin: "0% 50%", rotate: baseRotation },
        {
          rotate: 0,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        },
      ),
    );

    tweens.push(
      gsap.fromTo(
        words,
        { opacity: baseOpacity, willChange: "opacity" },
        {
          opacity: 1,
          stagger: 0.05,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom-=20%",
            end: "bottom bottom",
            scrub: true,
          },
        },
      ),
    );

    if (enableBlur) {
      tweens.push(
        gsap.fromTo(
          words,
          { filter: `blur(${blurStrength}px)` },
          {
            filter: "blur(0px)",
            stagger: 0.05,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom-=20%",
              end: "bottom bottom",
              scrub: true,
            },
          },
        ),
      );
    }

    return () => {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
    };
  }, [baseOpacity, baseRotation, blurStrength, enableBlur]);

  return (
    <h2 ref={containerRef} className={`m-0 ${containerClassName}`}>
      <span className={`m-0 flex flex-wrap ${textClassName}`}>{splitText}</span>
    </h2>
  );
}
