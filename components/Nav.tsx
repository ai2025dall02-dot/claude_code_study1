"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#programme", label: "라인업" },
  { href: "#about", label: "배급사" },
  { href: "#contact", label: "상영문의" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="nav" data-scrolled={scrolled}>
      <a className="nav__brand" href="#top" aria-label="필름 누벨 홈">
        <span className="nav__brand-ko">필름 누벨</span>
        <span className="nav__brand-en">Film Nouvelle</span>
      </a>
      <nav className="nav__links" aria-label="주요 메뉴">
        {links.map((l) => (
          <a key={l.href} className="nav__link" href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
