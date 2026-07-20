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

// 영상 자리 placeholder — 실제 영상은 나중에 교체. 지금은 로컬 이미지로 대체.
const PLACEHOLDER = "/posters-photo/m4.jpg";
const MINI_W = 400; // [C] 최종 미니플레이어 폭(px). 세로는 16:9 → 225px.
const MARGIN = 24; // 우/하 여백(px)

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
  // [A] 스프링 완화(120→70) → "슉~" 부드러운 감속.
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 1 });

  // k: 1(큰 영상) → 0(미니플레이어). [C] 축소 타이밍 중반 이후 늦게+짧게 [0.45,0.7].
  const k = useTransform(p, [0.45, 0.7], [1, 0]);

  // [A] width/calc 트윈 대신 transform: scale — 레이아웃 재계산 없이 GPU 합성으로 부드럽게.
  //   영상 박스는 CSS 로 초기 큰 16:9 크기 고정(우/하 24px 앵커). 아래 값은 측정 기반으로 반응형 대응.
  //   targetScale = 400 / baseWidth (최종 미니플레이어), txCenter = 초기 중앙정렬용 translateX(px).
  const targetScaleMV = useMotionValue(0.34);
  const txCenterMV = useMotionValue(0);
  useEffect(() => {
    const measure = () => {
      const w = vidRef.current?.offsetWidth || 0; // 레이아웃 폭(transform 영향 없음)
      if (!w) return;
      targetScaleMV.set(MINI_W / w);
      // [B] 초기(큰 영상)를 좌우 중앙정렬: 우측 앵커(right:MARGIN) 상태에서 왼쪽으로 이만큼 이동하면 중앙.
      txCenterMV.set(MARGIN + w / 2 - window.innerWidth / 2);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [targetScaleMV, txCenterMV]);

  // scale: k=1 → 1(큰 영상), k=0 → targetScale(미니플레이어). transform-origin: bottom right(CSS) → 우하단으로 모임.
  const scale = useTransform([k, targetScaleMV], ([kv, sv]) => (sv as number) + (kv as number) * (1 - (sv as number)));
  // x(translateX): k=1 → txCenter(중앙정렬), k=0 → 0(우측 앵커=우하단). 중앙정렬 translate 와 우하단 이동을 하나로.
  const x = useTransform([k, txCenterMV], ([kv, txv]) => (kv as number) * (txv as number));

  // reduce / 모바일: 모션 없이 정적(모바일은 CSS 가 static·full-width·16:9 로 override).
  const vidStyle: MotionStyle | undefined =
    reduce || isMobile ? undefined : { scale, x };

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
            <img src={PLACEHOLDER} alt="필름 누벨 소개 영상 (placeholder)" />
            <span className={styles.videoTag}>Showreel</span>
          </motion.div>

          {/* 본문 — 큰 영상(위 z)에 가려졌다가 영상이 우하단으로 축소되며 물리적으로 드러남. */}
          <p className={styles.body}>
            필름 누벨은 2014년부터 독립영화와 예술영화를 다시 스크린으로 선보여 왔습니다. 매년
            엄선한 소수의 작품을 극장 개봉, 특별전, 공동체 상영, 아카이브까지 이어지는 여정 속에서
            관객과 연결합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
