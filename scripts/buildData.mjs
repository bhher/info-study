// ============================================================
// 역할: 프로젝트 밖 `info/` 폴더의 정보처리기사 학습 자료(.md)를 읽어서
//       앱이 쓰는 데이터 파일(src/data/*.js)과 요약노트(src/notes/*.md)로 바꿔 줍니다.
//
//  실행:  npm run build:data
//  (원본 폴더 위치를 바꾸려면  INFO_DIR=경로 npm run build:data)
//
//  만들어지는 파일
//    src/data/choiceData.js    필기 80문제 + SQLD 50문제 (객관식)
//    src/data/shortData.js     단답형 100제 + IT용어 100문제 1탄·3탄 + 네트워크 예상문제 (주관식·용어)
//    src/data/practicalData.js 실기 기출(복원) 문제 + Java/Python 문제 모음 + 코딩 연습 과제 (자가 채점)
//    src/notes/*.md            단원별 요약노트 (원본 복사)
//
//  ※ 이 파일로 만들어진 데이터 파일은 직접 고치지 말고, 원본 md 를 고친 뒤 다시 실행하세요.
//    (이미 만들어진 데이터가 들어 있으므로 평소에는 실행하지 않아도 앱이 동작합니다.)
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INFO = process.env.INFO_DIR ? path.resolve(process.env.INFO_DIR) : path.resolve(ROOT, '../../info');
const DATA_DIR = path.join(ROOT, 'src/data');
const NOTES_DIR = path.join(ROOT, 'src/notes');

const CIRCLED = '①②③④⑤';

// ------------------------------------------------------------
// 공통 도우미
// ------------------------------------------------------------
const read = (file) => fs.readFileSync(path.join(INFO, file), 'utf8').replace(/\r\n/g, '\n');
const stripBold = (text) => String(text).replace(/\*\*/g, '').trim();
const pad = (n, size = 2) => String(n).padStart(size, '0');

/** 앞뒤의 빈 줄과 구분선(---)을 없앤 문자열 */
function cleanBlock(lines) {
  const copy = [...lines];
  while (copy.length && (copy[0].trim() === '' || /^---+\s*$/.test(copy[0].trim()))) copy.shift();
  while (copy.length && (copy[copy.length - 1].trim() === '' || /^---+\s*$/.test(copy[copy.length - 1].trim()))) copy.pop();
  // 줄 끝 공백 2칸(마크다운 줄바꿈)은 유지하되, 너무 긴 공백은 정리
  return copy.join('\n');
}

