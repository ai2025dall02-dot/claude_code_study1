"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { useIntroRevealed } from "./Intro";
import styles from "./FlowHero.module.css";

// 세로로 길쭉한 디스플레이 폰트 Anton(단일 weight 400) — jasminegunarto.com/첨부 HTML 무드.
// 빌드 시 Google Fonts 다운로드가 불안정한 환경이라 woff2 를 self-host(app/fonts) 후 next/font/local 로 로드.
const anton = localFont({
  src: "../app/fonts/anton-latin.woff2",
  weight: "400",
  display: "swap",
});

export type FlowCard = { label: string; caption: string; img: string };

const CARDS: FlowCard[] = [
  { label: "NOW SHOWING", caption: "여름의 잔상 · 2024", img: "/posters-photo/lineup_1.jpg" },
  { label: "DIRECTOR", caption: "북위 48도 · Léa Marchand", img: "/posters-photo/lineup_2.jpg" },
  { label: "FESTIVAL", caption: "조용한 망명 · BUSAN 2024", img: "/posters-photo/lineup_3.jpg" },
  { label: "SOUNDTRACK", caption: "소금사막 · O.S.T", img: "/posters-photo/lineup_4.jpg" },
  { label: "NOW SHOWING", caption: "겨울 손님 · 2025", img: "/posters-photo/lineup_5.jpg" },
  { label: "ARCHIVE", caption: "필름의 끝 · 16mm", img: "/posters-photo/lineup_6.jpg" },
];

// ── 원통형 카드 덱(형태·각도·회전·드래그 유지) ─────────────────────────────
// 5장 × 2바퀴 = 10장 → STEP 36° (간격 시원하게)
const DECK_CARDS = CARDS.slice(0, 5);
const DECK = [...DECK_CARDS, ...DECK_CARDS];
const CW = 230; // 카드 폭
const CH = 324; // 카드 높이
const COUNT = DECK.length;
const STEP = 360 / COUNT;
const RADIUS = Math.round((CW / 2 / Math.tan(Math.PI / COUNT)) * 1.075) + 20; // CW 비례 반경
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

// ── GSAP 글자 워드마크 "FILMNOUVELLE" (jasminegunarto.com 무드) ──────────────
// 커튼 웨이브 방식:
//  1) 인트로 — 카운트다운 종료 후, 화면 중앙에서 글자들이 좌→우로 "샥" 훑고 왜곡됐다 원위치 복귀(왕복)한 뒤
//     타이틀이 중앙 상단으로 이동.
//  2) 호버 — 글자에 커서를 올리면 그 인접 영역 글자만 동일한 커튼 웨이브를 1회 재생(상시 추적 아님).
// prefers-reduced-motion 이면 웨이브·호버 모두 비활성(중앙 상단 고정).
const TITLE = "FILMNOUVELLE";
// 인트로·호버가 공유하는 왜곡 파라미터/이징 — 좌→우 stagger 로 왜곡했다가 yoyo 로 원위치 복귀.
const WAVE = {
  scaleY: 2.0, // 세로 늘림 정점
  skewX: -20, // 기울임 정점(deg)
  yPercent: -34, // 위로 밀림 정점
  each: 0.045, // 글자 간 stagger 간격(좌→우 전파 속도)
  dur: 0.42, // 한 글자 편도 시간(yoyo 라 왕복 = 2×)
  ease: "power2.inOut",
};
const HOVER_SPAN = 2; // 호버한 글자 기준 좌우로 포함할 글자 수(=인접 영역 폭)

