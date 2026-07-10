"use client";

import { useEffect, useRef, useState } from "react";
import { useIntroRevealed } from "./Intro";
import styles from "./SiteNav.module.css";

const LINKS: { label: string; href: string }[] = [
  { label: "ABOUT", href: "#about" },
  { label: "LINEUP", href: "#lineup" },
  { label: "FILMMAKERS", href: "#filmmakers" },
  { label: "FESTIVALS", href: "#festivals" },
  { label: "JOURNAL", href: "#journal" },
  { label: "CONTACT", href: "#contact" },
];

const MENU_ID = "site-menu";

export default function SiteNav() {
  const revealed = useIntroRevealed();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // 모바일 햄버거 메뉴 열림 상태(데스크톱은 CSS 로 항상 노출)
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 열렸을 때: ESC 닫기 + 포커스 트랩(Tab 순환) + 첫 링크로 포커스 이동. (모바일에서만 open=true 가 됨)
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    // 트랩 대상: 햄버거 버튼 + 메뉴 내부 링크들
    const focusables = () => {
      const links = menu ? Array.from(menu.querySelectorAll<HTMLElement>('a[href]')) : [];
      return [btnRef.current, ...links].filter(Boolean) as HTMLElement[];
    };
    // 열리면 첫 메뉴 항목으로 포커스
    const firstLink = menu?.querySelector<HTMLElement>('a[href]');
    firstLink?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        btnRef.current?.focus(); // 닫으면 햄버거 버튼으로 포커스 복귀
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={styles.nav} data-scrolled={scrolled} data-revealed={revealed} data-open={open}>
      <a className={styles.brand} href="#home" aria-label="필름 누벨 — 히어로로 이동">
        FILMNOUVELLE
      </a>

      {/* 햄버거 버튼 — 모바일(≤767)에서만 CSS 로 노출. 데스크톱은 display:none. */}
      <button
        ref={btnRef}
        type="button"
        className={styles.hamburger}
        aria-expanded={open}
        aria-controls={MENU_ID}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.hamburgerBox} aria-hidden="true">
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </span>
      </button>

      <nav ref={menuRef} id={MENU_ID} className={styles.links} data-open={open} aria-label="주요 메뉴">
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            onClick={() => setOpen(false)} // 항목 탭 → 해당 섹션 이동 후 메뉴 닫힘
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
