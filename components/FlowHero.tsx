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
  // I 전용 낙하 연출(최종 좌표 대비 오프셋, 실측으로 주입): E 윗변 착지 지점 landY(음수=위), 시작 가로 slideX(음수=왼쪽)
  landY?: number;
  slideX?: number;
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
  // 하단행 by 는 양수(바닥선보다 살짝 위)로 착지 → measure() 의 바닥 클램핑이 밑변을 바닥선에 정확히 안착.
  // (예전 음수 by 는 잉크 밑변이 .stage 바닥 밖으로 내려가 overflow:hidden 에 잘렸음 → 제거)
  { ch: "M", x: 0.0, by: 0.1, rotate: -6, stiffness: 56, damping: 15, origin: "50% 100%" }, // 하단 좌(살짝 기욺)
  { ch: "V", x: 1.0, by: 0.08, rotate: 75, stiffness: 52, damping: 16, roll: true }, // 하단 중, 오른쪽으로 75° 눕힘
  { ch: "E", x: 1.85, by: 0.25, rotate: 65, stiffness: 60, damping: 15, origin: "50% 100%" }, // 하단 우(65° 눕힘 → 잉크가 커 by 여유)
  // 상단행: O 는 M 위(아래변 맞닿게 — 보정량 최소화 위해 by 를 접촉 근처로 낮춤), I 는 E 위에 얹혀 미끄러짐.
  { ch: "O", x: 0.0, by: 0.72, rotate: -5, stiffness: 64, damping: 15 }, // 상단 좌(M·V 위에 끼임)
  { ch: "I", x: 1.55, by: 0.62, rotate: 32, stiffness: 70, damping: 14, roll: true, rollX: 40 }, // 32° 기운 채 E 위 착지 → 오른쪽 아래로 미끄러져 정착
];
// 작업2(낙하 시작): 화면 최상단 밖(완전히 안 보이는 값).
const FALL_FROM = -1400;
const STAGGER = 0.22;
const DELAY_CHILDREN = 0.12;

// 스크롤/공통 motion value 와 무관한 "마운트 1회 시간 기반" 낙하 — variants 컨테이너 stagger.
const wordContainer: Variants = {
  hidden: {},
  // 작업1: 배열 순서(=by 오름차순, 바닥 먼저)대로 stagger delay 부여.
  show: { transition: { staggerChildren: STAGGER, delayChildren: DELAY_CHILDREN } },
};
// 자식 글자 variant — custom(p)로 글자별 값 주입. opacity 없이 위치/회전만. 착지=최종(재보정 없음).
// left/bottom 은 낙하 전 실측으로 최종 확정 → 여기선 "화면 밖 → 최종 위치"로 transform(y/x/rotate)만 이동.
const FALL_EASE = [0.33, 0, 0.2, 1]; // 천천히 시작→가속→착지에서 부드럽게 감속(ease-in-out)
const FALL_DUR = 1.55;
const ROLL_SLIDE = 0.55; // I 가 E 경사로 굴러 내리는 마지막 구간(초)
const letterVar: Variants = {
  // roll 글자는 rotate 0 에서 시작. I 는 시작 가로(slideX)에서 출발해 굴러 오른쪽 아래로 정착.
  hidden: (p: Pos) => ({ y: FALL_FROM, x: p.slideX ?? 0, rotate: p.roll ? 0 : p.rotate }),
  show: (p: Pos) =>
    p.slideX !== undefined
      ? {
          // I: 화면 밖 → E 윗변 착지(landY) → E 경사에 균형 잃고 오른쪽 아래로 굴러 미끄러져 바닥 근처 정착(x·y·rotate 동시).
          y: [FALL_FROM, p.landY ?? 0, 0],
          x: [p.slideX, p.slideX, 0],
          rotate: [0, p.rotate * 0.9, p.rotate],
          transition: {
            duration: FALL_DUR + ROLL_SLIDE,
            times: [0, FALL_DUR / (FALL_DUR + ROLL_SLIDE), 1],
            ease: [FALL_EASE, [0.22, 1, 0.36, 1]], // 낙하 → 굴러 내림(관성 감속, 튕김 없음)
          },
        }
      : p.roll
        ? {
            // V: 낙하 후 최종 각도로 안착(아주 작은 오버슈트). 착지 후 위치 변경 없음.
            y: 0,
            rotate: [0, p.rotate * 1.02, p.rotate],
            transition: {
              y: { duration: FALL_DUR, ease: FALL_EASE },
              rotate: { duration: FALL_DUR, times: [0, 0.82, 1], ease: [FALL_EASE, [0.34, 1.02, 0.64, 1]] },
            },
          }
        : {
            // 일반(M·O·E): 화면 밖 → 최종 위치로 낙하(각도 고정, 착지=최종).
            y: 0,
            rotate: p.rotate,
            transition: { duration: FALL_DUR, ease: FALL_EASE },
          },
};

