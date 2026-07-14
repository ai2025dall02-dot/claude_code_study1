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

// ── GSAP 글자 워드마크 "FILMNOUVELLE" ────────────────────────────────────────
// 첨부 hero-letters-interactive.html 방식:
//  1) 인트로 — 각 글자를 랜덤 yPercent·scaleY·skewX·opacity 0 에서 제자리로 한 번 모임(power4.out, from:"random").
//  2) 상시 인터랙션 — 인트로 완료 후 커서와 각 글자 거리로 yPercent·scaleY 를 실시간으로 밀어냄(quickTo).
// 커서가 벗어나면 원위치. prefers-reduced-motion 이면 인트로·인터랙션 모두 비활성(제자리 고정).
const TITLE = "FILMNOUVELLE";
// 커서 인터랙션 — 근처 글자가 세로로 크게 늘어나고(SKALEY) 기울며(SKEW) 밀려남(PUSH).
const HIT_RADIUS = 230; // 커서 영향 반경(px) — 넓게
const PUSH = 90; // 최대 yPercent 밀어냄
const STRETCH = 1.9; // 최대 scaleY 추가 늘림(세로로 확실히 늘어남)
const SKEW = 26; // 최대 skewX(deg) — 커서 좌우 위치에 따라 기울어짐(찌그러짐)

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
    gsap.set(letters, { transformOrigin: "50% 50%" });

    let introDone = false;
    let centers: { x: number; y: number }[] = [];
    // 인터랙션 거리 기준 = 글자가 최종 위치(중앙 상단)에 안착한 뒤의 화면상 중심을 캐시.
    // (밀어낸 transform 은 캐시에 반영 안 함 → 피드백 없이 안정적)
    const measure = () => {
      centers = letters.map((l) => {
        const r = l.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };

    // 1) 인트로 — 랜덤에서 제자리로 모임 → 완료 후 [3] 중앙 상단으로 이동 → 그다음 인터랙션 활성
    const intro = gsap.from(letters, {
      yPercent: () => gsap.utils.random(-280, 280),
      scaleY: () => gsap.utils.random(0.2, 2.6),
      skewX: () => gsap.utils.random(-50, 50),
      opacity: 0,
      duration: 1.5,
      ease: "power4.out",
      stagger: { each: 0.055, from: "random" },
      onComplete: () => {
        gsap.to(wrap, {
          y: topY(),
          duration: 1.1,
          ease: "power3.inOut",
          onComplete: () => {
            introDone = true;
            measure(); // 상단 안착 후 측정(이동으로 위치가 바뀌므로)
          },
        });
      },
    });

    // 2) 상시 인터랙션 — quickTo 로 yPercent·scaleY·skewX 실시간 반영(세로 늘림 + 기울임 왜곡)
    const yTo = letters.map((l) => gsap.quickTo(l, "yPercent", { duration: 0.5, ease: "power3" }));
    const sTo = letters.map((l) => gsap.quickTo(l, "scaleY", { duration: 0.5, ease: "power3" }));
    const kTo = letters.map((l) => gsap.quickTo(l, "skewX", { duration: 0.5, ease: "power3" }));

    const onMove = (e: PointerEvent) => {
      if (!introDone) return;
      for (let i = 0; i < letters.length; i++) {
        const c = centers[i];
        const dx = c.x - e.clientX;
        const dy = c.y - e.clientY;
        const dist = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - dist / HIT_RADIUS); // 가까울수록 1
        yTo[i]((dy / dist) * f * PUSH); // 커서 반대 방향으로 밀어냄
        sTo[i](1 + f * STRETCH); // 가까울수록 세로로 크게 늘어남
        kTo[i](-(dx / dist) * f * SKEW); // 커서 좌우 위치에 따라 기울어짐(찌그러짐)
      }
    };
    const reset = () => {
      for (let i = 0; i < letters.length; i++) {
        yTo[i](0);
        sTo[i](1);
        kTo[i](0);
      }
    };
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) reset(); // 뷰포트를 벗어날 때 원위치
    };
    const onResize = () => {
      measure();
      if (introDone) gsap.set(wrap, { y: topY() }); // 상단 위치 유지
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", onResize);
    window.addEventListener("blur", reset);
    document.addEventListener("pointerout", onLeave);

    return () => {
      intro.kill();
      gsap.killTweensOf(letters);
      gsap.killTweensOf(wrap);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("blur", reset);
      document.removeEventListener("pointerout", onLeave);
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
