// ============================================================
// 역할: 실기 기출 문제 한 개 (코드 해석, 서술형 등 "스스로 풀어 보고 정답을 확인하는" 문제)
//   - 제목을 누르면 문제가 펼쳐지고, [정답 확인]으로 정답과 해설을 봅니다.
//   - [이해 완료]로 학습 기록을 남기고, ☆ 로 다시 볼 문제를 표시합니다.
// props
//   - item               : 실기 문제 데이터 (exam, title, category, question, answer, explanation)
//   - done, favorite     : 이해 완료 / 즐겨찾기 여부
//   - onToggleDone, onToggleFavorite : 각 버튼을 눌렀을 때 호출
//   - defaultOpen        : 처음부터 펼쳐 둘지 (오늘의 학습에서는 true)
//   - actionLabel        : 완료 버튼 글자
// ※ 펼침/정답 보이기는 이 카드 안에서만 쓰는 값이라 카드가 직접 가집니다.
// ============================================================
import { useState } from 'react';
import Markdown from './Markdown';

function PracticalCard({ item, done, favorite, onToggleDone, onToggleFavorite, defaultOpen = false, actionLabel = '이해 완료' }) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <article className={done ? 'practical-card done' : 'practical-card'}>
      <div className="practical-head">
        <button className="practical-title" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="chev">{open ? '▾' : '▸'}</span>
          <span className="practical-title-text">{item.title}</span>
        </button>
        <span className="badge">{item.exam}</span>
        <span className="badge cat-badge">{item.category}</span>
        <button
          className={favorite ? 'icon-btn star on' : 'icon-btn star'}
          onClick={onToggleFavorite}
          aria-label={favorite ? '다시 볼 문제에서 해제' : '다시 볼 문제로 표시'}
          title="다시 볼 문제"
        >
          {favorite ? '★' : '☆'}
        </button>
      </div>

      {open && (
        <div className="practical-body">
          <div className="practical-section">
            <h4>문제</h4>
            <Markdown text={item.question} />
          </div>

          {showAnswer && (
            <>
              <div className="practical-section answer">
                <h4>정답</h4>
                <Markdown text={item.answer} />
              </div>
              {item.explanation && (
                <div className="practical-section explain">
                  <h4>해설</h4>
                  <Markdown text={item.explanation} />
                </div>
              )}
            </>
          )}

          <div className="btn-row">
            <button className="btn btn-small btn-ghost" onClick={() => setShowAnswer(!showAnswer)}>
              {showAnswer ? '정답 숨기기' : '👀 정답 확인'}
            </button>
            <button className={done ? 'btn btn-small btn-done' : 'btn btn-small btn-primary'} onClick={onToggleDone}>
              {done ? `✔ ${actionLabel}` : actionLabel}
            </button>
            <span className="muted small practical-source">{item.source}</span>
          </div>
        </div>
      )}
    </article>
  );
}

export default PracticalCard;