function FilmWordmark({ revealed, reduce }: { revealed: boolean; reduce: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const letters = letterRefs.current.filter(Boolean);
    if (!wrap || letters.length === 0) return;

    // 최종 배치: 화면 중앙 상단(네비 아래 충분한 여백). 인트로: 화면 세로 중앙.
    const topY = () => Math.round(clamp(window.innerHeight * 0.11, 88, 150)); // 네비를 안 가리는 top 여백
    const centerY = () => Math.round(window.innerHeight / 2 - wrap.offsetHeight / 2);

    // reduce: 애니메이션·인터랙션 모두 없이 중앙 상단 고정 (가로 중앙은 CSS text-align)
    if (reduce) {
      gsap.set(wrap, { y: topY() });
      gsap.set(letters, { clearProps: "transform" });
      return;
    }
    // 인트로 시작 타이밍 — 카운트다운 종료(revealed) 흐름과 연결
    if (!revealed) return;

    // 인트로는 화면 세로 중앙에서 시작 (가로 중앙은 CSS text-align)
    gsap.set(wrap, { y: centerY() });
    gsap.set(letters, { transformOrigin: "50% 50%", scaleY: 1, skewX: 0, yPercent: 0, opacity: 1 });

    let introDone = false;

    // 공유 커튼 웨이브 — 주어진 글자들을 좌→우 stagger 로 왜곡(WAVE)했다가 yoyo 로 정확히 원위치 복귀.
    // fromTo 의 from(=rest)으로 시작을 고정 → 중간에 겹쳐 호출돼도 항상 rest 로 되돌아옴. 반환 tween 으로 onComplete 훅 가능.
    const playWave = (els: HTMLSpanElement[]) =>
      gsap.fromTo(
        els,
        { scaleY: 1, skewX: 0, yPercent: 0 },
        {
          scaleY: WAVE.scaleY,
          skewX: WAVE.skewX,
          yPercent: WAVE.yPercent,
          duration: WAVE.dur,
          ease: WAVE.ease,
          stagger: { each: WAVE.each, from: "start" }, // 좌→우 순차 전파
          yoyo: true,
          repeat: 1, // 갔다가(왜곡) 되돌아옴(복귀)
        },
      );

    // 1) 인트로 — 전체 커튼 웨이브(좌→우, 왕복) → 완료 후 중앙 상단으로 이동 → 호버 활성
    gsap.from(wrap, { autoAlpha: 0, duration: 0.3, ease: "power1.out" }); // 부드러운 등장
    const intro = playWave(letters);
    intro.eventCallback("onComplete", () => {
      gsap.to(wrap, {
        y: topY(),
        duration: 1.0,
        ease: "power3.inOut",
        onComplete: () => {
          introDone = true;
        },
      });
    });

    // 2) 호버 — 커서를 올린 글자 인접 영역만 동일 웨이브 1회 재생(상시 추적 아님).
    // playing: 현재 웨이브가 진행 중인 글자 인덱스. 영역이 겹치면 중복 재생 방지.
    const playing = new Set<number>();
    const onEnter = (i: number) => {
      if (!introDone) return;
      const lo = Math.max(0, i - HOVER_SPAN);
      const hi = Math.min(letters.length - 1, i + HOVER_SPAN);
      const idxs: number[] = [];
      for (let k = lo; k <= hi; k++) idxs.push(k);
      if (idxs.some((k) => playing.has(k))) return; // 재생 중이면 무시(중복 방지)
      idxs.forEach((k) => playing.add(k));
      const t = playWave(idxs.map((k) => letters[k])); // 영역 왼쪽 끝부터 좌→우 전파
      t.eventCallback("onComplete", () => idxs.forEach((k) => playing.delete(k)));
    };
    const handlers = letters.map((l, i) => {
      const h = () => onEnter(i);
      l.addEventListener("mouseenter", h);
      return h;
    });

    const onResize = () => {
      if (introDone) gsap.set(wrap, { y: topY() }); // 상단 위치 유지
    };
    window.addEventListener("resize", onResize);

    return () => {
      intro.kill();
      gsap.killTweensOf(letters);
      gsap.killTweensOf(wrap);
      letters.forEach((l, i) => l.removeEventListener("mouseenter", handlers[i]));
      window.removeEventListener("resize", onResize);
      gsap.set(letters, { clearProps: "all" });
    };
  }, [revealed, reduce]);

  return (
    <div className={styles.titleWrap} ref={wrapRef}>
      <h1 className={`${styles.title} ${anton.className}`} aria-label={TITLE}>
        {TITLE.split("").map((ch, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) letterRefs.current[i] = el;
            }}
            className={styles.letter}
            aria-hidden="true"
          >
            {ch}
          </span>
        ))}
      </h1>
    </div>
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
      {/* 중앙 워드마크 FILMNOUVELLE — GSAP 글자 인트로 + 커서 인터랙션 (덱보다 뒤 z축) */}
      <FilmWordmark revealed={revealed} reduce={!!reduce} />

      {/* 원통형 3D 카드 덱(중앙 겹침) — 바깥=고정 기울기, 안쪽=rAF rotateY */}
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
