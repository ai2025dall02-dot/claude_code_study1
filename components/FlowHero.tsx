"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useIntroRevealed } from "./Intro";
import styles from "./FlowHero.module.css";

export type FlowCard = { label: string; caption: string; img: string };

// 필름 릴 구멍 좌표 (viewBox 100×100, 중심 50,50 / 반지름 27 / 6개)
const REEL_HOLES: [number, number][] = [0, 60, 120, 180, 240, 300].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return [50 + 27 * Math.cos(a), 50 + 27 * Math.sin(a)];
});

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

function norm(a: number) {
  const m = ((a % 360) + 360) % 360;
  return m > 180 ? m - 360 : m;
}
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
// 평탄 구간(±FULL_DEG=1) + 가장자리 FADE_BAND 에서 선형 페이드
function opacityAt(i: number, rot: number) {
  const dist = Math.abs(norm(i * STEP + rot));
  if (dist <= FULL_DEG) return 1;
  return clamp((FULL_DEG + FADE_BAND - dist) / FADE_BAND, 0, 1);
}

export default function FlowHero() {
  const revealed = useIntroRevealed();
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pausedRef = useRef(false);
  const rotRef = useRef(0);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;

    // 매 프레임 각 셀의 .card opacity 를 각도 기반으로 갱신 (display 토글 없음)
    const applyOpacity = () => {
      for (let i = 0; i < COUNT; i++) {
        const card = cardRefs.current[i];
        if (card) card.style.opacity = String(opacityAt(i, rotRef.current));
      }
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
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
      last = t; // dt 누적 점프 방지
      if (pausedRef.current) {
        // paused 동안 ring transform/opacity 를 매 프레임 재기록하지 않고 진입 시 1회만
        if (!pausedWritten) {
          ring.style.transform = `rotateY(${rotRef.current}deg)`;
          applyOpacity();
          pausedWritten = true;
        }
        raf = requestAnimationFrame(frame);
        return;
      }
      pausedWritten = false;
      rotRef.current += SPEED * dt;
      ring.style.transform = `rotateY(${rotRef.current}deg)`;
      applyOpacity();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // 카드 호버: 전체 회전 정지 + 그 카드만 확대
  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    pausedRef.current = true;
    e.currentTarget.classList.add(styles.hovered);
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    pausedRef.current = false;
    e.currentTarget.classList.remove(styles.hovered);
  };

  return (
    <section className={styles.stage} id="home" data-revealed={revealed}>
      <p className={styles.outline} aria-hidden="true">
        REEL
      </p>

      {/* 줄무늬 디졸브 대형 글자 — mask-composite(브라우저 호환 취약) 대신
          단일 마스크 2겹을 겹쳐(합집합) 왼쪽 솔리드 + 오른쪽 줄무늬 디졸브 */}
      <h1 className={styles.bigword} aria-label="MOVIE">
        <span className={styles.bigword__left} aria-hidden="true">
          MOVIE
        </span>
        <span className={styles.bigword__stripes} aria-hidden="true">
          MOVIE
        </span>
      </h1>

      <svg className={styles.ringText} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <path id="flowCirc" d="M50,50 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
        </defs>
        <text>
          <textPath href="#flowCirc" startOffset="0">
            FILM NOUVELLE ✦ ONE REEL IN INFINITE FLOW ✦
          </textPath>
        </text>
      </svg>

      {/* 회전하는 영화 필름 릴 */}
      <div className={styles.reelWrap} aria-hidden="true">
        <svg className={styles.reel} viewBox="0 0 100 100">
          <defs>
            <radialGradient id="reelFace" cx="38%" cy="32%" r="80%">
              <stop offset="0%" stopColor="#3a3a42" />
              <stop offset="100%" stopColor="#0b0b0d" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="47" fill="url(#reelFace)" stroke="rgba(0,0,0,0.55)" strokeWidth="1" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
          {REEL_HOLES.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="8.4" fill="#f6f6f4" stroke="rgba(0,0,0,0.5)" strokeWidth="0.8" />
          ))}
          <circle cx="50" cy="50" r="9.5" fill="#16161a" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="50" cy="50" r="3.2" fill="#f6f6f4" />
        </svg>
      </div>

      {/* 원통형 3D 카드 덱 — 바깥=고정 기울기, 안쪽=rAF rotateY */}
      <div className={styles.deck}>
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
                {/* 항상 깔리는 빈 패널 */}
                <div className={styles.panel} aria-hidden="true" />
                {/* 그 위에서 각도 기반 opacity 로 페이드되는 카드 */}
                <div
                  className={styles.card}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  style={{ opacity: opacityAt(i, 0) }}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                >
                  <div className={styles.front}>
                    <div className={styles.card__head}>
                      <span className={styles.card__label}>{c.label}</span>
                      <span className={styles.card__no}>
                        {String((i % DECK_CARDS.length) + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className={styles.card__media}>
                      <Image src={c.img} alt={c.caption} fill sizes="212px" priority={i < 6} />
                    </div>
                    <span className={styles.card__cap}>{c.caption}</span>
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
