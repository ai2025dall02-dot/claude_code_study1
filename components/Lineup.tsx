"use client";

// LINEUP — audition.smtown.com "ARTIST MESSAGE" 무드로 전면 교체.
//  A. 섹션 진입 시 "LINE UP" 텍스트가 화면 중앙에 크게 → 스크롤하면 좌측 하단 코너로 축소·이동(흰→회색).
//  B. 카드 이미지가 우→좌로 느리게 자동으로 흐르는 가로 슬라이드(마퀴) + 마우스/터치 드래그로 좌우 이동.
//     (기존 3열 세로 masonry / 세로 패럴랙스 구조는 제거)
//  C. 섹션 배경 검정 / 텍스트 흰→회색. D. 카드 클릭 시 상세 모달(바텀시트)은 그대로 유지.
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { films, type Film } from "@/data/films";
import LineupModal from "./LineupModal";
import styles from "./Landing.module.css";

/* 라인업 작품에 사진 포스터 매핑 (public/posters-photo). 12편이 각각 고유 이미지 사용. */
const FILM_PHOTO: Record<string, string> = {
  afterimage: "/posters-photo/lineup_1.jpg",
  north: "/posters-photo/lineup_2.jpg",
  exile: "/posters-photo/lineup_3.jpg",
  salt: "/posters-photo/lineup_4.jpg",
  winter: "/posters-photo/lineup_5.jpg",
  reel: "/posters-photo/lineup_6.jpg",
  tide: "/posters-photo/lineup_7.jpg",
  orchard: "/posters-photo/lineup_8.jpg",
  static: "/posters-photo/lineup_9.jpg",
  dust: "/posters-photo/lineup_10.jpg",
  meridian: "/posters-photo/lineup_11.jpg",
  ember: "/posters-photo/lineup_12.jpg",
};

const ITEMS = films;

// [B] 진입 시 텍스트 확대 배율(안착 크기 대비) — "살짝만" 크게. 안착 크기를 히어로급으로 키운
//   만큼 배율은 낮춰(1.6→1.2) 진입 시 화면 밖으로 넘치지 않게 균형. 데스크톱 1.2× / 모바일 1.15×.
const BIG_SCALE_DESKTOP = 1.2;
const BIG_SCALE_MOBILE = 1.15;
// [B] 텍스트가 좌상단(큰) → 좌하단(살짝 작게) 이동을 마치는 진행도. 이후 구간은 슬라이드 감상 체류.
const MOVE_END = 0.42;
// [B] 자동 슬라이드 속도(px/초). 느리게.
const AUTO_SPEED = 24;

// railX 를 한 세트 주기(period) 안으로 정규화 → (-period, 0]. 자동/드래그 모두 끊김 없이 순환.
function norm(v: number, period: number) {
  if (!period) return v;
  let n = v % period;
  if (n > 0) n -= period;
  return n;
}

