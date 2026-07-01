import {
  definePathSegment,
  DocumentEditor,
  documentsSegment,
  PathSegmentLink,
  TypesColumn,
  useCreateDocument,
  useDocuments,
  type AnyPathSegment,
} from '@jalyk/studio'
import { UserRoundIcon } from 'lucide-react'
import { PROFILE_TYPE } from './studio-config.ts'

// Кастомная навигация студии: корневой сегмент — колонка типов (навигацию она
// берёт из контекста сама), а под ней кнопка «Обо мне», ведущая в отдельный
// сегмент-лист. Профиль — singleton по соглашению: на проекте должен быть один
// документ типа profile. Сегмент сразу рендерит редактор этого документа, а
// если его ещё нет — кнопку создания.

/** Панель singleton-профиля: редактор единственного документа profile либо кнопка
 * его создания. Рендерится внутри <Studio>, поэтому доступны хуки данных. */
function ProfilePanel() {
  const profiles = useDocuments(PROFILE_TYPE)
  const create = useCreateDocument()
  const existing = profiles.data?.[0]

  if (profiles.isLoading) {
    return (
      <p className="p-4 text-sm text-muted-foreground">Загрузка…</p>
    )
  }

  if (existing) {
    return <DocumentEditor id={existing.id} type={PROFILE_TYPE} />
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-sm text-muted-foreground">
        Документ «Обо мне» ещё не создан.
      </p>
      <button
        type="button"
        onClick={() => create.mutate({ type: PROFILE_TYPE })}
        disabled={create.isPending}
        className="flex items-center gap-2 self-start rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
      >
        <UserRoundIcon className="size-4 text-muted-foreground" />
        {create.isPending ? 'Создание…' : 'Создать'}
      </button>
    </div>
  )
}

/** Сегмент-лист «Обо мне»: панель singleton-профиля. */
const profileSegment = definePathSegment({
  key: 'profile',
  title: 'Обо мне',
  view: () => (
    <div className="flex min-h-0 w-96 flex-1 flex-col overflow-hidden">
      <ProfilePanel />
    </div>
  ),
})

/** Корень кастомной навигации: колонка типов (без singleton-профиля) и под ней
 * кнопка «Обо мне». TypesColumn навигируется из контекста сам; фильтр прячет
 * profile из списка, а footer собран здесь — это зона потребителя, не колонки. */
export const customRootSegment: AnyPathSegment = definePathSegment({
  key: 'types',
  title: 'Типы',
  children: {
    documents: documentsSegment,
    profile: profileSegment,
  },
  view: ({ open }) => (
    <div className="flex min-h-0 w-56 flex-1 flex-col overflow-hidden">
      <TypesColumn filter={(type) => type !== PROFILE_TYPE} />
      <div className="border-t p-1">
        <PathSegmentLink
          to={open.profile({})}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-muted/50"
        >
          <UserRoundIcon className="size-4 text-muted-foreground" />
          Обо мне
        </PathSegmentLink>
      </div>
    </div>
  ),
})
