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
  // 16:9 고정(aspect-ratio, CSS). 폭(width)만 트윈 → 세로는 자동 → 비율 항상 유지. 우측 앵커(right:gutter).
  // [B] 축소 시작 지연: 입력 [0,0.82] → [0.15,0.9]. 0~0.15 는 '큰 영상 유지'(체류) 후 축소, 섹션 끝(≈0.9)에 완료.
  // k: 1(큰 영상, 시작) → 0(작은 영상, 끝). width 를 calc 로 보간:
  //   k=1 → calc(100vw - 2*gutter) [A: 우측 gutter 와 동일한 좌측 마진 → 양옆 대칭], k=0 → 30vw.
  // k: 1(큰 영상, 시작) → 0(작은 영상=유튜브 미니플레이어, 끝). [B] 긴 트랙에서 천천히.
  //   0.85 에 축소 완료 → 이후(0.85~1) 400×225 미니플레이어로 잠깐 머묾.
  const k = useTransform(p, [0.18, 0.85], [1, 0]);
  // [C] 최종 폭 = 고정 400px(16:9 → 세로 225px). 시작 = calc(100vw - 2*gutter)[A: 좌우 대칭].
  //   width = 400px + k*(대칭풀폭 - 400px) → k=1 대칭풀폭, k=0 400px.
  const width = useTransform(
    k,
    (v) => `calc(400px + ${v.toFixed(3)} * (100vw - 2 * var(--ln-gutter) - 400px))`
  );
  // [A] 초기 top 을 아래로(50vh) → 영상 위로 흰 배경이 크게 노출. [C] 최종 = 하단에서 225px+24px 위(미니플레이어).
  //   top = 50vh*k + (1-k)*(100vh - 249px) → k=1 50vh, k=0 calc(100vh-249px)(바닥 24px 여백).
  const top = useTransform(
    k,
    (v) => `calc(${(50 * v).toFixed(2)}vh + ${(1 - v).toFixed(3)} * (100vh - 249px))`
  );
  // [C] 우측 여백: 시작 gutter → 끝 24px(미니플레이어 우측 모서리 근처).
  const right = useTransform(
    k,
    (v) => `calc(24px + ${v.toFixed(3)} * (var(--ln-gutter) - 24px))`
  );

  // [A] "화면 고정된 채 영상만 변형" 느낌 제거 — sticky 안 콘텐츠를 스크롤에 맞춰 위로 흘려 진행감을 준다.
  //   lead(눈썹+인용문): 위로 드리프트하며 흘러 지나감 / body: 아래에서 제자리로 흘러 들어옴(물리적 노출과 함께).
  const leadY = useTransform(p, [0.12, 0.92], ["0vh", "-20vh"]);
  const bodyY = useTransform(p, [0.4, 0.92], ["9vh", "0vh"]);
  const leadStyle: MotionStyle | undefined = reduce || isMobile ? undefined : { y: leadY };
  const bodyStyle: MotionStyle | undefined = reduce || isMobile ? undefined : { y: bodyY };

  // reduce / 모바일: 모션 없이 정적(모바일은 CSS 가 static·full-width·16:9 로 override).
  const vidStyle: MotionStyle | undefined =
    reduce || isMobile ? undefined : { width, top, right };

  return (
    <section ref={ref} id="about" className={styles.about}>
      <div className={styles.pin}>
        <div className={styles.sticky}>
          <motion.div className={styles.lead} style={leadStyle}>
            <span className={styles.eyebrow}>About — 배급사 소개</span>

            <h2 className={styles.quote}>
              좋은 영화는 사라지지 않는다.
              <br />
              다만 옮겨질 곳을 기다릴 뿐이다.
            </h2>
          </motion.div>

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
