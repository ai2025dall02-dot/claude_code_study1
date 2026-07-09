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
// viewBox = 물리 월드. 5글자가 "겹침 없이 다 보이게" — 세로로 쌓아 넘어지지 않게, 가로로 넓은 한 줄에
// 좌→우로 나란히 떨어뜨려 서로 살짝 기대며 안착시킴(스택→토플→겹침 방지). 총 글자폭이 다 담기게 넓게.
const VBW = 1140; // 5글자가 서로 맞닿아 한 줄로 설 수 있는 실제 폭(≈915)+마진. 좁으면 강제로 겹쳐 불안정 → 넉넉히.
const VBH = 560;
const SCALE = 0.3; // 글리프(대문자 높이 ~688) → 월드 ~206. 한 줄에 5글자 다 들어가게 축소
const FLOOR_Y = VBH - 95; // 바닥선. 아래 95 여유 = 잉크가 충돌 헐(hull)보다 살짝 내려오는 만큼(하단 잘림 방지)
// 좌·우 벽을 viewBox 안쪽으로 마진만큼 들여 세움 → 양 끝 글자가 바깥으로 넘어져도 벽에 막혀 잉크가 프레임 안에 남음.
const WALL_MARGIN = 100; // 벽~viewBox 가장자리 여유(잉크 오버행 흡수 — 기울어진 E·M 도 안 잘리게 넉넉히)
const LEFT_X = WALL_MARGIN; // 좌측 벽 안쪽면
const RIGHT_X = VBW - WALL_MARGIN; // 우측 경계 안쪽면
const ORDER = ["M", "O", "V", "I", "E"] as const; // 렌더(z)·글자 순서(MOVIE)
// 낙하 위치(월드). x = 최종 열 중심을 인접 글자와 "맞닿게" 촘촘히 배치 → 서로 기대 지지(뾰족한 V 도 안 넘어짐).
// 좌→우 순서로 떨궈(DROP_ORDER=ORDER) 왼쪽 글자에 차례로 기댐. y 음수 → viewBox 위 밖(overflow:hidden 로 클립).
const START: Record<string, { x: number; y: number }> = {
  M: { x: 230, y: -140 },
  O: { x: 452, y: -150 },
  V: { x: 661, y: -160 },
  I: { x: 797, y: -150 },
  E: { x: 921, y: -170 },
};
// 투입(낙하) 순서 = 읽는 순서(왼→오). 각 글자가 이미 안착한 왼쪽 글자에 기대며 안착(뾰족한 V·얇은 I 도 이웃 지지로 섬).
const DROP_ORDER = ["M", "O", "V", "I", "E"] as const;
// 낙하 전 미리 부여할 고정 기울기(rad, 음수=왼쪽으로 기욺). 무작위 X → 결정론적.
// 각 글자를 살짝 왼쪽으로 기운 채(≈-5°) 촘촘히 떨궈, 낙하 후 왼쪽 이웃에 곧바로 걸려 그 각도로 안착(뾰족한 V 도 안 넘어짐).
const TILT: Record<string, number> = { M: -0.05, O: -0.05, V: -0.16, I: 0, E: -0.05 };
const STAGGER_MS = 700; // 글자 사이 낙하 간격 — 앞 글자 완전 안착 후 다음이 옆에 기대게
const FALL_DUR_GUESS = 14000; // 최대 시뮬 시간(ms) — 이후 프레임 고정
const MAX_SPEED = 18; // 바디 최대 속도 — 낮춰서 착지 충격·튐·미끄러짐 최소화(제자리 안착)
const MAX_ANG = 0.3; // 바디 최대 각속도

// 정지(=최종) 각 글자 transform 계산: 바디 중심(position)·회전(angle)에 맞춰 글리프 path 를 그림.
// path 는 글리프 단위 → translate(pos) rotate(angle) scale(SCALE) translate(-무게중심).
function bodyTransform(px: number, py: number, angleRad: number, ch: string) {
  const c = GLYPH_DATA[ch].c;
  return `translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${((angleRad * 180) / Math.PI).toFixed(2)}) scale(${SCALE}) translate(${-c[0]} ${-c[1]})`;
}
// 낙하 전 초기 transform(시작 위치 = 화면 위 밖) → 첫 페인트에 큰 글자 안 튀게.
const initialTransform = (ch: string) => bodyTransform(START[ch].x, START[ch].y, 0, ch);

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
    engine.gravity.y = 1;
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
    for (const ch of ORDER) {
      const g = GLYPH_DATA[ch];
      // 사전 분해된 볼록 조각들을 vertexSets 로 → 복합 바디(모두 볼록이라 안정적으로 충돌)
      const partSets = g.parts.map((part) => part.map(([x, y]) => ({ x: x * SCALE, y: y * SCALE })));
      const body = Matter.Bodies.fromVertices(
        START[ch].x,
        START[ch].y,
        partSets,
        { restitution: 0, friction: 0.95, frictionStatic: 1, density: 0.001 },
        false,
      );
      // slop 을 낮게(0.01) — 잉크끼리 파고드는 겹침을 시각적으로 안 보일 만큼 축소. 복합 바디는 parts 에도 적용.
      body.slop = 0.01;
      body.parts.forEach((p) => (p.slop = 0.01));
      Matter.Body.setAngle(body, TILT[ch]); // 미리 살짝 기울여 낙하 → 이웃에 걸려 그 각도로 안착(결정론적·안정)
      Matter.Body.setAngularVelocity(body, 0);
      bodies[ch] = body;
    }

    const render = () => {
      for (const ch of ORDER) {
        const b = bodies[ch];
        const t = bodyTransform(b.position.x, b.position.y, b.angle, ch);
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
      // 물리 없이 즉시 최종: 전부 넣고(약간 x 흩뿌려) 빠르게 안정화 후 1회 렌더
      for (const ch of ORDER) Matter.Composite.add(world, bodies[ch]);
      for (let i = 0; i < 1200; i++) {
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
      const loop = (t: number) => {
        if (!startT) startT = t;
        Matter.Engine.update(engine, 1000 / 60);
        clampVel();
        render();
        // 전부 투입 후 정지(sleeping 근사)면 멈춰 최종 프레임 고정(미세 진동 방지)
        if (addedCount >= ORDER.length) {
          let maxV = 0;
          for (const ch of ORDER) {
            const b = bodies[ch];
            maxV = Math.max(maxV, b.speed, b.angularSpeed * 30);
          }
          still = maxV < 0.35 ? still + 1 : 0;
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
