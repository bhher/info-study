// ============================================================
// 역할: 생성된 학습 데이터(src/data/*.js)가 올바른지 검사합니다.
//   실행: npm run check:data
//   - 문제 id 중복 / 객관식 보기·정답 범위 / 단답형 정답·키워드 / 해설 누락
//   - 단답형 대표 정답(answerText)이 채점 함수를 실제로 통과하는지
//   - 모의고사 문제 id 존재, 만점 100점 근처인지
//   - 실기 문제·요약노트 id 중복, 노트 파일 존재
// 문제가 하나라도 있으면 종료 코드 1 로 끝납니다.
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHOICE_QUESTIONS, SQLD_QUESTIONS, WRITTEN_QUESTIONS } from '../src/data/choiceData.js';
import { SHORT_QUESTIONS } from '../src/data/shortData.js';
import { PRACTICAL_LIST } from '../src/data/practicalData.js';
import { NOTE_LIST } from '../src/data/noteData.js';
import { EXAM_LIST } from '../src/data/examData.js';
import { checkAnswer } from '../src/utils/examUtils.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (message) => errors.push(message);

function checkUnique(list, label) {
  const seen = new Set();
  for (const item of list) {
    if (seen.has(item.id)) fail(`${label}: id 중복 ${item.id}`);
    seen.add(item.id);
  }
}

// ---------- 객관식 ----------
checkUnique(CHOICE_QUESTIONS, '객관식');
for (const q of CHOICE_QUESTIONS) {
  if (!q.question?.trim()) fail(`${q.id}: 문제 문장이 비어 있음`);
  if (!Array.isArray(q.options) || q.options.length < 4) fail(`${q.id}: 보기가 4개 미만`);
  else if (q.options.some((o) => !String(o).trim())) fail(`${q.id}: 빈 보기가 있음`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options?.length ?? 0)) fail(`${q.id}: 정답 번호가 범위를 벗어남 (${q.answer})`);
  if (!q.explanation?.trim()) fail(`${q.id}: 해설이 비어 있음`);
}
if (WRITTEN_QUESTIONS.length !== 80) fail(`필기 문제 수가 80이 아님: ${WRITTEN_QUESTIONS.length}`);
if (SQLD_QUESTIONS.length !== 50) fail(`SQLD 문제 수가 50이 아님: ${SQLD_QUESTIONS.length}`);

// ---------- 단답형 ----------
checkUnique(SHORT_QUESTIONS, '단답형');
for (const q of SHORT_QUESTIONS) {
  if (!q.question?.trim()) fail(`${q.id}: 문제 문장이 비어 있음`);
  if (!q.answers?.length || !q.answers[0]?.trim()) fail(`${q.id}: 정답이 비어 있음`);
  if (!q.keywords?.length || q.keywords.some((g) => !g.length || g.some((k) => !k.trim()))) fail(`${q.id}: 키워드가 비어 있음`);
  if (!q.answerText?.trim()) fail(`${q.id}: 대표 정답이 비어 있음`);
  if (!q.explanation?.trim()) fail(`${q.id}: 해설이 비어 있음`);
  if (!checkAnswer(q, q.answerText)) fail(`${q.id}: 대표 정답이 채점을 통과하지 못함 → ${q.answerText}`);
  if (checkAnswer(q, '')) fail(`${q.id}: 빈 답이 정답 처리됨`);
}

// ---------- 모의고사 ----------
const allIds = new Set([...CHOICE_QUESTIONS, ...SHORT_QUESTIONS].map((q) => q.id));
for (const exam of EXAM_LIST) {
  const ids = exam.questions.map((q) => q.id);
  if (new Set(ids).size !== ids.length) fail(`시험 ${exam.id}: 문제가 중복됨`);
  for (const id of ids) if (!allIds.has(id)) fail(`시험 ${exam.id}: 존재하지 않는 문제 id ${id}`);
  const total = exam.questions.reduce((sum, q) => sum + q.points, 0);
  if (Math.abs(total - 100) > 0.01) fail(`시험 ${exam.id}: 만점이 100점이 아님 (${total})`);
}

// ---------- 실기 ----------
checkUnique(PRACTICAL_LIST, '실기');
for (const p of PRACTICAL_LIST) {
  if (!p.question?.trim()) fail(`${p.id}: 실기 문제 문장이 비어 있음`);
  if (!p.answer?.trim()) fail(`${p.id}: 실기 정답이 비어 있음`);
  if (!p.title?.trim() || !p.category?.trim() || !p.exam?.trim()) fail(`${p.id}: 제목/분류/회차 누락`);
}

// ---------- 요약노트 ----------
checkUnique(NOTE_LIST, '요약노트');
for (const note of NOTE_LIST) {
  const file = path.join(root, 'src', 'notes', `${note.id}.md`);
  if (!fs.existsSync(file)) fail(`${note.id}: 노트 파일이 없음 (${file})`);
  else if (fs.readFileSync(file, 'utf8').trim().length < 50) fail(`${note.id}: 노트 내용이 너무 짧음`);
}

// ---------- 결과 ----------
console.log(
  `필기 ${WRITTEN_QUESTIONS.length} · SQLD ${SQLD_QUESTIONS.length} · 단답/용어 ${SHORT_QUESTIONS.length} · 실기 ${PRACTICAL_LIST.length} · 노트 ${NOTE_LIST.length} · 모의고사 ${EXAM_LIST.length}종`
);
if (errors.length) {
  console.error(`\n✖ 문제 ${errors.length}건`);
  for (const e of errors.slice(0, 80)) console.error(' - ' + e);
  process.exit(1);
}
console.log('✔ 데이터 검사 통과');
