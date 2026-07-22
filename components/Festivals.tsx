"use client";

// FESTIVALS — incredibles.dev "Incredible devs you can count on." 풍 재구성.
//  A. 중앙에 타이틀/본문이 "커튼(마스크)에 가려져 있다가" 아래→위로 드러남(타이틀→본문 순).
//  B. 리스트 항목 → 흰 카드로. sticky 무대에서 카드 컬럼이 스크롤에 연동해 아래→위로 흐르며
//     중앙 텍스트 위를 지나 하나씩 등장(위/아래 페이드 마스크).
//  C. 카드: 흰 배경 + 1px 검정 라인 + 어두운 텍스트.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type Variants } from "framer-motion";
import RiseTitle from "./RiseTitle";
import styles from "./Landing.module.css";

/* 영화제 초청·수상 (데모용 가상 정보). image: 카드 썸네일(/festival_*.png). */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명", image: "/festival_1.png" },
  { yr: "2024", name: "전주국제영화제", section: "국제경쟁", film: "여름의 잔상", image: "/festival_2.png" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도", image: "/festival_3.png" },
  { yr: "2023", name: "야마가타 다큐멘터리", section: "International Competition", film: "필름의 끝", image: "/festival_4.png" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막", image: "/festival_5.png" },
  { yr: "2022", name: "로카르노 영화제", section: "Concorso Cineasti del presente", film: "재의 계절", image: "/festival_6.png" },
  { yr: "2022", name: "낭트 3대륙 영화제", section: "Compétition", film: "붉은 방", image: "/festival_7.png" },
  { yr: "2021", name: "카를로비바리 영화제", section: "Proxima Competition", film: "겨울 우체국", image: "/festival_8.png" },
  { yr: "2021", name: "타이베이 금마장", section: "International New Talent", film: "빛의 문", image: "/festival_9.png" },
];

export default function Festivals() {
  const reduce = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const N = FESTIVALS.length;

  const { scrollYProgress } = useScroll({ target: scrollerRef, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.6 });

  // 카드 컬럼 이동량 계산용 측정치(카드 간 stride·첫 카드 중심·무대 높이).
  const [mtr, setMtr] = useState({ stride: 160, firstCenter: 80, stageH: 760 });
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const stage = stageRef.current;
      if (!track || !stage || track.children.length < 2) return;
      const r0 = track.children[0] as HTMLElement;
      const r1 = track.children[1] as HTMLElement;
      setMtr({
        stride: r1.offsetTop - r0.offsetTop,
        firstCenter: r0.offsetTop + r0.offsetHeight / 2,
        stageH: stage.clientHeight,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    const raf = requestAnimationFrame(measure);
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, []);

  // [B] 카드 컬럼 translateY: p=0 → 첫 카드가 화면 하단(88%)에서 진입, p=1 → 마지막 카드가 중앙(50%).
  //   → 스크롤에 따라 카드가 아래→위로 흐르며 위/아래 마스크로 페이드 인·아웃, 하나씩 등장.
  const trackY = useTransform(p, (v) => {
    if (reduce) return 0;
    const y0 = mtr.stageH * 0.88 - mtr.firstCenter;
    const y1 = mtr.stageH * 0.5 - (mtr.firstCenter + (N - 1) * mtr.stride);
    return y0 + v * (y1 - y0);
  });

  // 커튼 리빌 — 하나의 컨테이너 whileInView(once) 로 eyebrow→본문을 stagger 로 올림(개별 delay 대신
  //   staggerChildren 사용 → 트리거 신뢰성↑). 타이틀(RiseTitle)은 자체 whileInView 로 그 사이에 등장.
  const curtainGroup: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.18, delayChildren: reduce ? 0 : 0.05 } },
  };
  const curtainItem: Variants = {
    hidden: { y: reduce ? "0%" : "120%" },
    show: { y: "0%", transition: { duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className={styles.fests} id="festivals">
      <div ref={scrollerRef} className={styles.festsScroller}>
        <div className={styles.festsSticky}>
          <div ref={stageRef} className={styles.festStage}>
            {/* A. 중앙 커튼 리빌 타이틀/본문 (뒤 레이어) */}
            <motion.div
              className={styles.festHead}
              variants={curtainGroup}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-10% 0px" }}
            >
              <span className={styles.festHeadMask}>
                <motion.span className={styles.eyebrow} variants={curtainItem}>
                  Selections &amp; Awards
                </motion.span>
              </span>

              <RiseTitle solid="FESTI" outline="VALS" inViewMargin="-10% 0px" />

              <span className={styles.festHeadMask}>
                <motion.p className={styles.festHeadBody} variants={curtainItem}>
                  우리가 배급한 작품들이 국내외 영화제에서 받은 초청과 수상의 기록입니다. 부산에서
                  로테르담까지, 작가의 첫 영화가 세계의 스크린을 먼저 통과한 순간들.
                </motion.p>
              </span>
            </motion.div>

            {/* B. 카드 컬럼 (앞 레이어) — 스크롤 연동으로 아래→위 흐름 */}
            <div className={styles.festCardViewport}>
              <motion.div ref={trackRef} className={styles.festCardTrack} style={{ y: trackY }}>
                {FESTIVALS.map((fe) => (
                  <article key={fe.name} className={styles.festCard}>
                    <div className={styles.festCard__thumb}>
                      <Image src={fe.image} alt="" fill sizes="96px" />
                    </div>
                    <div className={styles.festCard__body}>
                      <span className={styles.festCard__yr}>{fe.yr}</span>
                      <h3 className={styles.festCard__name}>{fe.name}</h3>
                      <span className={styles.festCard__section}>{fe.section}</span>
                      <span className={styles.festCard__film}>배급작 · {fe.film}</span>
                    </div>
                  </article>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
