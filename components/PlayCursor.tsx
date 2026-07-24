"use client";

// 마우스 따라다니는 "Film · Movie" 재생 커서 (레퍼런스: houseofyellow.nl).
//  - 사이트 전 영역에서 표시(대상 제한 없음). 기본 커서는 전역 숨김(globals.css).
//  - 정사각형 + 중앙 원 + 원 둘레 회전 텍스트(SVG textPath, 등속 무한).
//  - 섹션 배경 명암에 따라 색 즉시 반전(useDarkBackdrop 공용 훅 — SiteNav 와 동일 판정):
//    밝은 배경 → 검은 사각 + 흰 텍스트 / 어두운 배경 → 흰 사각 + 검은 텍스트.
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
  const [visible, setVisible] = useState(false); // 마우스가 뷰포트 안(=표시)인가
  const [pressable, setPressable] = useState(false); // 클릭 가능한 요소(링크·버튼) 위인가 → 작은 사각형
  const [heroDone, setHeroDone] = useState(false); // 히어로 인트로 애니메이션 완료(FlowHero 신호) → 이때 등장
  const [forceDark, setForceDark] = useState<boolean | null>(null); // [data-cursor] 강제 색(솔리드 컨트롤 위 오판정 보정)
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

  // 히어로 인트로 완료 신호(FlowHero) 감지 → 이 시점부터 커서 등장(그 전엔 기본 커서, 히어로 애니 중).
  useEffect(() => {
    const read = () => setHeroDone(document.documentElement.getAttribute("data-hero-done") === "1");
    read();
    window.addEventListener("hero-intro-done", read);
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-hero-done"] });
    return () => {
      window.removeEventListener("hero-intro-done", read);
      mo.disconnect();
    };
  }, []);

  // 전역 기본 커서 숨김은 "커스텀 커서를 실제 쓰는 동안"에만 — 인트로·히어로 애니 중엔 기본 커서.
  //  (모달/바텀시트 중에도 커서를 계속 쓰므로 숨김 유지 — 커서 z 를 모달 위로 올려 그 위에 그린다.)
  useEffect(() => {
    const root = document.documentElement;
    const active = enabled && revealed && heroDone;
    if (active) root.setAttribute("data-playcursor-active", "on");
    else root.removeAttribute("data-playcursor-active");
    return () => root.removeAttribute("data-playcursor-active");
  }, [enabled, revealed, heroDone]);

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
      // 클릭으로 기능이 실행되는 요소(링크·버튼 등) 위 → 텍스트 없는 작은 사각형으로 전환.
      //  · #site-menu(네비 패널)·[role="dialog"](LINEUP 바텀시트) 전체를 press 로 처리 →
      //    항목 사이 여백에서 커졌다 작아지는 깜빡임 방지 + 시트 내부에선 작은 사각형 유지.
      const t = e.target instanceof Element ? e.target : null;
      const interactive = !!t?.closest(
        'a[href], button, [role="button"], input, select, textarea, label, #site-menu, [role="dialog"], [data-cursor-square]'
      );
      setPressable((v) => (v === interactive ? v : interactive));
      // [data-cursor="light"|"dark"] 영역: 배경 명암 판정을 무시하고 커서 색을 강제.
      //   (예: JOURNAL 페이지네이션 — 밝은 섹션인데 활성 페이지 버튼이 검은 솔리드라 커서가 흰색으로 오판정됨)
      const attr = t?.closest("[data-cursor]")?.getAttribute("data-cursor");
      const f = attr === "light" ? false : attr === "dark" ? true : null;
      setForceDark((v) => (v === f ? v : f));
      kick();
    };
    const hide = () => {
      wasVisible.current = false;
      setVisible(false);
    };
    // 창 밖으로 완전히 나가면 숨김(내부 요소 간 이동은 유지)
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) hide();
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

  const show = revealed && heroDone && visible; // 인트로·히어로 애니 끝난 뒤 등장(모달 중엔 표시)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={cursorRef}
          className={styles.cursor}
          data-dark={forceDark ?? dark}
          data-press={pressable}
          style={{ x, y }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: pressable ? 0.2 : 1 }} // 클릭 요소 위: 작은 사각형(≈21px)
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }} // 등장 살짝 더 부드럽게(0.26→0.42)
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
                  initial={{ scale: reduce ? 1 : 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: reduce ? 1 : 1.5, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // 텍스트 링 수축 더 부드럽게
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
