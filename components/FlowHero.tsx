"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useIntroRevealed } from "./Intro";
import styles from "./FlowHero.module.css";

export type FlowCard = { label: string; caption: string; img: string };

const CARDS: FlowCard[] = [
  { label: "NOW SHOWING", caption: "여름의 잔상 · 2024", img: "/posters-photo/m1.jpg" },
  { label: "DIRECTOR", caption: "정하루 인터뷰", img: "/posters-photo/m5.jpg" },
  { label: "FESTIVAL", caption: "BUSAN 2024", img: "/posters-photo/m3.jpg" },
  { label: "SOUNDTRACK", caption: "O.S.T VOL.1", img: "/posters-photo/m7.jpg" },
  { label: "IP · REMAKE", caption: "북위 48도", img: "/posters-photo/m4.jpg" },
  { label: "ARCHIVE", caption: "필름의 끝 · 16mm", img: "/posters-photo/m2.jpg" },
];

// 원통형 덱: 5장 × 2바퀴 = 10장 → STEP 36° (간격 시원하게)
const DECK_CARDS = CARDS.slice(0, 5);
const DECK = [...DECK_CARDS, ...DECK_CARDS];
const CW = 212;
const CH = 300;
const COUNT = DECK.length;
const STEP = 360 / COUNT;
const RADIUS = Math.round((CW / 2 / Math.tan(Math.PI / COUNT)) * 1.075) + 20;
const SPEED = 7; // deg/sec
const FULL_DEG = 42; // ±이 범위 안은 opacity 1 (STEP=36 → 가운데+양옆 3장)
const FADE_BAND = 30; // 그 바깥에서 1→0 으로 페이드되는 폭(deg)
// 드래그 플릭 관성: 손으로 굴린 뒤 관성으로 감속하며 자동 회전으로 복귀시키는 튜닝값.
const DRAG_FACTOR = 0.3;
const MAX_V = 520;
const DECAY = 0.94;

