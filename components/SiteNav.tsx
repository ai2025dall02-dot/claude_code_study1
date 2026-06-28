"use client";

import { useEffect, useState } from "react";
import styles from "./SiteNav.module.css";

const LINKS: { label: string; href: string }[] = [
  { label: "ABOUT", href: "#about" },
  { label: "LINEUP", href: "#lineup" },
  { label: "FILMMAKERS", href: "#filmmakers" },
  { label: "FESTIVALS", href: "#festivals" },
  { label: "JOURNAL", href: "#journal" },
  { label: "CONTACT", href: "#contact" },
];

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={styles.nav} data-scrolled={scrolled}>
      <a className={styles.brand} href="#home" aria-label="필름 누벨 — 히어로로 이동">
        FILMNOUVELLE
      </a>
      <nav className={styles.links} aria-label="주요 메뉴">
        {LINKS.map((l) => (
          <a key={l.label} href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
