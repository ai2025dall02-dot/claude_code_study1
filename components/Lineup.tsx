"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { films } from "@/data/films";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 라인업 작품에 사진 포스터 매핑 (public/posters-photo) */
const FILM_PHOTO: Record<string, string> = {
  afterimage: "/posters-photo/m1.jpg",
  north: "/posters-photo/m4.jpg",
  exile: "/posters-photo/m3.jpg",
  salt: "/posters-photo/m8.jpg",
  winter: "/posters-photo/m6.jpg",
  reel: "/posters-photo/m2.jpg",
};

const EASE = [0.16, 1, 0.3, 1] as const;

/* 카드별 시작 y 오프셋 + delay 를 불규칙하게 (흩어져 떠오르듯) */
const OFFSETS = [
  { y: 80, delay: 0.05 },
  { y: 120, delay: 0.34 },
  { y: 48, delay: 0.5 },
  { y: 104, delay: 0.16 },
  { y: 64, delay: 0.42 },
  { y: 112, delay: 0.1 },
];

export default function Lineup() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  // ABOUT 하단~LINEUP 진입 구간에서 원이 커지며 밝은 배경이 차오름
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });
  const radius = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const clipPath = useTransform(radius, (v) => `circle(${v}% at 50% 0%)`);
  const revealOpacity = useTransform(scrollYProgress, [0, 0.96, 1], [1, 1, 0]);

  const clipFrom = reduce ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)";

  return (
    <section ref={sectionRef} className={`${styles.section} ${styles.lineup}`} id="lineup">
      {/* 원형 reveal — 밝은 배경(#f8f8f8)이 위 중앙에서 원으로 차오름 */}
      {!reduce && (
        <motion.div
          className={styles.lineupReveal}
          aria-hidden="true"
          style={{ clipPath, opacity: revealOpacity }}
        />
      )}

      <div className={styles.inner}>
        <header className={styles.head}>
          <div>
            <span className={styles.eyebrow}>The Programme</span>
            <TypeTitle solid="LINE" outline="UP" />
          </div>
          <span className={styles.index}>현재 배급 · 2024–2025 / 전 {films.length}편</span>
        </header>

        <div className={styles.grid}>
          {films.map((f, i) => {
            const off = OFFSETS[i % OFFSETS.length];
            return (
              <motion.a
                key={f.id}
                className={styles.card}
                href="#contact"
                initial={{ opacity: 0, y: reduce ? 0 : off.y }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-18% 0px" }}
                transition={{ duration: 0.95, ease: EASE, delay: reduce ? 0 : off.delay }}
              >
                <motion.div
                  className={styles.card__media}
                  initial={{ clipPath: clipFrom }}
                  whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
                  viewport={{ once: true, margin: "-18% 0px" }}
                  transition={{ duration: 0.95, ease: EASE, delay: reduce ? 0 : off.delay }}
                >
                  <motion.div
                    className={styles.card__mediaInner}
                    initial={{ scale: reduce ? 1 : 1.25 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: "-18% 0px" }}
                    transition={{ duration: 1.25, ease: EASE, delay: reduce ? 0 : off.delay }}
                  >
                    <Image
                      src={FILM_PHOTO[f.id] ?? "/posters-photo/m1.jpg"}
                      alt={`${f.title} 스틸`}
                      fill
                      sizes="(max-width: 600px) 50vw, (max-width: 980px) 50vw, 33vw"
                    />
                  </motion.div>
                  <span className={styles.card__idx}>{f.index}</span>
                  <span className={styles.card__status}>{f.status}</span>
                </motion.div>
                <div className={styles.card__body}>
                  <span className={styles.card__title}>{f.title}</span>
                  <span className={styles.card__en}>{f.titleEn}</span>
                  <span className={styles.card__meta}>
                    {f.director} · {f.country} {f.year} · {f.format} · {f.genre}
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
