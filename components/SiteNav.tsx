"use client";

// tsitsipas.com 스타일 미니멀 네비 — 우측 상단 "Menu" 버튼.
//  [A] 클릭 시 풀스크린 오버레이가 아니라, 버튼 자리에서 아래로 펼쳐지는 "패널 박스"가 열림.
//  [B] 바깥 클릭 / CLOSE / ESC 로 닫힘, 배경 스크롤 잠금(딤 없음).
//  [C] 항목 폰트 축소(색상 유지). [D] IntersectionObserver 로 현재 섹션 활성(흰색)/비활성(회색).
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
  const [open, setOpen] = useState(false); // 패널 열림 상태
  const [active, setActive] = useState<string>(LINKS[0].href.slice(1)); // [D] 현재 섹션 id(기본 home)
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null); // 버튼+패널 앵커(바깥 클릭 판정 기준)
  const panelRef = useRef<HTMLDivElement>(null);

  // 스크롤 시 헤더에 옅은 바 표시
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // [D] 각 섹션을 관찰 → 뷰포트 세로 중앙선을 지나는 섹션을 activeSection 으로.
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

  // [B] 열림: 배경 스크롤 잠금 + 첫 항목 포커스 + ESC/바깥클릭 닫기 + 포커스 트랩(Tab 순환).
  //   (풀스크린 딤 없음 — 패널은 화면 일부만 덮고, 바깥을 눌러 닫음)
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevH = html.style.overflow;
    const prevB = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const panel = panelRef.current;
    const items = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>("a[href], button")) : [];
    panel?.querySelector<HTMLElement>("a[href]")?.focus(); // 첫 링크로 포커스

    const close = () => {
      setOpen(false);
      btnRef.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
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
    // 바깥(버튼+패널 앵커 밖) 클릭 시 닫힘
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      html.style.overflow = prevH;
      body.style.overflow = prevB;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <header className={styles.nav} data-scrolled={scrolled} data-revealed={revealed}>
      {/* [A] 버튼+패널 앵커 — 패널이 이 버튼 위치를 기준으로 아래로 펼쳐짐(풀스크린 아님) */}
      <div ref={wrapRef} className={styles.menuWrap} data-open={open}>
        <button
          ref={btnRef}
          type="button"
          className={styles.menuBtn}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={MENU_ID}
          tabIndex={open ? -1 : 0} // 열리면 패널이 가리므로 버튼은 포커스에서 제외
          onClick={() => setOpen(true)}
        >
          <span className={styles.menuBtnLabel}>Menu</span>
          <span className={styles.menuDot} aria-hidden="true" />
        </button>

        {/* [A] 확장 패널 — 버튼 top-right 기준으로 아래로 자라남. 닫힘 시 숨김 + 입력 차단 해제. */}
        <div
          ref={panelRef}
          id={MENU_ID}
          className={styles.panel}
          role="dialog"
          aria-label="사이트 메뉴"
          aria-hidden={!open}
        >
          <div className={styles.panelBar}>
            <button
              type="button"
              className={styles.close}
              onClick={() => {
                setOpen(false);
                btnRef.current?.focus();
              }}
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
                // [D] 현재 섹션과 일치하는 항목만 활성(흰색), 나머지 비활성(회색)
                data-active={active === l.href.slice(1)}
                aria-current={active === l.href.slice(1) ? "true" : undefined}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
              >
                <span className={styles.menuLabel}>{l.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
