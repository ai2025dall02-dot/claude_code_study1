"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

// MOVIE(M·O·V·I·E) 를 좌측 하단에 겹친 클러스터로 절대 배치(순서 무관). x/y 는 em, rotate 제각각.
// stiffness/damping 을 글자마다 다르게 → "각자 다른 속도"로 낙하. wobble=마지막에 기우뚱(overshoot).
type Pos = {
  ch: string;
  x: number; // 좌측 위치(em)
  by: number; // 하단 위치(em). 바닥행은 음수로 글자 밑변(회전 후 최하단)을 뷰포트 바닥에 딱 맞춤
  rotate: number;
  stiffness: number;
  damping: number;
  roll?: boolean; // 착지 후 균형 잃고 한쪽 모서리로 넘어지며 구르는 글자
  rollX?: number; // 구르는 방향 가로 이동(px)
  origin?: string; // 넘어지는 회전축(글자 아래 모서리)
};
// 작업1·2: 좌측 하단에 자연스럽게 쌓인 더미 — 바닥행(M·I·E, by≈0)과 그 위 얹힌(O·V) 을 x/y·rotate
// 불규칙하게. 겹치진 않되(세로 gap) 리듬감. 작업3: 마지막에 떨어지는 I·E 가 착지 후 넘어지며 구름.
// 작업1·2: 겹치지 않게 여백 두고 2단 블록 배치. 바닥행(M·I·E, by≈0 → 지면에 딱, M x=0 → 좌측 끝에 딱)
// + 위층(O·V, 세로 gap 넉넉). 회전해도 바운딩 안 겹치도록 글자 사이 간격 확보.
// 작업1: 배열 순서 = 낙하 순서(staggerChildren 이 배열 순서로 delay 부여). 최종 위치가 아래(by 작은)인
// 바닥행(M·I·E) 을 먼저, 위에 얹히는(by 큰) O·V 를 뒤에 두어 "아래부터 깔리고 위가 나중에" 순으로 낙하.
// 글자는 x/by 로 절대 배치되므로 배열/DOM 순서는 위치에 영향 없음(형태 유지).
// 목표 배치(이미지1): 하단행 M(살짝기욺)·V(크게 뒤집힘)·E(정방향), 상단행 O(정방향)·I(오른쪽으로 크게 눕듯).
// 배열 순서 = 낙하 순서라 하단(M·V·E) 먼저, 상단(O·I) 나중. 하단행은 밑변/꼭짓점(origin 바닥)으로 바닥 접촉.
const MOVIE: Pos[] = [
  // 하단행(M·V·E): 바닥 접촉(by 음수, origin 바닥) + 글자 폭(M≈.83·V≈.72·E≈.63em)만큼 x 를 좁혀 변끼리 맞닿게.
  { ch: "M", x: 0.0, by: -0.08, rotate: -6, stiffness: 56, damping: 15, origin: "50% 100%" }, // 하단 좌(살짝 기욺)
  { ch: "V", x: 1.0, by: -0.17, rotate: 90, stiffness: 52, damping: 16, roll: true }, // 하단 중, 왼쪽으로 90° 눕힘(회전축 중심 → by 로 바닥 접촉)
  { ch: "E", x: 1.85, by: -0.08, rotate: 2, stiffness: 60, damping: 15, origin: "50% 100%" }, // 하단 우(정방향)
  // 상단행: O 는 M 위(아래변 맞닿게), I 는 오른쪽으로 크게 눕혀 V·E 위에 얹혀 O 우측에 바짝.
  { ch: "O", x: 0.0, by: 0.96, rotate: -2, stiffness: 64, damping: 15 }, // 상단 좌(M 위, 정방향)
  { ch: "I", x: 1.55, by: 0.7, rotate: 78, stiffness: 70, damping: 14, roll: true, rollX: 40 }, // 눕힌 채 E 위 착지 → 오른쪽 미끄러져 정착
];
// 작업2(낙하 시작): 화면 최상단 밖(완전히 안 보이는 값).
const FALL_FROM = -1400;

