"use client";

// 마우스 따라다니는 "FILM / MOVIE" 재생 커서 (레퍼런스: houseofyellow.nl).
//  - 사이트 전 영역에서 표시(대상 제한 없음). 기본 커서는 전역 숨김(globals.css).
//  - 정사각 + 중앙 원(사각 동일색 마스크) + 대각선 2단어가 모서리→중앙으로 무한히 빨려듦.
//  - 두 단어 세트 전체가 중심 기준 시계방향 무한 회전(CSS). 배경 명암으로 색 즉시 반전(useDarkBackdrop).
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring } from "framer-motion";
import { useIntroRevealed } from "./Intro";
import { useDarkBackdrop } from "./useDarkBackdrop";
import styles from "./PlayCursor.module.css";

const SPRING = { stiffness: 300, damping: 28, mass: 0.5 }; // 살짝 지연되는 부드러운 추적

export default function PlayCursor() {
  const revealed = useIntroRevealed();
  const [enabled, setEnabled] = useState(false); // hover 지원(비터치) 장치만
  const [visible, setVisible] = useState(false); // 마우스가 뷰포트 안(=표시)인가
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

  // LINEUP 바텀시트 모달(body[data-modal-open]) 열림 감지 → 커서 숨김 + 기본 커서 복귀
  useEffect(() => {
    const read = () => setModalOpen(document.body.getAttribute("data-modal-open") === "true");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.body, { attributes: true, attributeFilter: ["data-modal-open"] });
    return () => mo.disconnect();
  }, []);

  // 전역 기본 커서 숨김은 "실제로 커스텀 커서를 쓰는 동안"에만 — 인트로/모달 중엔 기본 커서 복귀.
  const active = enabled && revealed && !modalOpen;
  useEffect(() => {
    const root = document.documentElement;
    if (active) root.setAttribute("data-playcursor-active", "on");
    else root.removeAttribute("data-playcursor-active");
    return () => root.removeAttribute("data-playcursor-active");
  }, [active]);

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
      // 숨김→등장 순간엔 순간이동(코너에서 날아오는 글라이드 방지), 이후엔 스프링 추적.
      if (!wasVisible.current) {
        x.jump(e.clientX);
        y.jump(e.clientY);
      } else {
        x.set(e.clientX);
        y.set(e.clientY);
      }
      wasVisible.current = true;
      setVisible(true);
      kick();
    };
    const hide = () => {
      wasVisible.current = false;
      setVisible(false);
    };
    // 창 밖으로 완전히 나가면 숨김(내부 요소 간 이동은 유지)
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget && !(e as MouseEvent & { toElement?: unknown }).toElement) hide();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onOut, { passive: true });
    window.addEventListener("blur", hide);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onOut);
      window.removeEventListener("blur", hide);
    };
  }, [enabled, x, y, kick]);

  if (!enabled) return null; // 터치/모바일: 렌더 안 함

  const show = revealed && visible && !modalOpen; // 인트로·모달 중엔 숨김. (초기 (0,0) 은 첫 mousemove 전이라 visible=false)

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
            <div className={styles.rotor}>
              <div className={`${styles.word} ${styles.wordA}`}>
                <span className={styles.wordInner}>FILM</span>
              </div>
              <div className={`${styles.word} ${styles.wordB}`}>
                <span className={styles.wordInner}>MOVIE</span>
              </div>
            </div>
            <span className={styles.dot} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
