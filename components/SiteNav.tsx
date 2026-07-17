"use client";

// [C] tsitsipas.com 스타일 미니멀 네비 — 좌: 브랜드 / 우: "Menu" 버튼 하나.
// 클릭 시 전체 오버레이가 열리고 메뉴 항목을 크게 세로로 나열(우상단 Close). 데스크톱·모바일 동일.
import { useEffect, useRef, useState } from "react";
import { useIntroRevealed } from "./Intro";
import { anton } from "@/app/fonts";
import styles from "./SiteNav.module.css";

const LINKS: { label: string; href: string }[] = [
  { label: "HOME", href: "#home" },
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
  const [open, setOpen] = useState(false); // 오버레이 메뉴 열림 상태
  const btnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 스크롤 시 헤더에 옅은 바 표시
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 열림: 배경 스크롤 잠금 + 첫 항목 포커스 + ESC 닫기 + 포커스 트랩(Tab 순환).
  // (오버레이가 z 최상단·pointer-events 로 히어로/덱 입력도 함께 차단)
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevH = html.style.overflow;
    const prevB = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const overlay = overlayRef.current;
    const items = () =>
      overlay ? Array.from(overlay.querySelectorAll<HTMLElement>("a[href], button")) : [];
    overlay?.querySelector<HTMLElement>("a[href]")?.focus(); // 첫 링크로 포커스

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        btnRef.current?.focus();
        return;
      }
      if (e.key === "Tab") {
        const list = items();
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
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
    return () => {
      html.style.overflow = prevH;
      body.style.overflow = prevB;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className={styles.nav} data-scrolled={scrolled} data-revealed={revealed}>
        <a className={styles.brand} href="#home">
          FILM NOUVELLE
        </a>
        <button
          ref={btnRef}
          type="button"
          className={styles.menuBtn}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={MENU_ID}
          onClick={() => setOpen(true)}
        >
          <span className={styles.menuDot} aria-hidden="true" />
          Menu
        </button>
      </header>

      {/* 전체 오버레이 메뉴 — z 최상단(히어로/덱 위). 닫힘 시 opacity/visibility 로 숨김 + 입력 차단 해제. */}
      <div
        ref={overlayRef}
        id={MENU_ID}
        className={styles.overlay}
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="사이트 메뉴"
        aria-hidden={!open}
      >
        <div className={styles.overlayBar}>
          <span className={styles.overlayBrand}>FILM NOUVELLE</span>
          <button
            type="button"
            className={styles.close}
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
            tabIndex={open ? 0 : -1}
          >
            <span>Close</span>
            <span className={styles.closeX} aria-hidden="true" />
          </button>
        </div>
        <nav className={styles.menuList} aria-label="주요 메뉴">
          {LINKS.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              className={anton.className}
              style={{ "--i": i } as React.CSSProperties}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
            >
              <span className={styles.menuIndex}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.menuLabel}>{l.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