function norm(a: number) {
  const m = ((a % 360) + 360) % 360;
  return m > 180 ? m - 360 : m;
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
function opacityAt(i: number, rot: number) {
  const dist = Math.abs(norm(i * STEP + rot));
  if (dist <= FULL_DEG) return 1;
  return clamp((FULL_DEG + FADE_BAND - dist) / FADE_BAND, 0, 1);
}

// 작업1·2: FILM 글자를 기하 SVG path 그대로 유지하되, 글자마다 개별 SVG(같은 좌표계 viewBox 크롭)로
// 쪼개 낙하(화면 밖 위→제자리)·기울기(rotate)를 개별 적용. viewBox 높이(150)를 통일해 스케일 일치.
// render(fill, pid): fill 색으로 그림(검정 base / 흰색 invert), pid 는 I 해칭 패턴 id 중복 방지.
type Glyph = {
  key: string;
  vb: string;
  rotate: number; // 작업2: 글자별 기울기(불규칙)
  dy: string; // 세로 흩뿌림(엎어진 듯)
  render: (fill: string, pid: string) => React.ReactNode;
};
const GLYPHS: Glyph[] = [
  {
    key: "F",
    vb: "-6 -11 80 150",
    rotate: -8,
    dy: "0.02em",
    render: (f) => (
      <path
        d="M0 32 A20 20 0 0 1 20 12 L66 12 L66 35 L26 35 L26 57 L54 57 L54 80 L26 80 L26 116 L0 116 Z"
        fill={f}
      />
    ),
  },
  {
    key: "I",
    vb: "88 -11 46 150",
    rotate: 10,
    dy: "0.14em",
    render: (f, pid) => (
      <>
        <defs>
          <pattern id={pid} width="8" height="24" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="3.6" height="24" fill={f} />
          </pattern>
        </defs>
        <rect x="96" y="12" width="30" height="104" fill={`url(#${pid})`} />
      </>
    ),
  },
  {
    key: "L",
    vb: "144 -11 84 150",
    rotate: -13,
    dy: "0.2em",
    render: (f) => <path d="M150 12 L176 12 L176 93 L220 93 L220 116 L150 116 Z" fill={f} />,
  },
  {
    key: "M",
    vb: "236 -11 166 150",
    rotate: 8,
    dy: "0em",
    render: (f) => (
      <path
        d="M256 116 L256 12 L318 86 L380 12 L380 116"
        fill="none"
        stroke={f}
        strokeWidth="26"
        strokeLinejoin="miter"
      />
    ),
  },
];

function FilmWordmark({ revealed, reduce }: { revealed: boolean; reduce: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [hover, setHover] = useState(false);

  // 작업4: 커서 좌표를 --mx/--my(워드마크 기준)로 추적 → 반전 원이 커서를 따라다님
  const onMove = (e: React.MouseEvent<HTMLHeadingElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <h1
      ref={ref}
      className={styles.bigword}
      aria-label="FILM"
      data-hover={hover}
      onMouseEnter={() => !reduce && setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={onMove}
    >
      {/* base: 밝은 배경 위 검정 글자. 각 글자 화면 밖(위)에서 시차를 두고 부드럽게 낙하 */}
      <span className={styles.wordLayer} aria-hidden="true">
        {GLYPHS.map((g, i) => (
          <span key={g.key} className={styles.letterStep} style={{ transform: `translateY(${g.dy})` }}>
            <motion.span
              className={styles.glyphMotion}
              initial={reduce ? false : { y: -820, opacity: 0, rotate: g.rotate }}
              animate={
                revealed || reduce
                  ? { y: 0, opacity: 1, rotate: g.rotate }
                  : { y: -820, opacity: 0, rotate: g.rotate }
              }
              transition={
                reduce ? { duration: 0 } : { delay: i * 0.13, duration: 1.0, ease: [0.16, 1, 0.3, 1] }
              }
            >
              <svg className={styles.glyph} viewBox={g.vb} aria-hidden="true">
                {g.render("#0b0b0c", `b${i}`)}
              </svg>
            </motion.span>
          </span>
        ))}
      </span>

      {/* invert: 커서 원(mask) 안에서만 보이는 반전 레이어 — 검은 배경 + 흰 글자. reduce 면 미렌더 */}
      {!reduce && (
        <span className={styles.wordInvert} aria-hidden="true">
          <span className={styles.invertBg} />
          <span className={styles.wordLayer}>
            {GLYPHS.map((g, i) => (
              <span key={g.key} className={styles.letterStep} style={{ transform: `translateY(${g.dy})` }}>
                <span className={styles.glyphMotion} style={{ transform: `rotate(${g.rotate}deg)` }}>
                  <svg className={styles.glyph} viewBox={g.vb} aria-hidden="true">
                    {g.render("#f8f8f8", `w${i}`)}
                  </svg>
                </span>
              </span>
            ))}
          </span>
        </span>
      )}
    </h1>
  );
}

export default function FlowHero() {
  const revealed = useIntroRevealed();
  const reduce = useReducedMotion();
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pausedRef = useRef(false);
  const rotRef = useRef(0);
  // 드래그 플릭 관성 상태
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const reduceRef = useRef(false);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;

    const applyOpacity = () => {
      for (let i = 0; i < COUNT; i++) {
        const card = cardRefs.current[i];
        if (card) card.style.opacity = String(opacityAt(i, rotRef.current));
      }
    };

    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceRef.current = r;
    if (r) {
      ring.style.transform = "rotateY(0deg)";
      applyOpacity();
      return;
    }

    let raf = 0;
    let last = 0;
    let pausedWritten = false;
    const frame = (t: number) => {
      if (!last) last = t;
      const dt = (t - last) / 1000;
      last = t;

      // 드래그 중 — 자동 회전/관성 없이 rotRef(손 입력)만 즉시 반영
      if (draggingRef.current) {
        ring.style.transform = `rotateY(${rotRef.current}deg)`;
        applyOpacity();
        pausedWritten = false;
        raf = requestAnimationFrame(frame);
        return;
      }

      // 호버 정지: 단, 관성이 남아있으면 무시하고 계속 굴림(플릭 우선)
      if (pausedRef.current && velocityRef.current === 0) {
        if (!pausedWritten) {
          ring.style.transform = `rotateY(${rotRef.current}deg)`;
          applyOpacity();
          pausedWritten = true;
        }
        raf = requestAnimationFrame(frame);
        return;
      }
      pausedWritten = false;

      // 자동 회전 + 관성(감쇠). velocity→0 이면 기존 자동 회전만 남아 자연 복귀.
      rotRef.current += (SPEED + velocityRef.current) * dt;
      velocityRef.current *= DECAY;
      if (Math.abs(velocityRef.current) < 0.05) velocityRef.current = 0;
      ring.style.transform = `rotateY(${rotRef.current}deg)`;
      applyOpacity();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    pausedRef.current = true;
    e.currentTarget.classList.add(styles.hovered);
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    pausedRef.current = false;
    e.currentTarget.classList.remove(styles.hovered);
  };

  // 드래그(플릭)로 원통 굴리기 — 마우스/터치 공통 pointer 이벤트
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceRef.current) return;
    draggingRef.current = true;
    velocityRef.current = 0;
    lastXRef.current = e.clientX;
    lastTRef.current = e.timeStamp;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    const dts = Math.max(1, e.timeStamp - lastTRef.current) / 1000;
    const dDeg = dx * DRAG_FACTOR;
    rotRef.current += dDeg;
    velocityRef.current = clamp(dDeg / dts, -MAX_V, MAX_V);
    lastXRef.current = e.clientX;
    lastTRef.current = e.timeStamp;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <section className={styles.stage} id="home" data-revealed={revealed}>
      {/* 대형 기하 워드마크 FILM — 좌측 낙하(화면 밖→제자리)·기울기 + 호버 원형 색반전 */}
      <FilmWordmark revealed={revealed} reduce={!!reduce} />

      {/* 원통형 3D 카드 덱(우측, 미잘림) — 바깥=고정 기울기, 안쪽=rAF rotateY */}
      <div
        className={styles.deck}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className={styles.deckTilt}>
          <div
            className={styles.deckRing}
            ref={ringRef}
            style={{ "--cw": `${CW}px`, "--ch": `${CH}px` } as React.CSSProperties}
          >
            {DECK.map((c, i) => (
              <div
                key={i}
                className={styles.cell}
                style={{ transform: `rotateY(${i * STEP}deg) translateZ(${RADIUS}px)` }}
              >
                <div className={styles.panel} aria-hidden="true" />
                <div
                  className={styles.card}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  style={{ opacity: opacityAt(i, 0) }}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                >
                  <div className={styles.card__media}>
                    <Image src={c.img} alt={c.caption} fill sizes="212px" priority={i < 6} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className={styles.tagline}>Film Nouvelle — One Reel In Infinite Flow</p>
    </section>
  );
}
