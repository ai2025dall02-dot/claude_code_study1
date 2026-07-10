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
  { date: "2023.12.10", cat: "상영회", title: "연말 회고전 ‘조용한 망명’ — 김도연 감독 GV" },
  { date: "2023.11.03", cat: "개봉", title: "‘만조의 방’ 11월 개봉 — 정하루 신작 예매 오픈" },
  { date: "2023.09.27", cat: "소식", title: "필름 누벨, 부산국제영화제 세일즈 라운지 운영" },
  { date: "2023.08.15", cat: "인터뷰", title: "Yuki Tanaka “16mm로 남기는 마지막 문장”" },
];

/* 저널 페이지네이션(데스크톱/노트북/태블릿 전용). 페이지당 8개 → 총 12개면 1페이지 8 + 2페이지 4(2페이지).
   모바일은 페이지 없이 리빌로 전체 노출. */
const JOURNAL_PAGE_SIZE = 8;

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
  // 작업2: 스크롤 진행도를 스프링으로 스무딩 → 블라인드/CONTACT 가 묵직하게 따라오고 부드럽게 정착.
  // (오버댐프: damping 26 > 임계 ~17.5 라 오버슈트 없이 부드럽게 멈춤. reduce 면 오버레이/블라인드 미렌더라 미사용.)
  const journalSmooth = useSpring(journalProgress, SPRING);

  // 작업3: 블라인드와 CONTACT 등장을 "하나의 흐름"으로 — CONTACT 를 sticky 패널 오버레이로 얹어
  // 같은(스무딩된) 진행도로 올림. 블라인드보다 살짝 뒤(0.62)에서 시작해 이어서 따라 올라오는 시차.
  // [0.62, 1.0] 에서 y 100%(패널 아래) → 0%(제자리). 끝점 1.0 유지 → 트랙 끝에서 정확히 안착.
  const contactRevealY = useTransform(journalSmooth, [0.62, 1.0], ["100%", "0%"]);

  // 작업1(모바일 ≤767px): JOURNAL 리스트를 5개만 먼저 노출 → 스크롤을 내리면 숨은 6~8번째가 아래에서
  // 위로 올라오며 드러나고, 다 올라오면 하단 마스크가 사라진 뒤 sticky 로 잠깐 고정 → 블라인드로 이어짐.
  // 데스크탑엔 이 리빌/마스크를 적용하지 않는다(구조·동작 그대로). isMobile 로만 게이팅.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // 저널 페이지네이션: 데스크톱/태블릿만 현재 페이지 4개 슬라이스. 모바일은 전체(리빌로 노출) → 리빌 로직과 충돌 없음.
  const [journalPage, setJournalPage] = useState(0);
  const journalPageCount = Math.ceil(JOURNAL.length / JOURNAL_PAGE_SIZE);
  const visiblePosts = isMobile
    ? JOURNAL
    : JOURNAL.slice(journalPage * JOURNAL_PAGE_SIZE, (journalPage + 1) * JOURNAL_PAGE_SIZE);
  const goJournalPage = (p: number) => setJournalPage(Math.max(0, Math.min(journalPageCount - 1, p)));

  // 리스트 리빌 측정: 5개까지의 창 높이(winHeight)와, 숨은 3개를 끌어올릴 거리(revealDistance).
  // .posts 그리드의 6번째 자식 상단(=5개 높이)을 창으로, 전체높이-창 을 이동거리로 사용(리사이즈 시 재측정).
  const postsInnerRef = useRef<HTMLDivElement>(null);
  const [winHeight, setWinHeight] = useState(0);
  const [revealDistance, setRevealDistance] = useState(0);
  useEffect(() => {
    const measure = () => {
      const inner = postsInnerRef.current;
      if (!inner || inner.children.length < 6) return;
      const top0 = (inner.children[0] as HTMLElement).offsetTop;
      const top5 = (inner.children[5] as HTMLElement).offsetTop; // 6번째 상단 = 앞 5개 높이
      const win = top5 - top0;
      setWinHeight(win);
      setRevealDistance(Math.max(0, inner.scrollHeight - win));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // isMobile 전환 시 노출 항목 수(데스크톱 4 ↔ 모바일 8)가 바뀌므로 재측정(모바일 리빌 창 높이 정확히).
  }, [isMobile]);

  // 모바일에서만 리빌 적용(reduce 접근성 폴백 제외). 데스크탑은 y:0·마스크 미표시로 현행 유지.
  const applyReveal = !reduce && isMobile;
  // 리빌 구간[0.05,0.42]: 숨은 리스트를 위(-revealDistance)로 끌어올림(스크롤 직결, 스무딩 없이 반응성 유지).
  const listY = useTransform(journalProgress, [0.05, 0.42], [0, -revealDistance]);
  // 마스크: 리빌 종료 지점[0.42,0.52]에서 투명화(아래로 사라짐). 이후 [0.52,0.56] sticky 유지 → 0.56~ 블라인드.
  const maskOpacity = useTransform(journalProgress, [0.42, 0.52], [1, 0]);

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
      <motion.header className={styles.head} variants={contentItem}>
        <div>
          <span className={styles.eyebrow}>Contact &amp; Acquisitions</span>
          <h2 className={styles.title}>
            CON<em>TACT</em>
          </h2>
        </div>
      </motion.header>

      <motion.div className={styles.contactGrid} variants={contentGroup}>
        {/* 좌: 대형 리드 */}
        <motion.div className={styles.contactMain} variants={contentItem}>
          <p className={styles.contactLead}>한 편의 영화를 극장으로 옮기고 싶다면.</p>
        </motion.div>

        {/* 우측 상단 = CTA */}
        <motion.div className={styles.contactCta} variants={contentItem}>
          <a className={styles.contactCta__link} href="mailto:booking@film-nouvelle.example">
            협업 시작하기 <span aria-hidden="true">→</span>
          </a>
        </motion.div>

        {/* 우측 하단 = 연락처 2×2 */}
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
      <div ref={journalTrackRef} className={flat ? undefined : styles.journalScroller}>
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
                  {/* 제목 타이핑: 하단 -45% 지점(대략 화면 중앙)까지 올라오면 발동 */}
                  <TypeTitle solid="JOUR" outline="NAL" inViewMargin="0px 0px -45% 0px" />
                </div>
                <span className={styles.index}>개봉 · 인터뷰 · 상영회</span>
              </header>

              {/* 작업1(모바일): 리스트 창(.postsWin) — 모바일에선 max-height=5개·overflow:hidden 으로 5개만
                  보이고, 안쪽 트랙(.postsTrack)이 listY 로 위로 올라오며 6~8번째가 드러남. 하단 마스크(.postsMask)
                  가 항상 흰색 그라데이션으로 아래 리스트를 가리다 리빌 끝(maskOpacity)에서 사라짐. 데스크탑은
                  maxHeight 미적용·마스크 display:none·y:0 이라 현행과 동일. */}
              <div
                className={styles.postsWin}
                style={applyReveal && winHeight ? { maxHeight: winHeight } : undefined}
              >
                <motion.div
                  className={styles.postsTrack}
                  style={{ y: applyReveal ? listY : 0 }}
                >
                  {/* 리스트 stagger: 화면 근처에 오면 아래→위 순차 등장.
                      key={journalPage}: 페이지 전환 시 리마운트 → stagger 리빌이 새 페이지 항목에도 다시 실행되게
                      함(안 그러면 부모 stagger 가 재오케스트레이션 안 돼 새 항목이 opacity 0 로 남음). 모바일은
                      journalPage 가 0 고정이라 리마운트 없음(리빌 측정·동작 그대로). viewport 는 데스크톱 페이지
                      전환(스크롤 위치 무관)에도 확실히 발동하도록 amount 기반으로. */}
                  <motion.div
                    key={journalPage}
                    ref={postsInnerRef}
                    className={styles.posts}
                    variants={postGroup}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.1 }}
                  >
                    {visiblePosts.map((p) => (
                      <motion.a key={p.title} className={styles.post} href="#contact" variants={postItem}>
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
                <motion.div
                  className={styles.postsMask}
                  aria-hidden="true"
                  style={{ opacity: applyReveal ? maskOpacity : 0 }}
                />
              </div>

              {/* 저널 페이지네이션 — 데스크톱/노트북/태블릿에서만(모바일은 리빌로 전체 노출 → 숨김: isMobile + CSS). */}
              {!isMobile && journalPageCount > 1 && (
                <nav className={styles.pagination} aria-label="저널 페이지">
                  <button
                    type="button"
                    className={styles.pageArrow}
                    onClick={() => goJournalPage(journalPage - 1)}
                    disabled={journalPage === 0}
                    aria-label="이전 페이지"
                  >
                    ←
                  </button>
                  {Array.from({ length: journalPageCount }, (_, p) => (
                    <button
                      key={p}
                      type="button"
                      className={styles.pageNum}
                      data-active={p === journalPage}
                      aria-current={p === journalPage ? "page" : undefined}
                      aria-label={`${p + 1}페이지`}
                      onClick={() => goJournalPage(p)}
                    >
                      {p + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.pageArrow}
                    onClick={() => goJournalPage(journalPage + 1)}
                    disabled={journalPage === journalPageCount - 1}
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
