import babel from '@rolldown/plugin-babel'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// Standalone-сайт-потребитель платформы Jalyk. Конфиг проекта (JALYK_*/VITE_JALYK_*)
// лежит в .env в корне самого проекта. Vite сам кладёт в process.env только VITE_-
// префикс; серверное чтение контента (через Effect Config) читает голый process.env,
// поэтому подгружаем все переменные из корня проекта (префикс '') вручную, как в
// apps/web монорепы.
const projectRoot = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, projectRoot, ''))
  return {
    server: { port: 3100, host: true },
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      tanstackStart(),
      // Деплой на Vercel: пресет vercel даёт серверless-выход в .vercel/output,
      // который Vercel подхватывает напрямую (в отличие от node-server у web на Railway).
      nitroV2Plugin({ preset: 'vercel' }),
      viteReact(),
      // React Compiler: в plugin-react v6 (oxc/rolldown) babel-конвейера в самом
      // плагине нет, поэтому компилятор подключаем отдельным rolldown-babel плагином
      // с пресетом из plugin-react (см. apps/web/vite.config.ts монорепы).
      babel({ presets: [reactCompilerPreset()] }),
    ],
  }
})
