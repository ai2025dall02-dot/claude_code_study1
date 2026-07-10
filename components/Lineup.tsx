"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { films, type Film } from "@/data/films";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 라인업 작품에 사진 포스터 매핑 (public/posters-photo). 12편 유니크 — 페이지(6편)마다 사진이 겹치지 않게 배치. */
const FILM_PHOTO: Record<string, string> = {
  afterimage: "/posters-photo/m1.jpg",
  north: "/posters-photo/m4.jpg",
  exile: "/posters-photo/m3.jpg",
  salt: "/posters-photo/m8.jpg",
  winter: "/posters-photo/m6.jpg",
  reel: "/posters-photo/m2.jpg",
  tide: "/posters-photo/m5.jpg",
  orchard: "/posters-photo/m7.jpg",
  static: "/posters-photo/m4.jpg",
  dust: "/posters-photo/m8.jpg",
  meridian: "/posters-photo/m3.jpg",
  ember: "/posters-photo/m1.jpg",
};

/* 카드별 배치 설정 — mt: 카드별 추가 세로 여백(촘촘하게 0~60), ar: 높이(aspect)
   (패럴랙스 속도는 더 이상 카드별이 아니라 '열 단위'로 묶임 → COL_SPEED) */
const CONF = [
  { mt: 0, ar: "3 / 4.2" },
  { mt: 28, ar: "3 / 3.6" },
  { mt: 14, ar: "3 / 4.6" },
  { mt: 44, ar: "3 / 3.8" },
  { mt: 8, ar: "3 / 4.4" },
  { mt: 36, ar: "3 / 4.0" },
  { mt: 20, ar: "3 / 3.9" },
  { mt: 52, ar: "3 / 4.5" },
  { mt: 6, ar: "3 / 3.7" },
  { mt: 32, ar: "3 / 4.3" },
  { mt: 48, ar: "3 / 4.1" },
  { mt: 16, ar: "3 / 3.6" },
];

/* 12편 유니크 라인업 (중복 반복 제거 — films 자체가 12편) */
const ITEMS = films;

/* 페이지네이션: 데스크톱/노트북/태블릿에서만 노출. 페이지당 6편 → 2페이지. */
const PAGE_SIZE = 6;

/* 세로 흐름 masonry: 3개 열로 라운드로빈 분배 (각 열이 세로로 이어짐) */
const COLS = 3;
const COL_CLASS = ["", "col1", "col2"] as const;
/* 열별 속도 계수 (음수=위로 흐름, 절댓값 클수록 빠름) — 속도 격차를 크게 벌려 어긋남 강조
   (가운데 열은 빠르게 -0.55, 마지막 열은 거의 정지 -0.05) */
const COL_SPEED = [-0.25, -0.55, -0.05];
/* 패럴랙스 기준 이동 폭(px). 계수 × 이 값 = 열의 (반)이동량.
   낮추면 첫 진입 시 이미지가 덜 아래에서 시작해 상단 여백이 줄어듦 */
const PARALLAX_DISTANCE = 1700;

