import { createFileRoute, Outlet } from '@tanstack/react-router'

// Лейаут публичной части сайта: центрированный контейнер контента без шапки.
// Студия (/studio) сюда не входит — она живёт прямо под root на весь экран;
// вернуться из неё можно кнопкой-домиком в её тулбаре (Studio.homeUrl).
export const Route = createFileRoute('/_site')({
  component: SiteLayout,
})

function SiteLayout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4">
      <main className="flex-1 py-16">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Сайт использует{' '}
        <a
          href="https://jalyk.up.railway.app"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground hover:underline"
        >
          Jalyk
        </a>
        .
      </footer>
    </div>
  )
}