// ── 글리프 잉크(실제 먹칠) 경계 실측 ──────────────────────────────────────────
// getBoundingClientRect 는 line-height 박스(글자 위·아래 타이포 여백 포함)를 준다. 대문자는 하강부가
// 없어 박스 하단에 큰 여백이 남으므로, 박스끼리 붙여도 글자 사이엔 흰 마진이 생긴다(=상단행 공중부양).
// → canvas TextMetrics 의 actualBoundingBox* 로 "실제 먹칠"의 로컬 경계를 구하고, 요소의 실제 transform
//   행렬(회전 + rollX 병진)·transform-origin·레이아웃 위치를 적용해 화면상 잉크 AABB 를 계산한다.
type InkBox = { left: number; right: number; top: number; bottom: number };
let _inkCtx: CanvasRenderingContext2D | null = null;
function parseMatrix(s: string) {
  const id = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  if (!s || s === "none") return id;
  const m = s.match(/matrix(3d)?\(([^)]+)\)/);
  if (!m) return id;
  const v = m[2].split(",").map((n) => parseFloat(n));
  // matrix3d: 회전·병진 성분 위치가 다름(col-major 4x4)
  if (m[1]) return { a: v[0], b: v[1], c: v[4], d: v[5], e: v[12], f: v[13] };
  return { a: v[0], b: v[1], c: v[2], d: v[3], e: v[4], f: v[5] };
}
function inkAABB(el: HTMLElement, host: HTMLElement, hostRect: DOMRect): InkBox {
  const cs = getComputedStyle(el);
  const W = el.offsetWidth;
  const H = el.offsetHeight; // = 1em(line-height:1) — 모든 글자 동일
  // 로컬 박스 좌표(원점 좌상단, y 아래로)의 잉크 사각형. 실패 시 박스 전체로 폴백.
  let ix0 = 0,
    ix1 = W,
    iy0 = 0,
    iy1 = H;
  if (!_inkCtx) _inkCtx = document.createElement("canvas").getContext("2d");
  if (_inkCtx) {
    _inkCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    _inkCtx.textBaseline = "alphabetic";
    _inkCtx.textAlign = "left";
    const m = _inkCtx.measureText(el.textContent || "");
    if (
      typeof m.actualBoundingBoxAscent === "number" &&
      typeof m.actualBoundingBoxLeft === "number" &&
      typeof m.fontBoundingBoxAscent === "number"
    ) {
      // line-height:1 박스 상단 → 베이스라인 거리(모든 글자 동일 → 세로 접촉 차이엔 오차 상쇄)
      const halfLeading = (H - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      const baseY = halfLeading + m.fontBoundingBoxAscent;
      ix0 = -m.actualBoundingBoxLeft; // 펜 원점(박스 좌변=0) 기준 잉크 좌·우
      ix1 = m.actualBoundingBoxRight;
      iy0 = baseY - m.actualBoundingBoxAscent; // 잉크 위·아래
      iy1 = baseY + m.actualBoundingBoxDescent;
    }
  }
  // 레이아웃(비변형) 좌상단 화면 좌표 — offset 체인 합산 후 host(변형 없는 h1) 기준 앵커
  let ox = 0,
    oy = 0;
  let node: HTMLElement | null = el;
  while (node && node !== host) {
    ox += node.offsetLeft;
    oy += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  const ux = hostRect.left + ox;
  const uy = hostRect.top + oy;
  // 실제 transform 행렬·origin 적용(회전 + rollX 병진 포함) → 잉크 4모서리 화면 좌표 → AABB
  const to = cs.transformOrigin.split(" ").map((n) => parseFloat(n));
  const oX = to[0] || 0;
  const oY = to[1] || 0;
  const t = parseMatrix(cs.transform);
  const pts = [
    [ix0, iy0],
    [ix1, iy0],
    [ix1, iy1],
    [ix0, iy1],
  ].map(([x, y]) => {
    const dx = x - oX;
    const dy = y - oY;
    return [ux + oX + t.a * dx + t.c * dy + t.e, uy + oY + t.b * dx + t.d * dy + t.f];
  });
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

function FilmWordmark({ revealed, reduce }: { revealed: boolean; reduce: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [hover, setHover] = useState(false);
  // 낙하 전 실측으로 확정한 "최종 접촉 좌표"(px offset). 착지=최종 → 착지 후 재보정/미끄러짐 없음.
  const [adj, setAdj] = useState<Record<string, { dx: number; dy: number }>>(() => ({
    M: { dx: 0, dy: 0 },
    V: { dx: 0, dy: 0 },
    E: { dx: 0, dy: 0 },
    O: { dx: 0, dy: 0 },
    I: { dx: 0, dy: 0 },
  }));
  // I 낙하 연출 오프셋(최종 대비): E 윗변 착지 지점 landY, 시작 가로 slideX (실측으로 갱신)
  const [roll, setRoll] = useState<{ landY: number; slideX: number }>({ landY: -160, slideX: -60 });
  const baseRefs = useRef<Record<string, HTMLSpanElement | null>>({}); // 숨김 측정 레이어 span (실측용)

  // 커서 좌표를 --mx/--my(워드마크 기준)로 추적 → 반전 원이 커서를 따라다님
  const onMove = (e: React.MouseEvent<HTMLHeadingElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  // 낙하 전(및 리사이즈) 실측 — "숨김 측정 레이어"(y=0·최종 rotate, visibility:hidden)의 잉크 AABB 로
  // 최종 접촉 좌표를 계산. transform(낙하)과 분리된 정적 레이어라 낙하 잔여와 섞이지 않아 정확.
  //  · 바닥: M·V·E 잉크 최하단을 뷰포트 바닥선(innerHeight-PAD)에 밀착(공통 dyFloor). 공중부양·잘림 0.
  //  · 가로: M 앵커 → V.left=M.right, E.left=V.right (면끼리 맞닿음, 겹침 0).
  //  · O: M·V 골(접합부≈M.right)에 끼움 — 가로 중심 정렬 + 더 높은 윗변에 얹힘(두 면에 기댐, 겹침 0).
  //  · I: E 오른쪽 바닥 근처 정착(굴러 내림 최종점). landY/slideX 는 낙하 연출용 상대 오프셋.
  const measure = useCallback(() => {
    const b = baseRefs.current;
    const host = ref.current;
    if (!b.M || !b.V || !b.E || !b.O || !b.I || !host) return;
    const GAP = 1; // 맞닿되 겹침 0(최대 1px 여유)
    const FLOOR_PAD = 12;
    const hostRect = host.getBoundingClientRect();
    const rM = inkAABB(b.M, host, hostRect);
    const rV = inkAABB(b.V, host, hostRect);
    const rE = inkAABB(b.E, host, hostRect);
    const rO = inkAABB(b.O, host, hostRect);
    const rI = inkAABB(b.I, host, hostRect);

    const floorY = window.innerHeight - FLOOR_PAD;
    const dyFloor = Math.max(rM.bottom, rV.bottom, rE.bottom) - floorY;
    const ddxV = rM.right + GAP - rV.left;
    const ddxE = rV.right + ddxV + GAP - rE.left;
    // O — M·V 골에 끼움: 왼쪽면을 M 우측면에 붙이고(O.left=M.right) 아래변을 V 윗변에 얹힘(O.bottom=V.top).
    // M 은 크고(윗변 높음) V 는 낮으므로, O 를 낮은 V 윗변에 내려 앉히면 M 우측면·V 위에 동시에 기댄 "끼인" 형태.
    const ddxO = rM.right + GAP - rO.left;
    const ddyO = rO.bottom - (rV.top - dyFloor) + GAP;
    // I — E 오른쪽 바닥 근처: 가로 E.right 옆, 세로 바닥선
    const ddxI = rE.right + ddxE + GAP - rI.left;
    const ddyI = rI.bottom - floorY;
    // I 낙하 연출(최종 대비): E 윗변 착지 y 오프셋(음수=위), 시작 가로(E 중앙쯤=왼쪽, 음수)
    const landY = rE.top - dyFloor - floorY;
    const slideX = (rE.left + rE.right) / 2 - (rE.right + ddxE + GAP);

    setRoll((prev) =>
      Math.abs(prev.landY - landY) < 0.5 && Math.abs(prev.slideX - slideX) < 0.5 ? prev : { landY, slideX }
    );
    setAdj((prev) => {
      const next = {
        M: { dx: prev.M.dx, dy: prev.M.dy + dyFloor },
        V: { dx: prev.V.dx + ddxV, dy: prev.V.dy + dyFloor },
        E: { dx: prev.E.dx + ddxE, dy: prev.E.dy + dyFloor },
        O: { dx: prev.O.dx + ddxO, dy: prev.O.dy + ddyO },
        I: { dx: prev.I.dx + ddxI, dy: prev.I.dy + ddyI },
      };
      const keys = Object.keys(next) as (keyof typeof next)[];
      const converged = keys.every(
        (k) => Math.abs(next[k].dx - prev[k].dx) < 0.5 && Math.abs(next[k].dy - prev[k].dy) < 0.5,
      );
      return converged ? prev : next; // 수렴 시 재렌더 억제
    });
  }, []);

  // 마운트 후 실측 → adj 변화 시 다음 프레임 재측정(수렴 시 measure 가 prev 반환 → 자동 정지).
  // 숨김 레이어는 항상 y=0·최종 위치라 낙하 애니메이션과 무관하게 안정적으로 측정됨.
  useEffect(() => {
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [adj, measure]);

  // 리사이즈 재계산(clamp 폰트 변동) — 150ms 디바운스
  useEffect(() => {
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
  }, [measure]);

  // 최종 접촉 좌표를 left/bottom 에 얹음. 숨김/base/invert 동일 적용 → 낙하 착지 = 이 좌표(재보정 없음).
  const leftFor = (p: Pos) => `calc(${p.x}em + ${adj[p.ch].dx}px)`;
  const bottomFor = (p: Pos) => `calc(${p.by}em + ${adj[p.ch].dy}px)`;
  // 정지(최종) 시 transform 은 rotate 만 — 가로는 left(dx)로 확정(낙하 중 x 는 framer 가 slideX→0 으로 연출).
  const restTransform = (p: Pos) => `rotate(${p.rotate}deg)`;

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
      {/* 숨김 측정 레이어 — y=0·최종 rotate 로 항상 렌더(visibility:hidden). 낙하 전/리사이즈 실측 기준. */}
      <span className={styles.wordLayer} aria-hidden="true" style={{ visibility: "hidden" }}>
        {MOVIE.map((p, i) => (
          <span
            key={i}
            ref={(el) => {
              baseRefs.current[p.ch] = el;
            }}
            className={styles.letterPos}
            style={{
              left: leftFor(p),
              bottom: bottomFor(p),
              transformOrigin: p.origin,
              transform: restTransform(p),
            }}
          >
            {p.ch}
          </span>
        ))}
      </span>

      {/* base(보이는) 레이어 — reduce: 즉시 최종상태. 아니면 화면 밖 → 최종 좌표로 낙하(착지=최종, 재보정 없음). */}
      {reduce ? (
        <span className={styles.wordLayer} aria-hidden="true">
          {MOVIE.map((p, i) => (
            <span
              key={i}
              className={styles.letterPos}
              style={{
                left: leftFor(p),
                bottom: bottomFor(p),
                transformOrigin: p.origin,
                transform: restTransform(p),
              }}
            >
              {p.ch}
            </span>
          ))}
        </span>
      ) : (
        <motion.span
          className={styles.wordLayer}
          aria-hidden="true"
          variants={wordContainer}
          initial="hidden"
          animate={revealed ? "show" : "hidden"}
        >
          {MOVIE.map((p, i) => {
            // I 만 실측 낙하 연출(landY/slideX) 주입 — 나머지는 그대로.
            const cp = p.ch === "I" ? { ...p, landY: roll.landY, slideX: roll.slideX } : p;
            return (
              <motion.span
                key={i}
                className={styles.letterPos}
                style={{ left: leftFor(p), bottom: bottomFor(p), transformOrigin: p.origin }}
                custom={cp}
                variants={letterVar}
              >
                {p.ch}
              </motion.span>
            );
          })}
        </motion.span>
      )}

      {/* invert: 커서 원(mask) 안에서만 보이는 반전 레이어 — 검은 배경 + 흰 글자. 최종 좌표 동일. reduce 면 미렌더 */}
      {!reduce && (
        <span className={styles.wordInvert} aria-hidden="true">
          <span className={styles.invertBg} />
          <span className={styles.wordLayer}>
            {MOVIE.map((p, i) => (
              <span
                key={i}
                className={styles.letterPos}
                style={{
                  left: leftFor(p), // base 와 동일한 최종 좌표 → 반전 글자도 정확히 겹침
                  bottom: bottomFor(p),
                  transformOrigin: p.origin,
                  transform: restTransform(p),
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
