"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
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
const FULL_DEG = 42;
const FADE_BAND = 30;
// 드래그 플릭 관성 튜닝값
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

// ── SVG 워드마크 MOVIE — 좌하단 블럭 스택(viewBox 절대좌표) + 위에서 하나씩 낙하 ──────────────
// 실측/보정(inkAABB·measure·adj) 전부 제거. 각 글자의 최종 중심(x,y)·각도(rot)를 viewBox 좌표로 확정 →
// 화면 크기·폰트 여백과 무관하게 항상 같은 비율로 맞물림(겹침·틈은 viewBox 상에서 좌표로 확정).
// 글자는 <text>(Arial Black 900), 각 글자 중심을 (x,y)에 두고(text-anchor middle·dominant-baseline central)
// 그 점을 기준으로 회전. 낙하는 framer 가 transform(y/x/rotate)만 이동(착지=최종).
type Glyph = {
  ch: string;
  x: number; // 최종 중심 X(viewBox)
  y: number; // 최종 중심 Y(viewBox)
  rot: number; // 각도(°, +시계)
  size: number; // font-size(viewBox 단위)
  slideX?: number; // I: 낙하 연출 — 시작 가로 오프셋(최종 대비, 음수=왼쪽)
  landY?: number; // I: E 윗변 착지 지점 Y 오프셋(최종 대비, 음수=위)
};
const VB_W = 1000;
const VB_H = 720;
// 하단행(M·V·E)을 viewBox 바닥에 밀착·맞물림, O 는 M·V 골에 끼움, I 는 E 오른쪽 바닥. (각도 유지)
const GLYPHS: Glyph[] = [
  { ch: "M", x: 165, y: 520, rot: -6, size: 250 },
  { ch: "V", x: 350, y: 560, rot: 75, size: 250 },
  { ch: "E", x: 560, y: 545, rot: 65, size: 250 },
  { ch: "O", x: 300, y: 360, rot: -5, size: 240 },
  { ch: "I", x: 760, y: 535, rot: 32, size: 240, slideX: -150, landY: -230 },
];

const FALL_FROM = -1000; // viewBox 위쪽 화면 밖(완전히 안 보이는 값)
const STAGGER = 0.22;
const DELAY_CHILDREN = 0.12;
const FALL_EASE = [0.33, 0, 0.2, 1]; // 천천히 시작→가속→착지 감속
const FALL_DUR = 1.5;
const ROLL_SLIDE = 0.55; // I 가 E 경사로 굴러 내리는 마지막 구간(초)

const wordContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER, delayChildren: DELAY_CHILDREN } },
};
// 각 글자 <g> — 화면 밖 위 → 최종 위치로 낙하(착지=최종). framer 는 translate(y/x)만 애니메이트하고,
// 회전은 <text> 자체 transform(rotate about 중심)으로 고정 → SVG 회전 원점 문제 없이 제자리 회전.
// I 만 E 위 착지 후 오른쪽 아래로 굴러(translate x+y) 미끄러져 E 옆 바닥에 정착.
const letterVar: Variants = {
  hidden: (g: Glyph) => ({ y: FALL_FROM, x: g.slideX ?? 0 }),
  show: (g: Glyph) =>
    g.slideX !== undefined
      ? {
          // I: 화면 밖 → E 윗변 착지(landY) → E 경사로 굴러 오른쪽 아래로 미끄러져 정착(x·y 동시, 관성 감속).
          y: [FALL_FROM, g.landY ?? 0, 0],
          x: [g.slideX, g.slideX, 0],
          transition: {
            duration: FALL_DUR + ROLL_SLIDE,
            times: [0, FALL_DUR / (FALL_DUR + ROLL_SLIDE), 1],
            ease: [FALL_EASE, [0.22, 1, 0.36, 1]],
          },
        }
      : {
          // 일반(M·O·V·E): 화면 밖 → 최종 위치로 낙하(각도 고정, 착지=최종, 착지 후 흔들림 없음).
          y: 0,
          x: 0,
          transition: { duration: FALL_DUR, ease: FALL_EASE },
        },
};

function FilmWordmark({ revealed, reduce }: { revealed: boolean; reduce: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState(false);

  // 커서 좌표를 viewBox 좌표(--mx/--my)로 변환 → SVG mask 원이 커서를 따라다님
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (reduce) return;
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // preserveAspectRatio "xMinYMax meet" → 균일 스케일, 좌측·하단 정렬
    const scale = Math.min(r.width / VB_W, r.height / VB_H);
    const offX = 0; // xMin
    const offY = r.height - VB_H * scale; // YMax(하단 정렬)
    const vx = (e.clientX - r.left - offX) / scale;
    const vy = (e.clientY - r.top - offY) / scale;
    svg.style.setProperty("--mx", `${vx}px`);
    svg.style.setProperty("--my", `${vy}px`);
  };

  return (
    <svg
      ref={svgRef}
      className={styles.wordmark}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMinYMax meet"
      role="img"
      aria-label="MOVIE"
      data-hover={hover}
      onMouseEnter={() => !reduce && setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={onMove}
    >
      <defs>
        <mask id="fh-invert" maskUnits="userSpaceOnUse" x="0" y="0" width={VB_W} height={VB_H}>
          <circle className={styles.maskCircle} />
        </mask>
      </defs>

      {/* base 검정 글자 — 히어로 진입 시 위에서 하나씩 낙하(착지=최종). reduce 면 즉시 최종. */}
      <motion.g
        variants={wordContainer}
        initial={reduce ? false : "hidden"}
        animate={revealed || reduce ? "show" : "hidden"}
      >
        {GLYPHS.map((g) => (
          <motion.g key={g.ch} custom={g} variants={letterVar}>
            <text
              x={g.x}
              y={g.y}
              className={styles.glyph}
              fontSize={g.size}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${g.rot} ${g.x} ${g.y})`}
            >
              {g.ch}
            </text>
          </motion.g>
        ))}
      </motion.g>

      {/* invert 레이어 — 커서 원(mask) 안에서만: 검은 배경 + 흰 글자(색반전). 최종 위치 고정. reduce 면 미렌더 */}
      {!reduce && (
        <g mask="url(#fh-invert)" aria-hidden="true">
          <rect x="0" y="0" width={VB_W} height={VB_H} fill="#0b0b0c" />
          {GLYPHS.map((g) => (
            <text
              key={g.ch}
              x={g.x}
              y={g.y}
              className={styles.glyphInvert}
              fontSize={g.size}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${g.rot} ${g.x} ${g.y})`}
            >
              {g.ch}
            </text>
          ))}
        </g>
      )}
    </svg>
  );
}

export default function FlowHero() {
  const revealed = useIntroRevealed();
  const reduce = useReducedMotion();
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pausedRef = useRef(false);
  const rotRef = useRef(0);
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

      // 호버 정지: 관성이 남아있으면 무시하고 계속 굴림(플릭 우선)
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

      // 자동 회전 + 관성(감쇠) → velocity→0 이면 기존 자동 회전만 남아 자연 복귀
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
      {/* 대형 볼드 워드마크 MOVIE — SVG 좌하단 블럭 스택 낙하 + 호버 원형 색반전 */}
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
    </section>
  );
}
