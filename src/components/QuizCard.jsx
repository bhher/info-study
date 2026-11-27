// ============================================================
// 역할: 객관식 퀴즈 한 문제 (보기를 고르면 바로 정답과 해설을 보여 줌)
// props
//   - question : { question, passage?, options, answer, explanation, category? }
//   - selected : 학생이 고른 보기 번호 (아직 안 골랐으면 undefined)
//   - onSelect : 보기를 눌렀을 때 호출 (번호를 넘겨 줌)
//   - number   : (선택) 문제 번호
//   - total    : (선택) 전체 문제 수
// 고른 값은 부모가 들고 있습니다. (필기 연습, 오늘의 미니 퀴즈, 추천 문제에서 함께 사용)
// ============================================================
import { CIRCLED_NUMBERS } from '../utils/examUtils';
import Markdown from './Markdown';

function QuizCard({ question, selected, onSelect, number, total }) {
  const answered = selected !== undefined && selected !== null;
  const isCorrect = answered && selected === question.answer;

  // 보기 모양: 정답이면 초록색, 고른 오답이면 빨간색
  function optionClass(index) {
    if (!answered) return 'option';
    if (index === question.answer) return 'option correct';
    if (index === selected) return 'option wrong';
    return 'option dim';
  }

  return (
    <div className="quiz-card">
      <div className="quiz-top">
        {number && (
          <div className="quiz-number">
            문제 {number}
            {total ? ` / ${total}` : ''}
          </div>
        )}
        {question.category && <span className="badge cat-badge">{question.category}</span>}
      </div>
      <h3 className="quiz-question">
        <Markdown inline text={question.question} />
      </h3>

      {/* 코드나 표 같은 보충 자료 */}
      {question.passage && (
        <div className="passage passage-text">
          <Markdown text={question.passage} />
        </div>
      )}

      <ul className="options">
        {question.options.map((option, index) => (
          <li key={index}>
            <button type="button" className={optionClass(index)} disabled={answered} onClick={() => onSelect(index)}>
              <span className="opt-no">{CIRCLED_NUMBERS[index]}</span>
              <Markdown inline text={option} />
            </button>
          </li>
        ))}
      </ul>

      {/* 답을 고른 뒤에만 정답 여부와 해설 표시 */}
      {answered && (
        <div className={isCorrect ? 'feedback ok' : 'feedback ng'}>
          <strong>
            {isCorrect ? '✔ 정답입니다!' : `✖ 아쉬워요. 정답은 ${CIRCLED_NUMBERS[question.answer]} 입니다.`}
          </strong>
          <Markdown text={question.explanation} />
        </div>
      )}
    </div>
  );
}

export default QuizCard;
