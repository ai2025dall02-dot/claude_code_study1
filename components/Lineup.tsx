"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
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

export default function Lineup() {
  const reduce = useReducedMotion();
  const clipFrom = reduce ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)";

  return (
    <section className={`${styles.section} ${styles.lineup}`} id="lineup">
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
            const delay = (i % 3) * 0.08;
            return (
              <a key={f.id} className={styles.card} href="#contact">
                {/* 스크롤 진입 시 아래→위로 클립 리빌 + 이미지 스케일 (podium 풍) */}
                <motion.div
                  className={styles.card__media}
                  initial={{ clipPath: clipFrom }}
                  whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
                  viewport={{ once: true, margin: "-12% 0px" }}
                  transition={{ duration: 0.95, ease: EASE, delay }}
                >
                  <motion.div
                    className={styles.card__mediaInner}
                    initial={{ scale: reduce ? 1 : 1.25 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: "-12% 0px" }}
                    transition={{ duration: 1.2, ease: EASE, delay }}
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
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
