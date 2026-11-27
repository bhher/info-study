// ============================================================
// 역할: 오답노트의 문제 카드 한 장
//   - [정답 확인] [해설 확인] [다시 풀기] 버튼과 "해결했어요" 체크
//   - 다시 풀기에서 맞히면 자동으로 "해결"로 표시됩니다.
// props
//   - question        : 시험 문제 데이터
//   - note            : { count(누적 오답 횟수), solved, lastWrongAt }
//   - onSolvedChange  : 해결 여부를 바꿀 때 호출 (true / false)
// ============================================================
import { useState } from 'react';
import ExamQuestion from './ExamQuestion';
import Markdown from './Markdown';
import { checkAnswer, getCorrectAnswerText, isAnswered } from '../utils/examUtils';
import { formatDateTime } from '../utils/studyUtils';

function WrongAnswerCard({ question, note, onSolvedChange }) {
  const [showAnswer, setShowAnswer] = useState(false); // 정답을 펼쳤는지
  const [showExplain, setShowExplain] = useState(false); // 해설을 펼쳤는지
  const [retrying, setRetrying] = useState(false); // 다시 풀기 중인지
  const [value, setValue] = useState(null); // 다시 풀기에서 고른/입력한 답
  const [result, setResult] = useState(null); // null | 'correct' | 'wrong'

  // 다시 풀기 시작
  function startRetry() {
    setRetrying(true);
    setValue(null);
    setResult(null);
  }

  // 다시 풀기 채점
  function handleCheck() {
    if (!isAnswered(question, value)) return;
    if (checkAnswer(question, value)) {
      setResult('correct');
      onSolvedChange(true); // 맞혔으니 해결 처리
    } else {
      setResult('wrong');
    }
  }

  // 답을 바꾸면 이전 채점 결과는 지움
  function handleChange(newValue) {
    setValue(newValue);
    setResult(null);
  }

  return (
    <article className={note.solved ? 'wrong-card solved' : 'wrong-card'}>
      <div className="wrong-meta">
        <span className={note.solved ? 'badge badge-ok' : 'badge badge-ng'}>{note.solved ? '해결' : '미해결'}</span>
        <span className="muted small">
          누적 오답 {note.count}회 · 마지막 {formatDateTime(note.lastWrongAt)}
        </span>
      </div>

      <ExamQuestion
        question={question}
        value={value}
        onChange={handleChange}
        readOnly={!retrying}
        highlightAnswer={showAnswer && !retrying}
      />

      {/* 다시 풀기 영역 */}
      {retrying && (
        <div className="retry-box">
          <button className="btn btn-primary btn-small" onClick={handleCheck} disabled={!isAnswered(question, value)}>
            채점하기
          </button>
          {result === 'correct' && <span className="retry-msg ok">✔ 정답입니다! 해결로 표시했어요.</span>}
          {result === 'wrong' && <span className="retry-msg ng">✖ 틀렸어요. 다시 생각해 보세요.</span>}
        </div>
      )}

      {/* 정답 / 해설 */}
      {showAnswer && (
        <div className="answer-box">
          <strong>정답</strong> <Markdown inline text={getCorrectAnswerText(question)} />
        </div>
      )}
      {showExplain && (
        <div className="explain-box">
          <strong>해설</strong>
          <Markdown text={question.explanation} />
        </div>
      )}

      <div className="wrong-actions">
        <button className="btn btn-small btn-ghost" onClick={() => setShowAnswer(!showAnswer)}>
          {showAnswer ? '정답 숨기기' : '정답 확인'}
        </button>
        <button className="btn btn-small btn-ghost" onClick={() => setShowExplain(!showExplain)}>
          {showExplain ? '해설 숨기기' : '해설 확인'}
        </button>
        {retrying ? (
          <button className="btn btn-small btn-ghost" onClick={() => setRetrying(false)}>
            다시 풀기 닫기
          </button>
        ) : (
          <button className="btn btn-small btn-ghost" onClick={startRetry}>
            다시 풀기
          </button>
        )}
        <label className="check-label">
          <input type="checkbox" checked={note.solved} onChange={(e) => onSolvedChange(e.target.checked)} />
          해결했어요
        </label>
      </div>
    </article>
  );
}

export default WrongAnswerCard;
