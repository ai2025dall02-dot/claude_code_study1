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
   (부모 map 안에서 직접 useTransform 하면 훅 규칙 위반). 슬랫 i 는 progress
   [i*STEP, i*STEP+WINDOW] 구간에서 scaleY 1→0 으로 위→아래 순차로 접혀 사라짐.
   (y 이동은 슬랫 자기 높이만큼만 움직여 완전히 안 걷힘 → scaleY 로 각 슬랫이 선까지 줄어들며 리빌). */
const SLATS = 10;
const SLAT_STEP = 0.05; // 슬랫 사이 시작 지연(위 슬랫부터)
const SLAT_WINDOW = 0.45; // 슬랫 하나가 접히는 구간(마지막 슬랫: 0.45+0.45=0.90 → progress 1 이전 완주,
// 동시에 진입 후반까지 덮개가 유지돼 CONTACT 가 화면을 채운 채 걷히는 게 보이도록)
function RevealSlat({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const start = index * SLAT_STEP;
  const scaleY = useTransform(progress, [start, start + SLAT_WINDOW], [1, 0]);
  return <motion.span className={styles.contactReveal__panel} style={{ scaleY }} />;
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

  // 블라인드 트리거 = CONTACT 섹션 자체 진입 스크롤. CONTACT 는 마지막 섹션이라 그 아래 여백이
  // 없어 상단이 뷰포트 최상단까지 못 올라감 → 끝점을 "start start" 로 두면 contactEnter 가 1에
  // 도달하지 못해 뒤쪽 슬랫이 안 걷혔음(진단으로 max≈0.93 확인). 끝점을 "start 25%"(상단이 뷰포트
  // 25% 지점) 로 바꿔 진입 중 0→1 을 확실히 완주 + 슬랫이 화면 대부분을 덮은 채 걷히는 게 보이게 함.
  const contactRef = useRef<HTMLElement>(null);
  const { scrollYProgress: contactEnter } = useScroll({
    target: contactRef,
    offset: ["start end", "start 25%"],
  });

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
      {/* 섹션에 ref 부착 → 커튼을 CONTACT 자체 진입 스크롤(contactEnter)에 연동 */}
      <section ref={contactRef} className={`${styles.section} ${styles.contact}`} id="contact">
        {/* 스크롤 연동 가로 블라인드: 검은 수평 슬랫 10개가 위에서부터 순차로 scaleY 1→0 접히며
            그 아래 CONTACT 내용이 드러남. 되감으면 다시 덮임. 각 슬랫 값은 RevealSlat 내부에서
            contactEnter 로 계산(훅 규칙 준수). pointer-events:none 이라 클릭/스크롤 비차단. reduce 면 미렌더. */}
        {!reduce && (
          <div className={styles.contactReveal} aria-hidden="true">
            {Array.from({ length: SLATS }).map((_, i) => (
              <RevealSlat key={i} index={i} progress={contactEnter} />
            ))}
          </div>
        )}

        {/* 작업5: 콘텐츠 전체를 하나의 stagger 컨테이너로 묶어 커튼과 함께 아래에서 위로 순차 등장.
            .inner=상위 컨테이너(헤더/그리드/footer), .contactGrid=하위 컨테이너(리드/CTA/연락처). */}
        <motion.div
          className={styles.inner}
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
