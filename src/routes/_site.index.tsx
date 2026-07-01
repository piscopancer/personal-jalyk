import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  BriefcaseIcon,
  CodeIcon,
  ExternalLinkIcon,
  FolderGitIcon,
  SendIcon,
} from 'lucide-react'
import {
  commercialExperienceQuery,
  devExperienceQuery,
  profileQuery,
} from '@/lib/queries'

export const Route = createFileRoute('/_site/')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(profileQuery()),
      queryClient.ensureQueryData(devExperienceQuery()),
      queryClient.ensureQueryData(commercialExperienceQuery()),
    ])
  },
  component: HomePage,
})

/** Полных лет по дате рождения (строка формата defineDate). */
function ageFrom(birthDate: string) {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate()))
    age--
  return age
}

/** Склонение слова «год» по числу: 1 год, 2–4 года, 5–20 лет (11–14 → «лет»). */
function yearsWord(age: number) {
  const mod100 = age % 100
  if (mod100 >= 11 && mod100 <= 14) return 'лет'
  const mod10 = age % 10
  if (mod10 === 1) return 'год'
  if (mod10 >= 2 && mod10 <= 4) return 'года'
  return 'лет'
}

const monthYear = new Intl.DateTimeFormat('ru', {
  month: 'short',
  year: 'numeric',
})

/** Период «месяц год — месяц год» из диапазона defineDateRange; без даты конца — «наст. время». Нет даты начала — период не показываем. */
function formatPeriod(period: { from?: string; to?: string } | undefined) {
  if (!period?.from) return undefined
  const from = monthYear.format(new Date(period.from))
  const to = period.to ? monthYear.format(new Date(period.to)) : 'наст. время'
  return `${from} — ${to}`
}

function HomePage() {
  const { data: profile } = useSuspenseQuery(profileQuery())
  const { data: devExperience } = useSuspenseQuery(devExperienceQuery())
  const { data: commercial } = useSuspenseQuery(commercialExperienceQuery())

  if (!profile) {
    return (
      <p className="text-muted-foreground">
        Профиль ещё не заполнен. Откройте студию и создайте документ «Обо мне».
      </p>
    )
  }

  const socials = profile.socials ?? {}

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
            {profile.fullName?.trim().charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-semibold leading-tight">
              {profile.fullName}
            </h1>
            <p className="text-muted-foreground">piscopancer</p>
          </div>
        </div>
        {(() => {
          // Строка «возраст, страна»: показываем только заполненные части.
          const age = profile.birthDate
            ? `${ageFrom(profile.birthDate)} ${yearsWord(ageFrom(profile.birthDate))}`
            : undefined
          const parts = [age, profile.country].filter(Boolean)
          return parts.length > 0 ? (
            <p className="text-sm text-muted-foreground">{parts.join(', ')}</p>
          ) : null
        })()}
        <div className="flex flex-wrap gap-4 text-sm">
          {socials.telegram ? (
            <SocialLink href={socials.telegram} label="Telegram">
              <SendIcon className="size-4" />
            </SocialLink>
          ) : null}
          {socials.discord ? (
            <SocialLink href={socials.discord} label="Discord">
              <ExternalLinkIcon className="size-4" />
            </SocialLink>
          ) : null}
          {socials.github ? (
            <SocialLink href={socials.github} label="GitHub">
              <FolderGitIcon className="size-4" />
            </SocialLink>
          ) : null}
        </div>
      </section>

      <Timeline
        title="Личный опыт разработки"
        icon={<CodeIcon className="size-5" />}
        items={devExperience.map((item) => ({
          heading: item.title ?? '',
          description: item.description,
          link: item.link,
          period: item.period,
        }))}
      />

      <Timeline
        title="Коммерческий опыт"
        icon={<BriefcaseIcon className="size-5" />}
        items={commercial.map((item) => ({
          heading: item.company ?? '',
          sub: item.role,
          period: item.period,
          projects: item.projects,
        }))}
      />
    </div>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
    >
      {children}
      {label}
    </a>
  )
}

type TimelineProject = {
  title?: string
  period?: { from?: string; to?: string }
  link?: string
  participation?: string
}

type TimelineItem = {
  heading: string
  sub?: string
  description?: string
  link?: string
  period?: { from?: string; to?: string }
  projects?: TimelineProject[]
}

/** Момент начала участия для сортировки; без даты — в самый низ (0). */
function startTime(item: TimelineItem) {
  return item.period?.from ? new Date(item.period.from).getTime() : 0
}

function Timeline({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: TimelineItem[]
}) {
  if (items.length === 0) return null
  // Сортировка по дате начала участия, свежие сверху.
  const sorted = [...items].sort((a, b) => startTime(b) - startTime(a))
  return (
    <section className="flex flex-col gap-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        {icon}
        {title}
      </h2>
      <ol className="flex flex-col">
        {sorted.map((item, i) => {
          const last = i === sorted.length - 1
          const period = formatPeriod(item.period)
          return (
            <li key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="mt-1.5 size-3 shrink-0 rounded-full border-2 border-foreground bg-background" />
                {last ? null : <span className="w-px flex-1 bg-border" />}
              </div>
              <div
                className={
                  last
                    ? 'flex min-w-0 flex-1 flex-col gap-1'
                    : 'flex min-w-0 flex-1 flex-col gap-1 pb-8'
                }
              >
                {period ? (
                  <span className="text-xs text-muted-foreground">{period}</span>
                ) : null}
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-medium">{item.heading}</h3>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Ссылка"
                      title="Ссылка"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLinkIcon className="size-4" />
                    </a>
                  ) : null}
                </div>
                {item.sub ? (
                  <p className="text-sm text-muted-foreground">{item.sub}</p>
                ) : null}
                {item.description ? (
                  <p className="whitespace-pre-line text-sm">{item.description}</p>
                ) : null}
                {item.projects && item.projects.length > 0 ? (
                  <ProjectsGrid projects={item.projects} />
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** Проекты компании сеткой. Container query (@container): число колонок зависит от ширины самой колонки записи, а не окна. */
function ProjectsGrid({ projects }: { projects: TimelineProject[] }) {
  return (
    <div className="@container mt-2">
      <ul className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @2xl:grid-cols-3">
        {projects.map((project, i) => {
          const period = formatPeriod(project.period)
          return (
            <li
              key={i}
              className="flex flex-col gap-1 rounded-lg border p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-sm font-medium">{project.title}</h4>
                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Ссылка"
                    title="Ссылка"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                ) : null}
              </div>
              {period ? (
                <span className="text-xs text-muted-foreground">{period}</span>
              ) : null}
              {project.participation ? (
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {project.participation}
                </p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
