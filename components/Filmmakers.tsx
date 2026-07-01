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

/* 감독 카드용 사진 매핑 (public/posters-photo) — 첨부 오렌지와 같은 '선명한 정물/자연 매크로'
   계열 4장(m1 과일·m8 사과·m3 나비·m2 개코원숭이)만 사용. 6칸이라 2장은 중복하되
   같은 이미지가 이웃 카드에 연속되지 않게 배치. (회화 m4·만화 m6·축구 m5·도시 m7 제외) */
const MAKER_PHOTO: Record<string, string> = {
  afterimage: "/posters-photo/m1.jpg", // 과일 정물 (첨부 이미지)
  north: "/posters-photo/m3.jpg", // 나비 매크로
  exile: "/posters-photo/m8.jpg", // 사과 정물
  salt: "/posters-photo/m2.jpg", // 개코원숭이
  winter: "/posters-photo/m3.jpg", // 나비 매크로 (중복)
  reel: "/posters-photo/m8.jpg", // 사과 정물 (중복)
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

  // 카드 가로 이동 — 선형(등속) 대신 '카드가 중앙에 올 때마다 잠시 머무는' 계단형 매핑.
  // 각 카드 중앙 진행도(c_i) 부근에 같은 x 값을 2점(enter/leave) 둬서 평탄(머무름) 구간을 만들고,
  // 그 사이는 빠르게 전환 → 스냅처럼 멈췄다 이어지는 느낌. (타이핑 끝나는 0.28 이후 시작)
  const N = MAKERS.length;
  const centerOffset = (m.vw - m.cardW) / 2; // 카드 0 이 중앙일 때의 x (= X_0)
  const P_START = 0.28; // 카드 이동 시작 진행도
  const C0 = 0.35; // 첫 카드가 중앙에 오는 진행도
  const DWELL = 0.03; // 중앙에서 머무는 절반 폭(진행도) — 살짝만 머물게
  const snapIn: number[] = [P_START];
  const snapOut: number[] = [m.start];
  for (let i = 0; i < N; i++) {
    const ci = N > 1 ? C0 + (1 - C0) * (i / (N - 1)) : C0; // 카드 i 중앙 진행도 (마지막=1.0)
    const Xi = centerOffset - i * m.pitch; // 카드 i 가 중앙일 때의 x
    const enter = Math.max(snapIn[snapIn.length - 1] + 0.001, ci - DWELL);
    snapIn.push(enter);
    snapOut.push(Xi);
    const leave = Math.min(1, ci + DWELL);
    if (leave > snapIn[snapIn.length - 1]) {
      snapIn.push(leave);
      snapOut.push(Xi);
    }
  }
  const x = useTransform(scrollYProgress, snapIn, snapOut);

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
  // 중앙 근처(거리 ~0.35p 까지)는 blur 0 으로 완전히 또렷, 그 밖으로 갈수록 흐려짐
  const blurN = useTransform(
    dist,
    [0, pitch * 0.35, pitch * 0.7, pitch],
    [0, 0, 6, 14]
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
