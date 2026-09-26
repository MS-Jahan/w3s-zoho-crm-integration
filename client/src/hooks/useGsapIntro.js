import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * GSAP entrance choreography for the dashboard.
 * Stat cards rise+fade with stagger; the table card slides in after.
 * Respects prefers-reduced-motion.
 */
export default function useGsapIntro(enabled = true) {
  const scopeRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!enabled || reduced || !scopeRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from('[data-gsap="stat-card"]', {
        y: 24,
        autoAlpha: 0,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.09,
      });
      gsap.from('[data-gsap="table-card"]', {
        y: 32,
        autoAlpha: 0,
        duration: 0.65,
        ease: 'power3.out',
        delay: 0.25,
      });
      gsap.from('[data-gsap="form-card"], [data-gsap="sandbox-card"]', {
        y: 24,
        autoAlpha: 0,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.12,
        delay: 0.35,
      });
    }, scopeRef);

    return () => ctx.revert();
  }, [enabled]);

  return scopeRef;
}