// 스크롤/공통 motion value 와 무관한 "마운트 1회 시간 기반" 낙하 — variants 컨테이너 stagger.
const wordContainer: Variants = {
  hidden: {},
  // 작업1: 배열 순서(=by 오름차순, 바닥 먼저)대로 stagger delay 부여.
  show: { transition: { staggerChildren: 0.22, delayChildren: 0.12 } },
};
// 자식 글자 variant — custom(p)로 글자별 값 주입. opacity 없이 y(+rotate)만으로 낙하.
// 작업3: roll 글자는 2단계(낙하 → 착지 후 데굴 구르며 x 이동·rotate 마저 돌아 정착) 키프레임.
const FALL_EASE = [0.33, 0, 0.2, 1]; // 천천히 시작→가속→착지에서 부드럽게 감속(ease-in-out)
const FALL_DUR = 1.55;
const letterVar: Variants = {
  // roll 글자는 rotate 0 에서 낙하하며 최종값 근처까지 돌고, 착지 직전 살짝 오버슈트 후 정착
  hidden: (p: Pos) => ({ y: FALL_FROM, rotate: p.roll ? 0 : p.rotate }),
  show: (p: Pos) =>
    p.roll
      ? {
          // 낙하하며 rotate 최종값(×1.06 오버슈트)으로 정착. rollX 있으면(I) 착지 후 x 로 옆으로 미끄러져 정착.
          y: 0,
          x: p.rollX ?? 0,
          rotate: [0, p.rotate * 1.06, p.rotate],
          transition: {
            y: { duration: FALL_DUR, ease: FALL_EASE },
            x: { delay: FALL_DUR - 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }, // 착지 후 미끄러짐(ease-out, 튕김 없음)
            rotate: {
              duration: FALL_DUR,
              times: [0, 0.82, 1],
              ease: [FALL_EASE, [0.34, 1.2, 0.64, 1]], // 낙하 회전(부드럽게) → 오버슈트 되돌림(과하지 않게)
            },
          },
        }
      : {
          // 일반(M·O·E): 단일 ease-in-out 낙하(rotate 소폭이라 낙하와 함께 고정).
          y: 0,
          rotate: p.rotate,
          transition: { duration: FALL_DUR, ease: FALL_EASE },
        },
};

