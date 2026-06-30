"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { films } from "@/data/films";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 이름에서 이니셜 추출 (라틴: 단어 첫 글자 / 한글: 첫 음절) */
function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* 감독 데이터 — films 에서 파생 (이름 + 필모/정보 + 인물 placeholder 용 팔레트/이니셜)
   public 에 인물 사진이 없어 감독별 팔레트 색 + 이니셜의 '인물 실루엣' placeholder 사용 */
const MAKERS = films.map((f) => ({
  id: f.id,
  index: f.index,
  name: f.director,
  country: f.country,
  year: f.year,
  genre: f.genre,
  film: f.title,
  filmEn: f.titleEn,
  palette: f.palette,
  initials: initialsOf(f.director),
}));

type Metrics = { start: number; end: number; pitch: number; cardW: number; vw: number };

export default function Filmmakers() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  // 세로 스크롤 진행도 (섹션 상단 도달 ~ 섹션 하단 도달)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // 카드 폭/간격/뷰포트폭 측정 → x 범위 + 카드별 중앙거리 계산에 사용
  const [m, setM] = useState<Metrics>({ start: 0, end: 0, pitch: 0, cardW: 0, vw: 0 });
  useEffect(() => {
    const measure = () => {
      const vp = viewportRef.current;
      const track = trackRef.current;
      if (!vp || !track || track.children.length === 0) return;
      const first = track.children[0] as HTMLElement;
      const cardW = first.offsetWidth;
      const pitch =
        track.children.length > 1
          ? (track.children[1] as HTMLElement).offsetLeft - first.offsetLeft
          : cardW;
      const vw = vp.clientWidth;
      // 첫 카드를 우측 바깥 '반 칸'(pitch*0.5)에서 출발 → 등장 직후 살짝만 스크롤해도 중앙 진입
      // (한 칸이면 중앙까지 너무 오래 걸림). 마지막 카드는 끝에서 중앙에 안착.
      const start = (vw - cardW) / 2 + pitch * 0.5;
      const travel = (track.children.length - 0.5) * pitch;
      setM({ start, end: start - travel, pitch, cardW, vw });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // 카드 가로 이동을 0.28 이후로 — 0~0.28 은 제목 타이핑 노출 구간(카드 첫 위치 고정)
  // 타이핑이 끝난 뒤 스크롤해야 카드가 흐르기 시작
  const x = useTransform(scrollYProgress, [0.28, 1], [m.start, m.end]);

  // [1] 타이핑 구간(0~0.28)에는 트랙 전체를 숨김 → 0.28 부근에서 fade-in (타이핑 먼저 노출)
  const trackGate = useTransform(scrollYProgress, [0.24, 0.3], [0, 1]);
  const trackOpacity = reduce ? 1 : trackGate;

  return (
    <section ref={sectionRef} className={styles.fm} id="filmmakers">
      <div ref={viewportRef} className={styles.fmViewport}>
        {/* 배경에 고정된 큰 FILMMAKERS 텍스트 (카드가 그 앞을 지나감) */}
        <div className={styles.fmBg} aria-hidden="true">
          <span className={styles.eyebrow}>Directors &amp; Authors</span>
          <TypeTitle solid="FILM" outline="MAKERS" inViewMargin="0px" />
          <span className={styles.fmHeadSub}>우리가 동행하는 작가들</span>
        </div>

        {/* 가로 트랙 — x 만 연동. 카드별 강조/블러는 각 FmCard 가 중앙거리로 개별 처리 */}
        <motion.div ref={trackRef} className={styles.fmTrack} style={{ x, opacity: trackOpacity }}>
          {MAKERS.map((mk, i) => (
            <FmCard key={mk.id} maker={mk} index={i} trackX={x} metrics={m} reduce={!!reduce} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* 카드 1장 — 트랙 x 를 구독해 '화면 중앙으로부터의 거리'에 따라 opacity/scale/blur 개별 적용 */
function FmCard({
  maker: mk,
  index,
  trackX,
  metrics,
  reduce,
}: {
  maker: (typeof MAKERS)[number];
  index: number;
  trackX: MotionValue<number>;
  metrics: Metrics;
  reduce: boolean;
}) {
  const pitch = metrics.pitch || 1; // 측정 전 0 방어
  const half = metrics.cardW / 2;
  const center = metrics.vw / 2;

  // 카드 화면 중심 x = 트랙 translateX + 카드 레이아웃 위치(index×pitch) + 카드 반폭
  // 화면 중앙(center) 기준 부호 있는 거리(signed)와 절대거리(dist)
  const signed = useTransform(trackX, (tx) => tx + index * pitch + half - center);
  const dist = useTransform(signed, (s) => Math.abs(s));

  // [2] 거리 → 스타일 매핑. 중앙 부근(~0.12p)에 'blur 0 / opacity 1 데드존'을 둬서
  // 약간 흔들려도 중앙 카드는 확실히 또렷하게 유지
  const opacity = useTransform(
    dist,
    [0, pitch * 0.12, pitch * 0.5, pitch * 0.9],
    [1, 1, 0.4, 0]
  );
  const scale = useTransform(dist, [0, pitch], [1.1, 0.78]);
  const blurN = useTransform(
    dist,
    [0, pitch * 0.12, pitch * 0.5, pitch],
    [0, 0, 5, 14]
  );
  const blur = useMotionTemplate`blur(${blurN}px)`;

  // 곡선 궤적: 양옆은 위로 떠오르고(-90), 중앙에 가까울수록 기준선(0)으로 가라앉는 아치
  const y = useTransform(dist, [0, pitch], [0, -90]);
  // 도는 느낌: 중앙 기준 좌우로 기울어짐 (왼쪽 +8°, 오른쪽 -8°)
  const rotate = useTransform(signed, [-pitch, 0, pitch], [8, 0, -8]);
  // [3] 뒤→앞 깊이감: 멀수록 뒤로 물러나고(z) 좌우로 비스듬히(rotateY) → 텍스트 뒤에서 앞으로 나오는 느낌
  const z = useTransform(dist, [0, pitch], [0, -180]);
  const rotateY = useTransform(signed, [-pitch, 0, pitch], [20, 0, -20]);

  const style = reduce
    ? undefined
    : {
        opacity,
        scale,
        y,
        z,
        rotate,
        rotateY,
        filter: blur as unknown as string,
      };

  return (
    <motion.article className={styles.fmCard} style={style}>
      <div className={styles.fmCard__photo}>
        <Portrait id={mk.id} palette={mk.palette} initials={mk.initials} name={mk.name} />
        <span className={styles.fmCard__idx}>{mk.index}</span>
      </div>
      <div className={styles.fmCard__info}>
        <h3 className={styles.fmCard__name}>
          {mk.name}
          <span>Director</span>
        </h3>
        <p className={styles.fmCard__meta}>
          {mk.country} · {mk.year} · {mk.genre}
        </p>
        <p className={styles.fmCard__film}>
          <b>{mk.film}</b> · {mk.filmEn}
        </p>
      </div>
    </motion.article>
  );
}

/* 인물 placeholder — 감독별 팔레트 그라데이션 위에 사람 실루엣(머리+어깨) + 이니셜 (3:4 포트레이트) */
function Portrait({
  id,
  palette,
  initials,
  name,
}: {
  id: string;
  palette: [string, string];
  initials: string;
  name: string;
}) {
  const [accent, deep] = palette;
  const gid = `fmgrad-${id}`;
  return (
    <svg
      className={styles.fmCard__portrait}
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${name} 감독`}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill={`url(#${gid})`} />
      {/* 사람 실루엣 (머리 + 어깨) */}
      <g fill="rgba(244,244,242,0.20)">
        <circle cx="150" cy="158" r="60" />
        <path d="M40 400 C40 312 92 268 150 268 C208 268 260 312 260 400 Z" />
      </g>
      <text
        x="150"
        y="372"
        textAnchor="middle"
        fill="rgba(244,244,242,0.92)"
        fontFamily="'Arial Black', Helvetica, sans-serif"
        fontSize="30"
        fontWeight="900"
        letterSpacing="2"
      >
        {initials}
      </text>
    </svg>
  );
}
