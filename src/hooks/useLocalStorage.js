// ============================================================
// 역할: useState 처럼 쓰지만, 값이 바뀔 때마다 localStorage 에 자동 저장되는 훅
//
// 사용법
//   const [list, setList] = useLocalStorage('hanmun_list', [], Array.isArray);
//
//   - key          : 저장소에 쓸 이름
//   - initialValue : 저장된 값이 없거나 깨졌을 때 쓸 처음 값
//   - validate     : (선택) 읽어 온 값이 올바른 모양인지 검사하는 함수. false 면 처음 값을 사용
//
// ※ localStorage 는 "글자"만 저장할 수 있어서 JSON.stringify / JSON.parse 를 사용합니다.
// ============================================================
import { useEffect, useState } from 'react';

function useLocalStorage(key, initialValue, validate) {
  // 처음 한 번만 저장소에서 읽어 옵니다. (함수를 넘기면 첫 렌더링 때만 실행됨)
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initialValue; // 처음 방문

      const saved = JSON.parse(raw);
      // 저장된 값이 깨졌다면(모양이 다르면) 처음 값으로 시작 → 화면이 멈추지 않게 함
      return !validate || validate(saved) ? saved : initialValue;
    } catch {
      return initialValue;
    }
  });

  // 값이 바뀔 때마다 저장
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 공간이 없거나 사용할 수 없는 환경이어도 화면은 계속 동작하게 함
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
