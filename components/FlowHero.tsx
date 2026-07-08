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
const DRAG_FACTOR = 0.3; // 드래그 1px → 회전 각도(deg). 클수록 손맛 빠름
const MAX_V = 520; // 관성 최대 속도(deg/s) 클램프 — 과한 스핀 방지
const DECAY = 0.94; // 관성 감쇠(프레임당). 1에 가까울수록 오래 굴러감

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

// 작업2·3: 대형 워드마크 FILM — 글자가 위에서 시차를 두고 떨어져 좌측에 계단식으로 쌓이고,
// 호버 시 커서 주변 원형 영역만 색반전(검은 배경 + 아웃라인 글자)되는 두 겹 레이어.
const LETTERS = ["F", "I", "L", "M"];
// 계단(아래로 한 단씩)·겹침(음수 marginLeft) — base/invert 레이어에 동일 적용해 정렬 일치
function stepStyle(i: number): React.CSSProperties {
  return { marginLeft: i === 0 ? 0 : "-0.08em", transform: `translateY(${i * 0.14}em)` };
}

function FilmWordmark({ revealed, reduce }: { revealed: boolean; reduce: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [hover, setHover] = useState(false);

  // 커서 좌표를 --mx/--my(워드마크 기준)로 추적 → 반전 원이 커서를 따라다님
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
      {/* base: 밝은 배경 위 솔리드 검정 글자 (글자별 낙하). reveal 후 시작, reduce 면 정적 */}
      <span className={styles.wordLayer} aria-hidden="true">
        {LETTERS.map((ch, i) => (
          <span key={i} className={styles.letterStep} style={stepStyle(i)}>
            <motion.span
              className={styles.letterSolid}
              initial={reduce ? false : { y: "-160%", opacity: 0 }}
              animate={revealed || reduce ? { y: 0, opacity: 1 } : { y: "-160%", opacity: 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { delay: i * 0.09, type: "spring", stiffness: 420, damping: 22 }
              }
            >
              {ch}
            </motion.span>
          </span>
        ))}
      </span>

      {/* invert: 커서 원(mask) 안에서만 보이는 반전 레이어(검은 배경 + 아웃라인 글자). reduce 면 미렌더 */}
      {!reduce && (
        <span className={styles.wordInvert} aria-hidden="true">
          <span className={styles.invertBg} />
          <span className={styles.wordLayer}>
            {LETTERS.map((ch, i) => (
              <span key={i} className={styles.letterStep} style={stepStyle(i)}>
                <span className={styles.letterOutline}>{ch}</span>
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
  // 드래그 플릭 관성 상태 — velocity(관성 속도) + 드래그 추적용 refs
  const velocityRef = useRef(0); // 관성 속도(deg/s). rAF 에서 감쇠하며 rotRef 에 더함
  const draggingRef = useRef(false); // 드래그 중 자동/관성 정지, rotRef 를 손으로 직접 갱신
  const lastXRef = useRef(0); // 직전 포인터 x
  const lastTRef = useRef(0); // 직전 포인터 timestamp(ms) — 속도 계산용
  const reduceRef = useRef(false); // reduce-motion 이면 드래그 관성 생략

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

    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    reduceRef.current = r;
    if (r) {
      ring.style.transform = "rotateY(0deg)";
      applyOpacity();
      return; // 정지 유지 — 드래그 관성도 핸들러에서 reduceRef 로 생략
    }

    let raf = 0;
    let last = 0;
    let pausedWritten = false;
    const frame = (t: number) => {
      if (!last) last = t;
      const dt = (t - last) / 1000;
      last = t; // dt 누적 점프 방지

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

      // 자동 회전(SPEED) + 관성(velocity, 매 프레임 감쇠). velocity→0 이면 기존 자동 회전만 남아
      // 자연스럽게 원래 속도로 복귀. 방향/기본 속도는 이전과 동일.
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

  // 카드 호버: 전체 회전 정지 + 그 카드만 확대
  const onEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    pausedRef.current = true;
    e.currentTarget.classList.add(styles.hovered);
  };
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    pausedRef.current = false;
    e.currentTarget.classList.remove(styles.hovered);
  };

  // 드래그(플릭)로 원통 굴리기 — 지구본처럼. 마우스/터치 공통 pointer 이벤트 사용.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceRef.current) return; // reduce-motion: 관성 생략(정지 유지)
    draggingRef.current = true;
    velocityRef.current = 0;
    lastXRef.current = e.clientX;
    lastTRef.current = e.timeStamp;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    const dts = Math.max(1, e.timeStamp - lastTRef.current) / 1000; // 초
    const dDeg = dx * DRAG_FACTOR;
    rotRef.current += dDeg; // 손으로 직접 회전
    velocityRef.current = clamp(dDeg / dts, -MAX_V, MAX_V); // 놓았을 때 넘겨줄 관성 속도(deg/s)
    lastXRef.current = e.clientX;
    lastTRef.current = e.timeStamp;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false; // velocityRef 유지 → rAF 관성으로 이어짐
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <section className={styles.stage} id="home" data-revealed={revealed}>
      {/* 대형 워드마크 FILM — 좌측 낙하 계단식 + 호버 원형 색반전 */}
      <FilmWordmark revealed={revealed} reduce={!!reduce} />

      {/* 원통형 3D 카드 덱(우측) — 바깥=고정 기울기, 안쪽=rAF rotateY.
          .deck 에 pointer 핸들러 → 드래그(플릭)로 굴리고 놓으면 관성. touch-action:none 은 CSS. */}
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
                  {/* 라벨/번호/캡션 제거 — 이미지가 카드 전체를 꽉 채움(여백 0) */}
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
