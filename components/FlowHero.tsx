import Image from "next/image";
import styles from "./FlowHero.module.css";

const NAV = ["HOME", "COMPANY", "BUSINESS", "ARTISTS", "PROJECTS", "NEWSROOM", "CONTACT"];

export type FlowCard = { label: string; caption: string; img: string };

const CARDS: FlowCard[] = [
  { label: "NOW SHOWING", caption: "여름의 잔상 · 2024", img: "/posters-photo/m1.jpg" },
  { label: "DIRECTOR", caption: "정하루 인터뷰", img: "/posters-photo/m5.jpg" },
  { label: "FESTIVAL", caption: "BUSAN 2024", img: "/posters-photo/m3.jpg" },
  { label: "SOUNDTRACK", caption: "O.S.T VOL.1", img: "/posters-photo/m7.jpg" },
  { label: "IP · REMAKE", caption: "북위 48도", img: "/posters-photo/m4.jpg" },
  { label: "ARCHIVE", caption: "필름의 끝 · 16mm", img: "/posters-photo/m2.jpg" },
];

// 원통형 덱: 카드 부족 시 자연스러운 곡면을 위해 두 바퀴로 채움
const DECK = [...CARDS, ...CARDS];
const CW = 212;
const CH = 300;
const COUNT = DECK.length;
const STEP = 360 / COUNT;
const RADIUS = Math.round((CW / 2 / Math.tan(Math.PI / COUNT)) * 1.12);

export default function FlowHero() {

  return (
    <section className={styles.stage}>
      {/* NAV */}
      <header className={styles.nav}>
        <span className={styles.nav__brand}>FILMNOUVELLE</span>
        <nav className={styles.nav__links}>
          {NAV.map((l) => (
            <a key={l} href="#">
              {l}
            </a>
          ))}
        </nav>
      </header>

      {/* 우측 아웃라인 대형 글자 */}
      <p className={styles.outline} aria-hidden="true">
        REEL
      </p>

      {/* 좌측 거대 줄무늬 디졸브 글자 */}
      <h1 className={styles.bigword} aria-label="MOVIE">
        MOVIE
      </h1>

      {/* 원형 회전 텍스트 */}
      <svg className={styles.ringText} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <path id="flowCirc" d="M50,50 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
        </defs>
        <text>
          <textPath href="#flowCirc" startOffset="0">
            FILM NOUVELLE ✦ ONE REEL IN INFINITE FLOW ✦
          </textPath>
        </text>
      </svg>

      {/* 3D 큐브 */}
      <div className={styles.cubeWrap} aria-hidden="true">
        <div className={styles.cube}>
          <i /><i /><i /><i /><i /><i />
        </div>
      </div>

      {/* 원통형 3D 카드 덱 — 바깥=고정 기울기, 안쪽=rotateY 무한회전 */}
      <div className={styles.deck}>
        <div className={styles.deckTilt}>
          <div
            className={styles.deckRing}
            style={
              {
                "--cw": `${CW}px`,
                "--ch": `${CH}px`,
                "--dur": "52s",
              } as React.CSSProperties
            }
          >
            {DECK.map((c, i) => (
              <div
                key={i}
                className={styles.cell}
                style={{ transform: `rotateY(${i * STEP}deg) translateZ(${RADIUS}px)` }}
              >
                <div className={styles.card}>
                  <div className={styles.card__head}>
                    <span className={styles.card__label}>{c.label}</span>
                    <span className={styles.card__no}>
                      {String((i % CARDS.length) + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className={styles.card__media}>
                    <Image
                      src={c.img}
                      alt={c.caption}
                      fill
                      sizes="212px"
                      priority={i < 5}
                    />
                  </div>
                  <span className={styles.card__cap}>{c.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className={styles.tagline}>Film Nouvelle — One Reel In Infinite Flow</p>
    </section>
  );
}
