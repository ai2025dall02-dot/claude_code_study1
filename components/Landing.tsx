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

/* 저널 / 소식 (데모용 가상 정보) — 작업1: 4개 → 8개로 확장(체류 구간 채우기) */
const JOURNAL = [
  { date: "2024.09.02", cat: "개봉", title: "‘여름의 잔상’ 9월 전국 개봉 — 감독과의 대화 일정 공개" },
  { date: "2024.07.18", cat: "인터뷰", title: "정하루 감독 “인화되지 않은 빛에 대하여”" },
  { date: "2024.06.30", cat: "상영회", title: "16mm 아카이브 특별전 ‘필름의 끝’ 단독 상영" },
  { date: "2024.05.12", cat: "소식", title: "필름 누벨, 2025 라인업 2편 추가 확정" },
  { date: "2024.04.20", cat: "개봉", title: "‘북위 48도’ 재개봉 — 4K 리마스터링 버전 공개" },
  { date: "2024.03.15", cat: "인터뷰", title: "촬영감독 이서란 “빛으로 쓰는 문장”" },
  { date: "2024.02.08", cat: "상영회", title: "겨울 아카이브전 ‘소금사막’ 감독판 상영" },
  { date: "2024.01.22", cat: "소식", title: "필름 누벨, 로테르담영화제 세일즈 부스 참가" },
];

/* 가로 블라인드 슬랫 1개. 훅 규칙 준수를 위해 useTransform 을 슬랫 컴포넌트 내부에서 호출
   (부모 map 안에서 직접 useTransform 하면 훅 규칙 위반).
   밝은 JOURNAL 위에서 검은 슬랫이 "차오르며 덮는" 방향(scaleY 0→1), 아래→위 순차.
   작업2: sticky 트랙 진행도(journalProgress)의 "뒤 구간"에서만 발동 → 앞 구간은 JOURNAL 체류.
   REVEAL_FROM 부터 전환 시작(이 값을 낮추면 체류 짧아지고 전환 빨라짐). */
const SLATS = 10;
const REVEAL_FROM = 0.5; // journalProgress 0.5 부터 블라인드 차오름 시작(앞 0~0.5 는 체류)
const SLAT_STEP = 0.03; // 슬랫 사이 시작 지연(아래 슬랫부터)
const SLAT_WINDOW = 0.2; // 슬랫 하나 펼침 구간(맨 위 슬랫: 0.5+9*0.03+0.2=0.97 → 트랙 끝나기 직전 완전히 덮음)
function RevealSlat({ index, progress }: { index: number; progress: MotionValue<number> }) {
  // 아래 슬랫(index=SLATS-1)이 REVEAL_FROM 부근 먼저, 위로 갈수록 나중에 펼쳐짐
  const start = REVEAL_FROM + (SLATS - 1 - index) * SLAT_STEP;
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

  // 작업2: JOURNAL 을 sticky 로 붙잡는 스크롤 트랙(FESTIVALS 의 scroller+sticky 패턴).
  // journalTrackRef = 높이 큰 래퍼(.journalScroller). 그 안 .journalSticky 가 100vh 로 고정돼
  // 래퍼 높이만큼 스크롤하는 동안 JOURNAL 이 화면에 머묾(체류).
  // journalProgress: 래퍼 기준 0(진입)→1(끝). 앞 0~REVEAL_FROM 은 체류, 뒤 구간에서 블라인드 발동.
  const journalTrackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: journalProgress } = useScroll({
    target: journalTrackRef,
    offset: ["start start", "end end"],
  });

  // 작업2: CONTACT slide-up. sticky 로 JOURNAL 이 핀되는 동안 CONTACT 는 화면 밖(아래)이라
  // journalProgress 에 묶으면 화면에 들어오기 전 이미 정지해버림 → 실제로 "올라오는 게" 안 보임.
  // 그래서 CONTACT 자체 진입 스크롤에 연동해, 트랙이 끝나 CONTACT 가 들어올 때 y 120px→0 로 올라오게 함.
  const contactRef = useRef<HTMLElement>(null);
  const { scrollYProgress: contactEnter } = useScroll({
    target: contactRef,
    offset: ["start end", "start center"],
  });
  const contactSlideY = useTransform(contactEnter, [0, 1], [reduce ? 0 : 120, 0]);

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

      {/* ── JOURNAL (작업2: sticky 체류 트랙) ────────────── */}
      {/* .journalScroller = 높이 큰 스크롤 래퍼(체류 길이 = 이 높이, CSS 에서 조절).
          그 안 .journalSticky 가 100vh 로 고정돼 래퍼 스크롤 동안 JOURNAL 이 화면에 머묾. */}
      <div ref={journalTrackRef} className={styles.journalScroller}>
        <div className={styles.journalSticky}>
          <section className={`${styles.section} ${styles.journal}`} id="journal">
            {/* 검은 가로 블라인드를 밝은 JOURNAL 위에 얹어 대비가 보이게 함. journalProgress 뒤 구간
                (REVEAL_FROM~)에서 슬랫이 아래→위로 차오르며 덮음 → 검게 되고 검은 CONTACT 로 이어짐.
                pointer-events:none / reduce 면 미렌더 / 역스크롤 시 역재생. */}
            {!reduce && (
              <div className={styles.blind} aria-hidden="true">
                {Array.from({ length: SLATS }).map((_, i) => (
                  <RevealSlat key={i} index={i} progress={journalProgress} />
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
        </div>
      </div>

      {/* ── CONTACT + FOOTER (black) ───────────── */}
      {/* 블라인드는 JOURNAL 섹션으로 이동(밝은 배경 위에서 보이게). CONTACT 는 블라인드가 걷힌 뒤
          자연스럽게 이어지는 검은 콘텐츠. 등장은 콘텐츠 stagger(whileInView)로 유지.
          작업2: ref={contactRef} 로 CONTACT 진입 스크롤을 측정해 slide-up 에 사용. */}
      <section ref={contactRef} className={`${styles.section} ${styles.contact}`} id="contact">
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
