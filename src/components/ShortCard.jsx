// ============================================================
// 역할: 단답형(주관식) 연습 한 문제 - 답을 직접 입력하고 [채점하기]를 누르면 바로 결과와 해설을 보여 줌
// props
//   - question        : 단답형 문제 데이터 (question, passage?, answerText, explanation ...)
//   - number, total   : 문제 번호 / 전체 문제 수
//   - value           : 입력한 답
//   - onChange        : 입력이 바뀔 때 호출
//   - checked         : 채점을 마쳤는지
//   - correct         : 채점 결과 (맞았는지)
//   - forced          : "내 답이 맞아요"로 직접 정정했는지
//   - onCheck         : [채점하기] 를 눌렀을 때
//   - onGiveUp        : [모르겠어요] 를 눌렀을 때 (정답 보기)
//   - onForceCorrect  : [내 답이 맞아요] 를 눌렀을 때
// 입력한 값과 채점 결과는 부모(PracticeRunner)가 들고 있습니다.
// ============================================================
import Markdown from './Markdown';

function ShortCard({ question, number, total, value, onChange, checked, correct, forced, onCheck, onGiveUp, onForceCorrect }) {
  const hasInput = String(value ?? '').trim() !== '';

  // Enter 키로도 채점
  function handleKeyDown(e) {
    if (e.key === 'Enter' && hasInput && !checked) onCheck();
  }

  return (
    <div className="quiz-card">
      <div className="quiz-top">
        <div className="quiz-number">
          문제 {number} / {total}
        </div>
        <span className="badge cat-badge">{question.category}</span>
      </div>

      <h3 className="quiz-question">
        <Markdown inline text={question.question} />
      </h3>
      {question.passage && (
        <div className="passage passage-text">
          <Markdown text={question.passage} />
        </div>
      )}

      <input
        type="text"
        className="short-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={checked}
        placeholder="정답을 입력하세요 (한글 또는 영문)"
        autoComplete="off"
        aria-label="단답형 답 입력"
      />

      {!checked && (
        <div className="btn-row">
          <button className="btn btn-primary" onClick={onCheck} disabled={!hasInput}>
            채점하기
          </button>
          <button className="btn btn-ghost" onClick={onGiveUp}>
            모르겠어요 (정답 보기)
          </button>
        </div>
      )}

      {checked && (
        <div className={correct ? 'feedback ok' : 'feedback ng'}>
          <strong>{correct ? (forced ? '✔ 정답으로 처리했어요.' : '✔ 정답입니다!') : '✖ 아쉬워요.'}</strong>
          <p>
            <b>정답</b> <Markdown inline text={question.answerText} />
          </p>
          <Markdown text={question.explanation} />
          {!correct && hasInput && (
            <div>
              <button className="btn btn-small btn-ghost" onClick={onForceCorrect}>
                내 답이 맞아요 (정답으로 정정)
              </button>
              <p className="muted small">표현이 조금 달라도 같은 뜻이면 직접 정정할 수 있어요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ShortCard;
