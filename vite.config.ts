import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // أضف هذا السطر لحل مشاكل المسارات نهائياً
})
