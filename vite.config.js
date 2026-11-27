import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 문제 데이터(정적 JS)가 커서 기본 경고 기준(500kB)을 넘습니다. 학습 사이트라 문제 없으므로 기준을 올려 둡니다.
    chunkSizeWarningLimit: 1500,
  },
});
