"use client";

// [C/D/E] tsitsipas.com 스타일 미니멀 네비.
//  C: 헤더는 우측 상단 "Menu" 알약 버튼 하나(테두리+점). 좌측 브랜드 로고 제거.
//  D: 클릭 시 전체 오버레이 — 우상단 Close + 큰 세로 메뉴(언어 EN/GR 없음).
//  E: IntersectionObserver 로 현재 보고 있는 섹션 추적 → 해당 항목만 활성(흰색), 나머지 비활성(회색).
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
  const [active, setActive] = useState<string>(LINKS[0].href.slice(1)); // [E] 현재 섹션 id(기본 home)
  const btnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 스크롤 시 헤더에 옅은 바 표시
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // [E] 각 섹션을 관찰 → 뷰포트 세로 중앙선을 지나는 섹션을 activeSection 으로.
  //   rootMargin 으로 루트를 화면 중앙의 얇은 띠로 만들어, 그 띠에 걸친 섹션이 활성.
  //   (메뉴가 닫혀 있어도 계속 갱신 → 열 때 즉시 반영)
  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.href.slice(1))).filter(
      (el): el is HTMLElement => !!el
    );
    if (sections.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
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
      {/* [C] 헤더 — 우측 상단 Menu 알약 버튼 하나(브랜드 로고 제거, flex-end 정렬) */}
      <header className={styles.nav} data-scrolled={scrolled} data-revealed={revealed}>
        <button
          ref={btnRef}
          type="button"
          className={styles.menuBtn}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={MENU_ID}
          onClick={() => setOpen(true)}
        >
          <span className={styles.menuBtnLabel}>Menu</span>
          <span className={styles.menuDot} aria-hidden="true" />
        </button>
      </header>

      {/* [D] 전체 오버레이 메뉴 — z 최상단(히어로/덱 위). 닫힘 시 opacity/visibility 로 숨김 + 입력 차단 해제. */}
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
              // [E] 현재 섹션과 일치하는 항목만 활성(흰색), 나머지 비활성(회색)
              data-active={active === l.href.slice(1)}
              aria-current={active === l.href.slice(1) ? "true" : undefined}
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
