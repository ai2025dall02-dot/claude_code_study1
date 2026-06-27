# 필름 누벨 (FILM NOUVELLE)

독립·예술영화 배급사를 위한 원페이지 웹사이트입니다. **가상 브랜드**이며, 모든 작품·인물 정보는 데모용 플레이스홀더입니다.

> 변방의 영화를 스크린 한가운데로.

## 기술 스택

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Framer Motion** — 시네마틱 모션 (카운트다운 리더 인트로, 시네마스코프 레터박스, 스크롤 스태거)
- **next/font** 셀프 호스팅 폰트 — Playfair Display · 나눔명조 · Noto Sans KR · JetBrains Mono
- 빌드 도구 없는 순수 CSS 디자인 토큰 (`app/globals.css`)

## 디자인 컨셉

아트하우스 극장의 **상영 프로그램(필름 슬레이트)** 형식.

| 항목 | 선택 |
|------|------|
| 컬러 | 잉크 블랙 `#0C0C0E` · 스크린 본 `#ECE7DC` · 프로젝터 앰버 `#E4A23B`(단일 액센트) |
| 타이포 | 제목 Playfair/나눔명조 · 본문 Noto Sans KR · 메타데이터 JetBrains Mono |
| 시그니처 | 페이지 로드 시 필름 카운트다운 리더(3·2·1) → 레터박스 오픈 |
| 번호 슬레이트 | 01–06, 실제 라인업 순서를 나타내는 의미적 장치 |

## 접근성 · 성능

- `prefers-reduced-motion` 존중 (리더 인트로 자동 생략, 모든 트랜지션 비활성화)
- 키보드 포커스 링, 본문 건너뛰기 링크, `aria-expanded`/`aria-controls`/`aria-live`
- transform·opacity 기반 애니메이션 (레이아웃 시프트 없음), 셀프 호스팅 폰트로 FOIT 방지
- 반응형: 375 / 768 / 1024 / 1440px

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

프로덕션 빌드:

```bash
npm run build
npm run start
```

## 구조

```
app/
  layout.tsx      폰트 · 메타데이터
  page.tsx        섹션 조립
  globals.css     디자인 토큰 · 전체 스타일
components/
  LeaderIntro.tsx 카운트다운 리더 인트로
  Hero.tsx        레터박스 히어로
  Programme.tsx   작품 슬레이트(아코디언)
  Manifesto.tsx   배급사 소개 · 원칙
  Contact.tsx     상영 문의 폼
  Nav.tsx Footer.tsx
data/
  films.ts        가상 라인업 데이터
```
