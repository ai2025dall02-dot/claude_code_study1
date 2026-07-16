"use client";

import { useEffect, useRef } from "react";
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

  // 열렸을 때: 배경 스크롤 잠금 + ESC 닫기 + 포커스 트랩(+ 닫기 버튼으로 초기 포커스, 닫으면 이전 포커스 복귀)
  useEffect(() => {
    if (!film) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    // 모달 열림 표시 — SiteNav 가 이 속성으로 모바일에서 네비를 잠시 숨김(닫기 X 와 겹침 방지)
    body.setAttribute("data-modal-open", "true");
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
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
      document.removeEventListener("keydown", onKey);
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      body.removeAttribute("data-modal-open"); // 닫히면 네비 복구
      prevFocus?.focus?.();
    };
  }, [film, onClose]);

  return (
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
    </AnimatePresence>
  );
}
