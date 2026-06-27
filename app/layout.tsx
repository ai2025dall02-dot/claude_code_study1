import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  Nanum_Myeongjo,
  Noto_Sans_KR,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

// 라틴 디스플레이 (브랜드·영문 제목)
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display-en",
  display: "swap",
});

// 한글 디스플레이 (포스터 제목) — CJK는 preload 미사용
const nanum = Nanum_Myeongjo({
  weight: ["400", "700", "800"],
  variable: "--font-display-ko",
  display: "swap",
  preload: false,
});

// 본문 (라틴 + 한글 모두 커버)
const noto = Noto_Sans_KR({
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
  display: "swap",
  preload: false,
});

// 메타데이터 (연도·러닝타임·포맷)
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://film-nouvelle.example"),
  title: "필름 누벨 — 독립·예술영화 배급",
  description:
    "변방의 영화를 스크린 한가운데로. 필름 누벨은 국내외 독립·예술영화를 발굴해 극장과 관객을 잇는 배급사입니다.",
  keywords: ["독립영화", "예술영화", "영화배급", "아트하우스", "필름 누벨"],
  openGraph: {
    title: "필름 누벨 — 독립·예술영화 배급",
    description: "변방의 영화를 스크린 한가운데로.",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0C0E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${playfair.variable} ${nanum.variable} ${noto.variable} ${mono.variable}`}
    >
      <body>
        <a className="skip-link" href="#programme">
          본문으로 건너뛰기
        </a>
        {children}
      </body>
    </html>
  );
}
