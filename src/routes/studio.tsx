import { Studio } from '@jalyk/studio'
import { createFileRoute } from '@tanstack/react-router'
import { customRootSegment } from '@/custom-studio'
import { config } from '@/studio-config'

// Студия интерактивна и завязана на window/браузерные API, поэтому SSR для неё
// выключен (ssr: false) — рендерится только на клиенте. Параметры подключения берём
// из VITE_JALYK_* (инлайнятся в клиентский бандл): projectId и write-ключ. Адреса
// api и центрального домена входа студия знает сама (дефолты в @jalyk/studio).
const projectId = import.meta.env.VITE_JALYK_PROJECT_ID as string | undefined
const apiKey = import.meta.env.VITE_JALYK_API_KEY as string | undefined

export const Route = createFileRoute('/studio')({
  ssr: false,
  component: StudioPage,
})

function StudioPage() {
  if (!projectId || !apiKey) return <Missing />

  return (
    <div className="h-screen">
      <Studio
        projectId={projectId}
        apiKey={apiKey}
        config={config}
        layout="miller"
        navigation={{ root: customRootSegment }}
        homeUrl="/"
      />
    </div>
  )
}

function Missing() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Студия не настроена</h1>
      <p className="mt-2 text-muted-foreground">
        Задайте в <code>.env</code> переменные <code>VITE_JALYK_PROJECT_ID</code> и{' '}
        <code>VITE_JALYK_API_KEY</code> (ключ со scope write).
      </p>
    </div>
  )
}
