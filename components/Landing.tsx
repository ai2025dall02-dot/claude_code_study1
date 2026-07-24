"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import About from "@/components/About";
import Lineup from "@/components/Lineup";
import Filmmakers from "@/components/Filmmakers";
import Festivals from "@/components/Festivals";
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
  { date: "2023.12.10", cat: "상영회", title: "연말 회고전 ‘조용한 망명’ — 김도연 감독 GV" },
  { date: "2023.11.03", cat: "개봉", title: "‘만조의 방’ 11월 개봉 — 정하루 신작 예매 오픈" },
  { date: "2023.09.27", cat: "소식", title: "필름 누벨, 부산국제영화제 세일즈 라운지 운영" },
  { date: "2023.08.15", cat: "인터뷰", title: "Yuki Tanaka “16mm로 남기는 마지막 문장”" },
];

/* 저널 페이지네이션(데스크톱/모바일 공통). 페이지당: 데스크톱 8 / 모바일 5(100vh sticky 에 맞춤). */
const JOURNAL_PAGE_SIZE = 8;
const JOURNAL_PAGE_SIZE_MOBILE = 5;
/* 상단 필터 탭 순서(고정). ALL + 사용 중인 카테고리. */
const JOURNAL_CATS = ["ALL", "개봉", "인터뷰", "상영회", "소식"] as const;

/* 가로 블라인드 슬랫 1개. 훅 규칙 준수를 위해 useTransform 을 슬랫 컴포넌트 내부에서 호출
   (부모 map 안에서 직접 useTransform 하면 훅 규칙 위반).
   밝은 JOURNAL 위에서 검은 슬랫이 "차오르며 덮는" 방향(scaleY 0→1), 아래→위 순차.
   작업2: sticky 트랙 진행도(journalProgress)의 "뒤 구간"에서만 발동 → 앞 구간은 JOURNAL 체류.
   REVEAL_FROM 부터 전환 시작(이 값을 낮추면 체류 짧아지고 전환 빨라짐). */
/* ── 무게감/타이밍 조절점 ──────────────────────────────────────────────
   · 체류 길이: .journalScroller height (CSS, 길수록 묵직) — 현재 340vh
   · 블라인드 시작: REVEAL_FROM (뒤로 미룰수록 앞 체류 ↑)
   · 블라인드 무게: SLAT_STEP(stagger 간격 ↑ = 한 장씩 묵직) / SLAT_WINDOW(슬랫 펼침 구간)
   · 감속 스무딩: SPRING(아래) stiffness ↓ = 더 무거움 / damping ↑ = 급정지 없이 부드럽게
   · CONTACT 상승: contactRevealY 구간(아래) — 블라인드보다 살짝 뒤에서 시작 */
const SLATS = 10;
// 작업1: 블라인드 시작을 0.5 → 0.56 으로 미뤄 앞쪽 순수 체류를 넉넉히 확보.
const REVEAL_FROM = 0.56;
// 작업2: stagger 간격 ↑(0.03→0.033, 한 장씩 묵직) + 전체 진행을 REVEAL_FROM~1.0 에 넓게 퍼지게.
const SLAT_STEP = 0.033; // 슬랫 사이 시작 지연(아래 슬랫부터)
const SLAT_WINDOW = 0.14; // 맨 위 슬랫: 0.56+9*0.033+0.14 ≈ 1.0 → 트랙 끝에서 완전히 덮임(더 긴 스크롤 = 무겁게)
// 작업2: journalProgress 를 스프링으로 감싸 묵직·부드럽게(급가속/급정지 방지). stiffness↓/damping↑ = 더 무겁게.
const SPRING = { stiffness: 70, damping: 26, mass: 1.1 };
function RevealSlat({ index, progress }: { index: number; progress: MotionValue<number> }) {
  // 아래 슬랫(index=SLATS-1)이 REVEAL_FROM 부근 먼저, 위로 갈수록 나중에 펼쳐짐
  const start = REVEAL_FROM + (SLATS - 1 - index) * SLAT_STEP;
  const scaleY = useTransform(progress, [start, start + SLAT_WINDOW], [0, 1]);
  return <motion.span className={styles.blind__slat} style={{ scaleY }} />;
}

