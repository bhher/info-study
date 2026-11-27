# Info Study (정보처리기사 학습 사이트)

`info/` 폴더의 정보처리기사 필기 · 실기 · SQLD 자료를 그대로 문제 데이터로 만들어 학습할 수 있는 React 사이트입니다.
(`react/hanmun-study` 와 같은 구조 · 같은 디자인 방향)

## 실행 방법

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 배포용 빌드 (dist/)
npm run check:data # 생성된 문제 데이터 검사
npm run build:data # info/*.md → src/data/*.js 다시 만들기
```

## 학습 데이터 (모두 `info/` 의 md 파일에서 자동 생성)

| 구분 | 개수 | 출처 | 화면 |
| --- | --- | --- | --- |
| 필기 객관식 | 80문제 (5과목) | 필기 모의고사 문제/정답 | 필기·SQLD, 모의고사 |
| SQLD 객관식 | 50문제 (2과목) | SQLD 모의고사 문제/정답 | 필기·SQLD, 모의고사 |
| 단답형·용어 | 320문제 | 단답형 100제, IT용어 1탄·3탄, 네트워크 예상문제 | 용어 암기, 단답형, 모의고사 |
| 실기 기출 | 300문제 | 2020~2025 실기 복원, Java 문제모음, Python 기출, 코딩 연습 | 실기 기출, 오늘의 학습 |
| 요약노트 | 12편 | 요약 노트(ch01~ch11), SQL 기출 정리 | 요약노트 |

## 주요 기능

- **홈**: 오늘의 용어, 오늘의 학습 목표 진행률, 학습 통계, 모의고사 현황, 최근 학습 기록, 추천 문제
- **오늘의 학습** (`/today`): 날짜별로 용어 5개 + 필기 미니 퀴즈 5문제 + 실기 문제 1개 + 요약노트 1편
- **용어 암기** (`/terms`): 설명을 보고 용어 떠올리기(정답 가리기), 검색, 분류/출처 필터, 암기·즐겨찾기, 해설 팝업, 암기 연습 모드
- **필기·SQLD** (`/written`): 과목별 4지선다 연습 (바로 채점 + 해설), 문제 수/순서/오답만 풀기
- **단답형** (`/short`): 직접 입력해서 채점, 모르겠어요(정답 보기), 내 답이 맞아요(수동 정정)
- **실기 기출** (`/practical`): 코드 해석·서술형을 스스로 풀고 정답/해설 확인, 분류/회차/검색, 이해 완료·다시 볼 문제
- **요약노트** (`/notes`): 마크다운 본문(코드·표 지원), 읽기 완료 기록, 이전/다음 이동
- **모의고사** (`/exam`): 8종 — 필기 80문제(150분), 필기 맛보기 20문제, SQLD 50문제, 실기 단답형 5회분(20문제씩). 타이머, 문제 번호판, 자동 제출, 합격 기준(60점) 표시
- **시험 결과 / 오답노트**: 문제별 내 답·정답·해설, 틀린 문제 자동 저장, 다시 풀기, 해결 체크, 누적 오답 횟수

학습 기록(암기·완료·즐겨찾기·시험 기록·오답노트)은 브라우저 `localStorage` (`info_` 접두사)에만 저장됩니다.

## 폴더 구조

```
info-study/
├─ scripts/
│  ├─ buildData.mjs   info/*.md 를 읽어 src/data/*.js, src/notes/*.md 생성
│  └─ checkData.mjs   데이터 검사 (id 중복, 정답 범위, 채점 통과 여부 등)
└─ src/
   ├─ data/           choiceData / shortData / practicalData / noteData (자동 생성), examData (시험 구성)
   ├─ notes/          요약노트 md (자동 복사, 읽을 때 지연 로딩)
   ├─ context/        StudyContext (학습 기록 전체 상태 + localStorage 저장)
   ├─ hooks/          useLocalStorage
   ├─ utils/          examUtils (채점), studyUtils (날짜·진행률)
   ├─ components/     Header, QuizCard, ShortCard, TermCard, PracticalCard, PracticeRunner, PracticePage ...
   └─ pages/          Home, Today, TermStudy, Written, Short, Practical, Notes, Exam, ExamResult, WrongAnswer
```

> `src/data/*Data.js` 와 `src/notes/*.md` 는 자동 생성 파일입니다. 내용을 고치려면 `info/` 의 md 를 고친 뒤
> `npm run build:data` 를 실행하세요. (`INFO_DIR` 환경변수로 다른 위치의 info 폴더도 지정할 수 있어요.)

## 단답형 채점 규칙

1. 공백·대소문자·문장부호는 무시합니다.
2. 정답 전체가 같으면 정답입니다.
3. 정답이 여러 개(`A, B, C`)이면 각각의 묶음 중 필요한 개수 이상을 입력해야 합니다. ("3가지 이상" 문제는 3개만 맞혀도 정답)
4. 한 묶음 안에서는 한글 이름과 영문 약어 중 어느 쪽으로 써도 인정됩니다. (예: `기밀성` 또는 `Confidentiality`)
5. 표현이 달라 오답 처리되면 **내 답이 맞아요** 버튼으로 직접 정정할 수 있습니다.
