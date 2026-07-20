"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type Film } from "@/data/films";
import styles from "./LineupModal.module.css";

/** LINEUP 카드 클릭 시 뜨는 영화 상세 모달.
 *  PC: 하단에서 슬라이드 업 오버레이(좌 포스터 + 우 다크 상세). 모바일: 세로 풀스크린(상단 이미지 + 하단 상세).
 *  X/배경 클릭/ESC 로 닫힘. 열렸을 때 배경 스크롤 잠금 + 포커스 트랩. reduce-motion 이면 애니메이션 없이 즉시. */
export default function LineupModal({
  film,
  image,
  onClose,
}: {
  film: Film | null;
  image?: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // 포털 마운트 가드(SSR/하이드레이션 안전) — createPortal 은 클라이언트에서만.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 열렸을 때: 배경 스크롤 잠금 + ESC 닫기 + 포커스 트랩(+ 닫기 버튼 초기 포커스, 닫으면 이전 포커스 복귀)
  useEffect(() => {
    if (!film) return;
    const body = document.body;
    // 모달 열림 표시 — SiteNav 가 이 속성으로 모바일에서 네비를 잠시 숨김(닫기 X 와 겹침 방지)
    body.setAttribute("data-modal-open", "true");
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    // 배경 스크롤 잠금 — body/html 의 overflow 를 건드리지 않는다.
    //   (overflow:hidden 을 주면 LINEUP 의 position:sticky 가 깨져 무대가 튀고, 뒤 화면이 사라진다.)
    //   대신 스크롤 '입력'만 막아 현재 화면(sticky 고정 프레임)을 그대로 얼려 둔다 → 딤/블러가 실제 화면 위로.
    const SCROLL_KEYS = [" ", "Spacebar", "PageUp", "PageDown", "ArrowUp", "ArrowDown", "Home", "End"];
    const blockScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return; // 모달 내부 스크롤은 허용
      e.preventDefault();
    };
    window.addEventListener("wheel", blockScroll, { passive: false });
    window.addEventListener("touchmove", blockScroll, { passive: false });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      const t = e.target as HTMLElement | null;
      const inField = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (!inField && SCROLL_KEYS.includes(e.key) && !panelRef.current?.contains(t)) {
        e.preventDefault(); // 스페이스/화살표/PageUp·Down 등으로 배경 스크롤 방지
      }
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const items = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null);
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
    return () => {
      window.removeEventListener("wheel", blockScroll);
      window.removeEventListener("touchmove", blockScroll);
      document.removeEventListener("keydown", onKey);
      body.removeAttribute("data-modal-open"); // 닫히면 네비 복구
      prevFocus?.focus?.();
    };
  }, [film, onClose]);

  if (!mounted) return null;

  // [B] 포털로 document.body 에 렌더 → LINEUP sticky 트랙/overflow:hidden/z-index 컨텍스트 밖에서
  //   position:fixed 오버레이가 뷰포트 전체를 덮고, SiteNav(z:100) 위(z:300)로 뜬다.
  return createPortal(
    <AnimatePresence>
      {film && (
        <motion.div
          className={styles.overlay}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${film.title} 상세 정보`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.3 }}
        >
          <motion.div
            ref={panelRef}
            className={styles.panel}
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="닫기">
              <span aria-hidden="true">✕</span>
            </button>

            <div className={styles.media}>
              {image && (
                <Image src={image} alt={`${film.title} 포스터`} fill sizes="(max-width: 767px) 100vw, 44vw" />
              )}
            </div>

            <div className={styles.body}>
              <span className={styles.eyebrow}>{film.status}</span>
              <h2 className={styles.title}>{film.title}</h2>
              <span className={styles.titleEn}>{film.titleEn}</span>
              <p className={styles.logline}>{film.logline}</p>
              <dl className={styles.meta}>
                <div className={styles.metaRow}>
                  <dt>감독</dt>
                  <dd>{film.director}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>국가 · 연도</dt>
                  <dd>
                    {film.country} · {film.year}
                  </dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>러닝타임</dt>
                  <dd>{film.runtime}분</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>포맷</dt>
                  <dd>{film.format}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>장르</dt>
                  <dd>{film.genre}</dd>
                </div>
              </dl>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
