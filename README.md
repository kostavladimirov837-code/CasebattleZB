# CasebattleZB

Фронтенд-версия сайта без бэкенда: все игровые данные, авторизация и прогресс хранятся локально в браузере (`localStorage`).

## Участники

Основной автор и сопровождение: **[Jwiqen](https://github.com/Jwiqen)**.

На GitHub вкладка **Contributors** строится по авторам коммитов и строкам `Co-authored-by:` в сообщении. Чтобы новые коммиты шли только от вас, в репозитории заданы `user.name` / `user.email` под Jwiqen; при клонировании на другой ПК выполните `git config user.name "Jwiqen"` и укажите email, привязанный к вашему GitHub. Если IDE автоматически дописывает `Co-authored-by: Cursor …`, отключите это в настройках редактора или используйте `git commit --no-verify`, иначе бот снова появится в Contributors. Файл [.mailmap](.mailmap) опционально выравнивает имена в `git log`; старую историю на GitHub можно заменить только переписав коммиты и сделав `git push --force` (осторожно, если с репозиторием уже работают другие).

## Локальный запуск

1. Установить зависимости:
   `npm install`
2. Запустить dev-сервер:
   `npm run dev`
3. Открыть адрес из консоли Vite.

## Сборка

- `npm run build` - production build фронтенда
- `npm run preview` - локальный просмотр production-сборки

## GitHub Pages

Сайт на Pages **обновляется только на GitHub**: после `git push` в ветку `main` или `feature/layout-improvements` запускается workflow [Deploy to GitHub Pages](.github/workflows/deploy-pages.yml). Без `git push` деплой не стартует — нужны ваши учётные данные GitHub.

### Один раз в репозитории

1. **Settings → Pages → Build and deployment**: источник **GitHub Actions** (не «Deploy from a branch»), если хотите использовать этот workflow.
2. Убедитесь, что **Actions** включены и для среды `github-pages` нет блокирующих правил (при первом деплое GitHub может попросить подтверждение).
3. Проверьте remote (имя репозитория должно совпадать с тем, что в URL сайта `…github.io/<имя>/`):

   ```bash
   git remote -v
   # при необходимости:
   # git remote set-url origin https://github.com/Jwiqen/ВАШ-РЕПО.git
   ```

### Отправить код и обновить сайт

Вариант A — **GitHub CLI** (удобно один раз залогиниться):

```bash
gh auth login
git push -u origin feature/layout-improvements
# или основная ветка:
git push -u origin main
```

Вариант B — **HTTPS + Personal Access Token** (классический `repo` scope):

```bash
git push https://github.com/Jwiqen/ВАШ-РЕПО.git feature/layout-improvements
```

(логин — ваш GitHub username, пароль — токен, не пароль от аккаунта.)

Вариант C — после push откройте **Actions → Deploy to GitHub Pages → Run workflow** (у workflow есть `workflow_dispatch`), если нужно перезапустить деплой без нового коммита.

### Сборка в папку `docs/` (без Actions)

Если хотите публиковать из ветки и папки `docs/`:

```bash
npm run pages:export
```

Затем добавьте в коммит (папка `docs/` в [.gitignore](.gitignore), чтобы не мешала обычной работе): `git add -f docs/` и в **Settings → Pages** выберите ветку и каталог `/docs`. Если имя репозитория не `CasebattleZB`, поменяйте `--base` в скрипте `pages:export` в [package.json](package.json).