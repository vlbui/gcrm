"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

interface FadeUpProps {
  children: ReactNode;
}

export default function FadeUp({ children }: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`fade-up${visible ? " visible" : ""}`}>
      {children}
    </div>
  );
}
