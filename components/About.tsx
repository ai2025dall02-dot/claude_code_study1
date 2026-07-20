"use client";

// ABOUT — noth.in "Most brands produce~" 무드: 상단 리드 텍스트가 보이는 상태에서 영상 축소가 시작.
//   리드/영상/본문이 같은 sticky 무대에 있고, 영상은 뷰포트를 다 덮지 않는 크기(상단에 텍스트 공간)로
//   시작 → 스크롤에 따라 scale 로 서서히 축소되어 우측 하단 미니플레이어로 안착(그 사이 본문 노출).
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
const MINI_W = 400; // 최종 미니플레이어 폭(px). 세로는 16:9 → 225px.
const MARGIN = 24; // 우/하 코너 여백(px)

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
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 1 });

  // k: 1(큰 영상) → 0(미니플레이어). 리드가 보이는 초반부터 서서히 축소.
  const k = useTransform(p, [0.08, 0.6], [1, 0]);

  // transform: scale + translateX 기반(레이아웃 재계산 없음, GPU).
  //   영상은 CSS 로 '가운데 정렬(상단 텍스트 공간을 남긴 크기)'. 측정으로 최종 미니플레이어 크기/위치 계산:
  //   targetScale = 400 / baseW, cornerX = offsetLeft - MARGIN (가운데 → 우측 코너로 이동할 거리).
  const targetScaleMV = useMotionValue(0.4);
  const cornerXMV = useMotionValue(0);
  useEffect(() => {
    const measure = () => {
      const el = vidRef.current;
      if (!el || !el.offsetWidth) return;
      targetScaleMV.set(MINI_W / el.offsetWidth);
      // 가운데 정렬이라 offsetLeft = 좌측 여백. 우측 코너(right:MARGIN)로 옮기는 거리 = 좌측여백 - MARGIN.
      cornerXMV.set(el.offsetLeft - MARGIN);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [targetScaleMV, cornerXMV]);

  // scale: k=1 → 1(가운데 큰 영상), k=0 → targetScale(미니플레이어). transform-origin: bottom right(CSS).
  const scale = useTransform(
    [k, targetScaleMV],
    ([kv, sv]) => (sv as number) + (kv as number) * (1 - (sv as number))
  );
  // x(translateX): k=1 → 0(가운데), k=0 → cornerX(우측 코너). 가운데→우하단 이동을 scale 과 함께.
  const x = useTransform(
    [k, cornerXMV],
    ([kv, cx]) => (1 - (kv as number)) * (cx as number)
  );

  // reduce / 모바일: 모션 없이 정적(모바일은 CSS 가 static·full-width·16:9 로 override).
  const vidStyle: MotionStyle | undefined = reduce || isMobile ? undefined : { scale, x };

  return (
    <section ref={ref} id="about" className={styles.about}>
      <div className={styles.pin}>
        {/* 리드 + 영상 + 본문이 같은 sticky 무대 → 상단 텍스트가 보이는 채로 영상이 축소된다. */}
        <div className={styles.stage}>
          <div className={styles.lead}>
            <span className={styles.eyebrow}>About — 배급사 소개</span>
            <h2 className={styles.quote}>
              좋은 영화는 사라지지 않는다.
              <br />
              다만 옮겨질 곳을 기다릴 뿐이다.
            </h2>
          </div>

          <motion.div ref={vidRef} className={styles.video} style={vidStyle}>
            <img src={PLACEHOLDER} alt="필름 누벨 소개 영상 (placeholder)" />
            <span className={styles.videoTag}>Showreel</span>
          </motion.div>

          {/* 본문 — 영상이 우하단으로 축소되며 좌측 하단에 드러남. */}
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
