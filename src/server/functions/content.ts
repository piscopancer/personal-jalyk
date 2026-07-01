import { createServerFn } from '@tanstack/react-start'
import { runContent } from '../content'

// Серверные функции чтения контента поверх сервиса Content (реализация выбирается
// в content.ts через CONTENT_SOURCE).

export const getProfile = createServerFn({ method: 'GET' }).handler(() =>
  runContent((content) => content.getProfile),
)

export const listDevExperience = createServerFn({ method: 'GET' }).handler(() =>
  runContent((content) => content.listDevExperience),
)

export const listCommercialExperience = createServerFn({
  method: 'GET',
}).handler(() => runContent((content) => content.listCommercialExperience))
