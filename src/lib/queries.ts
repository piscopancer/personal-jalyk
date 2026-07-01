import { queryOptions } from '@tanstack/react-query'
import {
  getProfile,
  listCommercialExperience,
  listDevExperience,
} from '@/server/functions/content'

// Единый источник ключей кэша и queryOptions поверх серверных функций контента.
// Роуты грузят их в лоадерах через ensureQueryData для SSR.
export const qk = {
  profile: ['profile'] as const,
  devExperience: ['dev-experience'] as const,
  commercialExperience: ['commercial-experience'] as const,
}

export const profileQuery = () =>
  queryOptions({ queryKey: qk.profile, queryFn: () => getProfile() })

export const devExperienceQuery = () =>
  queryOptions({
    queryKey: qk.devExperience,
    queryFn: () => listDevExperience(),
  })

export const commercialExperienceQuery = () =>
  queryOptions({
    queryKey: qk.commercialExperience,
    queryFn: () => listCommercialExperience(),
  })
