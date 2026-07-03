"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
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

/* 가로 블라인드 슬랫 1개. 훅 규칙 준수를 위해 useTransform 을 슬랫 컴포넌트 내부에서 호출
   (부모 map 안에서 직접 useTransform 하면 훅 규칙 위반).
   밝은 JOURNAL 위에서 검은 슬랫이 "차오르며 덮는" 방향(scaleY 0→1).
   작업1: 레퍼런스처럼 아래→위로 차오르게 — 맨 아래 슬랫(index=SLATS-1)이 먼저, 위로 갈수록 나중. */
const SLATS = 10;
const SLAT_STEP = 0.05; // 슬랫 사이 시작 지연(아래 슬랫부터)
const SLAT_WINDOW = 0.3; // 슬랫 하나가 펼쳐지는 구간(맨 위 슬랫: 0.45+0.3=0.75 → JOURNAL 이 절반쯤 빠지기 전 완전히 덮음)
function RevealSlat({ index, progress }: { index: number; progress: MotionValue<number> }) {
  // 작업1: 시작 지연을 아래 슬랫 기준으로 뒤집음(맨 아래=index SLATS-1 이 progress 0 부근 먼저 펼쳐짐)
  const start = (SLATS - 1 - index) * SLAT_STEP;
  const scaleY = useTransform(progress, [start, start + SLAT_WINDOW], [0, 1]);
  return <motion.span className={styles.blind__slat} style={{ scaleY }} />;
}

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

  // 작업5: CONTACT 콘텐츠 일괄 등장 — 하나의 stagger 컨테이너로 묶어 아래→위로 순차 fade-up.
  // contentGroup 은 .inner 와 .contactGrid 양쪽에 재활용(빈 hidden/show + staggerChildren)해
  // 헤더/리드/CTA/연락처/footer 가 커튼 리빌과 비슷한 타이밍에 스르륵 올라오게 함.
  const contentGroup: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };
  const contentItem: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  // 블라인드 트리거 = JOURNAL 섹션 퇴장 스크롤. offset ["end end","end start"]: JOURNAL 하단이
  // 뷰포트 하단→상단으로 이동하는 동안 0→1. JOURNAL 은 마지막 섹션이 아니라(아래 CONTACT 존재)
  // 1까지 확실히 완주됨. 이 진행도에 검은 슬랫이 "밝은 JOURNAL 위로 차오르는" 것을 연동.
  const journalRef = useRef<HTMLElement>(null);
  const { scrollYProgress: journalExit } = useScroll({
    target: journalRef,
    offset: ["end end", "end start"],
  });
  // 진단 결과: journalExit 는 0→0.93 까지 도달(JOURNAL 하단=CONTACT 상단이라 마지막 섹션
  // 기하로 1엔 못 미침). 슬랫 매핑은 마지막 슬랫이 0.75 에 완전히 덮이도록 잡아 문제없이 다 채워짐.

  // 작업2: CONTACT 콘텐츠가 블라인드가 차오르는 흐름을 따라 아래→위로 슬라이드 인.
  // 같은 journalExit 에 연동: [0.1, 0.8] 구간에서 y 120px→0 (블라인드 완주 0.75 즈음 제자리 도달).
  // reduce 면 이동 없이 0 고정.
  const contactSlideY = useTransform(journalExit, [0.1, 0.8], [reduce ? 0 : 120, 0]);

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
        {/* 근본수정: 검은 가로 블라인드를 "밝은 JOURNAL(흰 배경) 위"에 얹어 대비가 보이게 함.
            (기존엔 검은 CONTACT 배경 위라 검정-검정 무대비로 안 보였음.) JOURNAL 이 위로 빠지는
            journalExit 에 맞춰 슬랫이 위→아래 순차로 차오르며 밝은 콘텐츠를 덮음 → 화면이 검게 되고
            그 아래 검은 CONTACT 로 자연스럽게 이어짐. pointer-events:none / reduce 면 미렌더 / 역스크롤 시 역재생. */}
        {!reduce && (
          <div className={styles.blind} aria-hidden="true">
            {Array.from({ length: SLATS }).map((_, i) => (
              <RevealSlat key={i} index={i} progress={journalExit} />
            ))}
          </div>
        )}
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
      {/* 블라인드는 JOURNAL 섹션으로 이동(밝은 배경 위에서 보이게). CONTACT 는 블라인드가 걷힌 뒤
          자연스럽게 이어지는 검은 콘텐츠. 등장은 콘텐츠 stagger(whileInView)로 유지. */}
      <section className={`${styles.section} ${styles.contact}`} id="contact">
        {/* 콘텐츠 전체를 하나의 stagger 컨테이너로 묶어 아래에서 위로 순차 등장.
            작업2: 여기에 스크롤 연동 y(contactSlideY)를 더해 블라인드가 차오르는 흐름을 따라
            컨테이너째 아래→위로 슬라이드 인(내부 아이템 stagger 는 그대로). */}
        <motion.div
          className={styles.inner}
          style={{ y: contactSlideY }}
          variants={contentGroup}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
        >
          {/* 작업1: 킥커 삭제. 헤더도 등장 아이템 */}
          <motion.header className={styles.head} variants={contentItem}>
            <div>
              <span className={styles.eyebrow}>Contact &amp; Acquisitions</span>
              <h2 className={styles.title}>
                CON<em>TACT</em>
              </h2>
            </div>
          </motion.header>

          <motion.div className={styles.contactGrid} variants={contentGroup}>
            {/* 작업4: 타이핑 제거 → 일반 텍스트(흰색 솔리드). 등장 아이템 */}
            <motion.div className={styles.contactMain} variants={contentItem}>
              <p className={styles.contactLead}>한 편의 영화를 극장으로 옮기고 싶다면.</p>
            </motion.div>

            {/* 작업1: 우측 열 상단 = CTA */}
            <motion.div className={styles.contactCta} variants={contentItem}>
              <a className={styles.contactCta__link} href="mailto:booking@film-nouvelle.example">
                협업 시작하기 <span aria-hidden="true">→</span>
              </a>
            </motion.div>

            {/* 작업1: 우측 열 하단 = 연락처 2×2 */}
            <motion.div className={styles.ciList} variants={contentItem}>
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
            </motion.div>
          </motion.div>

          {/* 작업2: 내비 링크 제거 → 로고(좌) ↔ 저작권/주소(우) 가로 양끝 정렬 */}
          <motion.footer className={styles.footer} variants={contentItem}>
            <div className={styles.footer__brand}>
              필름 누벨
              <small>FILM NOUVELLE</small>
            </div>
            <p className={styles.footer__fine}>
              © 2026 FILM NOUVELLE. 모든 작품·인물은 데모용 가상 정보입니다.
              <br />
              서울특별시 마포구 와우산로 00, 3층 · booking@film-nouvelle.example
            </p>
          </motion.footer>
        </motion.div>
      </section>
    </div>
  );
}
