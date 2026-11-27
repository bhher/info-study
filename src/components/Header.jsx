// ============================================================
// 역할: 화면 맨 위의 로고와 메뉴 (홈 / 용어 / 필기 / 단답형 / 실기 기출 / 요약노트 / 모의고사 / 오답노트)
//  - NavLink : 클릭하면 해당 페이지로 이동하고, 현재 주소와 같은 메뉴에 자동으로 active 표시
//  - 모바일에서는 햄버거 버튼으로 메뉴를 펼치고 접습니다. (open 상태)
//  - 오답노트 메뉴 옆에는 "아직 해결하지 못한 오답" 개수를 배지로 보여 줍니다.
// ============================================================
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';

// 메뉴를 배열로 만들어 두면 map 으로 한 번에 출력할 수 있고, 메뉴를 늘릴 때도 한 줄만 추가하면 됩니다.
const MENUS = [
  { path: '/', label: '홈', end: true },
  { path: '/terms', label: '용어 암기' },
  { path: '/written', label: '필기·SQLD' },
  { path: '/short', label: '단답형' },
  { path: '/practical', label: '실기 기출' },
  { path: '/notes', label: '요약노트' },
  { path: '/exam', label: '모의고사' },
  { path: '/wrong', label: '오답노트' },
];

function Header() {
  const [open, setOpen] = useState(false); // 모바일 메뉴가 펼쳐졌는지
  const { pathname } = useLocation();
  const { wrongNotes } = useStudy();

  // 아직 해결하지 못한 오답 개수
  const unsolvedCount = Object.values(wrongNotes).filter((note) => !note.solved).length;

  // 다른 페이지로 이동하면 모바일 메뉴를 자동으로 접음
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* 로고 */}
        <Link to="/" className="logo">
          <span className="logo-mark">IT</span>
          <span className="logo-text">
            <strong>Info Study</strong>
            <small>정보처리기사 필기·실기 대비</small>
          </span>
        </Link>

        {/* 메뉴 */}
        <nav className={open ? 'main-nav open' : 'main-nav'} aria-label="주 메뉴">
          {MENUS.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              end={menu.end} // '/' 는 정확히 같을 때만 active
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {menu.label}
              {menu.path === '/wrong' && unsolvedCount > 0 && <span className="nav-badge">{unsolvedCount}</span>}
            </NavLink>
          ))}
        </nav>

        {/* 모바일 햄버거 버튼 */}
        <button
          className="hamburger"
          onClick={() => setOpen(!open)}
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={open}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
}

export default Header;
