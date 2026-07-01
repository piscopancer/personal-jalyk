import { faker } from '@faker-js/faker'
import { createClient } from '@jalyk/client'
import type { DocumentRecord } from '@jalyk/schema'
import { Config, Context, Effect, Layer, ManagedRuntime } from 'effect'
import { config } from '@/studio-config'

// Контент-слой сайта как Effect-сервис с двумя реализациями. Контракт (методы
// чтения) объявлен здесь, а формы данных не пишутся руками — они высасываются из
// типов, порождённых конфигом студии (DocumentRecord<typeof config, ключ>). Live-
// реализация читает опубликованный контент через @jalyk/client, fake — генерит
// случайные данные через @faker-js/faker для локального прогона без бэкенда.

type Cfg = typeof config

/** Профиль «обо мне» — форма выведена из конфига студии. */
export type Profile = DocumentRecord<Cfg, 'profile'>
/** Запись личного опыта — форма из конфига. */
export type DevExperience = DocumentRecord<Cfg, 'devExperience'>
/** Запись коммерческого опыта — форма из конфига. */
export type CommercialExperience = DocumentRecord<Cfg, 'commercialExperience'>

/** Контракт чтения контента сайта. Реализации: [[ContentLive]] и [[ContentFake]]. */
export class Content extends Context.Tag('Content')<
  Content,
  {
    readonly getProfile: Effect.Effect<Profile | null>
    readonly listDevExperience: Effect.Effect<ReadonlyArray<DevExperience>>
    readonly listCommercialExperience: Effect.Effect<
      ReadonlyArray<CommercialExperience>
    >
  }
>() {}

// Адрес api задавать не нужно — он зашит дефолтом в @jalyk/client. Потребитель
// сообщает лишь свой проект и read-ключ. Id проекта не секрет (он и так в браузерном
// бандле студии), поэтому берём общий VITE_JALYK_PROJECT_ID — vite.config кладёт все
// переменные в process.env, так что серверный слой читает ту же, без дубля.
const connection = Config.all({
  projectId: Config.string('VITE_JALYK_PROJECT_ID'),
  apiKey: Config.string('JALYK_CONTENT_API_KEY'),
})

/** Прод-реализация: читает опубликованный контент студии через @jalyk/client. */
export const ContentLive = Layer.effect(
  Content,
  Effect.gen(function* () {
    const options = yield* connection
    const client = createClient(config, options)
    return Content.of({
      getProfile: Effect.promise(() =>
        client.profile.findMany({ take: 1 }),
      ).pipe(Effect.map((rows) => rows[0] ?? null)),
      listDevExperience: Effect.promise(() => client.devExperience.findMany()),
      listCommercialExperience: Effect.promise(() =>
        client.commercialExperience.findMany(),
      ),
    })
  }),
)

/** Случайный период «дата — дата» в пределах последних лет — для таймлайна. */
const fakePeriod = () => {
  const from = faker.date.past({ years: 6 })
  const to = faker.date.between({ from, to: new Date() })
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(from), to: iso(to) }
}

const fakeProfile = (): Profile => ({
  id: faker.string.uuid(),
  fullName: faker.person.fullName(),
  birthDate: faker.date
    .birthdate({ min: 18, max: 35, mode: 'age' })
    .toISOString()
    .slice(0, 10),
  country: faker.location.country(),
  socials: {
    telegram: `https://t.me/${faker.internet.username()}`,
    discord: `https://discord.com/users/${faker.string.numeric(18)}`,
    github: `https://github.com/${faker.internet.username()}`,
  },
})

const fakeDevExperience = (): DevExperience => ({
  id: faker.string.uuid(),
  title: faker.commerce.productName(),
  description: faker.lorem.paragraph(),
  link: faker.internet.url(),
  period: fakePeriod(),
})

const fakeCommercialProject = () => ({
  title: faker.commerce.productName(),
  period: fakePeriod(),
  link: faker.internet.url(),
  participation: faker.lorem.sentence(),
})

const fakeCommercialExperience = (): CommercialExperience => ({
  id: faker.string.uuid(),
  company: faker.company.name(),
  role: faker.person.jobTitle(),
  period: fakePeriod(),
  projects: faker.helpers.multiple(fakeCommercialProject, {
    count: { min: 1, max: 3 },
  }),
})

/** Тестовая реализация: случайные данные обо мне и записи опыта через faker. */
export const ContentFake = Layer.succeed(
  Content,
  Content.of({
    getProfile: Effect.sync(fakeProfile),
    listDevExperience: Effect.sync(() =>
      faker.helpers.multiple(fakeDevExperience, { count: { min: 2, max: 4 } }),
    ),
    listCommercialExperience: Effect.sync(() =>
      faker.helpers.multiple(fakeCommercialExperience, {
        count: { min: 2, max: 4 },
      }),
    ),
  }),
)

/** Выбор реализации: CONTENT_SOURCE=fake → faker, иначе (по умолчанию) — студия. */
const source = Config.string('CONTENT_SOURCE').pipe(
  Config.withDefault('live'),
  Config.map((value) => (value === 'fake' ? 'fake' : 'live') as const),
)

const contentLayer = Layer.unwrapEffect(
  source.pipe(
    Effect.map((value) => (value === 'fake' ? ContentFake : ContentLive)),
  ),
)

const runtime = ManagedRuntime.make(contentLayer)

/** Запустить эффект, зависящий от сервиса Content, на выбранной реализации. */
export function runContent<A>(
  use: (content: Context.Tag.Service<Content>) => Effect.Effect<A>,
) {
  return runtime.runPromise(Effect.flatMap(Content, use))
}
