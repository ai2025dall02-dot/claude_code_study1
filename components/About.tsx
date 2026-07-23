"use client";

// ABOUT — noth.in "Most brands produce~" 무드: 텍스트(리드/본문)는 일반 흐름으로 스크롤되고,
//   영상 박스만 별도 sticky 컨테이너로 화면에 잠깐 붙어 우측 하단 미니플레이어로 축소된다.
//   (전체 100vh sticky 로 화면을 통째 고정하던 구조 제거 → 영상만 sticky)
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import styles from "./About.module.css";

// 소개 영상. public/videos/about.mp4 를 올리면 재생됨(경로: /videos/about.mp4).
// POSTER = 영상 로드 전/실패 시 보이는 이미지(파일 없어도 화면 안 깨지게).
const VIDEO_SRC = "/videos/about.mp4";
const POSTER = "/posters-photo/m4.jpg";
const MINI_W = 780; // [C] 최종 미니플레이어 폭(px). 세로는 16:9 → 약 439px.

export default function About() {
  const ref = useRef<HTMLElement | null>(null);
  const vidRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // 섹션 스크롤 진행도(0=진입, 1=이탈).
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // [A] 스프링 유지(살짝 더 부드럽게 60/22) → "슉~" 부드러운 감속.
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 1 });

  // k: 1(큰 영상) → 0(미니플레이어). 축소 시작을 아주 살짝 더 앞당김(0.1 → 0.05), 끝(0.6)·부드러움은 유지.
  const k = useTransform(p, [0.05, 0.6], [1, 0]);

  // [A] transform: scale 기반(레이아웃 재계산 없음, GPU). [B] 영상은 CSS 로 좌/우 24px 대칭 배치(left/right 동일)
  //   → 컨테이너 기준 완전 중앙(뷰포트 vw/스크롤바 계산 불필요) → 좌우 여백 동일. translateX 보정 제거.
  //   scale 만 트윈, transform-origin: bottom right → 하단에 붙은 채 우측 하단 코너로 축소.
  //   targetScale = 400 / baseWidth(측정) → 최종 정확히 400×225.
  const targetScaleMV = useMotionValue(0.34);
  useEffect(() => {
    const measure = () => {
      const w = vidRef.current?.offsetWidth || 0; // 레이아웃 폭(transform 영향 없음) = 컨테이너 - 48
      if (w) targetScaleMV.set(MINI_W / w);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [targetScaleMV]);

  // scale: k=1 → 1(큰 영상, 좌우 대칭), k=0 → targetScale(우하단 400×225 미니플레이어).
  const scale = useTransform(
    [k, targetScaleMV],
    ([kv, sv]) => (sv as number) + (kv as number) * (1 - (sv as number))
  );

  // reduce / 모바일: 모션 없이 정적(모바일은 CSS 가 static·full-width·16:9 로 override).
  const vidStyle: MotionStyle | undefined = reduce || isMobile ? undefined : { scale };

  return (
    <section ref={ref} id="about" className={styles.about}>
      {/* 리드(눈썹+인용문) — 일반 흐름. 그냥 자연스럽게 스크롤되며 위로 지나감(고정 없음). */}
      <div className={styles.lead}>
        <span className={styles.eyebrow}>About — 배급사 소개</span>
        <h2 className={styles.quote}>
          좋은 영화는 사라지지 않는다.
          <br />
          다만 옮겨질 곳을 기다릴 뿐이다.
        </h2>
      </div>

      {/* 영상 전용 sticky 트랙 — 이 트랙(.pin)을 스크롤하는 동안 .videoStage 만 화면에 붙어 영상이 축소된다. */}
      <div className={styles.pin}>
        <div className={styles.videoStage}>
          <motion.div ref={vidRef} className={styles.video} style={vidStyle}>
            <video
              src={VIDEO_SRC}
              poster={POSTER}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="필름 누벨 소개 영상"
            />
          </motion.div>

          {/* 본문 — 큰 영상(위 z)에 가려졌다가 영상이 우하단으로 축소되며 물리적으로 드러남. */}
          <p className={styles.body}>
            필름 누벨은 2014년부터 독립영화와 예술영화를 다시 스크린으로 선보여 왔습니다.
            <br />
            매년 엄선한 소수의 작품을 극장 개봉, 특별전, 공동체 상영, 아카이브까지 이어지는 여정 속에서
            <br />
            관객과 연결합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
