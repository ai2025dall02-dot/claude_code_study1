export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__top">
          <div>
            <p className="footer__brand-ko">필름 누벨</p>
            <p className="footer__brand-en">Film Nouvelle</p>
          </div>
          <nav className="footer__nav" aria-label="푸터 메뉴">
            <a href="#programme">라인업</a>
            <a href="#about">배급사</a>
            <a href="#contact">상영문의</a>
            <a href="mailto:booking@film-nouvelle.example">이메일</a>
          </nav>
        </div>
        <div className="footer__bottom">
          <p className="footer__fine">
            © 2026 FILM NOUVELLE. 모든 작품·인물은 데모용 가상 정보입니다.
            <br />
            서울특별시 마포구 와우산로 00, 3층 · booking@film-nouvelle.example
          </p>
          <p className="footer__fine">
            독립 · 예술영화 배급
            <br />
            Seoul · Since 2014
          </p>
        </div>
      </div>
    </footer>
  );
}
