"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./FlowHero.module.css";

const NAV = ["HOME", "COMPANY", "BUSINESS", "ARTISTS", "PROJECTS", "NEWSROOM", "CONTACT"];

export type FlowCard = { label: string; caption: string; img: string };

const CARDS: FlowCard[] = [
  { label: "NOW SHOWING", caption: "여름의 잔상 · 2024", img: "/posters-photo/m1.jpg" },
  { label: "DIRECTOR", caption: "정하루 인터뷰", img: "/posters-photo/m5.jpg" },
  { label: "FESTIVAL", caption: "BUSAN 2024", img: "/posters-photo/m3.jpg" },
  { label: "SOUNDTRACK", caption: "O.S.T VOL.1", img: "/posters-photo/m7.jpg" },
  { label: "IP · REMAKE", caption: "북위 48도", img: "/posters-photo/m4.jpg" },
  { label: "ARCHIVE", caption: "필름의 끝 · 16mm", img: "/posters-photo/m2.jpg" },
];

// 원통형 덱: 카드 부족 시 곡면을 채우기 위해 두 바퀴
const DECK = [...CARDS, ...CARDS];
const CW = 212;
const CH = 300;
const COUNT = DECK.length;
const STEP = 360 / COUNT;
// 카드 간격(배수 1.075)은 유지하고, 고정 가산값으로 반지름만 키워 완만한 호
const RADIUS = Math.round((CW / 2 / Math.tan(Math.PI / COUNT)) * 1.075) + 60;
const SPEED = 7; // deg/sec (기존 ~52s/turn 과 유사)
const FRONT_DEG = 45; // 정면 판정 범위(±deg) — 좁힐수록 또렷한 카드 수 감소

// 각도를 -180~180 으로 정규화
function norm(a: number) {
  const m = ((a % 360) + 360) % 360;
  return m > 180 ? m - 360 : m;
}

export default function FlowHero() {
  const ringRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pausedRef = useRef(false);
  const rotRef = useRef(0);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;

    // 각 셀의 절대 각도(i*STEP + rot)로 정면 ±90° 판정 → .isFront 토글
    const applyFront = () => {
      for (let i = 0; i < COUNT; i++) {
        const cell = cellRefs.current[i];
        if (!cell) continue;
        const a = norm(i * STEP + rotRef.current);
        cell.classList.toggle(styles.isFront, Math.abs(a) <= FRONT_DEG);
      }
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // [5] reduced-motion: rAF 정지, 한 번만 배치
      ring.style.transform = "rotateY(0deg)";
      applyFront();
      return;
    }

    // [1] 회전을 requestAnimationFrame 으로 구동
    let raf = 0;
    let last = 0;
    let pausedWritten = false;
    const frame = (t: number) => {
      if (!last) last = t;
      const dt = (t - last) / 1000;
      last = t; // dt 누적 점프 방지 위해 항상 갱신
      if (pausedRef.current) {
        // [2] paused 동안 ring transform 을 매 프레임 재기록하지 않고 진입 시 1회만
        if (!pausedWritten) {
          ring.style.transform = `rotateY(${rotRef.current}deg)`;
          applyFront();
          pausedWritten = true;
        }
        raf = requestAnimationFrame(frame);
        return;
      }
      pausedWritten = false;
      rotRef.current += SPEED * dt; // rot 누적
      ring.style.transform = `rotateY(${rotRef.current}deg)`;
      applyFront();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // [4] 카드 호버: 전체 회전 정지 + 그 카드만 확대
  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    pausedRef.current = true;
    e.currentTarget.classList.add(styles.hovered);
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    pausedRef.current = false;
    e.currentTarget.classList.remove(styles.hovered);
  };

  return (
    <section className={styles.stage}>
      <header className={styles.nav}>
        <span className={styles.nav__brand}>FILMNOUVELLE</span>
        <nav className={styles.nav__links}>
          {NAV.map((l) => (
            <a key={l} href="#">
              {l}
            </a>
          ))}
        </nav>
      </header>

      <p className={styles.outline} aria-hidden="true">
        REEL
      </p>

      <h1 className={styles.bigword} aria-label="MOVIE">
        MOVIE
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

      <div className={styles.cubeWrap} aria-hidden="true">
        <div className={styles.cube}>
          <i /><i /><i /><i /><i /><i />
        </div>
      </div>

      {/* 원통형 3D 카드 덱 — 바깥=고정 기울기, 안쪽=rAF rotateY */}
      <div className={styles.deck}>
        <div className={styles.deckTilt}>
          <div
            className={styles.deckRing}
            ref={ringRef}
            style={{ "--cw": `${CW}px`, "--ch": `${CH}px` } as React.CSSProperties}
          >
            {DECK.map((c, i) => {
              const initFront = Math.abs(norm(i * STEP)) <= FRONT_DEG;
              return (
                <div
                  key={i}
                  ref={(el) => {
                    cellRefs.current[i] = el;
                  }}
                  className={`${styles.cell}${initFront ? " " + styles.isFront : ""}`}
                  style={{
                    transform: `rotateY(${i * STEP}deg) translateZ(${RADIUS}px)`,
                  }}
                >
                  <div className={styles.card} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                    {/* 정면 카드: 이미지 + 라벨/캡션 */}
                    <div className={styles.front}>
                      <div className={styles.card__head}>
                        <span className={styles.card__label}>{c.label}</span>
                        <span className={styles.card__no}>
                          {String((i % CARDS.length) + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div className={styles.card__media}>
                        <Image src={c.img} alt={c.caption} fill sizes="212px" priority={i < 6} />
                      </div>
                      <span className={styles.card__cap}>{c.caption}</span>
                    </div>
                    {/* 비정면 카드: 옅은 회색 빈 패널 */}
                    <div className={styles.panel} aria-hidden="true" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className={styles.tagline}>Film Nouvelle — One Reel In Infinite Flow</p>
    </section>
  );
}