/** 코드 블록(```) 안인지 따라가며 각 줄에 inFence 표시를 붙임 */
function markFences(lines) {
  let inFence = false;
  return lines.map((line) => {
    const isFenceLine = /^\s*```/.test(line);
    const info = { line, inFence: inFence || isFenceLine };
    if (isFenceLine) inFence = !inFence;
    return info;
  });
}

/** 줄 목록에서 최상위(괄호 밖)의 구분자로 자르기 */
function splitTopLevel(text, separators) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if ('([{【'.includes(ch)) depth++;
    if (')]}】'.includes(ch)) depth = Math.max(0, depth - 1);
    if (depth === 0 && separators.includes(ch)) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

// ------------------------------------------------------------
// 1. 객관식 (필기 / SQLD)
// ------------------------------------------------------------
function parseChoiceFile(text) {
  const out = [];
  let subject = null;
  let cur = null;
  const flush = () => {
    if (cur) out.push(cur);
    cur = null;
  };

  for (const line of text.split('\n')) {
    let m = line.match(/^## 제(\d)과목:\s*(.+?)\s*\((\d+)문제\)/);
    if (m) {
      flush();
      subject = m[2].trim();
      continue;
    }
    if (/^## /.test(line)) {
      flush();
      subject = null;
      continue;
    }
    m = line.match(/^### (\d+)\.\s*(.+)$/);
    if (m && subject) {
      flush();
      cur = { subject, no: Number(m[1]), title: stripBold(m[2]), body: [], options: [], answer: null, explain: [], mode: 'body' };
      continue;
    }
    if (!cur) continue;

    if (/^---+\s*$/.test(line.trim()) && cur.mode !== 'body') {
      cur.mode = 'done';
      continue;
    }
    if (cur.mode === 'done') continue;

    if (cur.mode === 'body' || cur.mode === 'opts') {
      const opt = line.match(/^([①②③④⑤])\s*(.*?)\s*$/);
      if (opt) {
        cur.options.push(stripBold(opt[2]));
        cur.mode = 'opts';
        continue;
      }
    }
    const ans = line.match(/^\*\*정답\s*[:：]\s*([①②③④⑤])\s*(.*?)\*\*\s*$/);
    if (ans) {
      cur.answer = CIRCLED.indexOf(ans[1]);
      cur.mode = 'afterAnswer';
      continue;
    }
    if (/^\*\*(상세\s*)?해설\s*[:：]?\s*\*\*/.test(line)) {
      cur.mode = 'explain';
      continue;
    }
    if (cur.mode === 'body') cur.body.push(line);
    else if (cur.mode === 'explain') cur.explain.push(line);
  }
  flush();
  return out;
}

/** 문제 파일 + 정답 파일을 합쳐 객관식 문제 목록 만들기 */
function buildChoice({ questionFile, answerFile, prefix, examName }) {
  const qs = parseChoiceFile(read(questionFile));
  const as = parseChoiceFile(read(answerFile));
  if (qs.length !== as.length) throw new Error(`${examName}: 문제 ${qs.length}개, 정답 ${as.length}개가 서로 달라요.`);

  return qs.map((q, i) => {
    const a = as[i];
    if (stripBold(q.title) !== stripBold(a.title)) throw new Error(`${examName}: ${i + 1}번 문제 제목이 서로 달라요.`);
    const passage = cleanBlock(q.body);
    const item = {
      id: `${prefix}${pad(i + 1)}`,
      type: 'choice',
      category: q.subject,
      question: q.title,
      options: q.options,
      answer: a.answer,
      explanation: cleanBlock(a.explain),
      source: examName,
    };
    if (passage) item.passage = passage;
    return item;
  });
}

// ------------------------------------------------------------
// 2. 단답형 / 용어
// ------------------------------------------------------------

/** "**문제:**", "**정답:**", "**해설:**" 표시가 있는 블록에서 문제/정답/해설 뽑기 */
function extractQA(lines) {
  const q = [];
  const a = [];
  const e = [];
  let mode = 'q';
  for (const line of lines) {
    let m = line.match(/^\*\*문제\s*[:：]\*\*\s*(.*)$/);
    if (m) {
      mode = 'q';
      if (m[1]) q.push(m[1]);
      continue;
    }
    m = line.match(/^\*\*정답\s*[:：]\*\*\s*(.*)$/);
    if (m) {
      mode = 'a';
      if (m[1]) a.push(m[1]);
      continue;
    }
    m = line.match(/^\*\*해설\s*[:：]\*\*\s*(.*)$/);
    if (m) {
      mode = 'e';
      if (m[1]) e.push(m[1]);
      continue;
    }
    if (/^---+\s*$/.test(line.trim())) continue;
    if (mode === 'q') q.push(line);
    else if (mode === 'a') a.push(line);
    else e.push(line);
  }
  return {
    question: cleanBlock(q).replace(/\n+/g, ' ').trim(),
    answer: stripBold(cleanBlock(a).replace(/\n+/g, ' ')),
    explanation: cleanBlock(e),
  };
}

/** "## 문제 N" 또는 "### 문제 N" 블록들로 나누기 */
function parseNumberedBlocks(text) {
  const blocks = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const m = line.match(/^#{2,3}\s*문제\s*(\d+)\s*$/);
    if (m) {
      cur = { no: Number(m[1]), lines: [] };
      blocks.push(cur);
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      cur = null; // 다른 제목(핵심 용어 정리 등)을 만나면 블록 끝
      continue;
    }
    if (/^\s*-\s*\[.*\]\(#.*\)\s*$/.test(line)) continue; // 목차 링크
    if (cur) cur.lines.push(line);
  }
  return blocks;
}

/** 같은 뜻의 다른 표현 나누기: 'A / B' 는 나누고, 'PL/SQL', 'TCP/IP' 처럼 영문끼리 붙은 슬래시는 유지 */
function splitAlts(text) {
  const guarded = text.replace(/([A-Za-z0-9])\/(?=[A-Za-z0-9])/g, '$1\u0001');
  return splitTopLevel(guarded, ['/', '|']).map((s) => s.replaceAll('\u0001', '/'));
}
/** 정답 글자를 "채점용 묶음"으로 바꾸기
 *  - 쉼표(,)로 나뉜 것은 모두 맞혀야 하는 "묶음"
 *  - 슬래시(/)나 괄호 안의 영문은 같은 묶음 안의 "다른 표현"
 */
function buildAnswerKey(answerText, questionText) {
  const text = answerText.replace(/\s+/g, ' ').trim();
  const rawParts = splitTopLevel(text, [',', '，', '、', ';', '·', '\n']);
  const groups = [];

  for (const rawPart of rawParts) {
    const part = rawPart.replace(/^\s*(?:\d+[.)]|[①②③④⑤])\s*/, '').trim();
    if (!part) continue;
    const alts = new Set();
    // 괄호/대괄호 밖의 글자
    const outside = part.replace(/[(\[{【][^)\]}】]*[)\]}】]/g, ' ').replace(/\s+/g, ' ').trim();
    for (const piece of splitAlts(outside)) alts.add(piece);
    // 괄호 안의 글자 (쉼표가 없고 짧은 것만 다른 표현으로 인정)
    const insideMatches = part.matchAll(/[(\[{【]([^)\]}】]*)[)\]}】]/g);
    for (const match of insideMatches) {
      const inner = match[1].trim();
      if (inner && !/[,，]/.test(inner) && inner.length <= 60) {
        for (const piece of splitAlts(inner)) alts.add(piece);
      }
    }
    // 괄호만 있는 답이면 전체를 사용
    if (alts.size === 0) alts.add(part);
    groups.push([...alts].filter((s) => s.length > 0));
  }

  const key = { answers: [text], keywords: groups };

  // "3가지", "3가지 이상" → 필요한 개수
  const countMatch = questionText.match(/(\d+)\s*가지/);
  if (countMatch) {
    const need = Number(countMatch[1]);
    if (groups.length > need) key.minMatch = need;
  }
  return key;
}

/** 용어 분류 (키워드로 대략 구분) */
const SHORT_CATEGORY_RULES = [
  ['보안', /보안|암호|해킹|해커|공격|취약|인증|방화벽|침입|악성|바이러스|랜섬|스니핑|스푸핑|피싱|\bDDoS\b|\bDoS\b|XSS|인젝션|CSRF|\bSSL\b|\bTLS\b|접근\s*통제|디지털\s*서명|해시|\bDRM\b|제로데이|백도어|트로이|좀비|봇넷|ISMS|\bSSO\b|\bAES\b|\bRSA\b|\bDES\b|\bSEED\b|ARIA|\bVPN\b|\bIDS\b|\bIPS\b|\bWAF\b|허니팟|패스워드|비밀번호|키로거|사회\s*공학|웜\b|워터링|스미싱|파밍|랜섬웨어|블록체인/i],
  ['인터페이스·통합', /EAI|ESB|연계|미들웨어|SOAP|WSDL|UDDI|메시지\s*큐|브로커|웹\s*서비스|Web\s*Service|\bRPC\b|\bORB\b|CORBA|오픈\s*API|인터페이스\s*(설계|구현|명세|검증)|\bFEP\b|API\s*Gateway/i],
  ['테스트', /테스트|검증\s*기법|결함|커버리지|블랙박스|화이트박스|동치|경계값|원인-?\s*결과|회귀|알파|베타|인수\s*테스트|리팩토링|정적\s*분석|동적\s*분석|슬라이싱|테스트\s*케이스|오라클|스텁|드라이버|하네스|Mutation|뮤테이션|단위\s*테스트/i],
  ['네트워크', /네트워크|프로토콜|\bIP\b|\bTCP\b|\bUDP\b|라우|패킷|\bOSI\b|통신|이더넷|\bLAN\b|\bWAN\b|\bVLAN\b|\bARP\b|\bRARP\b|\bDNS\b|\bDHCP\b|\bHTTPS?\b|\bFTP\b|\bSMTP\b|포트|\bMAC\b|스위치|무선|Wi-?Fi|Bluetooth|블루투스|\b5G\b|IPv|\bNAT\b|ICMP|IGMP|\bSSH\b|Telnet|대역폭|다중화|토폴로지|멀티캐스트|유니캐스트|브로드캐스트|CSMA|흐름\s*제어|오류\s*제어|\bNFC\b|RFID|\bSDN\b|\bNFV\b|MQTT|\bSNMP\b|\bBGP\b|\bOSPF\b|\bRIP\b|\bPAN\b|\bMAN\b|서브넷|게이트웨이|브리지|허브|리피터|\bVoIP\b|\bQoS\b|메시|\bTTL\b|홉/i],
  ['데이터베이스', /데이터베이스|\bDB\b|\bSQL\b|트랜잭션|정규화|릴레이션|스키마|테이블|튜플|인덱스|조인|\bERD\b|\bDBMS\b|무결성|반정규화|파티션|\bACID\b|교착|NoSQL|빅데이터|데이터\s*웨어하우스|\bOLAP\b|데이터\s*마이닝|\bCRUD\b|커서|트리거|프로시저|\bRAID\b|관계\s*대수|관계\s*해석|후보키|기본키|외래키|슈퍼키|카디널리티|도메인|엔티티|개체|애트리뷰트|\bDDL\b|\bDML\b|\bDCL\b|\bTCL\b|회복|체크포인트|직렬/i],
  ['운영체제', /운영\s*체제|\bOS\b|프로세스|스레드|스케줄링|메모리|페이징|세그멘|가상\s*(기억|메모리)|\bFIFO\b|\bLRU\b|\bLFU\b|\bOPT\b|\bNUR\b|커널|쉘|\bShell\b|Linux|리눅스|UNIX|유닉스|인터럽트|세마포|뮤텍스|캐시|디스크|파일\s*(시스템|구조|접근)|chmod|명령어|\bHRN\b|\bSJF\b|라운드|\bSSTF\b|\bSCAN\b|버퍼|스풀|\bCPU\b|레지스터|단편화|\bFCFS\b|\bSRT\b|\bMLQ\b|\bMFQ\b|교착\s*상태|임계\s*구역|부팅|\bBIOS\b|\bPCB\b/i],
  ['소프트웨어 공학', /소프트웨어|개발\s*(방법론|모델|기법)|\bUML\b|요구\s*사항|설계|디자인\s*패턴|객체|클래스|모듈|결합도|응집도|애자일|스크럼|\bXP\b|폭포수|나선형|\bCMMI\b|\bSPICE\b|형상|프로젝트|\bCOCOMO\b|\bLOC\b|기능\s*점수|\bWBS\b|\bPERT\b|\bCPM\b|아키텍처|\bMVC\b|프레임워크|\bDFD\b|유스케이스|추상|캡슐|상속|다형|SOLID|정보\s*은닉|재사용|\bCBD\b|\bSOA\b|마이크로서비스|DevOps|\bERP\b|\bCRM\b|\bSCM\b|\bMES\b|다이어그램|\bGoF\b|싱글톤|팩토리|옵저버|데코레이터|프록시|빌더/i],
  ['프로그래밍', /프로그래밍|언어|\bJava\b|Python|C\s*언어|JavaScript|컴파일|인터프리터|변수|배열|함수|재귀|알고리즘|정렬|탐색|자료\s*구조|스택|\b큐\b|트리|그래프|연결\s*리스트|JSON|XML|AJAX|Node\.?js|React|파싱|스크립트|HTML|CSS|라이브러리|\bAPI\b|\bREST\b|\bIDE\b|예외|제네릭|람다|\bAOP\b|\bDI\b|\bIoC\b|Spring|JSP|Servlet|서블릿|\bSPA\b|\bDOM\b|\bBOM\b|\bUI\b|\bUX\b|화면\s*설계|프로토타입/i],
];

function classifyShort(question, answer) {
  const target = `${question} ${answer}`;
  for (const [name, regex] of SHORT_CATEGORY_RULES) {
    if (regex.test(target)) return name;
  }
  return 'IT 일반';
}

function makeShortItem({ id, question, passage, answer, explanation, source }) {
  const key = buildAnswerKey(answer, question);
  const item = {
    id,
    type: 'short',
    category: classifyShort(`${question} ${passage || ''}`, answer),
    question,
    ...(passage ? { passage } : {}),
    answerKind: 'text',
    answers: key.answers,
    keywords: key.keywords,
    ...(key.minMatch ? { minMatch: key.minMatch } : {}),
    answerText: answer,
    explanation,
    source,
  };
  return item;
}

/** 단답형 100제: "## 001. 문제" + "- **정답**: ..." + "- **해설**: ..." */
function buildShort100() {
  const lines = read('정보처리기사_실기_단답형_100제_문제-정답-해설.md').split('\n');
  const items = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^## (\d{3})\.\s*(.+)$/);
    if (m) {
      cur = { no: Number(m[1]), title: m[2].trim(), answer: '', explanation: '' };
      items.push(cur);
      continue;
    }
    if (!cur) continue;
    const a = line.match(/^- \*\*정답\*\*\s*[:：]\s*(.*)$/);
    if (a) {
      cur.answer = stripBold(a[1]);
      continue;
    }
    const e = line.match(/^- \*\*해설\*\*\s*[:：]\s*(.*)$/);
    if (e) cur.explanation = stripBold(e[1]);
  }
  return items.map((it) => {
    // 끝의 (2020 1차) 같은 출처 표시를 분리
    const srcMatch = it.title.match(/\s*\((\d{4}\s*\d차)\)\s*$/);
    const question = srcMatch ? it.title.replace(srcMatch[0], '').trim() : it.title;
    return makeShortItem({
      id: `s${pad(it.no, 3)}`,
      question,
      answer: it.answer,
      explanation: it.explanation,
      source: srcMatch ? `단답형 100제 · ${srcMatch[1]}` : '단답형 100제',
    });
  });
}

/** IT용어 100문제 / 네트워크 예상문제: "문제 N" 블록 */
function buildTerms({ file, prefix, source, asTerm }) {
  const blocks = parseNumberedBlocks(read(file));
  return blocks
    .map((block) => {
      const qa = extractQA(block.lines);
      if (!qa.question || !qa.answer) return null;
      const args = asTerm
        ? {
            id: `${prefix}${pad(block.no, 3)}`,
            question: '다음 설명에 해당하는 용어를 쓰시오.',
            passage: qa.question,
          }
        : { id: `${prefix}${pad(block.no, 2)}`, question: qa.question };
      return makeShortItem({ ...args, answer: qa.answer, explanation: qa.explanation, source });
    })
    .filter(Boolean);
}

// ------------------------------------------------------------
// 3. 실기 기출 / 코드 문제 (자가 채점)
// ------------------------------------------------------------
const PRACTICAL_FILES = [
  '2022년-1회-실기-복원문제-해설.md',
  '정보처리기사-2022년-2회-실기-복원문제-해설.md',
  '정보처리기사-2021년-1회-실기-기출문제-해설.md',
  '정보처리기사-2023년-1회-실기-복원문제-해설.md',
  '정보처리기사-2023년-2회-실기-복원문제-해설.md',
  '정보처리기사-2023년-3회-실기-복원문제-해설1.md',
  '정보처리기사-2024년-1회-실기-복원문제-해설.md',
  '2024-정보처리기사-실기-2회-복원문제-해설.md',
  '정보처리기사-2024년-3회-실기-복원문제-해설.md',
  '2025-정보처리기사-실기-1회-복원문제-해설.md',
  '정보처리기사-2025년-2회-실기-복원문제-해설.md',
  '2025년-3회-실기-복원문제-해설.md',
];

const ITEM_HEADING = /^## (?:📋\s*)?(?:문제\s*)?(\d+)\s*[.:]\s*(.+)$/;

/** 한 문제 덩어리(줄 목록)를 문제/정답/해설로 나누기 */
function splitSections(lines) {
  const marked = markFences(lines);
  const hasSub = marked.some((l) => !l.inFence && /^### /.test(l.line));
  const buckets = { q: [], a: [], e: [] };

  if (hasSub) {
    let role = 'q';
    let answered = false;
    for (const { line, inFence } of marked) {
      const h = !inFence ? line.match(/^### (.+)$/) : null;
      if (h) {
        const title = h[1].replace(/[*📋]/g, '').trim();
        if (/^(정답|답안|답)(\s|$|및)/.test(title) || /^(정답|답안|답)$/.test(title)) {
          role = 'a';
          answered = true;
        } else if (/^(해설|풀이|상세\s*해설|설명)/.test(title)) {
          role = 'e';
        } else if (/^문제/.test(title)) {
          role = 'q';
        } else {
          // 알 수 없는 소제목: 정답 앞이면 문제의 일부, 뒤면 해설의 일부
          role = answered ? 'e' : 'q';
          buckets[role].push(`**${title}**`);
        }
        continue;
      }
      buckets[role].push(line);
    }
  } else {
    // "**문제:**", "**답:**", "**정답:**", "**해설:**" 표시 방식
    let mode = 'q';
    let answerStarted = false;
    let answerHasText = false;
    for (const { line, inFence } of marked) {
      if (!inFence) {
        let m = line.match(/^\*\*문제\s*[:：]\*\*\s*(.*)$/);
        if (m) {
          mode = 'q';
          if (m[1]) buckets.q.push(m[1]);
          continue;
        }
        m = line.match(/^\*\*(?:정답|답)\s*[:：]\*\*\s*(.*)$/) || line.match(/^\*\*(?:정답|답)\s*[:：]\s*(.*?)\*\*\s*$/);
        if (m) {
          mode = 'a';
          answerStarted = true;
          answerHasText = false;
          if (m[1]) {
            buckets.a.push(m[1]);
            answerHasText = true;
          }
          continue;
        }
        m = line.match(/^\*\*해설\s*[:：]\*\*\s*(.*)$/);
        if (m) {
          mode = 'e';
          if (m[1]) buckets.e.push(m[1]);
          continue;
        }
        // 정답 표시 뒤의 첫 번째 문단만 정답으로 보고, 빈 줄 이후는 해설로 보냄
        if (mode === 'a' && answerStarted && line.trim() === '' && answerHasText) {
          mode = 'e';
          continue;
        }
        if (mode === 'a' && line.trim() !== '') answerHasText = true;
      }
      buckets[mode].push(line);
    }
  }
  return { q: cleanBlock(buckets.q), a: cleanBlock(buckets.a), e: cleanBlock(buckets.e) };
}

function classifyPractical(title, q) {
  const fence = q.match(/```(\w+)/);
  const lang = fence ? fence[1].toLowerCase() : '';
  if (lang === 'java') return 'Java';
  if (lang === 'python' || lang === 'py') return 'Python';
  if (lang === 'c' || lang === 'cpp' || lang === 'c++') return 'C언어';
  if (lang === 'sql') return '데이터베이스·SQL';
  const t = `${title} ${q}`;
  if (/\bJava\b|자바/i.test(title)) return 'Java';
  if (/Python|파이썬/i.test(title)) return 'Python';
  if (/C\s*언어|포인터|\bC\b\s*(프로그램|코드)/i.test(title)) return 'C언어';
  if (/\bSQL\b|SELECT|INSERT|UPDATE|DELETE|GRANT|REVOKE|VIEW|뷰|인덱스|조인|JOIN|트랜잭션|릴레이션|정규화|관계\s*(대수|해석)|데이터베이스|\bDB\b|키\b|무결성|\bDDL\b|\bDML\b|\bDCL\b|\bERD\b/i.test(title)) return '데이터베이스·SQL';
  if (/보안|암호|공격|취약|인증|해시|방화벽|침입|\bSSL\b|\bTLS\b|\bXSS\b|CSRF|\bSQL\s*삽입|OAuth|\bDRM\b|접근\s*통제/i.test(title)) return '보안';
  if (/네트워크|프로토콜|\bIP\b|\bTCP\b|\bUDP\b|라우팅|\bOSI\b|\bARP\b|\bDNS\b|서브넷|\bVLAN\b|\bNAT\b|패킷|통신|\bHTTP|\bSNMP\b|\bFTP\b|\bSMTP\b/i.test(title)) return '네트워크';
  if (/테스트|결함|커버리지|블랙박스|화이트박스|리팩토링|\bV\s*모델|\bCMMI\b|\bSPICE\b|소스\s*코드\s*품질/i.test(title)) return '테스트';
  if (/UML|디자인\s*패턴|싱글톤|팩토리|옵저버|데코레이터|객체|클래스\s*다이어그램|결합도|응집도|애자일|스크럼|XP|폭포수|나선|요구\s*사항|소프트웨어|\bCOCOMO\b|\bLOC\b|형상|\bDFD\b|\bUI\b|\bUX\b|화면|아키텍처|\bMVC\b|\bERP\b|프로젝트|\bCPM\b|\bPERT\b/i.test(title)) return '소프트웨어 공학';
  if (/운영\s*체제|\bOS\b|프로세스|스케줄링|\bFIFO\b|\bLRU\b|메모리|페이징|교착|리눅스|Linux|유닉스|UNIX|chmod|명령어|\bRAID\b|디스크|파일\s*구조|인터럽트/i.test(title)) return '운영체제';
  if (/알고리즘|정렬|탐색|자료\s*구조|스택|큐|트리|그래프|재귀|비트|연산|배열|문자열|반복문|제어문/i.test(t.slice(0, 200))) return '알고리즘·자료구조';
  return '기타 이론';
}

function examLabelFromFile(file) {
  const m = file.match(/(20\d\d)\D+?(\d)회/);
  return m ? `${m[1]}년 ${m[2]}회` : file;
}

function examKey(label) {
  const m = label.match(/(\d{4})년\s*(\d)회/);
  return m ? `${m[1]}-${m[2]}` : label.replace(/\s+/g, '');
}

/** 실기 복원문제 파일 → 문제 목록 */
function buildPracticalFromExamFile(file) {
  const label = examLabelFromFile(file);
  const lines = read(file).split('\n');
  const marked = markFences(lines);
  const items = [];
  let cur = null;
  for (const { line, inFence } of marked) {
    if (!inFence) {
      const m = line.match(ITEM_HEADING);
      if (m) {
        cur = { no: Number(m[1]), title: stripBold(m[2]).replace(/[📋]/g, '').trim(), lines: [] };
        items.push(cur);
        continue;
      }
      if (/^## /.test(line) || /^# /.test(line)) {
        cur = null;
        continue;
      }
    }
    if (cur) cur.lines.push(line);
  }

  const result = [];
  const seen = new Set();
  for (const it of items) {
    const { q, a, e } = splitSections(it.lines);
    if (!q || !a) continue; // 내용이 비어 있는 제목만 있는 항목은 건너뜀
    const dupKey = `${it.title}|${q.slice(0, 60)}`;
    if (seen.has(dupKey)) continue;
    seen.add(dupKey);
    result.push({
      id: `p${examKey(label)}-${pad(result.length + 1)}`,
      exam: label,
      no: result.length + 1,
      title: it.title,
      category: classifyPractical(it.title, q),
      source: '실기 기출·복원문제',
      question: q,
      answer: a,
      explanation: e,
    });
  }
  return result;
}

/** Java 문제 모음: "## 2020년 1회" 아래 "### 문제 N: 제목" */
function buildPracticalFromLanguageFile({ file, kind, idPrefix, source }) {
  const lines = read(file).split('\n');
  const marked = markFences(lines);
  const items = [];
  let exam = '';
  let cur = null;
  for (const { line, inFence } of marked) {
    if (!inFence) {
      const h2 = line.match(/^## (\d{4}년\s*\d회)\s*$/);
      if (h2) {
        exam = h2[1];
        cur = null;
        continue;
      }
      const h3 = line.match(/^### 문제\s*(\d+)\s*[:：]\s*(.+)$/);
      if (h3) {
        let title = stripBold(h3[2]);
        let itemExam = exam;
        const t = title.match(/^(\d{4}년\s*\d회차?)\s*[-–]\s*(.+)$/); // 파이썬 형식
        if (t) {
          itemExam = t[1].replace('회차', '회');
          title = t[2];
        }
        cur = { no: Number(h3[1]), exam: itemExam, title, lines: [] };
        items.push(cur);
        continue;
      }
      if (/^#{1,3} /.test(line)) {
        cur = null;
        continue;
      }
    }
    if (cur) cur.lines.push(line);
  }

  const result = [];
  for (const it of items) {
    const { q, a, e } = splitSections(it.lines);
    if (!q || !a) continue;
    result.push({
      id: `${idPrefix}${examKey(it.exam)}-${pad(it.no)}`,
      exam: it.exam,
      no: it.no,
      title: `${kind} · ${it.title}`,
      category: kind,
      source,
      question: q,
      answer: a,
      explanation: e,
    });
  }
  return result;
}

/** 코딩 연습 과제(문제 파일 + 해설 파일) */
function buildAssignments({ questionFile, answerFile, kind, idPrefix }) {
  const parse = (text, re) => {
    const lines = text.split('\n');
    const marked = markFences(lines);
    const blocks = [];
    let cur = null;
    for (const { line, inFence } of marked) {
      if (!inFence) {
        const m = line.match(re);
        if (m) {
          cur = { no: Number(m[1]), title: stripBold(m[2]), lines: [] };
          blocks.push(cur);
          continue;
        }
        if (/^## /.test(line) || /^# /.test(line)) {
          cur = null;
          continue;
        }
      }
      if (cur) cur.lines.push(line);
    }
    return blocks;
  };
  const qs = parse(read(questionFile), /^## 문제\s*(\d+)\s*[:：]\s*(.+)$/);
  const as = parse(read(answerFile), /^## 문제\s*(\d+)\s*해설\s*[:：]\s*(.+)$/);
  return qs
    .map((q) => {
      const a = as.find((x) => x.no === q.no);
      if (!a) return null;
      return {
        id: `${idPrefix}${pad(q.no)}`,
        exam: `코딩 연습 (${kind})`,
        no: q.no,
        title: q.title,
        category: '알고리즘·자료구조',
        source: `코딩 연습 과제 (${kind})`,
        question: cleanBlock(q.lines),
        answer: '아래 [해설]의 전체 코드를 참고해 직접 작성한 코드와 비교해 보세요.',
        explanation: cleanBlock(a.lines),
      };
    })
    .filter(Boolean);
}

// ------------------------------------------------------------
// 4. 요약노트 복사
// ------------------------------------------------------------
const NOTE_FILES = [
  ['ch01', '정보처리기사-실기-01-요구사항확인-정리.md', '01 요구사항 확인', '실기 단원별 정리'],
  ['ch02', '정보처리기사-실기-02-화면설계-정리.md', '02 화면 설계', '실기 단원별 정리'],
  ['ch03', '정보처리기사-실기-03-데이터-입출력-구현-정리.md', '03 데이터 입출력 구현', '실기 단원별 정리'],
  ['ch04', '정보처리기사-실기-04-통합구현-정리.md', '04 통합 구현', '실기 단원별 정리'],
  ['ch05', '정보처리기사-실기-05-인터페이스-구현-정리.md', '05 인터페이스 구현', '실기 단원별 정리'],
  ['ch06', '정보처리기사-실기-06-서버-프로그램-구현-정리.md', '06 서버 프로그램 구현', '실기 단원별 정리'],
  ['ch07', '정보처리기사-실기-06-프로그래밍-언어-활용-정리.md', '07 프로그래밍 언어 활용', '실기 단원별 정리'],
  ['ch09', '정보처리기사-실기-09-소프트웨어-개발-보안-구축-정리.md', '09 소프트웨어 개발 보안 구축', '실기 단원별 정리'],
  ['ch10', '정보처리기사-실기-10-애플리케이션-테스트-관리-정리.md', '10 애플리케이션 테스트 관리', '실기 단원별 정리'],
  ['ch11', '정보처리기사-실기-11-응용-SW-기초-기술-활용-정리.md', '11 응용 SW 기초 기술 활용', '실기 단원별 정리'],
  ['sql1', '정보처리기사_SQL_정리.md', 'SQL 기출 정리 (2020~2024)', 'SQL'],
  ['sql2', '정보처리기사_SQL_응용_정리.md', 'SQL 응용 정리', 'SQL'],
];

function buildNotes() {
  fs.mkdirSync(NOTES_DIR, { recursive: true });
  const index = [];
  for (const [id, file, title, group] of NOTE_FILES) {
    const text = read(file);
    fs.writeFileSync(path.join(NOTES_DIR, `${id}.md`), text, 'utf8');
    // 첫 번째 소제목 아래 한두 줄을 요약으로 사용
    const body = text
      .split('\n')
      .filter((l) => l.trim() && !/^#/.test(l) && !/^[|>\-*`]/.test(l.trim()) && !/^---/.test(l.trim()));
    const summary = stripBold(body[0] || '').slice(0, 90);
    index.push({ id, title, group, summary, length: text.length });
  }
  return index;
}

// ------------------------------------------------------------
// 파일 쓰기
// ------------------------------------------------------------
function listLiteral(items) {
  return `[\n${items.map((item) => `  ${JSON.stringify(item)}`).join(',\n')},\n]`;
}

function writeModule(file, header, body) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, file), `${header}\n${body}\n`, 'utf8');
}

const AUTO = '// ※ scripts/buildData.mjs 가 info/ 폴더의 md 파일에서 자동으로 만든 파일입니다. 직접 고치지 마세요.';

function main() {
  // ---- 객관식 ----
  const written = buildChoice({
    questionFile: '정보처리기사-필기-문제.md',
    answerFile: '정보처리기사-필기-정답.md',
    prefix: 'w',
    examName: '정보처리기사 필기',
  });
  const sqld = buildChoice({
    questionFile: 'SQLD-시험문제.md',
    answerFile: 'SQLD-시험문제-정답.md',
    prefix: 'd',
    examName: 'SQLD',
  });

  writeModule(
    'choiceData.js',
    `// ============================================================
// 역할: 객관식 문제 은행 (정보처리기사 필기 80문제 + SQLD 50문제)
//
// 문제가 가진 정보
//   - id          : 문제 번호표 (w01~w80: 필기, d01~d50: SQLD). 오답노트가 이 번호로 문제를 찾습니다.
//   - type        : 'choice' (객관식)
//   - category    : 과목 이름
//   - question    : 문제 문장
//   - passage     : (선택) 코드나 표 같은 보충 자료 (마크다운)
//   - options     : 보기 목록 (4~5개)
//   - answer      : 정답 보기의 번호 (0부터 시작: 0=①, 1=②, ...)
//   - explanation : 해설 (마크다운)
//   - source      : 출처
${AUTO}
// ============================================================
`,
    `export const WRITTEN_QUESTIONS = ${listLiteral(written)};

export const SQLD_QUESTIONS = ${listLiteral(sqld)};

export const CHOICE_QUESTIONS = [...WRITTEN_QUESTIONS, ...SQLD_QUESTIONS];

export const WRITTEN_SUBJECTS = ${JSON.stringify([...new Set(written.map((q) => q.category))])};

export const SQLD_SUBJECTS = ${JSON.stringify([...new Set(sqld.map((q) => q.category))])};
`
  );

  // ---- 단답형 / 용어 ----
  const short100 = buildShort100();
  const terms1 = buildTerms({ file: '정보처리기사-실기-IT용어-100문제-1탄.md', prefix: 't1-', source: 'IT용어 100문제 1탄', asTerm: true });
  const terms3 = buildTerms({ file: '정보처리기사-실기-IT용어-100문제-3탄.md', prefix: 't3-', source: 'IT용어 100문제 3탄', asTerm: true });
  const network = buildTerms({ file: '정보처리기사-실기-예상문제-네트워크.md', prefix: 'n', source: '네트워크·시스템 예상문제', asTerm: true });
  // 표 형태로 답하는 문제(포트 번호 표)는 단답형 채점에 맞지 않아 실기 문제로 옮깁니다.
  const networkShort = network.filter((q) => !q.answerText.includes('|---'));
  const shortAll = [...short100, ...terms1, ...terms3, ...networkShort];
  const shortCategories = [...new Set(shortAll.map((q) => q.category))];

  writeModule(
    'shortData.js',
    `// ============================================================
// 역할: 단답형(주관식) 문제 은행 = "용어 학습" 카드의 재료이기도 합니다.
//   단답형 100제 + IT용어 100문제 1탄·3탄 + 네트워크·시스템 예상문제
//
// 문제가 가진 정보
//   - id          : s001~(단답형 100제), t1-001~(용어 1탄), t3-001~(용어 3탄), n01~(네트워크)
//   - type        : 'short' (주관식)
//   - category    : 분류 (보안, 네트워크, 데이터베이스 ...)
//   - question    : 문제 문장 (용어 문제는 "다음 설명에 해당하는 용어를 쓰시오.")
//   - passage     : (용어 문제만) 용어에 대한 설명 = 문제 본문
//   - answers     : 정답 전체 글자 (공백/문장부호는 채점할 때 무시)
//   - keywords    : [[한글, 영문], [한글, 영문]] 묶음 - 묶음마다 하나씩 들어 있으면 정답
//   - minMatch    : (선택) 묶음 중 최소 몇 개를 맞혀야 하는지 ("3가지 이상" 문제 등)
//   - answerText  : 결과 화면에 보여 줄 대표 정답
//   - explanation : 해설
//   - source      : 출처
${AUTO}
// ============================================================
`,
    `export const SHORT_QUESTIONS = ${listLiteral(shortAll)};

export const SHORT_CATEGORIES = ${JSON.stringify(shortCategories)};
`
  );

  // ---- 실기 기출 ----
  let practical = [];
  for (const file of PRACTICAL_FILES) practical.push(...buildPracticalFromExamFile(file));
  practical.push(...buildPracticalFromLanguageFile({ file: '정보처리기사-실기-Java-문제모음.md', kind: 'Java', idPrefix: 'pj', source: 'Java 문제 모음' }));
  practical.push(...buildPracticalFromLanguageFile({ file: '정보처리기사-실기-Python-기출문제.md', kind: 'Python', idPrefix: 'pp', source: 'Python 기출문제' }));
  practical.push(...buildAssignments({ questionFile: '정보처리기사-실기-문제.md', answerFile: '정보처리기사-실기-해설.md', kind: 'Java', idPrefix: 'pa-j' }));
  practical.push(...buildAssignments({ questionFile: '정보처리기사-실기-문제-C언어.md', answerFile: '정보처리기사-실기-해설-C언어.md', kind: 'C', idPrefix: 'pa-c' }));

  practical.push({
    id: 'pn-ports',
    exam: '네트워크 예상문제',
    no: 1,
    title: '잘 알려진 포트 번호 (21~443)',
    category: '네트워크',
    question: [
      '다음은 잘 알려진 포트번호이다. 해당하는 용어를 쓰시오.',
      '',
      '| 포트 | 이름 |',
      '|------|------|',
      '| 21 | ㄱ |',
      '| 22 | ㄴ |',
      '| 23 | ㄷ |',
      '| 25 | ㄹ |',
      '| 53 | ㅁ |',
      '| 80 | ㅂ |',
      '| 110 | ㅅ |',
      '| 143 | ㅇ |',
      '| 194 | ㅈ |',
      '| 443 | ㅊ |',
    ].join('\n'),
    answer: [
      '| 포트 | 이름 | 설명 |',
      '|------|------|------|',
      '| 21 | FTP | File Transfer Protocol - 파일 전송 프로토콜 (제어 포트) |',
      '| 22 | SSH | Secure Shell - 원격 제어, 보안 기능 |',
      '| 23 | Telnet | 원격 제어 프로토콜 |',
      '| 25 | SMTP | Simple Mail Transfer Protocol - 이메일 전송 |',
      '| 53 | DNS | Domain Name System - 도메인 이름 해석 |',
      '| 80 | HTTP | HyperText Transfer Protocol - 웹 서비스 |',
      '| 110 | POP3 | Post Office Protocol 3 - 이메일 수신 |',
      '| 143 | IMAP | Internet Message Access Protocol - 이메일 수신, 보관 기능 |',
      '| 194 | IRC | Internet Relay Chat - 인터넷 채팅 프로토콜 |',
      '| 443 | HTTPS | HTTP Secure - 보안 웹 서비스 |',
    ].join('\n'),
    explanation: '포트 번호는 반드시 암기해야 하는 단골 문제입니다. 21(FTP) · 22(SSH) · 23(Telnet) · 25(SMTP) · 53(DNS) · 80(HTTP) · 110(POP3) · 143(IMAP) · 194(IRC) · 443(HTTPS)',
    source: '네트워크·시스템 예상문제',
  });
  // id 중복 방지
  const idCount = new Map();
  practical = practical.map((item) => {
    const n = (idCount.get(item.id) || 0) + 1;
    idCount.set(item.id, n);
    return n === 1 ? item : { ...item, id: `${item.id}-${n}` };
  });

  const practicalExams = [...new Set(practical.map((p) => p.exam))];
  const practicalCategories = [...new Set(practical.map((p) => p.category))];

  writeModule(
    'practicalData.js',
    `// ============================================================
// 역할: 실기 기출(복원) 문제 은행 - 코드 해석, 서술형, 빈칸 채우기 등
//   직접 입력해서 채점하기 어려운 문제라서 "스스로 풀어 본 뒤 정답을 확인하는 방식"으로 보여 줍니다.
//
// 문제가 가진 정보
//   - id          : 문제 번호표
//   - exam        : 회차 (예: '2022년 1회')
//   - no          : 회차 안에서의 번호
//   - title       : 문제 제목
//   - category    : 분류 (Java, C언어, Python, 데이터베이스·SQL, 보안 ...)
//   - question    : 문제 (마크다운. 코드 블록 포함)
//   - answer      : 정답 (마크다운)
//   - explanation : 해설 (마크다운)
//   - source      : 출처
${AUTO}
// ============================================================
`,
    `export const PRACTICAL_LIST = ${listLiteral(practical)};

export const PRACTICAL_EXAMS = ${JSON.stringify(practicalExams)};

export const PRACTICAL_CATEGORIES = ${JSON.stringify(practicalCategories)};
`
  );

  // ---- 요약노트 ----
  const notes = buildNotes();
  writeModule(
    'noteData.js',
    `// ============================================================
// 역할: 요약노트 목록 (본문은 src/notes/아이디.md 파일)
//   - id      : 파일 이름 (예: ch01 → src/notes/ch01.md)
//   - title   : 제목
//   - group   : 묶음 이름
//   - summary : 한 줄 소개
${AUTO}
// ============================================================
`,
    `export const NOTE_LIST = ${listLiteral(notes)};

export const NOTE_GROUPS = ${JSON.stringify([...new Set(notes.map((n) => n.group))])};
`
  );

  // ---- 요약 출력 ----
  const count = (list, key) => list.reduce((acc, item) => ({ ...acc, [item[key]]: (acc[item[key]] || 0) + 1 }), {});
  console.log('필기 문제      :', written.length);
  console.log('SQLD 문제      :', sqld.length);
  console.log('단답형 100제   :', short100.length);
  console.log('IT용어 1탄/3탄 :', terms1.length, '/', terms3.length);
  console.log('네트워크 예상  :', network.length);
  console.log('단답 분류      :', count(shortAll, 'category'));
  console.log('실기 기출 합계 :', practical.length);
  console.log('실기 회차별    :', count(practical, 'exam'));
  console.log('실기 분류      :', count(practical, 'category'));
  console.log('요약노트       :', notes.length);
}

main();
