"use client";

// ABOUT — noth.in "Most brands produce~" 무드: 텍스트(리드/본문)는 일반 흐름으로 스크롤되고,
//   영상 박스만 별도 sticky 컨테이너로 화면에 잠깐 붙어 우측 하단 미니플레이어로 축소된다.
//   (전체 100vh sticky 로 화면을 통째 고정하던 구조 제거 → 영상만 sticky)
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

  // 섹션 스크롤 진행도(0=진입, 1=이탈). 영상 sticky 가 붙어 있는 동안 이 값으로 영상만 축소한다.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 1 });

  // k: 1(큰 영상) → 0(미니플레이어). [축소 타이밍] 중반 이후 늦게+짧게 [0.45,0.7] → 한동안 크게 있다 빠르게 축소.
  const k = useTransform(p, [0.45, 0.7], [1, 0]);
  // [C] 최종 폭 = 고정 400px(16:9 → 세로 225px). 시작 = calc(100vw - 2*gutter)[좌우 대칭].
  const width = useTransform(
    k,
    (v) => `calc(400px + ${v.toFixed(3)} * (100vw - 2 * var(--ln-gutter) - 400px))`
  );
  // top: 시작 12vh(위로 흰 배경, 큰 영상도 화면 안에) → 끝 calc(100vh - 249px)(하단 24px 여백 미니플레이어).
  const top = useTransform(
    k,
    (v) => `calc(${(12 * v).toFixed(2)}vh + ${(1 - v).toFixed(3)} * (100vh - 249px))`
  );
  // 우측 여백: 시작 gutter → 끝 24px(미니플레이어 우측 모서리 근처).
  const right = useTransform(
    k,
    (v) => `calc(24px + ${v.toFixed(3)} * (var(--ln-gutter) - 24px))`
  );

  // reduce / 모바일: 모션 없이 정적(모바일은 CSS 가 static·full-width·16:9 로 override).
  const vidStyle: MotionStyle | undefined =
    reduce || isMobile ? undefined : { width, top, right };

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
          <motion.div className={styles.video} style={vidStyle}>
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
