// ============================================================
// 역할: 전체 화면 뼈대와 "주소 → 페이지" 연결표(라우팅)
//   Header(항상 위에) + 페이지 내용(주소에 따라 바뀜) + Footer(항상 아래에)
// ============================================================
import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import TermStudy from './pages/TermStudy';
import Written from './pages/Written';
import Short from './pages/Short';
import Practical from './pages/Practical';
import Notes from './pages/Notes';
import Exam from './pages/Exam';
import ExamResult from './pages/ExamResult';
import WrongAnswer from './pages/WrongAnswer';
import Today from './pages/Today';
import NotFound from './pages/NotFound';

function App() {
  const { pathname } = useLocation();

  // 다른 페이지로 이동하면 화면 맨 위로 올리기
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/terms" element={<TermStudy />} />
          <Route path="/written" element={<Written />} />
          <Route path="/short" element={<Short />} />
          <Route path="/practical" element={<Practical />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/:noteId" element={<Notes />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/exam/result/:id" element={<ExamResult />} />
          <Route path="/wrong" element={<WrongAnswer />} />
          <Route path="/today" element={<Today />} />
          {/* 위 어느 주소에도 해당하지 않으면 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <p>Info Study · 정보처리기사 필기 · 실기 · SQLD 대비 학습 사이트</p>
        <p className="muted small">학습 기록은 이 브라우저(localStorage)에만 저장됩니다.</p>
      </footer>
    </div>
  );
}

export default App;
