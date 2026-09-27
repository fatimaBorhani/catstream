import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// (این کامنت فقط برای force کردن ری‌استارت کامل سرور dev اضافه شده - افزودن هوک useStreamStatus)
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
