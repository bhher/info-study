// ============================================================
// 역할: 시험 문제 한 개를 보여 주고 답을 받는 부품 (객관식 / 주관식 공통)
// props
//   - question        : 시험 문제 데이터
//   - number          : 문제 번호
//   - value           : 현재 답 (객관식: 보기 번호, 주관식: 입력한 글자)
//   - onChange        : 답이 바뀔 때 호출 (새 답을 넘겨 줌)
//   - readOnly        : true 면 답을 고르거나 입력할 수 없음 (오답노트에서 문제만 볼 때)
//   - highlightAnswer : true 면 정답 보기를 초록색으로 표시 (readOnly 일 때 사용)
// ============================================================
import { CIRCLED_NUMBERS, formatScore, getQuestionFormat } from '../utils/examUtils';
import Markdown from './Markdown';

function ExamQuestion({ question, number, value, onChange, readOnly = false, highlightAnswer = false }) {
  const isChoice = question.type === 'choice';

  // 보기 한 줄의 모양
  function optionClass(index) {
    let cls = 'option';
    if (!readOnly && value === index) cls += ' selected';
    if (highlightAnswer && index === question.answer) cls += ' correct';
    if (readOnly) cls += ' static';
    return cls;
  }

  return (
    <div className="exam-question">
      <div className="exam-q-head">
        <span className="q-no">{number ? `문제 ${number}` : '문제'}</span>
        <span className="q-meta">
          {getQuestionFormat(question)}
          {question.points != null ? ` · ${formatScore(question.points)}점` : ''}
        </span>
        <span className="q-cat">{question.category}</span>
      </div>

      <h3 className="q-text">
        <Markdown inline text={question.question} />
      </h3>

      {question.passage && (
        <div className="passage passage-text">
          <Markdown text={question.passage} />
        </div>
      )}

      {isChoice ? (
        <ul className="options">
          {question.options.map((option, index) => (
            <li key={index}>
              <button
                type="button"
                className={optionClass(index)}
                disabled={readOnly}
                // 이미 고른 보기를 다시 누르면 선택이 취소됩니다.
                onClick={() => onChange(value === index ? null : index)}
              >
                <span className="opt-no">{CIRCLED_NUMBERS[index]}</span>
                <Markdown inline text={option} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !readOnly && (
          <div className="short-answer">
            <input
              type="text"
              className="short-input"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="정답을 입력하세요"
              autoComplete="off"
              aria-label="주관식 답 입력"
            />
            <p className="muted small">띄어쓰기, 대소문자, 마침표가 달라도 괜찮아요. 한글 이름이나 영문 약어 모두 정답으로 인정돼요.</p>
          </div>
        )
      )}
    </div>
  );
}

export default ExamQuestion;
