// ============================================================
// 역할: 여러 문제(객관식/단답형)를 처음부터 끝까지 진행하는 부품
//   문제 풀이 → 바로 채점 + 해설 → [다음 문제] → 마지막 문제 뒤 결과(점수) 화면
// props
//   - questions  : 문제 배열 (객관식 type:'choice', 단답형 type:'short' 를 섞어도 됨)
//   - title      : 퀴즈 제목 (예: '필기 연습')
//   - onComplete : (선택) 끝냈을 때 호출 (details = [{ questionId, isCorrect }], 맞힌 개수)
//   - onRestart  : [새 문제로 다시 풀기] 를 눌렀을 때 호출 (부모가 새 문제를 만들어 줌)
//   - onExit     : (선택) [그만 풀기 / 설정으로] 를 눌렀을 때 호출
// ※ 부모가 key 를 바꿔 주면 이 부품이 처음 상태로 다시 만들어집니다.
// ============================================================
import { useRef, useState } from 'react';
import QuizCard from './QuizCard';
import ShortCard from './ShortCard';
import ProgressBar from './ProgressBar';
import Markdown from './Markdown';
import { checkAnswer, getCorrectAnswerText, getUserAnswerText } from '../utils/examUtils';

function PracticeRunner({ questions, title, onComplete, onRestart, onExit }) {
  const [index, setIndex] = useState(0); // 지금 몇 번째 문제인지 (0부터)
  const [answers, setAnswers] = useState({}); // { 문제 위치: 고른 번호 또는 입력한 글자 }
  const [checked, setChecked] = useState({}); // { 문제 위치: 채점을 마쳤는지 }
  const [forced, setForced] = useState({}); // { 문제 위치: 직접 "맞아요"로 정정했는지 }
  const [finished, setFinished] = useState(false); // 결과 화면을 보여 줄지
  const reported = useRef(false); // onComplete 를 한 번만 부르기 위한 표시

  if (questions.length === 0) {
    return <p className="empty-box">풀 문제가 없어요. 조건을 바꿔 보세요.</p>;
  }

  const total = questions.length;
  const question = questions[index];
  const isChoice = question.type === 'choice';

  // i 번째 문제를 맞혔는지
  const isCorrectAt = (i) => Boolean(forced[i]) || (answers[i] !== undefined && checkAnswer(questions[i], answers[i]));
  const score = questions.filter((q, i) => checked[i] && isCorrectAt(i)).length;
  const done = Boolean(checked[index]);

  // 객관식: 보기를 누르면 바로 채점
  function handleSelect(choice) {
    if (done) return;
    setAnswers({ ...answers, [index]: choice });
    setChecked({ ...checked, [index]: true });
  }

  // 단답형
  function handleCheck() {
    setChecked({ ...checked, [index]: true });
  }
  function handleGiveUp() {
    setAnswers({ ...answers, [index]: answers[index] ?? '' });
    setChecked({ ...checked, [index]: true });
  }

  function handleNext() {
    if (index === total - 1) {
      setFinished(true);
      if (!reported.current) {
        reported.current = true;
        if (onComplete) {
          const details = questions.map((q, i) => ({ questionId: q.id, isCorrect: isCorrectAt(i) }));
          onComplete(details, score);
        }
      }
      return;
    }
    setIndex(index + 1);
  }

  // ---------- 결과 화면 ----------
  if (finished) {
    const percent = Math.round((score / total) * 100);
    return (
      <div className="panel quiz-result">
        <h2>🎉 {title} 결과</h2>
        <div className="result-score">
          <strong>{score}</strong> / {total}
        </div>
        <p className="muted">정답률 {percent}% · 틀린 문제는 오답노트에 저장되었어요.</p>

        <ul className="result-list">
          {questions.map((q, i) => {
            const ok = isCorrectAt(i);
            return (
              <li key={q.id} className={ok ? 'ok' : 'ng'}>
                <span className="mark">{ok ? '○' : '✕'}</span>
                <div className="result-body">
                  <div className="result-q">
                    <Markdown inline text={q.passage && q.type === 'short' ? q.passage : q.question} />
                  </div>
                  <div className="muted small">
                    정답: <Markdown inline text={getCorrectAnswerText(q)} />
                    {!ok && <span> · 내 답: {getUserAnswerText(q, answers[i])}</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="btn-row">
          <button className="btn btn-primary" onClick={onRestart}>
            🔁 새 문제로 다시 풀기
          </button>
          {onExit && (
            <button className="btn btn-ghost" onClick={onExit}>
              설정으로 돌아가기
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------- 문제 풀이 화면 ----------
  return (
    <div>
      <ProgressBar value={((index + (done ? 1 : 0)) / total) * 100} label={title} text={`${index + 1} / ${total}`} />
      {isChoice ? (
        <QuizCard question={question} selected={checked[index] ? answers[index] : undefined} onSelect={handleSelect} number={index + 1} total={total} />
      ) : (
        <ShortCard
          key={question.id}
          question={question}
          number={index + 1}
          total={total}
          value={answers[index]}
          onChange={(value) => setAnswers({ ...answers, [index]: value })}
          checked={done}
          correct={isCorrectAt(index)}
          forced={Boolean(forced[index])}
          onCheck={handleCheck}
          onGiveUp={handleGiveUp}
          onForceCorrect={() => setForced({ ...forced, [index]: true })}
        />
      )}
      <div className="quiz-actions">
        <span className="muted">맞힌 문제 {score}개</span>
        <div className="btn-row">
          {onExit && (
            <button className="btn btn-ghost" onClick={onExit}>
              그만 풀기
            </button>
          )}
          <button className="btn btn-primary" onClick={handleNext} disabled={!done}>
            {index === total - 1 ? '결과 보기' : '다음 문제 →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PracticeRunner;
