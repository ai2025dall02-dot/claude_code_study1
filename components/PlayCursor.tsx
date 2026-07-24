"use client";

// 마우스 따라다니는 "Film · Movie" 재생 커서 (레퍼런스: houseofyellow.nl).
//  - 대상 영역([data-playcursor]: ABOUT 영상 / LINEUP·FILMMAKERS 카드) 위에서만 등장, 기본 커서는 숨김.
//  - 정사각형 + 중앙 원 + 원 둘레 회전 텍스트(SVG textPath, 등속 무한).
//  - 배경 명암에 따라 색 즉시 반전(useDarkBackdrop 공용 훅 — SiteNav 와 동일 판정).
//  - 스프링 추적 + 등장 시 "빨려들어감"(텍스트 링 수축). pointer-events:none.
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "framer-motion";
import { useIntroRevealed } from "./Intro";
import { useDarkBackdrop } from "./useDarkBackdrop";
import styles from "./PlayCursor.module.css";

const R = 33; // 텍스트 원 반지름(중심 52). 원둘레 ≈ 2πR
const CIRC = 2 * Math.PI * R; // textLength 로 강제 → 폰트와 무관하게 균일 분포
// 안쪽을 향하는(상단이 중심 방향) 원형 경로 — 반시계(sweep 0)로 그려 글자가 안쪽으로 눕게.
const PATH = `M 52 52 m 0 -${R} a ${R} ${R} 0 1 0 0 ${2 * R} a ${R} ${R} 0 1 0 0 -${2 * R}`;
const SPRING = { stiffness: 300, damping: 28, mass: 0.5 }; // 살짝 지연되는 부드러운 추적

export default function PlayCursor() {
  const revealed = useIntroRevealed();
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false); // hover 지원(비터치) 장치만
  const [visible, setVisible] = useState(false); // 대상 영역 위인가
  const [modalOpen, setModalOpen] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const wasVisible = useRef(false);

  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);

  // hover/fine 포인터 장치 감지(터치·모바일 제외 → 렌더 자체 안 함)
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // 대상 영역에서만 기본 커서 숨김(활성 장치일 때만) — html 마커로 CSS 스코프
  useEffect(() => {
    const root = document.documentElement;
    if (enabled) root.setAttribute("data-playcursor-active", "on");
    else root.removeAttribute("data-playcursor-active");
    return () => root.removeAttribute("data-playcursor-active");
  }, [enabled]);

  // LINEUP 바텀시트 모달(body[data-modal-open]) 열림 감지 → 커서 숨김
  useEffect(() => {
    const read = () => setModalOpen(document.body.getAttribute("data-modal-open") === "true");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.body, { attributes: true, attributeFilter: ["data-modal-open"] });
    return () => mo.disconnect();
  }, []);

  // 배경 명암 → 색 반전(공용 훅). 마우스 좌표 샘플, 커서 자신은 제외.
  const { dark, kick } = useDarkBackdrop({
    getPoint: () =>
      visible ? { x: mouse.current.x, y: mouse.current.y, exclude: cursorRef.current } : null,
    watchScroll: true,
    watchResize: false,
    initialKickMs: 0,
    scrollKickMs: 600,
    enabled,
    reinitDeps: [enabled],
  });

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      const t = e.target instanceof Element ? e.target.closest("[data-playcursor]") : null;
      const next = !!t;
      // 숨김→등장 순간엔 순간이동(코너에서 날아오는 글라이드 방지), 이후엔 스프링 추적.
      if (next && !wasVisible.current) {
        x.jump(e.clientX);
        y.jump(e.clientY);
      } else {
        x.set(e.clientX);
        y.set(e.clientY);
      }
      wasVisible.current = next;
      setVisible((v) => (v === next ? v : next));
      if (next) kick();
    };
    const hide = () => {
      wasVisible.current = false;
      setVisible(false);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("mouseleave", hide);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("blur", hide);
      document.removeEventListener("mouseleave", hide);
    };
  }, [enabled, x, y, kick]);

  if (!enabled) return null; // 터치/모바일: 렌더 안 함

  const show = revealed && visible && !modalOpen; // 인트로·모달 중엔 숨김

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={cursorRef}
          className={styles.cursor}
          data-dark={dark}
          style={{ x, y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          <div className={styles.square}>
            <span className={styles.dot} />
            <svg className={styles.svg} viewBox="0 0 104 104">
              <defs>
                <path id="pcPath" d={PATH} fill="none" />
              </defs>
              <g className={styles.spin}>
                <motion.g
                  className={styles.suck}
                  initial={{ scale: reduce ? 1 : 1.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: reduce ? 1 : 1.6, opacity: 0 }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                >
                  <text className={styles.ring} textLength={CIRC} lengthAdjust="spacing">
                    <textPath href="#pcPath" startOffset="0">
                      FILM · MOVIE · FILM · MOVIE ·
                    </textPath>
                  </text>
                </motion.g>
              </g>
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
