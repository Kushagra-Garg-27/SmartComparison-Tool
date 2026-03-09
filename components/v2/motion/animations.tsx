import React, { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

/**
 * Hooks and utilities for GSAP-powered animations
 */

/* ─── Stagger reveal: animate children into view ─── */
export function useStaggerReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  selector = ".reveal-item",
  options?: { delay?: number; stagger?: number; y?: number },
) {
  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll(selector);
    if (!els.length) return;

    gsap.set(els, { opacity: 0, y: options?.y ?? 40, scale: 0.95 });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(els, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              stagger: options?.stagger ?? 0.1,
              delay: options?.delay ?? 0,
              ease: "expo.out",
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
}

/* ─── Fade up: single element entrance ─── */
export function useFadeUp(ref: React.RefObject<HTMLElement | null>, delay = 0) {
  useEffect(() => {
    if (!ref.current) return;
    gsap.set(ref.current, { opacity: 0, y: 50 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(ref.current, {
            opacity: 1,
            y: 0,
            duration: 1,
            delay,
            ease: "expo.out",
          });
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);
}

/* ─── Mouse parallax hook ─── */
export function useMouseParallax(factor = 0.02) {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return mouse;
}

/* ─── Magnetic button effect ─── */
export function useMagnetic(
  ref: React.RefObject<HTMLElement | null>,
  strength = 0.3,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.4,
        ease: "power2.out",
      });
    };

    const handleLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [strength]);
}

/* ─── Tilt card effect ─── */
export function useTilt(ref: React.RefObject<HTMLElement | null>, maxTilt = 8) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * maxTilt;
      const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * maxTilt;

      gsap.to(el, {
        rotateX,
        rotateY,
        duration: 0.4,
        ease: "power2.out",
        transformPerspective: 800,
      });
    };

    const handleLeave = () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.5)",
      });
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [maxTilt]);
}

/* ─── Typing text animation ─── */
export function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = React.useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayed;
}

/* ─── Glow pulse on hover ─── */
export function useGlowHover(
  ref: React.RefObject<HTMLElement | null>,
  color = "rgba(123, 47, 242, 0.3)",
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleEnter = () => {
      gsap.to(el, {
        boxShadow: `0 0 30px ${color}, 0 0 60px ${color}`,
        duration: 0.4,
        ease: "power2.out",
      });
    };

    const handleLeave = () => {
      gsap.to(el, {
        boxShadow: "0 0 0px transparent",
        duration: 0.6,
        ease: "power2.inOut",
      });
    };

    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [color]);
}

/* ─── Page entrance timeline ─── */
export function usePageEntrance(
  containerRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    tl.from(containerRef.current, { opacity: 0, duration: 0.5 })
      .from(".hero-title", { opacity: 0, y: 80, duration: 1 }, 0.2)
      .from(".hero-subtitle", { opacity: 0, y: 40, duration: 0.8 }, 0.5)
      .from(".hero-cta", { opacity: 0, scale: 0.8, duration: 0.6 }, 0.7)
      .from(".hero-badge", { opacity: 0, y: 20, duration: 0.5 }, 0.9);

    return () => {
      tl.kill();
    };
  }, []);
}
