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

// 공용 본문 한글 폰트 Pretendard(가변 weight 하나로 전 굵기 커버) — 사이트 전체 한글/본문 통일.
// 이 환경은 Google Fonts/jsdelivr 다운로드가 막혀 raw.githubusercontent 에서 받은 variable woff2 를 self-host.
// variable(--font-pretendard)로 노출 → globals 의 --font-sans 스택 선두에 넣어 일괄 적용.
export const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  weight: "45 920", // 가변 폰트 weight 범위(기존 300~700 등 굵기 값 그대로 매핑됨)
  display: "swap",
  variable: "--font-pretendard",
});
