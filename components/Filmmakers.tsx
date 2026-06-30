"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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

/* 감독 카드용 사진 매핑 (public/posters-photo) — LINEUP 과 동일 매핑으로 일관성 유지 */
const MAKER_PHOTO: Record<string, string> = {
  afterimage: "/posters-photo/m1.jpg",
  north: "/posters-photo/m4.jpg",
  exile: "/posters-photo/m3.jpg",
  salt: "/posters-photo/m8.jpg",
  winter: "/posters-photo/m6.jpg",
  reel: "/posters-photo/m2.jpg",
};

/* 감독 데이터 — films 에서 파생 (사진 + 이름 + 필모/정보) */
const MAKERS = films.map((f) => ({
  id: f.id,
  index: f.index,
  name: f.director,
  country: f.country,
  year: f.year,
  genre: f.genre,
  film: f.title,
  filmEn: f.titleEn,
  photo: MAKER_PHOTO[f.id] ?? "/posters-photo/m1.jpg",
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
      const start = (vw - cardW) / 2; // 첫 카드 중앙 정렬
      const travel = (track.children.length - 1) * pitch;
      setM({ start, end: start - travel, pitch, cardW, vw });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // [2단계] 카드 가로 이동을 0.2 이후로 — 0~0.2 는 제목 타이핑 노출 구간(카드 첫 위치 고정)
  const x = useTransform(scrollYProgress, [0.2, 1], [m.start, m.end]);

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
        <motion.div ref={trackRef} className={styles.fmTrack} style={{ x }}>
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
  // 화면 중앙(center)과의 절대거리
  const dist = useTransform(trackX, (tx) =>
    Math.abs(tx + index * pitch + half - center)
  );

  // 거리 → 스타일 매핑 (중앙=또렷/확대, 멀수록 흐림/축소/투명) — 좌우 대칭 자동
  // 중앙 부근에서 확실히 blur 0 으로 또렷하게, 멀어질수록 빠르게 흐려짐
  const opacity = useTransform(dist, [0, pitch * 0.5, pitch * 0.9], [1, 0.4, 0]);
  const scale = useTransform(dist, [0, pitch], [1.1, 0.78]);
  const blurN = useTransform(dist, [0, pitch * 0.45, pitch], [0, 4, 14]);
  const blur = useMotionTemplate`blur(${blurN}px)`;

  const style = reduce
    ? undefined
    : { opacity, scale, filter: blur as unknown as string };

  return (
    <motion.article className={styles.fmCard} style={style}>
      <div className={styles.fmCard__photo}>
        <Image
          src={mk.photo}
          alt={`${mk.name} 감독`}
          fill
          sizes="(max-width: 600px) 80vw, 360px"
        />
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