export default function Landing() {
  const reduce = useReducedMotion();

  // 방향 전환: 모바일도 데스크탑과 '동일한 구조'(JOURNAL sticky 트랙 + 블라인드 + CONTACT 오버레이
  // 커튼)를 그대로 사용한다. 그래야 데스크탑에서 정상 동작하는 "블라인드 아래→위 + CONTACT 내용이
  // 같은 progress 로 함께 올라옴"이 모바일에서도 같은 코드로 동작한다(크기만 CSS 미디어쿼리로 조정).
  // flat = 접근성(reduce) 일 때만 sticky/블라인드/커튼을 끄고 일반 흐름 폴백으로 렌더.
  const flat = reduce;

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
  // 작업2: 스크롤 진행도를 스프링으로 스무딩 → 블라인드/CONTACT 가 묵직하게 따라오고 부드럽게 정착.
  // (오버댐프: damping 26 > 임계 ~17.5 라 오버슈트 없이 부드럽게 멈춤. reduce 면 오버레이/블라인드 미렌더라 미사용.)
  const journalSmooth = useSpring(journalProgress, SPRING);

  // 작업3: 블라인드와 CONTACT 등장을 "하나의 흐름"으로 — CONTACT 를 sticky 패널 오버레이로 얹어
  // 같은(스무딩된) 진행도로 올림. 블라인드보다 살짝 뒤(0.62)에서 시작해 이어서 따라 올라오는 시차.
  // [0.62, 1.0] 에서 y 100%(패널 아래) → 0%(제자리). 끝점 1.0 유지 → 트랙 끝에서 정확히 안착.
  const contactRevealY = useTransform(journalSmooth, [0.62, 1.0], ["100%", "0%"]);

  // 반응형: 페이지당 개수만 결정(모바일에도 페이지네이션 적용). 리빌 로직은 제거됨.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // 상단 카테고리 필터 + 페이지네이션(데스크톱/모바일 공통). 필터가 바뀌면 1페이지로 리셋.
  const [activeCat, setActiveCat] = useState<(typeof JOURNAL_CATS)[number]>("ALL");
  const [journalPage, setJournalPage] = useState(0);
  const selectCat = (c: (typeof JOURNAL_CATS)[number]) => {
    setActiveCat(c);
    setJournalPage(0);
  };
  const filtered = activeCat === "ALL" ? JOURNAL : JOURNAL.filter((p) => p.cat === activeCat);
  const pageSize = isMobile ? JOURNAL_PAGE_SIZE_MOBILE : JOURNAL_PAGE_SIZE;
  const journalPageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(journalPage, journalPageCount - 1); // 필터/리사이즈로 페이지 초과 시 클램프
  const visiblePosts = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const goJournalPage = (p: number) => setJournalPage(Math.max(0, Math.min(journalPageCount - 1, p)));

  // 작업3: CONTACT 콘텐츠(헤더/그리드/footer). 오버레이(비-reduce)와 일반 섹션(reduce) 양쪽에서
  // 재사용. 내부 아이템 stagger(contentGroup/contentItem)는 그대로. slide-up 은 바깥 래퍼가 담당.
  const contactInner = (
    <motion.div
      className={styles.inner}
      variants={contentGroup}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
    >
      {/* 상단(세로 중앙): eyebrow + 대형 CONTACT 워드마크(정적 솔리드) + 설명 + 솔리드 버튼 */}
      <div className={styles.contactTop}>
        <motion.span className={styles.eyebrow} variants={contentItem}>
          Contact &amp; Acquisitions
        </motion.span>
        {/* 정적 솔리드 워드마크(애니메이션·아웃라인 없음) */}
        <h2 className={styles.title}>CONTACT</h2>
        <motion.p className={styles.contactLead} variants={contentItem}>
          한 편의 영화를 극장으로 옮기고 싶다면.
        </motion.p>
        <motion.a
          className={styles.contactBtn}
          href="mailto:booking@film-nouvelle.example"
          variants={contentItem}
        >
          CONTACT <span aria-hidden="true">&gt;</span>
        </motion.a>
      </div>

      {/* 하단(아래 고정): 좌 = 스튜디오 주소 + 저작권 / 우 = FOLLOW US */}
      <motion.div className={styles.contactBottom} variants={contentItem}>
        <div className={styles.contactBottom__left}>
          <div className={styles.ci}>
            <p className={styles.ci__label}>스튜디오</p>
            <p className={styles.ci__value}>서울특별시 마포구 와우산로 00, 3층</p>
          </div>
          <p className={styles.footer__fine}>© 2026 FILM NOUVELLE INC. ALL RIGHTS RESERVED</p>
        </div>
        <div className={styles.followUs} data-cursor-square>
          <p className={styles.ci__label}>Follow Us</p>
          <a className={styles.followUs__link} href="#">Instagram</a>
          <a className={styles.followUs__link} href="#">Youtube</a>
        </div>
      </motion.div>
    </motion.div>
  );

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

      {/* ── JOURNAL (sticky 체류 트랙) + CONTACT 오버레이 ──────────
          작업3: CONTACT 를 JOURNAL sticky 패널 안 오버레이로 얹어, 블라인드 상승과 CONTACT 등장을
          같은 journalProgress 로 이어지게 함(트랙 밖 별도 스크롤 제거 → 끊김/지연 없음).
          reduce 면 sticky/오버레이 없이 JOURNAL·CONTACT 를 일반 흐름으로 렌더. */}
      <div
        ref={journalTrackRef}
        id="journalTrack"
        className={flat ? undefined : styles.journalScroller}
      >
        <div className={flat ? undefined : styles.journalSticky}>
          <section className={`${styles.section} ${styles.journal}`} id="journal">
            {/* 검은 가로 블라인드를 밝은 JOURNAL 위에 얹어 대비가 보이게 함. journalProgress 뒤 구간
                (REVEAL_FROM~)에서 슬랫이 아래→위로 차오르며 덮음. pointer-events:none / reduce·모바일 면 미렌더. */}
            {!flat && (
              <div className={styles.blind} aria-hidden="true">
                {/* 작업2: 스무딩된 진행도(journalSmooth)로 묵직·부드럽게 차오름 */}
                {Array.from({ length: SLATS }).map((_, i) => (
                  <RevealSlat key={i} index={i} progress={journalSmooth} />
                ))}
              </div>
            )}
            <div className={styles.inner}>
              <header className={styles.head}>
                <div>
                  <span className={styles.eyebrow}>News &amp; Notes</span>
                  {/* 정적 타이틀(타이핑 애니메이션 제거) — solid(JOUR)+outline(NAL) 구조 유지 */}
                  <h2 className={styles.title} aria-label="JOURNAL">
                    <span aria-hidden="true">JOUR</span>
                    <em aria-hidden="true">NAL</em>
                  </h2>
                </div>
              </header>

              {/* 상단 카테고리 필터 탭 — 활성 검정 볼드 / 나머지 회색. 클릭 시 해당 cat 만 필터(페이지 리셋). */}
              <nav className={styles.journalFilter} aria-label="카테고리 필터">
                {JOURNAL_CATS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={styles.journalFilter__tab}
                    data-active={activeCat === c}
                    aria-pressed={activeCat === c}
                    onClick={() => selectCat(c)}
                  >
                    {c}
                  </button>
                ))}
              </nav>

              {/* 리스트 — 처음부터 정적 표시(애니메이션 없음). 행: 윗줄 cat(작은 메타) / 아랫줄 제목(볼드, 좌) + 날짜(우) */}
              <div className={styles.posts}>
                {visiblePosts.map((p) => (
                  <a key={p.title} className={styles.post} href="#contact">
                    <span className={styles.post__cat}>{p.cat}</span>
                    <span className={styles.post__main}>
                      <span className={styles.post__title}>{p.title}</span>
                      <span className={styles.post__date}>{p.date}</span>
                    </span>
                  </a>
                ))}
              </div>

              {/* 저널 페이지네이션 — 데스크톱/모바일 공통. 필터 결과가 1페이지면 미표시. */}
              {journalPageCount > 1 && (
                <nav className={styles.pagination} aria-label="저널 페이지" data-cursor="light" data-cursor-square>
                  <button
                    type="button"
                    className={styles.pageArrow}
                    onClick={() => goJournalPage(page - 1)}
                    disabled={page === 0}
                    aria-label="이전 페이지"
                  >
                    ←
                  </button>
                  {Array.from({ length: journalPageCount }, (_, p) => (
                    <button
                      key={p}
                      type="button"
                      className={styles.pageNum}
                      data-active={p === page}
                      aria-current={p === page ? "page" : undefined}
                      aria-label={`${p + 1}페이지`}
                      onClick={() => goJournalPage(p)}
                    >
                      {p + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.pageArrow}
                    onClick={() => goJournalPage(page + 1)}
                    disabled={page === journalPageCount - 1}
                    aria-label="다음 페이지"
                  >
                    →
                  </button>
                </nav>
              )}
            </div>

            {/* 작업3: 비-reduce — CONTACT 를 sticky 패널 안 오버레이(z-index 블라인드 위)로. 블라인드가
                차오르는 것과 거의 동시에(journalProgress [0.55,1]) y 100%→0% 로 아래에서 올라와 제자리.
                이게 페이지의 마지막 화면(트랙 끝)이 됨 → 스크롤 지연 없이 바로 이어짐. */}
            {!flat && (
              <motion.section
                id="contact"
                className={`${styles.section} ${styles.contact} ${styles.contactReveal}`}
                style={{ y: contactRevealY }}
              >
                {contactInner}
              </motion.section>
            )}
          </section>
        </div>
      </div>

      {/* reduce 폴백: sticky/블라인드/커튼 없이 CONTACT 를 일반 흐름 섹션으로(즉시 표시).
          (모바일은 위 데스크탑 구조를 그대로 타므로 여기 안 옴 — reduce 전용) */}
      {flat && (
        <section className={`${styles.section} ${styles.contact}`} id="contact">
          {contactInner}
        </section>
      )}
    </div>
  );
}
