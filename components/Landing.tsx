"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
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

/* 작업1: CONTACT 진입 시 아래→위로 걷히는 검은 커튼 패널 수 (모바일은 CSS 로 4개만 노출) */
const PANELS = 6;
/* 작업2: 라인 아웃라인 제거 + 한 글자씩 타이핑되는 리드 문구 */
const LEAD_TEXT = "한 편의 영화를 극장으로 옮기고 싶다면.";

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

  // 작업1: 검은 패널 커튼 — 아래→위로 순차(stagger)로 걷히며 CONTACT 를 드러냄
  const revealGroup: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const revealPanel: Variants = {
    hidden: { y: "0%" }, // 처음엔 콘텐츠를 완전히 덮음
    show: { y: "-100%", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  // 작업2: 리드 문구 타이핑 — 글자 컨테이너(패널 리빌 뒤 delayChildren 0.5s) + 글자별 fade-up
  const leadGroup: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045, delayChildren: 0.5 } },
  };
  const leadChar: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  };

  // JOURNAL→CONTACT 전환: JOURNAL 섹션이 화면 위로 빠져나가는 마지막 1뷰포트 구간에
  // 내용이 떠오르며(위로 이동) 페이드·축소되어 퇴장 → 이어서 CONTACT 커튼 리빌이 걷힘.
  // offset ["end end","end start"]: 섹션 하단이 뷰포트 하단→상단으로 이동하는 동안 0→1.
  const journalRef = useRef<HTMLElement>(null);
  const { scrollYProgress: journalExit } = useScroll({
    target: journalRef,
    offset: ["end end", "end start"],
  });
  // reduce 모션이면 이동/투명/축소 모두 정지값으로 → 전환 애니메이션 없이 그대로.
  const jExitY = useTransform(journalExit, [0, 1], [0, reduce ? 0 : -160]);
  const jExitOpacity = useTransform(journalExit, [0, 0.35, 0.9], [1, 1, reduce ? 1 : 0]);
  const jExitScale = useTransform(journalExit, [0, 1], [1, reduce ? 1 : 0.96]);

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
      <section ref={journalRef} className={`${styles.section} ${styles.journal}`} id="journal">
        {/* 스크롤 연동 퇴장 래퍼: 섹션이 위로 빠져나갈 때 내용이 떠오르며 페이드·축소 */}
        <motion.div className={styles.inner} style={{ y: jExitY, opacity: jExitOpacity, scale: jExitScale }}>
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
        </motion.div>
      </section>

      {/* ── CONTACT + FOOTER (black) ───────────── */}
      <section className={`${styles.section} ${styles.contact}`} id="contact">
        {/* 작업1: 검은 패널 커튼 리빌. 진입 시 아래→위로 순차로 걷힘. once:true 로 1회만.
            reduce 모션이면 오버레이 자체를 렌더하지 않아 콘텐츠가 즉시 보임 */}
        {!reduce && (
          <motion.div
            className={styles.contactReveal}
            variants={revealGroup}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "0px 0px -20% 0px" }}
            aria-hidden="true"
          >
            {Array.from({ length: PANELS }).map((_, i) => (
              <motion.span key={i} className={styles.contactReveal__panel} variants={revealPanel} />
            ))}
          </motion.div>
        )}

        <div className={styles.inner}>
          <header className={styles.head}>
            <div>
              <span className={styles.eyebrow}>Contact &amp; Acquisitions</span>
              <h2 className={styles.title}>
                CON<em>TACT</em>
              </h2>
            </div>
            {/* 작업3: 기존 우측 인덱스 문구는 리드 위 kicker(.contactKicker)로 이동 → 중복 제거 */}
          </header>

          {/* 작업3: TRIONN 식 재배치 — 좌: 아이브로우+대형 리드 / 우: CTA / 하단: 연락처 4열 */}
          <div className={styles.contactGrid}>
            <div className={styles.contactMain}>
              <span className={styles.contactKicker}>상영 · 배급 제안 환영</span>
              {/* 작업2: em 아웃라인 제거 → 흰색 솔리드. 글자별 타이핑(reduce 면 통 텍스트) */}
              {reduce ? (
                <p className={styles.contactLead}>{LEAD_TEXT}</p>
              ) : (
                <motion.p
                  className={styles.contactLead}
                  variants={leadGroup}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  aria-label={LEAD_TEXT}
                >
                  {LEAD_TEXT.split("").map((ch, i) => (
                    <motion.span
                      key={i}
                      className={styles.contactLead__char}
                      variants={leadChar}
                      aria-hidden="true"
                    >
                      {ch === " " ? " " : ch}
                    </motion.span>
                  ))}
                  <span className={styles.contactLead__caret} aria-hidden="true" />
                </motion.p>
              )}
            </div>

            <div className={styles.contactCta}>
              <a className={styles.contactCta__link} href="mailto:booking@film-nouvelle.example">
                협업 시작하기 <span aria-hidden="true">→</span>
              </a>
            </div>

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
