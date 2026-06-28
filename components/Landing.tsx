import Image from "next/image";
import { films } from "@/data/films";
import About from "@/components/About";
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

/* 영화제 초청·수상 (데모용 가상 정보) */
const FESTIVALS = [
  { yr: "2024", name: "부산국제영화제", section: "한국영화의 오늘 — 비전", film: "조용한 망명" },
  { yr: "2024", name: "전주국제영화제", section: "국제경쟁", film: "여름의 잔상" },
  { yr: "2023", name: "로테르담 국제영화제", section: "Tiger Competition", film: "북위 48도" },
  { yr: "2023", name: "야마가타 다큐멘터리", section: "International Competition", film: "필름의 끝" },
  { yr: "2022", name: "산세바스티안 영화제", section: "New Directors", film: "소금사막" },
];

/* 저널 / 소식 (데모용 가상 정보) */
const JOURNAL = [
  { date: "2024.09.02", cat: "개봉", title: "‘여름의 잔상’ 9월 전국 개봉 — 감독과의 대화 일정 공개" },
  { date: "2024.07.18", cat: "인터뷰", title: "정하루 감독 “인화되지 않은 빛에 대하여”" },
  { date: "2024.06.30", cat: "상영회", title: "16mm 아카이브 특별전 ‘필름의 끝’ 단독 상영" },
  { date: "2024.05.12", cat: "소식", title: "필름 누벨, 2025 라인업 2편 추가 확정" },
];

const FOOTER_NAV = ["ABOUT", "LINEUP", "FILMMAKERS", "FESTIVALS", "JOURNAL", "CONTACT"];

export default function Landing() {
  return (
    <div className={styles.land}>
      {/* ── ABOUT (scroll-darkening bg, fade-up, text-reveal) ─ */}
      <About />

      {/* ── LINEUP ─────────────────────────────── */}
      <section className={`${styles.section} ${styles.lineup}`} id="lineup">
        <div className={styles.inner}>
          <header className={styles.head}>
            <div>
              <span className={styles.eyebrow}>The Programme</span>
              <h2 className={styles.title}>
                LINE<em>UP</em>
              </h2>
            </div>
            <span className={styles.index}>현재 배급 · 2024–2025 / 전 {films.length}편</span>
          </header>

          <div className={styles.grid}>
            {films.map((f) => (
              <a key={f.id} className={styles.card} href="#contact">
                <div className={styles.card__media}>
                  <Image
                    src={FILM_PHOTO[f.id] ?? "/posters-photo/m1.jpg"}
                    alt={`${f.title} 스틸`}
                    fill
                    sizes="(max-width: 600px) 50vw, (max-width: 980px) 50vw, 33vw"
                  />
                  <span className={styles.card__idx}>{f.index}</span>
                  <span className={styles.card__status}>{f.status}</span>
                </div>
                <div className={styles.card__body}>
                  <span className={styles.card__title}>{f.title}</span>
                  <span className={styles.card__en}>{f.titleEn}</span>
                  <span className={styles.card__meta}>
                    {f.director} · {f.country} {f.year} · {f.format} · {f.genre}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILMMAKERS ─────────────────────────── */}
      <section className={`${styles.section} ${styles.makers}`} id="filmmakers">
        <div className={styles.inner}>
          <header className={styles.head}>
            <div>
              <span className={styles.eyebrow}>Directors &amp; Authors</span>
              <h2 className={styles.title}>
                FILM<em>MAKERS</em>
              </h2>
            </div>
            <span className={styles.index}>우리가 동행하는 작가들</span>
          </header>

          {films.map((f) => (
            <a key={f.id} className={styles.maker} href="#contact">
              <span className={styles.maker__idx}>{f.index}</span>
              <span className={styles.maker__name}>
                {f.director}
                <span>{f.country}</span>
              </span>
              <span className={styles.maker__film}>
                <b>{f.title}</b> · {f.titleEn}
              </span>
              <span className={styles.maker__arrow} aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M3 10L10 3M10 3H4M10 3v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── FESTIVALS ──────────────────────────── */}
      <section className={`${styles.section} ${styles.fests}`} id="festivals">
        <div className={styles.inner}>
          <header className={styles.head}>
            <div>
              <span className={styles.eyebrow}>Selections &amp; Awards</span>
              <h2 className={styles.title}>
                FESTI<em>VALS</em>
              </h2>
            </div>
            <span className={styles.index}>국내외 영화제 초청 · 수상</span>
          </header>

          <div className={styles.festsGrid}>
            <p className={styles.festsLead}>
              우리가 고른 영화는 세계의 스크린을 먼저 통과합니다.
              <small>
                필름 누벨의 라인업은 부산에서 로테르담까지, 작가의 첫 영화가 관객을
                만나는 가장 먼 길을 함께합니다.
              </small>
            </p>

            <div>
              {FESTIVALS.map((fe) => (
                <div key={`${fe.yr}-${fe.film}`} className={styles.fest}>
                  <span className={styles.fest__yr}>{fe.yr}</span>
                  <span className={styles.fest__name}>
                    {fe.name}
                    <span>{fe.section}</span>
                  </span>
                  <span className={styles.fest__film}>{fe.film}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── JOURNAL ────────────────────────────── */}
      <section className={`${styles.section} ${styles.journal}`} id="journal">
        <div className={styles.inner}>
          <header className={styles.head}>
            <div>
              <span className={styles.eyebrow}>News &amp; Notes</span>
              <h2 className={styles.title}>
                JOUR<em>NAL</em>
              </h2>
            </div>
            <span className={styles.index}>개봉 · 인터뷰 · 상영회</span>
          </header>

          <div className={styles.posts}>
            {JOURNAL.map((p) => (
              <a key={p.title} className={styles.post} href="#contact">
                <span className={styles.post__date}>{p.date}</span>
                <span>
                  <span className={styles.post__cat}>{p.cat}</span>
                  <span className={styles.post__title}>{p.title}</span>
                </span>
                <span className={styles.post__more}>READ →</span>
              </a>
            ))}
          </div>
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
