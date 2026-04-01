import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  // @ 별칭 지정 추가
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  // (추가) 프론트(5173)와 백엔드(8080)를 하나로 묶어주는 설정
  server: {
    proxy: {
      '/member': {
        target: 'http://localhost:8080', // 백엔드 주소
        changeOrigin: true,
        // secure: false, // 만약 https가 아니라면 생략 가능
      }
    }
  }
})