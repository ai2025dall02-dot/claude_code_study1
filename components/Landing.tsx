"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import About from "@/components/About";
import Lineup from "@/components/Lineup";
import Filmmakers from "@/components/Filmmakers";
import Festivals from "@/components/Festivals";
import TypeTitle from "@/components/TypeTitle";
import styles from "./Landing.module.css";

/* 저널 / 소식 (데모용 가상 정보) */
const JOURNAL = [
  { date: "2024.09.02", cat: "개봉", title: "‘여름의 잔상’ 9월 전국 개봉 — 감독과의 대화 일정 공개" },
  { date: "2024.07.18", cat: "인터뷰", title: "정하루 감독 “인화되지 않은 빛에 대하여”" },
  { date: "2024.06.30", cat: "상영회", title: "16mm 아카이브 특별전 ‘필름의 끝’ 단독 상영" },
  { date: "2024.05.12", cat: "소식", title: "필름 누벨, 2025 라인업 2편 추가 확정" },
];

const FOOTER_NAV = ["ABOUT", "LINEUP", "FILMMAKERS", "FESTIVALS", "JOURNAL", "CONTACT"];

export default function Landing() {
  const reduce = useReducedMotion();

  // 작업2: JOURNAL 리스트 등장 — 다른 섹션과 같은 stagger 컨테이너 + fade-up item 컨벤션
  const postGroup: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  };
  const postItem: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className={styles.land}>
      {/* ── ABOUT (scroll-darkening bg, fade-up, text-reveal) ─ */}
      <About />

      {/* ── LINEUP (타이핑 제목 + 스크롤 리빌 이미지) ─ */}
      <Lineup />

      {/* ── FILMMAKERS (sunty.ae 풍 가로 카드 캐러셀) ─ */}
      <Filmmakers />

      {/* ── FESTIVALS (ABOUT 식 fade-up/line 등장 + 대형 리스트) ─ */}
      <Festivals />

      {/* ── JOURNAL ────────────────────────────── */}
      <section className={`${styles.section} ${styles.journal}`} id="journal">
        <div className={styles.inner}>
          <header className={styles.head}>
            <div>
              <span className={styles.eyebrow}>News &amp; Notes</span>
              {/* 제목 타이핑: 하단 -45% → 제목이 화면 하단에서 45% 위(대략 화면 중앙쯤)까지
                  올라왔을 때 발동. (이 % 를 키우면 더 늦게(더 올라와야) 발동) */}
              <TypeTitle solid="JOUR" outline="NAL" inViewMargin="0px 0px -45% 0px" />
            </div>
            <span className={styles.index}>개봉 · 인터뷰 · 상영회</span>
          </header>

          {/* 리스트 stagger: 하단 -40% → 리스트가 화면 중앙 근처까지 올라왔을 때 아래→위 순차 등장.
              (이 % 를 키우면 더 늦게 발동) once:true 로 1회만 재생. 호버 CSS(padding/READ)는 그대로 */}
          <motion.div
            className={styles.posts}
            variants={postGroup}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "0px 0px -40% 0px" }}
          >
            {JOURNAL.map((p) => (
              <motion.a
                key={p.title}
                className={styles.post}
                href="#contact"
                variants={postItem}
              >
                <span className={styles.post__date}>{p.date}</span>
                <span>
                  <span className={styles.post__cat}>{p.cat}</span>
                  <span className={styles.post__title}>{p.title}</span>
                </span>
                <span className={styles.post__more}>READ →</span>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT + FOOTER (black) ───────────── */}
      <section className={`${styles.section} ${styles.contact}`} id="contact">
        <div className={styles.inner}>
          <header className={styles.head}>
            <div>
              <span className={styles.eyebrow}>Contact &amp; Acquisitions</span>
              <h2 className={styles.title}>
                CON<em>TACT</em>
              </h2>
            </div>
            <span className={styles.index}>상영 · 배급 제안 환영</span>
          </header>

          <div className={styles.contactGrid}>
            <p className={styles.contactLead}>
              한 편의 영화를 <em>극장으로</em> 옮기고 싶다면.
            </p>

            <div className={styles.ciList}>
              <div>
                <p className={styles.ci__label}>배급 · 상영 문의</p>
                <p className={styles.ci__value}>
                  <a href="mailto:booking@film-nouvelle.example">booking@film-nouvelle.example</a>
                </p>
              </div>
              <div>
                <p className={styles.ci__label}>작품 제안 (Acquisitions)</p>
                <p className={styles.ci__value}>
                  <a href="mailto:acquisitions@film-nouvelle.example">acquisitions@film-nouvelle.example</a>
                </p>
              </div>
              <div>
                <p className={styles.ci__label}>전화</p>
                <p className={styles.ci__value}>02-1234-5678 (평일 10–18시)</p>
              </div>
              <div>
                <p className={styles.ci__label}>스튜디오</p>
                <p className={styles.ci__value}>서울특별시 마포구 와우산로 00, 3층</p>
              </div>
            </div>
          </div>

          <footer className={styles.footer}>
            <div className={styles.footer__brand}>
              필름 누벨
              <small>FILM NOUVELLE</small>
            </div>
            <nav className={styles.footer__nav}>
              {FOOTER_NAV.map((l) => (
                <a key={l} href={`#${l.toLowerCase()}`}>
                  {l}
                </a>
              ))}
            </nav>
            <p className={styles.footer__fine}>
              © 2026 FILM NOUVELLE. 모든 작품·인물은 데모용 가상 정보입니다.
              <br />
              서울특별시 마포구 와우산로 00, 3층 · booking@film-nouvelle.example
            </p>
          </footer>
        </div>
      </section>
    </div>
  );
}