export default function Lineup() {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<Film | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null); // 세로로 긴 스크롤 트랙(진행도 측정)
  const titleRef = useRef<HTMLHeadingElement | null>(null); // 텍스트 크기/위치 측정용

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // ── [A] 텍스트 진입/코너 이동 ─────────────────────────────────────
  const { scrollYProgress: p } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const bigScale = isMobile ? BIG_SCALE_MOBILE : BIG_SCALE_DESKTOP;

  // [B] 좌하단(안착) 대비 좌상단(진입)까지의 translate 량 실측.
  //  .lineupHeading 은 CSS 로 좌측 하단(left/bottom)에 앵커, <h2> 는 transform-origin: left bottom.
  //  scale=1·translate 0 → 좌하단 안착. scale=bigScale·translateY(위로) → 좌상단에 살짝 크게.
  //  좌우는 항상 좌측 정렬(txBig=0)이라 세로로만 top↔bottom 이동한다.
  const [big, setBig] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const measure = () => {
      const el = titleRef.current; // <h2> 만 확대·이동(eyebrow 는 좌하단 고정)
      const container = el?.offsetParent as HTMLElement | null; // .lineupHeading (absolute)
      const stage = container?.offsetParent as HTMLElement | null; // .lineupStage (sticky)
      if (!el || !container || !stage) return;
      const h0 = el.offsetHeight; // 레이아웃 높이(transform 영향 없음, 미확대 기준)
      const stageH = stage.clientHeight;
      // 무대 기준 <h2> 좌상단 y(= 컨테이너 오프셋 + h2 오프셋) → 안착 시 하단(restBottom)
      const yInStage = el.offsetTop + container.offsetTop;
      const restBottom = yInStage + h0;
      // 진입 시 상단 여백(무대 높이 비례, 상한/하한). 여기에 확대된 텍스트 상단을 맞춤.
      // [A] 진입 시 상단 여백을 줄여 LINE UP 을 살짝 위로(0.13→0.09, 하한 72→50).
      const topPad = Math.max(50, Math.round(stageH * 0.09));
      // origin: left bottom → 확대 텍스트 하단 = restBottom + tyBig, 상단 = topPad 가 되도록:
      //   topPad + h0*bigScale = restBottom + tyBig  →  tyBig = topPad + h0*bigScale - restBottom (음수=위로)
      setBig({ x: 0, y: topPad + h0 * bigScale - restBottom });
    };
    measure();
    window.addEventListener("resize", measure);
    const raf = requestAnimationFrame(measure);
    // 폰트(Anton) 로딩 후 폭이 바뀌면 재측정
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [bigScale, isMobile]);

  const tx = useTransform(p, [0, MOVE_END], [big.x, 0]);
  const ty = useTransform(p, [0, MOVE_END], [big.y, 0]);
  const scale = useTransform(p, [0, MOVE_END], [bigScale, 1]);
  // [C] 진입 흰색 → 코너 안착 시 회색으로 전환. [B] 안착 회색을 더 어둡게(#8f8f8b → #5a5a57)
  //   → 위에 겹치는 카드/영화 제목 텍스트가 LINE UP 위에서도 잘 읽히게.
  const titleColor = useTransform(p, [0.12, 0.34], ["#f4f4f2", "#5a5a57"]);
  // eyebrow 는 코너에 텍스트가 거의 안착할 즈음 페이드 인(진입 시 대형 텍스트만 보이게)
  const eyebrowOpacity = useTransform(p, [0.3, 0.44], [0, 1]);
  const titleStyle = reduce
    ? undefined
    : { x: tx, y: ty, scale, color: titleColor, transformOrigin: "left bottom" as const };

  // ── [B] 슬라이드가 텍스트 이동과 함께 서서히 등장 ─────────────────
  const railOpacity = useTransform(p, [0.16, MOVE_END], [0, 1]);
  const railShift = useTransform(p, [0.16, MOVE_END], [50, 0]);

  // 리스트(레일)가 실제로 드러나기 전엔 카드가 인터랙티브하지 않게(투명 카드가 hover/click 안 되게) →
  //   PlayCursor 가 리스트 등장 전에 "작은 사각형"으로 바뀌는 문제 방지. 등장(railOpacity>0.55) 후 활성화.
  const [railReady, setRailReady] = useState(false);
  useEffect(() => {
    if (reduce) {
      setRailReady(true);
      return;
    }
    setRailReady(railOpacity.get() > 0.55);
    return railOpacity.on("change", (v) => setRailReady(v > 0.55));
  }, [reduce, railOpacity]);

  // ── [B] 가로 자동 슬라이드(마퀴) + 드래그 ─────────────────────────
  const railX = useMotionValue(0);
  const setRef = useRef<HTMLDivElement | null>(null); // 카드 한 세트(폭 측정)
  const innerRef = useRef<HTMLDivElement | null>(null); // 세트 사이 gap 측정
  const periodRef = useRef(0); // 한 세트 폭 + gap = 순환 주기
  const draggingRef = useRef(false);
  const movedRef = useRef(false); // 드래그로 움직였으면 클릭(모달) 무시
  const startRef = useRef({ x: 0, val: 0 });

  useEffect(() => {
    const measure = () => {
      const set = setRef.current;
      const inner = innerRef.current;
      if (!set || !inner) return;
      const cs = getComputedStyle(inner);
      const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
      periodRef.current = set.offsetWidth + gap;
    };
    measure();
    window.addEventListener("resize", measure);
    const raf = requestAnimationFrame(measure);
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [isMobile]);

  // 매 프레임: 드래그 중이 아니면 우→좌로 느리게 이동(순환).
  useAnimationFrame((_, delta) => {
    if (reduce || draggingRef.current) return;
    const period = periodRef.current;
    if (!period) return;
    railX.set(norm(railX.get() - AUTO_SPEED * (delta / 1000), period));
  });

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - startRef.current.x;
      if (Math.abs(dx) > 4) movedRef.current = true;
      railX.set(norm(startRef.current.val + dx, periodRef.current));
    },
    [railX]
  );
  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (reduce) return;
      draggingRef.current = true;
      movedRef.current = false;
      startRef.current = { x: e.clientX, val: railX.get() };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [reduce, railX, onPointerMove, onPointerUp]
  );
  useEffect(
    () => () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    },
    [onPointerMove, onPointerUp]
  );

  const openCard = (f: Film) => {
    if (movedRef.current) return; // 방금 드래그였으면 모달 열지 않음
    setSelected(f);
  };

  const cards = (keyPrefix: string, ariaHidden: boolean) => (
    <div ref={ariaHidden ? undefined : setRef} className={styles.railSet} aria-hidden={ariaHidden}>
      {ITEMS.map((f) => (
        <button
          key={`${keyPrefix}-${f.id}`}
          type="button"
          className={styles.railCard}
          data-playcursor
          onClick={() => openCard(f)}
          tabIndex={ariaHidden ? -1 : 0}
          aria-label={`${f.title} 상세 보기`}
          draggable={false}
        >
          <div className={styles.railCard__media}>
            <Image
              src={FILM_PHOTO[f.id] ?? "/posters-photo/lineup_1.jpg"}
              alt={`${f.title} 스틸`}
              fill
              sizes="(max-width: 767px) 52vw, 20vw"
              draggable={false}
            />
            <span className={styles.railCard__status}>{f.status}</span>
          </div>
          <div className={styles.railCard__body}>
            <span className={styles.railCard__title}>{f.title}</span>
            <span className={styles.railCard__en}>{f.titleEn}</span>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <section className={styles.lineup} id="lineup">
      <div ref={trackRef} className={styles.lineupTrack}>
        <div className={styles.lineupStage}>
          {/* [B] 가로 슬라이드 뷰포트 — 자동 마퀴 + 드래그 */}
          <motion.div
            className={styles.railViewport}
            style={
              reduce
                ? undefined
                : { opacity: railOpacity, y: railShift, pointerEvents: railReady ? "auto" : "none" }
            }
            onPointerDown={onPointerDown}
          >
            <motion.div
              ref={innerRef}
              className={styles.railInner}
              style={reduce ? undefined : { x: railX }}
            >
              {cards("a", false)}
              {cards("b", true)}
            </motion.div>
          </motion.div>

          {/* [A][B][C] LINE UP 텍스트 — 진입 시 좌상단 크게(흰) → 좌하단으로 살짝 축소(회색).
              [A] "LINE"=솔리드 채움 / "UP"=아웃라인(라인). 채움색·아웃라인 stroke 색 모두 흰→회색 전환.
              컨테이너는 좌하단 고정, <h2> 만 확대·이동. eyebrow 는 안착 즈음 페이드 인. */}
          <div className={styles.lineupHeading}>
            <motion.h2 ref={titleRef} className={styles.lineupBig} style={titleStyle} aria-label="LINE UP">
              <span className={styles.luSolid} aria-hidden="true">
                LINE
              </span>{" "}
              <motion.span
                className={styles.luLine}
                aria-hidden="true"
                style={reduce ? undefined : { WebkitTextStrokeColor: titleColor }}
              >
                UP
              </motion.span>
            </motion.h2>
            {/* eyebrow 를 제목 아래에 배치 */}
            <motion.span
              className={styles.lineupEyebrow}
              style={reduce ? undefined : { opacity: eyebrowOpacity }}
            >
              The Programme · 2024–2025
            </motion.span>
          </div>
        </div>
      </div>

      {/* [D] 카드 클릭 → 영화 상세 모달(바텀시트) — 동작 유지 */}
      <LineupModal
        film={selected}
        image={selected ? (FILM_PHOTO[selected.id] ?? "/posters-photo/lineup_1.jpg") : undefined}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
