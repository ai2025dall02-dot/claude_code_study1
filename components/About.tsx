"use client";

// ABOUT — noth.in "step aside" 레이아웃/스크롤 구조 참고(문구는 미사용, 지정 문구만).
//  E: 좌측 정렬 대형 인용문 + 하단 영상(placeholder) 박스.
//  F: 스크롤 진행에 따라 영상 박스가 우측 하단의 작은 박스로 축소·이동(되돌리면 역방향).
//  G: 좌측 하단 소형 본문. (기존 원형 reveal/원칙/배경반전 애니메이션은 전부 제거)
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import styles from "./About.module.css";

// 영상 자리 placeholder — 실제 영상은 나중에 교체. 지금은 로컬 이미지로 대체.
const PLACEHOLDER = "/posters-photo/m4.jpg";

export default function About() {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // [F] 섹션 스크롤 진행도(0=진입, 1=이탈). sticky 가 고정된 동안 이 값으로 영상 크기를 줄인다.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 30, mass: 1 });
  // [A] 비율 고정(aspect-ratio, CSS) + '단일 scale' 로만 축소 → 가로세로가 따로 놀지 않음.
  //   초기 크게(scale 1, 58vw 폭) → 진행할수록 우측 하단 작은 박스(scale 0.42)로. origin: bottom right.
  const scale = useTransform(p, [0, 0.85], [1, 0.42]);
  const vidStyle: MotionStyle | undefined = reduce || isMobile ? undefined : { scale };

  // [B] 좌측 하단 본문 — 스크롤 후반부(영상이 우하단으로 물러날 때)에 페이드/상승하며 드러남.
  const bodyOpacity = useTransform(p, [0.5, 0.82], [0, 1]);
  const bodyY = useTransform(p, [0.5, 0.82], [18, 0]);
  const bodyStyle: MotionStyle | undefined =
    reduce || isMobile ? undefined : { opacity: bodyOpacity, y: bodyY };

  return (
    <section ref={ref} id="about" className={styles.about}>
      <div className={styles.pin}>
        <div className={styles.sticky}>
          <span className={styles.eyebrow}>About — 배급사 소개</span>

          <h2 className={styles.quote}>
            좋은 영화는 사라지지 않는다.
            <br />
            다만 옮겨질 곳을 기다릴 뿐이다.
          </h2>

          <motion.p className={styles.body} style={bodyStyle}>
            필름 누벨은 2014년부터 독립영화와 예술영화를 다시 스크린으로 선보여 왔습니다. 매년
            엄선한 소수의 작품을 극장 개봉, 특별전, 공동체 상영, 아카이브까지 이어지는 여정 속에서
            관객과 연결합니다.
          </motion.p>

          <motion.div className={styles.video} style={vidStyle}>
            <img src={PLACEHOLDER} alt="필름 누벨 소개 영상 (placeholder)" />
            <span className={styles.videoTag}>Showreel</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
