"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import Matter from "matter-js";
import decomp from "poly-decomp";
import { useIntroRevealed } from "./Intro";
import { GLYPH_DATA } from "./FlowHeroGlyphs";
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

// ── Matter.js 물리 워드마크 MOVIE ─────────────────────────────────────────────
// 실제 글리프 아웃라인(Liberation Sans Bold, Arial 메트릭 호환)을 다각형 바디로 만들어 위에서 떨어뜨리고
// 좌하단 바닥·좌우 벽에 부딪혀 쌓이며 기대게 함. 렌더는 매 틱 바디 position·angle 로 <path> transform 갱신.
// 좌표계: viewBox(=물리 월드) 단위. 글리프 데이터는 fontSize 1000(위쪽 음수) → SCALE 로 축소.
// viewBox = 물리 월드. 큰 글자(SCALE↑)가 좌하단을 시원하게 채우며 블럭처럼 쌓이게 함.
// 세로로 길게(VBH) 잡아 화면 최상단 밖(네비 위)에서부터 낙하 구간을 확보 → 처음엔 안 보이다 천천히 떨어짐.
const VBW = 1200;
const VBH = 1250; // 세로로 길게: 상단은 낙하 구간(화면 위 밖), 하단은 착지·쌓임 영역
const SCALE = 0.4; // 글리프(대문자 높이 ~688) → 월드 ~275. 과감하게 크게(단 쏟아져 쌓일 때 서로 엉킴 줄이려 약간 낮춤)
const FLOOR_Y = VBH - 105; // 바닥선. 기울어 쌓인 글자는 모서리가 더 내려오므로 여유를 둠(랜덤 회전에도 하단 잘림 방지)
// 좌·우 벽을 viewBox 안쪽으로 마진만큼 들여 세움 → 양 끝 글자가 바깥으로 넘어져도 벽에 막혀 잉크가 프레임 안에 남음.
const WALL_MARGIN = 90; // 벽~viewBox 가장자리 여유(잉크 오버행 흡수)
const LEFT_X = WALL_MARGIN; // 좌측 벽 안쪽면
const RIGHT_X = 880; // 우측 경계를 덱 왼쪽에 맞춰 안쪽으로 → 글자가 덱 뒤로 안 넘어가고 좌하단에 모여 쌓임
const ORDER = ["M", "O", "V", "I", "E"] as const; // 렌더(z)·글자 순서(MOVIE)
// 낙하 시작 위치(월드). y 아주 큰 음수 → 글자 전체가 화면 최상단(네비) 위 밖(처음엔 안 보임).
// x: 아래줄(M·O·V)은 좌→우로 나란히, 윗줄(I·E)은 그 위에 얹히게 → 2줄 블럭 스택. 초기 x 겹침 없이 벌림.
// 시작 위치: x 를 좌측 영역에 흩뿌리고 y 는 서로 살짝만 다르게(거의 같은 높이) → 거의 동시에 우르르 쏟아져
// 공중에서 서로 부딪히며 제각각 회전한 채 좌하단에 테트리스처럼 쌓임. 전부 화면 최상단(네비) 위 밖에서 시작.
const START: Record<string, { x: number; y: number }> = {
  M: { x: 250, y: -1120 },
  O: { x: 700, y: -1040 },
  V: { x: 400, y: -1260 },
  I: { x: 560, y: -1100 },
  E: { x: 850, y: -1190 },
};
// 투입(낙하) 순서 — 거의 동시(STAGGER 짧음). 순서 자체는 큰 의미 없음.
const DROP_ORDER = ["M", "O", "V", "E", "I"] as const;
const STAGGER_MS = 150; // 글자 사이 낙하 간격 — 짧게(거의 동시 낙하 → 우르르) 하되 과한 엉킴은 줄이게 약간
const FALL_DUR_GUESS = 26000; // 최대 시뮬 시간(ms) — 이후 프레임 고정
const MAX_SPEED = 90; // 바디 최대 속도 — 중력 자연 가속은 살리되 공중 충돌 시 과하게 튕겨 흩어지지 않게 적당히
const MAX_ANG = 1.0; // 바디 최대 각속도 — 크게 완화(자유로운 자연 회전 허용)

