// ============================================================
// 역할: 용어 암기 카드 한 장 (설명을 보고 용어를 떠올려 보는 카드)
// props
//   - term               : 단답형/용어 데이터 (question, passage?, answerText, explanation, category ...)
//   - hideAnswer         : true 면 정답(용어)을 가리고 [정답 확인] 버튼을 보여 줌 (암기 연습용)
//   - memorized, favorite: 암기 완료 / 즐겨찾기 여부
//   - onToggleMemorized, onToggleFavorite, onDetail : 각 버튼을 눌렀을 때 호출
//   - actionLabel        : 암기 버튼 글자 (오늘의 학습에서는 '학습 완료')
// ※ 정답이 보이는지(revealed)는 이 카드 안에서만 쓰는 값이라 카드가 직접 가집니다.
// ============================================================
import { useState } from 'react';
import Markdown from './Markdown';

function TermCard({
  term,
  hideAnswer,
  memorized,
  favorite,
  onToggleMemorized,
  onToggleFavorite,
  onDetail, // 없으면 [상세 보기] 버튼을 보여 주지 않음
  actionLabel = '암기 완료',
}) {
  const [revealed, setRevealed] = useState(false); // [정답 확인]을 눌렀는지
  const showAnswer = !hideAnswer || revealed; // 정답을 보여 줄지
  const description = term.passage ?? term.question;

  return (
    <article className={memorized ? 'term-card memorized' : 'term-card'}>
      <div className="term-top">
        <span className="badge cat-badge">{term.category}</span>
        <button
          className={favorite ? 'icon-btn star on' : 'icon-btn star'}
          onClick={onToggleFavorite}
          aria-label={favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          title="즐겨찾기"
        >
          {favorite ? '★' : '☆'}
        </button>
      </div>

      <p className="term-desc">
        <Markdown inline text={description} />
      </p>

      <div className="term-answer-area">
        {showAnswer ? (
          <>
            <div className="term-answer">
              <Markdown inline text={term.answerText} />
            </div>
            {hideAnswer && (
              <button className="link-btn" onClick={() => setRevealed(false)}>
                다시 가리기
              </button>
            )}
          </>
        ) : (
          <button className="btn btn-ghost" onClick={() => setRevealed(true)}>
            👀 정답 확인
          </button>
        )}
      </div>

      <div className="term-actions">
        {onDetail && (
          <button className="btn btn-small btn-ghost" onClick={onDetail}>
            해설 보기
          </button>
        )}
        <button className={memorized ? 'btn btn-small btn-done' : 'btn btn-small btn-primary'} onClick={onToggleMemorized}>
          {memorized ? `✔ ${actionLabel}` : actionLabel}
        </button>
      </div>
    </article>
  );
}

export default TermCard;
