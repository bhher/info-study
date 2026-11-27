// ============================================================
// 역할: 앱의 시작점. React 앱을 index.html 의 <div id="root"> 에 붙입니다.
//   - BrowserRouter : 주소(URL)에 따라 화면을 바꿔 주는 라우터
//   - StudyProvider : 학습 기록(암기, 오답노트 등)을 모든 화면이 함께 쓰게 해 주는 상자
// ============================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { StudyProvider } from './context/StudyContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StudyProvider>
        <App />
      </StudyProvider>
    </BrowserRouter>
  </React.StrictMode>
);