// 정지(=최종) 각 글자 transform 계산: 바디 중심(position)·회전(angle)에 맞춰 글리프 path 를 그림.
// path 는 글리프 단위 → translate(pos) rotate(angle) scale(SCALE) translate(-무게중심).
// 회전 중심(cx,cy)은 "바디의 면적 중심"과 반드시 같아야 함(기울여도 잉크가 바디에서 안 어긋남).
function bodyTransform(px: number, py: number, angleRad: number, cx: number, cy: number) {
  return `translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${((angleRad * 180) / Math.PI).toFixed(2)}) scale(${SCALE}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`;
}
// 낙하 전 초기 transform(시작 위치 = 화면 위 밖, 각도 0) → 첫 페인트에 큰 글자 안 튀게.
const initialTransform = (ch: string) => bodyTransform(START[ch].x, START[ch].y, 0, GLYPH_DATA[ch].c[0], GLYPH_DATA[ch].c[1]);

function FilmWordmark({ revealed, reduce }: { revealed: boolean; reduce: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const baseRefs = useRef<Record<string, SVGPathElement | null>>({});
  const invertRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [hover, setHover] = useState(false);

  // 커서 → viewBox 좌표(--mx/--my). 글자(획) 위에서만 호출됨(pointer-events:visiblePainted).
  const onMove = (e: React.MouseEvent<SVGPathElement>) => {
    if (reduce) return;
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const scale = Math.min(r.width / VBW, r.height / VBH);
    const offY = r.height - VBH * scale; // xMinYMax(하단 정렬)
    svg.style.setProperty("--mx", `${(e.clientX - r.left) / scale}px`);
    svg.style.setProperty("--my", `${(e.clientY - r.top - offY) / scale}px`);
  };

  useEffect(() => {
    if (!revealed && !reduce) return; // 히어로 진입(또는 reduce) 전엔 대기
    const svg = svgRef.current;
    if (!svg) return;

    Matter.Common.setDecomp(decomp); // 오목 글자(M·V·E) 볼록 분해
    // 충돌 해상도 상향(positionIterations 20·velocityIterations 16) → 서로 파고드는 관통 해소
    const engine = Matter.Engine.create({ positionIterations: 20, velocityIterations: 16 });
    engine.gravity.y = 0.8; // 살짝 낮춰 체공↑ → 부드럽게 가속(뚝뚝 아님)
    const world = engine.world;

    // 정적 경계: 바닥·좌·우 — 두껍게(터널링 방지). slop 낮춰 겹침 허용치 축소.
    const wall = { isStatic: true, friction: 0.9, restitution: 0, slop: 0.01 };
    Matter.Composite.add(world, [
      Matter.Bodies.rectangle(VBW / 2, FLOOR_Y + 400, VBW * 4, 800, wall), // 바닥(윗면 = FLOOR_Y)
      Matter.Bodies.rectangle(LEFT_X - 400, 0, 800, VBH * 10, wall), // 좌측 벽(우측면 = LEFT_X)
      Matter.Bodies.rectangle(RIGHT_X + 400, 0, 800, VBH * 10, wall), // 우측 경계(좌측면 = RIGHT_X)
    ]);

    // 글자 바디(실제 아웃라인) — 낙하 중 튐 최소화(restitution 낮게), 마찰로 안착 안정화
    const bodies: Record<string, Matter.Body> = {};
    const cRender: Record<string, [number, number]> = {}; // 글자별 면적 중심(글리프 좌표) = 바디 회전 중심
    for (const ch of ORDER) {
      const g = GLYPH_DATA[ch];
      // 파트(볼록 조각)들의 면적 가중 중심을 직접 계산 → 이 점을 회전 중심으로 삼아야 기울여도 잉크가 바디와 정확히 겹침.
      let aSum = 0;
      let cxSum = 0;
      let cySum = 0;
      for (const part of g.parts) {
        let a = 0;
        let cx = 0;
        let cy = 0;
        for (let i = 0; i < part.length; i++) {
          const [x0, y0] = part[i];
          const [x1, y1] = part[(i + 1) % part.length];
          const cr = x0 * y1 - x1 * y0;
          a += cr;
          cx += (x0 + x1) * cr;
          cy += (y0 + y1) * cr;
        }
        a *= 0.5;
        if (Math.abs(a) < 1e-6) continue;
        const w = Math.abs(a);
        aSum += w;
        cxSum += (cx / (6 * a)) * w;
        cySum += (cy / (6 * a)) * w;
      }
      const cx0 = aSum ? cxSum / aSum : g.c[0];
      const cy0 = aSum ? cySum / aSum : g.c[1];
      cRender[ch] = [cx0, cy0];
      // 면적 중심 기준으로 아주 살짝(1.012배≈2~3단위) 팽창(중심 보존) → 잉크끼리 안 겹치고 렌더 정렬 유지.
      const DILATE = 1.012;
      const partSets = g.parts.map((part) =>
        part.map(([x, y]) => ({ x: (cx0 + (x - cx0) * DILATE) * SCALE, y: (cy0 + (y - cy0) * DILATE) * SCALE })),
      );
      const body = Matter.Bodies.fromVertices(
        START[ch].x,
        START[ch].y,
        partSets,
        // restitution 0.1(툭 얹히는 아주 약한 바운스), frictionStatic 0.8(딱딱한 정지 완화),
        // frictionAir 0.012(공기 저항 → 낙하에 미세 감속감, 부드러움)
        { restitution: 0.08, friction: 0.9, frictionStatic: 1.1, frictionAir: 0.012, density: 0.001 },
        false,
      );
      // slop 을 낮게(0.01) — 잉크끼리 파고드는 겹침을 시각적으로 안 보일 만큼 축소. 복합 바디는 parts 에도 적용.
      body.slop = 0.01;
      body.parts.forEach((p) => (p.slop = 0.01));
      // 제각각 기울어 쏟아지게: 랜덤 초기 각도(±0.35rad≈±20°, 과하지 않게 → 서로 심하게 안 엉킴) + 약한 랜덤 각속도.
      // 회전은 잠그지 않음(자유 회전 → 기울어진 채 걸려 멈춤).
      Matter.Body.setAngle(body, (Math.random() - 0.5) * 0.7);
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
      bodies[ch] = body;
    }

    const render = () => {
      for (const ch of ORDER) {
        const b = bodies[ch];
        const c = cRender[ch];
        const t = bodyTransform(b.position.x, b.position.y, b.angle, c[0], c[1]);
        baseRefs.current[ch]?.setAttribute("transform", t);
        invertRefs.current[ch]?.setAttribute("transform", t);
      }
    };
    // 매 스텝 속도 클램프 — 빠른 바디의 터널링/폭발 방지(안정적 안착)
    const clampVel = () => {
      for (const ch of ORDER) {
        const b = bodies[ch];
        if (b.speed > MAX_SPEED) {
          const k = MAX_SPEED / b.speed;
          Matter.Body.setVelocity(b, { x: b.velocity.x * k, y: b.velocity.y * k });
        }
        if (b.angularSpeed > MAX_ANG) Matter.Body.setAngularVelocity(b, Math.sign(b.angularVelocity) * MAX_ANG);
      }
    };

    let raf = 0;
    const timeouts: number[] = [];
    let addedCount = 0;
    let still = 0;
    let startT = 0;

    if (reduce) {
      // 애니메이션 없이 즉시 최종 배치. 애니와 동일하게 거의 동시 투입 → 제각각 기울어 쌓인 상태로 안정화.
      for (const ch of ORDER) Matter.Composite.add(world, bodies[ch]);
      for (let i = 0; i < 1800; i++) {
        Matter.Engine.update(engine, 1000 / 60);
        clampVel();
      }
      render();
    } else {
      // stagger 로 하나씩 월드에 투입(=하나씩 낙하). DROP_ORDER(왼→오) 순서로 왼쪽 글자에 기대며 안착.
      DROP_ORDER.forEach((ch, i) => {
        timeouts.push(
          window.setTimeout(() => {
            Matter.Composite.add(world, bodies[ch]);
            addedCount++;
          }, i * STAGGER_MS),
        );
      });
      // 실제 경과시간 기반 고정 스텝(accumulator) → 프레임 드롭에도 물리는 일정 속도(부드러움, 안정성 유지).
      const STEP = 1000 / 60;
      let acc = 0;
      let lastT = 0;
      const loop = (t: number) => {
        if (!startT) startT = t;
        if (!lastT) lastT = t;
        let frame = t - lastT;
        lastT = t;
        if (frame > 100) frame = 100; // 탭 비활성 후 폭주 방지(clamp)
        acc += frame;
        let steps = 0;
        while (acc >= STEP && steps < 5) {
          Matter.Engine.update(engine, STEP);
          clampVel();
          acc -= STEP;
          steps++;
        }
        render();
        // 전부 투입 후 정지(sleeping 근사)면 멈춰 최종 프레임 고정(미세 진동 방지)
        if (addedCount >= ORDER.length) {
          let maxV = 0;
          for (const ch of ORDER) {
            const b = bodies[ch];
            maxV = Math.max(maxV, b.speed, b.angularSpeed * 30);
          }
          still = maxV < 0.4 ? still + 1 : 0;
        }
        if ((addedCount >= ORDER.length && still > 45) || t - startT > FALL_DUR_GUESS) {
          render();
          return; // 프레임 고정(정지)
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      timeouts.forEach((id) => clearTimeout(id));
      Matter.Engine.clear(engine);
    };
  }, [revealed, reduce]);

  return (
    <svg
      ref={svgRef}
      className={styles.wordmark}
      viewBox={`0 0 ${VBW} ${VBH}`}
      preserveAspectRatio="xMinYMax meet"
      role="img"
      aria-label="MOVIE"
      data-hover={hover}
    >
      <defs>
        <mask id="fh-invert" maskUnits="userSpaceOnUse" x="0" y="0" width={VBW} height={VBH}>
          <circle className={styles.maskCircle} />
        </mask>
      </defs>

      {/* base 검정 글자 — 물리 바디에 동기화(transform 은 rAF 가 imperative 갱신). 호버는 획 위에서만. */}
      <g>
        {ORDER.map((ch) => (
          <path
            key={ch}
            ref={(el) => {
              baseRefs.current[ch] = el;
            }}
            className={styles.glyph}
            d={GLYPH_DATA[ch].d}
            transform={initialTransform(ch)}
            onMouseEnter={() => !reduce && setHover(true)}
            onMouseLeave={() => setHover(false)}
            onMouseMove={onMove}
          />
        ))}
      </g>

      {/* invert 레이어 — 커서 원(mask) 안에서만: 검은 배경 + 흰 글자. base 와 동일 transform.
          reduce 면 호버 자체가 비활성(r=0 유지)이라 안 보임 → SSR 일치 위해 항상 렌더(하이드레이션 안전). */}
      <g mask="url(#fh-invert)" aria-hidden="true" style={{ pointerEvents: "none" }}>
        <rect x="0" y="0" width={VBW} height={VBH} fill="#0b0b0c" />
        {ORDER.map((ch) => (
          <path
            key={ch}
            ref={(el) => {
              invertRefs.current[ch] = el;
            }}
            className={styles.glyphInvert}
            d={GLYPH_DATA[ch].d}
            transform={initialTransform(ch)}
          />
        ))}
      </g>
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
      {/* 대형 워드마크 MOVIE — Matter.js 물리 낙하·쌓임 + 호버 원형 색반전 */}
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
