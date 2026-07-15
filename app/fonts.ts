import localFont from "next/font/local";

// 공용 Anton(단일 weight 400) — 히어로 워드마크 + 섹션 제목(TypeTitle)이 공유.
// 이 빌드 환경은 Google Fonts 다운로드가 불안정해 woff2 를 self-host(app/fonts) 후 next/font/local 로 로드.
// variable(--font-anton)로 노출 → layout 에서 html 에 적용하면 CSS 어디서든 var(--font-anton) 사용 가능.
export const anton = localFont({
  src: "./fonts/anton-latin.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-anton",
});