function FilmWordmark({ revealed, reduce }: { revealed: boolean; reduce: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [hover, setHover] = useState(false);
  // 실측 보정값(px): 글자별 가로(dx)·세로(dy). clamp 폰트 + 글리프 여백 오차 때문에 정적 em 추정이
  // 계속 어긋나므로(상단행 뜸), 낙하 완료 후 실제 AABB(getBoundingClientRect)로 마진 0 접촉을 결정.
  const [adj, setAdj] = useState<Record<string, { dx: number; dy: number }>>(() => ({
    M: { dx: 0, dy: 0 },
    V: { dx: 0, dy: 0 },
    E: { dx: 0, dy: 0 },
    O: { dx: 0, dy: 0 },
    I: { dx: 0, dy: 0 },
  }));
  const [ready, setReady] = useState(false); // 낙하 완료(또는 reduce) → 실측 시작 신호
  const baseRefs = useRef<Record<string, HTMLSpanElement | null>>({}); // 글자별 base span (측정용)

  // 커서 좌표를 --mx/--my(워드마크 기준)로 추적 → 반전 원이 커서를 따라다님
  const onMove = (e: React.MouseEvent<HTMLHeadingElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  // 실측 마진 0 접촉(정적 em 추정 금지). 낙하 완료 후 모든 글자의 실제 AABB 로:
  //  · 가로(하단행 M·V·E): M 을 앵커로 V.left=M.right, E.left=V.right 가 되게 dx 보정(변끼리 맞닿음).
  //  · 세로(상단행 O·I): O.bottom=M.top, I.bottom=E.top 가 되게 dy 보정(아래 글자 위에 얹힘).
  // 회전 글자(V·I)는 AABB 기준. left/bottom(px)→화면 px 1:1(스케일 조상 없음)이라 단일 패스로 정확.
  // 보정은 transform(framer 낙하) 과 충돌 없게 left/bottom(CSS)에 얹음. GAP=1px(마진 0 목표·겹침 방지).
  const measure = useCallback(() => {
    const b = baseRefs.current;
    if (!b.M || !b.V || !b.E || !b.O || !b.I) return;
    const GAP = 1;
    const rM = b.M.getBoundingClientRect();
    const rV = b.V.getBoundingClientRect();
    const rE = b.E.getBoundingClientRect();
    const rO = b.O.getBoundingClientRect();
    const rI = b.I.getBoundingClientRect();

    // 가로 접촉(하단행) — M 고정 → 오른쪽으로 순차 밀착. E 는 V 이동분(ddxV) 반영한 예측 right 사용.
    const ddxV = rM.right + GAP - rV.left;
    const ddxE = rV.right + ddxV + GAP - rE.left;
    // 세로 접촉(상단행) — 아래 글자 윗변에 GAP 만 두고 얹힘. bottom(css)↑ = 화면 위로 이동.
    const ddyO = rO.bottom - rM.top + GAP;
    const ddyI = rI.bottom - rE.top + GAP;

    setAdj((prev) => {
      // 수렴(리사이즈 후 잔차 <0.5px) 시 재렌더 억제
      if (
        Math.abs(ddxV) < 0.5 &&
        Math.abs(ddxE) < 0.5 &&
        Math.abs(ddyO) < 0.5 &&
        Math.abs(ddyI) < 0.5
      ) {
        return prev;
      }
      return {
        M: prev.M,
        V: { dx: prev.V.dx + ddxV, dy: 0 },
        E: { dx: prev.E.dx + ddxE, dy: 0 },
        O: { dx: 0, dy: prev.O.dy + ddyO },
        I: { dx: 0, dy: prev.I.dy + ddyI },
      };
    });
  }, []);

  // 낙하 완료 신호(ready): reduce 면 즉시, 아니면 onAnimationComplete + 폴백 타이머(마지막 글자 안착).
  useEffect(() => {
    if (reduce) {
      setReady(true);
      return;
    }
    if (!revealed) return;
    const t = setTimeout(() => setReady(true), (FALL_DUR + 1.3) * 1000); // onAnimationComplete 폴백
    return () => clearTimeout(t);
  }, [reduce, revealed]);

  // ready 후 1회 실측(analytic 접촉 보정 → 단일 패스로 정확). left/bottom transition 으로 부드럽게 안착.
  useEffect(() => {
    if (!ready) return;
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [ready, measure]);

  // 리사이즈 재계산(clamp 폰트 크기 변동) — 150ms 디바운스. 잔차만 보정(단일 패스).
  useEffect(() => {
    if (!ready) return;
    let t = 0;
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(measure, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, [ready, measure]);

  // 실측 보정(dx/dy)을 left/bottom 에 얹음. base/invert 동일 적용 → 반전 글자도 정확히 겹침.
  const leftFor = (p: Pos) => `calc(${p.x}em + ${adj[p.ch].dx}px)`;
  const bottomFor = (p: Pos) => `calc(${p.by}em + ${adj[p.ch].dy}px)`;
  // reduce: 애니메이션 없이 즉시 1회 적용. 아니면 접촉 보정을 0.35s 로 부드럽게 안착.
  const settle = reduce
    ? "none"
    : "left 0.35s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.35s cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <h1
      ref={ref}
      className={styles.bigword}
      aria-label="MOVIE"
      data-hover={hover}
      onMouseEnter={() => !reduce && setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={onMove}
    >
      {/* base: 검정 글자. 히어로 진입(revealed) 시 variants 컨테이너가 글자들을 하나씩 순차 낙하.
          낙하 완료(onAnimationComplete) → 실측 마진 0 접촉 보정. reduce 면 initial=false 로 즉시 최종. */}
      <motion.span
        className={styles.wordLayer}
        aria-hidden="true"
        variants={wordContainer}
        initial={reduce ? false : "hidden"}
        animate={revealed || reduce ? "show" : "hidden"}
        onAnimationComplete={() => (revealed || reduce) && setReady(true)}
      >
        {MOVIE.map((p, i) => (
          <motion.span
            key={i}
            ref={(el) => {
              baseRefs.current[p.ch] = el;
            }}
            className={styles.letterPos}
            // 보정 dx/dy 는 left/bottom(CSS)에 얹어 낙하(transform y/rotate)와 충돌 없이 부드럽게 안착.
            style={{
              left: leftFor(p),
              bottom: bottomFor(p),
              transformOrigin: p.origin,
              transition: settle,
            }}
            custom={p}
            variants={letterVar}
          >
            {p.ch}
          </motion.span>
        ))}
      </motion.span>

      {/* invert: 커서 원(mask) 안에서만 보이는 반전 레이어 — 검은 배경 + 흰 글자. base 와 동일 보정. reduce 면 미렌더 */}
      {!reduce && (
        <span className={styles.wordInvert} aria-hidden="true">
          <span className={styles.invertBg} />
          <span className={styles.wordLayer}>
            {MOVIE.map((p, i) => (
              <span
                key={i}
                className={styles.letterPos}
                style={{
                  left: leftFor(p), // base 와 동일한 dx/dy 보정 → 반전 글자도 정확히 겹침
                  bottom: bottomFor(p),
                  transformOrigin: p.origin,
                  transform: `translateX(${p.rollX ?? 0}px) rotate(${p.rotate}deg)`,
                  transition: settle,
                }}
              >
                {p.ch}
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
      {/* 대형 볼드 워드마크 FILM — 좌측 하단 낙하(화면 밖→제자리)·누움 + 호버 원형 색반전 */}
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
