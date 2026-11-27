// ============================================================
// 역할: 모의고사 결과 페이지 (/exam/result/:id)
//   - 총점(100점 만점), 합격 여부(60점 이상), 맞힌/틀린 문제 수, 정답률, 소요 시간
//   - 문제별 내 답 / 정답 / 해설 (전체 보기 / 틀린 문제만 보기)
//   - [다시 풀기], [오답노트 보기]
// 주소의 :id 로 저장된 시험 결과(examHistory)를 찾아 보여 줍니다.
// ============================================================
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QUESTION_MAP } from '../data/examData';
import { useStudy } from '../context/StudyContext';
import { formatScore, getCorrectAnswerText, getQuestionFormat, getUserAnswerText } from '../utils/examUtils';
import { formatDateTime, formatTime } from '../utils/studyUtils';
import ProgressBar from '../components/ProgressBar';
import Markdown from '../components/Markdown';

// 점수에 따른 응원 문구
function getComment(rate) {
  if (rate >= 90) return '훌륭해요! 합격권이에요. 실수만 한 번 더 점검해 보세요.';
  if (rate >= 70) return '잘했어요! 틀린 문제만 복습하면 더 좋아질 거예요.';
  if (rate >= 60) return '합격 기준선이에요. 오답노트로 약한 부분을 채워 보세요.';
  return '괜찮아요. 요약노트와 오답노트로 차근차근 다시 도전해 보세요.';
}

function ExamResult() {
  const { id } = useParams();
  const { examHistory } = useStudy();
  const [onlyWrong, setOnlyWrong] = useState(false);

  const result = examHistory.find((record) => record.id === id);

  // 주소의 결과를 찾지 못한 경우 (기록이 지워졌거나 잘못된 주소)
  if (!result) {
    return (
      <div className="page">
        <p className="empty-box">시험 결과를 찾을 수 없어요.</p>
        <p className="center-text">
          <Link className="btn btn-primary" to="/exam">
            시험 보러 가기
          </Link>
        </p>
      </div>
    );
  }

  // 결과 상세에 문제 정보를 붙여서 보여 줄 목록 만들기
  const rows = result.details
    .map((detail, index) => ({ detail, number: index + 1, question: QUESTION_MAP[detail.questionId] }))
    .filter((row) => row.question && (!onlyWrong || !row.detail.isCorrect));

  const scoreRate = result.totalPoints === 0 ? 0 : Math.round((result.score / result.totalPoints) * 100);
  const passed = scoreRate >= 60;

  return (
    <div className="page">
      <div className="page-head">
        <h1>시험 결과</h1>
        <p className="muted">
          {result.examTitle} · {formatDateTime(result.takenAt)}
        </p>
      </div>

      {/* 점수 요약 */}
      <section className="panel score-panel">
        <div className="score-big">
          <span className="score-num">{formatScore(result.score)}</span>
          <span className="score-total"> / {formatScore(result.totalPoints)}점</span>
          <span className={passed ? 'badge badge-ok pass-badge' : 'badge badge-ng pass-badge'}>{passed ? '합격 기준 통과' : '합격 기준 미달'}</span>
        </div>
        <p className="score-comment">{getComment(scoreRate)}</p>
        <ProgressBar value={result.rate} label="정답률" tone={result.rate >= 60 ? 'green' : 'orange'} />

        <ul className="info-grid">
          <li>
            <span>맞힌 문제</span>
            <strong className="text-ok">{result.correctCount}개</strong>
          </li>
          <li>
            <span>틀린 문제</span>
            <strong className="text-ng">{result.wrongCount}개</strong>
          </li>
          <li>
            <span>답 안 한 문제</span>
            <strong>{result.unansweredCount}개</strong>
          </li>
          <li>
            <span>걸린 시간</span>
            <strong>
              {formatTime(result.usedSec)} / {result.limitMin}분
            </strong>
          </li>
        </ul>

        <div className="result-actions">
          <Link className="btn btn-primary" to="/exam">
            🔁 다시 풀기
          </Link>
          <Link className="btn btn-ghost" to="/wrong">
            📒 오답노트 보기
          </Link>
        </div>
        {result.wrongCount > 0 && (
          <p className="muted small">틀린 {result.wrongCount}문제는 오답노트에 자동으로 저장되었어요.</p>
        )}
      </section>

      {/* 문제별 결과 */}
      <div className="section-head">
        <h2>문제별 결과</h2>
        <div className="seg">
          <button className={!onlyWrong ? 'seg-btn active' : 'seg-btn'} onClick={() => setOnlyWrong(false)}>
            전체 {result.totalCount}
          </button>
          <button className={onlyWrong ? 'seg-btn active' : 'seg-btn'} onClick={() => setOnlyWrong(true)}>
            틀린 문제 {result.wrongCount}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="empty-box">🎉 틀린 문제가 없어요. 만점이에요!</p>
      ) : (
        <ul className="result-detail-list">
          {rows.map(({ detail, number, question }) => (
            <li key={detail.questionId} className={detail.isCorrect ? 'rd-item ok' : 'rd-item ng'}>
              <div className="rd-head">
                <strong>문제 {number}</strong>
                <span className={detail.isCorrect ? 'badge badge-ok' : 'badge badge-ng'}>
                  {detail.isCorrect ? '정답' : detail.answered ? '오답' : '미응답'}
                </span>
                <span className="muted small">
                  {getQuestionFormat(question)} · {formatScore(detail.earned)} / {formatScore(detail.points)}점
                </span>
              </div>
              <p className="rd-question">
                <Markdown inline text={question.question} />
              </p>
              {question.passage && (
                <div className="rd-passage">
                  <Markdown text={question.passage} />
                </div>
              )}
              <dl className="rd-answers">
                <dt>내 답</dt>
                <dd className={detail.isCorrect ? 'text-ok' : 'text-ng'}>{getUserAnswerText(question, detail.userAnswer)}</dd>
                <dt>정답</dt>
                <dd>
                  <Markdown inline text={getCorrectAnswerText(question)} />
                </dd>
                <dt>해설</dt>
                <dd>
                  <Markdown text={question.explanation} />
                </dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExamResult;