export default function Lineup() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  // 모바일(≤767)에서는 .grid 가 1열로 쌓여 열마다 속도가 다른 패럴랙스가 서로 어긋난다
  // → 모바일에서는 패럴랙스 정지(y=0). 데스크톱/태블릿은 그대로 유지.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // 페이지네이션(데스크톱/태블릿). 모바일은 페이지 없이 전체를 한 흐름으로 노출(패럴랙스만 정지).
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(ITEMS.length / PAGE_SIZE);
  // 현재 페이지에 노출할 항목 (전역 인덱스 i 는 CONF·key 용으로 보존). 모바일이면 전체.
  const indexed = ITEMS.map((f, i) => ({ f, i }));
  const visible = isMobile ? indexed : indexed.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const goPage = (p: number) => {
    const next = Math.max(0, Math.min(pageCount - 1, p));
    if (next === page) return;
    setPage(next);
    // 리스트 상단으로 부드럽게 스크롤(선택) — 새 페이지가 화면 위에서 시작하도록.
    requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  // 패럴랙스용 — 섹션이 화면을 지나는 전체 진행도 (0: 하단 진입 ~ 1: 상단 이탈)
  // (원형 reveal 은 About 컴포넌트로 이동 — About 본문 기준으로 시작 시점을 잡기 위해)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section ref={sectionRef} className={`${styles.section} ${styles.lineup}`} id="lineup">

      <div className={styles.inner}>
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>The Programme</span>
            <TypeTitle solid="LINE" outline="UP" />
          </div>
          <span className={styles.index}>현재 배급 · 2024–2025 / 전 {ITEMS.length}편</span>
        </header>

        <div className={styles.grid}>
          {Array.from({ length: COLS }, (_, c) => (
            <ParallaxColumn
              key={c}
              className={`${styles.col} ${styles[COL_CLASS[c]] ?? ""}`}
              progress={scrollYProgress}
              speed={COL_SPEED[c]}
              reduce={!!reduce}
              noParallax={isMobile}
              // 현재 페이지 항목만 열에 분배(페이지 내 지역 인덱스로 라운드로빈 → 열 개수·패럴랙스 유지)
              items={visible.filter((_, li) => li % COLS === c)}
            />
          ))}
        </div>

        {/* 페이지네이션 — 데스크톱/노트북/태블릿에서만. 모바일(≤767)에서는 숨김(CSS + isMobile). */}
        {!isMobile && pageCount > 1 && (
          <nav className={styles.pagination} aria-label="라인업 페이지">
            <button
              type="button"
              className={styles.pageArrow}
              onClick={() => goPage(page - 1)}
              disabled={page === 0}
              aria-label="이전 페이지"
            >
              ←
            </button>
            {Array.from({ length: pageCount }, (_, p) => (
              <button
                key={p}
                type="button"
                className={styles.pageNum}
                data-active={p === page}
                aria-current={p === page ? "page" : undefined}
                aria-label={`${p + 1}페이지`}
                onClick={() => goPage(p)}
              >
                {p + 1}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageArrow}
              onClick={() => goPage(page + 1)}
              disabled={page === pageCount - 1}
              aria-label="다음 페이지"
            >
              →
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}

/* 한 열 전체를 묶어 섹션 진행도 × 열 계수로 선형(scrub) 이동 — 스프링/딜레이 없이 즉각 반응.
   각 카드에는 이 열의 패럴랙스 y(MotionValue)를 그대로 내려, 카드가 opacity 를
   '실제 화면 위치(레이아웃+패럴랙스)' 기준으로 계산하게 한다. */
function ParallaxColumn({
  progress,
  speed,
  reduce,
  noParallax,
  className,
  items,
}: {
  progress: MotionValue<number>;
  speed: number;
  reduce: boolean;
  noParallax: boolean; // 모바일 1열 — 열 이동 정지
  className: string;
  items: { f: Film; i: number }[];
}) {
  // 진입 밀림을 '완전 제거'가 아니라 '조금만 축소' — 기존 대칭 [-D, D] 에서
  // 시작값만 60%(-D*0.6)로 낮춰 진입 밀림이 약 40% 감소. 상단 여백은 적당히 줄되
  // LINEUP 제목을 침범하진 않음. '슉슉' 세기(총 이동폭)는 거의 유지.
  const yRaw = useTransform(
    progress,
    [0, 1],
    [-speed * PARALLAX_DISTANCE * 0.6, speed * PARALLAX_DISTANCE]
  );
  // 열 이동 스프링 — 관성은 줄이고 부드러움만: stiffness↑(스크롤에 더 붙음) + mass 1.0(가벼움) + damping 유지.
  //   조절점: stiffness 높을수록 스크롤 밀착(관성↓) / damping 높을수록 덜 출렁 / mass 낮을수록 가벼움.
  const ySmooth = useSpring(yRaw, { stiffness: 185, damping: 28, mass: 1.0 });
  // reduce 또는 모바일(noParallax)이면 열 이동 정지(y=0). 페이드(opacity)는 그대로 유지.
  const still = reduce || noParallax;
  const y = still ? 0 : ySmooth;
  return (
    <motion.div className={className} style={{ y, willChange: "transform" }}>
      {items.map(({ f, i }, colIdx) => (
        <LineupCard
          key={`${f.id}-${i}`}
          film={f}
          conf={CONF[i % CONF.length]}
          topCard={colIdx === 0}
          reduce={reduce}
          // 작업2(중요): opacity 위치 보정도 트랙과 "같은" 스무딩 값(ySmooth)을 구독 → 이미지 위치와
          // 페이드가 어긋나지 않음. (정지 시엔 undefined → 레이아웃 위치 기준으로 페이드)
          parallaxY={still ? undefined : ySmooth}
        />
      ))}
    </motion.div>
  );
}

function LineupCard({
  film: f,
  conf,
  topCard,
  reduce,
  parallaxY,
}: {
  film: Film;
  conf: { mt: number; ar: string };
  topCard: boolean;
  reduce: boolean;
  parallaxY?: MotionValue<number>;
}) {
  // 각 열 '맨 위' 카드만 상단 여백 약간(75%) 축소 — [1] 패럴랙스로 이미 여백이 줄었으므로
  // 여기선 최소로만 걸어 제목 침범을 피함 (기존 절반 → 0.75 로 완화)
  const marginTop = topCard ? conf.mt * 0.75 : conf.mt;
  const ref = useRef<HTMLAnchorElement | null>(null);

  // opacity 를 '카드의 실제 화면 위치(= 레이아웃 위치 + 패럴랙스 이동)' 기준으로 계산.
  //  - framer-motion 11 의 useScroll(target) 측정(calcInset)은 offsetTop 누적이라
  //    조상(열)의 패럴랙스 translateY 를 무시 → '레이아웃 위치' 진행도만 준다.
  //  - 여기에 패럴랙스 y 를 보정해 '실제 보이는 위치' 진행도로 바꾼다:
  //      layoutTop = vh - progress_layout·(vh+cardH),  visualTop = layoutTop + pY
  //      → progress_visual = progress_layout - pY/(vh+cardH)
  //  - progress_layout·pY 는 모두 같은 스크롤에서 파생된 MotionValue 라, 이를 합친 파생값은
  //    패럴랙스와 '같은 프레임'에 원자적으로 갱신됨 → 정지 시에도 어긋남/지연 없음,
  //    getBoundingClientRect 재측정(reflow)·rAF 경쟁 없음, 스크롤 방향과 무관하게 일관.
  const { scrollYProgress: progressLayout } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const [span, setSpan] = useState(1500); // vh + 카드 높이 (진행도 → 위치 환산 분모)
  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (el) setSpan(window.innerHeight + el.offsetHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const progressVisual = useTransform(
    () => progressLayout.get() - (parallaxY?.get() ?? 0) / span
  );
  // 또렷(opacity 1) 구간 0.25~0.75, 페이드아웃 0.92 (기존 곡선 유지)
  const opRaw = useTransform(
    progressVisual,
    [0.08, 0.25, 0.75, 0.92],
    [0, 1, 1, 0]
  );
  const opacity = reduce ? 1 : opRaw;

  return (
    <motion.a ref={ref} className={styles.card} href="#contact" style={{ marginTop, opacity }}>
      <div className={styles.card__media} style={{ aspectRatio: conf.ar }}>
        <Image
          src={FILM_PHOTO[f.id] ?? "/posters-photo/m1.jpg"}
          alt={`${f.title} 스틸`}
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 980px) 50vw, 33vw"
        />
        <span className={styles.card__idx}>{f.index}</span>
        <span className={styles.card__status}>{f.status}</span>
      </div>
      <div className={styles.card__body}>
        <span className={styles.card__title}>{f.title}</span>
        <span className={styles.card__en}>{f.titleEn}</span>
        <span className={styles.card__meta}>
          {f.director} · {f.country} {f.year} · {f.format} · {f.genre}
        </span>
      </div>
    </motion.a>
  );
}
