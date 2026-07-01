import {
  defineArray,
  defineConfig,
  defineDate,
  defineDateRange,
  defineDocument,
  defineObject,
  defineProjectBadge,
  defineString,
  index,
  rules,
} from '@jalyk/schema'
import { createStudio } from '@jalyk/studio'
import {
  BriefcaseIcon,
  BuildingIcon,
  CakeIcon,
  CalendarRangeIcon,
  CodeIcon,
  FileTextIcon,
  FolderGitIcon,
  LinkIcon,
  MapPinIcon,
  SendIcon,
  TagIcon,
  UserIcon,
  UserRoundIcon,
} from 'lucide-react'

// Тип-ключ профиля: документ «обо мне» — singleton по соглашению (на проекте всегда
// один документ типа profile). Сайт читает его через findMany({ take: 1 }), а студия
// открывает/создаёт его кнопкой «Обо мне» в навигации (см. custom-studio.tsx).
export const PROFILE_TYPE = 'profile' as const

/** Профиль автора: имя, дата рождения (возраст сайт считает сам) и ссылки на соцсети. */
const profileDoc = defineDocument({
  title: 'Обо мне',
  icon: UserRoundIcon,
  preview: { title: 'fullName' },
  fields: {
    fullName: defineString({ title: 'Имя', icon: UserIcon }),
    birthDate: defineDate({
      title: 'Дата рождения',
      icon: CakeIcon,
      format: 'long',
    }),
    country: defineString({ title: 'Страна', icon: MapPinIcon }),
    socials: defineObject({
      title: 'Соцсети',
      icon: LinkIcon,
      fields: {
        telegram: defineString({ title: 'Telegram', icon: SendIcon }),
        discord: defineString({ title: 'Discord', icon: LinkIcon }),
        github: defineString({ title: 'GitHub', icon: FolderGitIcon }),
      },
    }),
  },
  validate: (doc, path) => [
    rules.required(doc.fullName, { path: path(['fullName']) }),
    rules.required(doc.birthDate, { path: path(['birthDate']) }),
  ],
})

/** Запись личного (некоммерческого) опыта разработки. */
const devExperienceDoc = defineDocument({
  title: 'Личный опыт',
  icon: CodeIcon,
  preview: { title: 'title' },
  list: { search: ['title'], sort: ['title'] },
  fields: {
    title: defineString({ title: 'Название', icon: TagIcon }),
    description: defineString({
      title: 'Описание',
      icon: FileTextIcon,
      input: { type: 'multiline' },
    }),
    link: defineString({ title: 'Ссылка', icon: LinkIcon }),
    period: defineDateRange({ title: 'Период', icon: CalendarRangeIcon }),
  },
  validate: (doc, path) => [
    rules.required(doc.title, { path: path(['title']) }),
  ],
})

/** Мс из строки даты (defineDate/DateRange), либо undefined для незаданной. */
const timeOf = (date: string | undefined) =>
  date ? new Date(date).getTime() : undefined

/** Сообщение, если период проекта выходит за рамки трудоустройства в компании, иначе null. Пустой период компании ограничений не накладывает. */
function projectOutsideEmployment(
  employment: { from?: string; to?: string } | undefined,
  project: { from?: string; to?: string } | undefined,
) {
  const empFrom = timeOf(employment?.from)
  const empTo = timeOf(employment?.to)
  const projFrom = timeOf(project?.from)
  const projTo = timeOf(project?.to)
  if (empFrom !== undefined && projFrom !== undefined && projFrom < empFrom)
    return 'Проект начался раньше трудоустройства в компании'
  if (empTo !== undefined && projFrom !== undefined && projFrom > empTo)
    return 'Проект начался позже ухода из компании'
  if (empTo !== undefined && projTo !== undefined && projTo > empTo)
    return 'Проект закончился позже ухода из компании'
  if (empFrom !== undefined && projTo !== undefined && projTo < empFrom)
    return 'Проект закончился раньше трудоустройства в компании'
  return null
}

/** Запись коммерческого опыта работы. */
const commercialExperienceDoc = defineDocument({
  title: 'Коммерческий опыт',
  icon: BriefcaseIcon,
  preview: { title: 'company' },
  list: { search: ['company'], sort: ['company'] },
  fields: {
    company: defineString({ title: 'Компания', icon: BuildingIcon }),
    role: defineString({ title: 'Должность', icon: UserIcon }),
    period: defineDateRange({ title: 'Период', icon: CalendarRangeIcon }),
    projects: defineArray({
      title: 'Проекты',
      icon: FolderGitIcon,
      of: defineObject({
        title: 'Проект',
        icon: FolderGitIcon,
        fields: {
          title: defineString({ title: 'Название', icon: TagIcon }),
          period: defineDateRange({
            title: 'Начало — конец',
            icon: CalendarRangeIcon,
          }),
          link: defineString({ title: 'Ссылка', icon: LinkIcon }),
          participation: defineString({
            title: 'Участие',
            icon: FileTextIcon,
            input: { type: 'multiline' },
          }),
        },
      }),
    }),
  },
  validate: (doc, path) => [
    rules.required(doc.company, { path: path(['company']) }),
    rules.required(doc.role, { path: path(['role']) }),
    // Период каждого проекта должен лежать внутри трудоустройства в компании.
    ...(doc.projects ?? []).flatMap((project, i) => {
      const message = projectOutsideEmployment(doc.period, project.period)
      return message
        ? [
            {
              severity: 'error' as const,
              message,
              path: path(['projects', index(i), 'period']),
            },
          ]
        : []
    }),
  ],
})

/** Сборка документов; ключи задают типы документов проекта. */
const documents = {
  profile: profileDoc,
  devExperience: devExperienceDoc,
  commercialExperience: commercialExperienceDoc,
}

// Единая регистрация схемы: ключ → определение документа. Из неё выводятся ключи
// типов (для `to`/клиента) и карты полей. Рассинхрон ловит defineConfig.
declare module '@jalyk/schema' {
  interface SchemaRegistry {
    profile: typeof profileDoc
    devExperience: typeof devExperienceDoc
    commercialExperience: typeof commercialExperienceDoc
  }
}

export const config = defineConfig({
  documents,
  project: defineProjectBadge({ name: 'piscopancer', icon: UserRoundIcon }),
})

/** Типизированный клиент запросов студии (find/create/update/delete) из config. */
export const studio = createStudio(config)
