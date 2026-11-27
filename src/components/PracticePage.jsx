// ============================================================
// 역할: "문제 풀이 연습" 화면의 공통 틀 (필기·SQLD 페이지와 단답형 페이지가 함께 사용)
//   1) 설정 화면 : 분류(사이드바) 선택 + 문제 수 / 순서 / 오답만 풀기 선택 + [풀기 시작]
//   2) 풀이 화면 : PracticeRunner 로 한 문제씩 풀고 바로 채점 + 해설
//   틀린 문제는 끝날 때 오답노트에 자동 저장됩니다.
// props
//   - title       : 페이지 제목
//   - description : 페이지 소개 글
//   - questions   : 문제 은행 (전체)
//   - groupTitle  : 사이드바 제목
//   - groups      : [{ value, label, filter }] 사이드바 항목. filter(문제) 가 true 인 문제만 해당 분류
// ============================================================
import { useState } from 'react';
import { useStudy } from '../context/StudyContext';
import { shuffle } from '../utils/studyUtils';
import Sidebar from './Sidebar';
import PracticeRunner from './PracticeRunner';

const COUNT_OPTIONS = [10, 20, 30, 'all'];

function PracticePage({ title, description, questions, groupTitle, groups }) {
  const { wrongNotes, recordPractice } = useStudy();

  const [groupValue, setGroupValue] = useState(groups[0].value);
  const [count, setCount] = useState(10);
  const [random, setRandom] = useState(true);
  const [onlyWrong, setOnlyWrong] = useState(false);

  const [running, setRunning] = useState(false); // 풀이 화면인지
  const [runQuestions, setRunQuestions] = useState([]);
  const [runKey, setRunKey] = useState(0); // 바뀌면 PracticeRunner 가 처음부터 다시 시작

  const group = groups.find((g) => g.value === groupValue) || groups[0];
  const isUnsolved = (q) => wrongNotes[q.id] && !wrongNotes[q.id].solved;

  // 선택한 조건에 맞는 문제 목록 만들기
  function buildQuestions() {
    let pool = questions.filter(group.filter);
    if (onlyWrong) pool = pool.filter(isUnsolved);
    if (random) pool = shuffle(pool);
    return count === 'all' ? pool : pool.slice(0, count);
  }

  function start() {
    setRunQuestions(buildQuestions());
    setRunKey(runKey + 1);
    setRunning(true);
  }

  const poolSize = questions.filter(group.filter).length;
  const wrongSize = questions.filter(group.filter).filter(isUnsolved).length;
  const willSolve = onlyWrong ? wrongSize : poolSize;
  const solveCount = count === 'all' ? willSolve : Math.min(count, willSolve);

  const groupItems = groups.map((g) => ({ value: g.value, label: g.label, count: questions.filter(g.filter).length }));

  // ---------- 풀이 화면 ----------
  if (running) {
    return (
      <div className="page">
        <div className="page-head">
          <h1>{title}</h1>
          <p className="muted">{group.label}</p>
        </div>
        <div className="narrow">
          <PracticeRunner
            key={runKey}
            questions={runQuestions}
            title={`${title} · ${group.label}`}
            onComplete={(details) => recordPractice(`${title}(${group.label})`, details)}
            onRestart={start}
            onExit={() => setRunning(false)}
          />
        </div>
      </div>
    );
  }

  // ---------- 설정 화면 ----------
  return (
    <div className="page">
      <div className="page-head">
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>

      <div className="study-layout">
        <Sidebar title={groupTitle} items={groupItems} selected={groupValue} onSelect={setGroupValue} />

        <section className="panel">
          <h2 className="panel-title">{group.label}</h2>
          <p className="muted">
            이 분류의 문제 <strong>{poolSize}</strong>개 · 오답노트의 미해결 문제 <strong className="text-ng">{wrongSize}</strong>개
          </p>

          <div className="setting-row">
            <span className="setting-label">문제 수</span>
            <div className="seg">
              {COUNT_OPTIONS.map((option) => (
                <button key={option} className={count === option ? 'seg-btn active' : 'seg-btn'} onClick={() => setCount(option)}>
                  {option === 'all' ? '전체' : `${option}문제`}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">순서</span>
            <div className="seg">
              <button className={random ? 'seg-btn active' : 'seg-btn'} onClick={() => setRandom(true)}>
                무작위
              </button>
              <button className={!random ? 'seg-btn active' : 'seg-btn'} onClick={() => setRandom(false)}>
                번호 순서대로
              </button>
            </div>
          </div>

          <label className="check-label">
            <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} />
            오답노트의 미해결 문제만 풀기
          </label>

          <div className="btn-row">
            <button className="btn btn-primary btn-large" onClick={start} disabled={solveCount === 0}>
              ▶ {solveCount}문제 풀기 시작
            </button>
          </div>
          {solveCount === 0 && <p className="warn-text">조건에 맞는 문제가 없어요. 오답만 풀기를 끄거나 분류를 바꿔 보세요.</p>}
        </section>
      </div>
    </div>
  );
}

export default PracticePage;
