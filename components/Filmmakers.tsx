"use client";

import { useRef } from "react";
import Image from "next/image";
import { films } from "@/data/films";
import TypeTitle from "./TypeTitle";
import styles from "./Landing.module.css";

/* 감독 카드용 사진 매핑 (public/posters-photo) — LINEUP 과 동일 매핑으로 일관성 유지 */
const MAKER_PHOTO: Record<string, string> = {
  afterimage: "/posters-photo/m1.jpg",
  north: "/posters-photo/m4.jpg",
  exile: "/posters-photo/m3.jpg",
  salt: "/posters-photo/m8.jpg",
  winter: "/posters-photo/m6.jpg",
  reel: "/posters-photo/m2.jpg",
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

export default function Filmmakers() {
  const sectionRef = useRef<HTMLElement | null>(null);

  return (
    <section ref={sectionRef} className={`${styles.section} ${styles.fm}`} id="filmmakers">
      <div className={styles.fmHead}>
        <span className={styles.eyebrow}>Directors &amp; Authors</span>
        <TypeTitle solid="FILM" outline="MAKERS" />
        <span className={styles.fmHeadSub}>우리가 동행하는 작가들</span>
      </div>

      {/* 1단계: 가로로 정적 나열 (애니메이션 없음) — 카드 UI 확정용 */}
      <div className={styles.fmViewport}>
        <div className={styles.fmTrack}>
          {MAKERS.map((m) => (
            <article key={m.id} className={styles.fmCard}>
              <div className={styles.fmCard__photo}>
                <Image
                  src={m.photo}
                  alt={`${m.name} 감독`}
                  fill
                  sizes="(max-width: 600px) 80vw, 360px"
                />
                <span className={styles.fmCard__idx}>{m.index}</span>
              </div>
              <div className={styles.fmCard__info}>
                <h3 className={styles.fmCard__name}>
                  {m.name}
                  <span>Director</span>
                </h3>
                <p className={styles.fmCard__meta}>
                  {m.country} · {m.year} · {m.genre}
                </p>
                <p className={styles.fmCard__film}>
                  <b>{m.film}</b> · {m.filmEn}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
