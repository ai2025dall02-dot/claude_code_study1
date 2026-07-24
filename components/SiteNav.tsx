"use client";

// tsitsipas.com 스타일 미니멀 네비 — 우측 상단 "Menu" 버튼.
//  [A] 클릭 시 풀스크린 오버레이가 아니라, 버튼 자리에서 아래로 펼쳐지는 "패널 박스"가 열림.
//  [B] 바깥 클릭 / CLOSE / ESC 로 닫힘, 배경 스크롤 잠금(딤 없음).
//  [C] 항목 폰트 축소(색상 유지). [D] IntersectionObserver 로 현재 섹션 활성(흰색)/비활성(회색).
import { useEffect, useRef, useState } from "react";
import { useIntroRevealed } from "./Intro";
import { useDarkBackdrop } from "./useDarkBackdrop";
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
  const [open, setOpen] = useState(false); // 패널 열림 상태
  const [active, setActive] = useState<string>(LINKS[0].href.slice(1)); // 현재 섹션 id(패널 활성 표시용)
  const navRef = useRef<HTMLElement>(null); // [반전] 배경 샘플링 시 헤더/버튼 자신을 제외하기 위한 참조
  const btnRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null); // 버튼+패널 앵커(바깥 클릭 판정 기준)
  const panelRef = useRef<HTMLDivElement>(null);

  // [반전] 버튼 뒤(최상단) 배경이 어두운지 → data-dark. 공용 훅(useDarkBackdrop)으로 판정.
  //   · 샘플 지점: 버튼 바로 아래 중앙(화면 최상단). exclude=헤더(자기 자신 제외).
  //   · onFrame: active(35% 기준선) 계산을 같은 rAF 루프에서 수행(패널 활성 표시용).
  //   · reinitDeps=[revealed]: 인트로 종료 시 재시작해 밝은 히어로를 올바로 읽음.
  //   (스크롤·resize kick, rAF tail, 스프링 정착 대응 등 기존 동작은 훅 내부에서 100% 동일)
  const { dark } = useDarkBackdrop({
    getPoint: () => {
      const btn = btnRef.current;
      if (!btn) return null;
      const br = btn.getBoundingClientRect();
      return { x: br.left + br.width / 2, y: br.bottom + 10, exclude: navRef.current };
    },
    onFrame: () => {
      const refY = window.innerHeight * 0.35; // 기준선("지금 읽는 섹션")
      let current = LINKS[0].href.slice(1);
      for (const l of LINKS) {
        const el = document.getElementById(l.href.slice(1));
        if (el && el.getBoundingClientRect().top - refY <= 0) current = l.href.slice(1);
      }
      setActive(current);
    },
    reinitDeps: [revealed],
    initialKickMs: 800,
    scrollKickMs: 1200,
  });

  // [B] 열림: 배경 스크롤 잠금 + 첫 항목 포커스 + ESC/바깥클릭 닫기 + 포커스 트랩(Tab 순환).
  //   (풀스크린 딤 없음 — 패널은 화면 일부만 덮고, 바깥을 눌러 닫음)
  useEffect(() => {
    if (!open) return;
    // [수정] 과거 html/body { overflow:hidden } 으로 스크롤을 잠갔더니 position:sticky(영상 무대·
    //   FILMMAKERS 캐러셀·JOURNAL/CONTACT 고정)가 깨져, 패널을 열면 고정 콘텐츠가 제자리에서 튕겨
    //   화면이 비어 보였다. 레이아웃은 그대로 두고 스크롤 입력만 막아 "누른 시점 화면"을 얼려 그 위에
    //   패널이 뜨게 한다. (wheel·touchmove + 스크롤 유발 키만 차단 — 버튼/링크 활성용 Space/Enter 는 유지)
    const preventScroll = (e: Event) => e.preventDefault();
    const SCROLL_KEYS = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
    const onScrollKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.includes(e.key)) e.preventDefault();
    };
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", onScrollKey, { passive: false });

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
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", onScrollKey);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <header ref={navRef} className={styles.nav} data-revealed={revealed} data-dark={dark}>
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
                onClick={(e) => {
                  // 일부 섹션은 sticky/overlap 구조라 "요소 상단"과 "실제로 보이는 지점"이 다르다 → 보정.
                  //  · FESTIVALS(.fests): margin-top:-100vh 로 FILMMAKERS 와 100vh 겹침 → 요소 상단으로 가면
                  //    아직 위 레이어 FILMMAKERS(감독 카드)가 덮음 → 100vh 더 내려 FESTIVALS 가 드러난 지점으로.
                  //  · CONTACT(.contactReveal): JOURNAL sticky 트랙 안 오버레이(아래→위 상승)라 트랙 끝에서야
                  //    완전히 드러남 → 페이지 최하단으로 스크롤해야 CONTACT 가 보임.
                  //  · JOURNAL(#journal): sticky 로 고정돼 있어 요소 top+scrollY 가 "현재 스크롤"을 반환 →
                  //    CONTACT(트랙 끝)에서 누르면 제자리(변화 없음). 트랙 래퍼(#journalTrack) 상단으로 이동해야
                  //    JOURNAL 리스트가 드러남.
                  const id = l.href.slice(1);
                  let el = document.getElementById(id);
                  if (id === "journal") el = document.getElementById("journalTrack") ?? el;
                  if (el) {
                    e.preventDefault();
                    let top = el.getBoundingClientRect().top + window.scrollY;
                    if (id === "festivals") top += window.innerHeight;
                    else if (id === "contact")
                      top = document.documentElement.scrollHeight - window.innerHeight;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                  setOpen(false);
                }}
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
