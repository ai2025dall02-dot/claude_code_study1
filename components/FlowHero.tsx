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

const SPREAD = 72;

export default function FlowHero() {
  const n = CARDS.length;
  const half = SPREAD / 2;

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
      <h1 className={styles.bigword} aria-label="FILM">
        FILM
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

      {/* 부채꼴 카드 */}
      <div className={styles.fan}>
        {CARDS.map((c, i) => {
          const theta = -half + (SPREAD / (n - 1)) * i;
          const t = Math.abs(theta) / half;
          const scale = 1 - 0.12 * t;
          const opacity = (1 - 0.12 * t).toFixed(2);
          const z = Math.round(100 - Math.abs(theta));
          return (
            <div
              key={c.label}
              className={styles.slot}
              style={{
                transform: `translate(-50%, -50%) rotate(${theta}deg) translateY(calc(var(--radius) * -1))`,
                zIndex: z,
                animationDelay: `${0.15 + i * 0.1}s`,
              }}
            >
              <div
                className={styles.card}
                style={{ "--s": scale, "--o": opacity } as React.CSSProperties}
              >
                <div className={styles.card__head}>
                  <span className={styles.card__label}>{c.label}</span>
                  <span className={styles.card__no}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className={styles.card__media}>
                  <Image
                    src={c.img}
                    alt={c.caption}
                    fill
                    sizes="220px"
                    priority={i < 4}
                  />
                </div>
                <span className={styles.card__cap}>{c.caption}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.tagline}>Film Nouvelle — One Reel In Infinite Flow</p>
    </section>
  );
}
