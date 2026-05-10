# CasebattleZB

## Deploy backend (Render) + frontend (GitHub Pages)

### 1) Deploy API on Render

1. Open [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Select this GitHub repository (`CasebattleZB`).
4. Render will detect `render.yaml` and create service `casebattlezb-api`.
5. Wait until deploy is green and copy your API URL, for example:
   `https://casebattlezb-api.onrender.com/api`

Quick check:
- open `https://<your-render-domain>/api/health`
- expected response: `{"status":"ok"}`

### 2) Connect API URL to GitHub Pages build

1. Open repository settings:
   `Settings` -> `Secrets and variables` -> `Actions` -> `Variables`.
2. Add variable:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://<your-render-domain>/api`
3. Open `Actions` tab -> `Deploy to GitHub Pages` -> **Run workflow** (or push any commit).

### 3) Open the site

`https://kostavladimirov837-code.github.io/CasebattleZB/`

After the variable is set and workflow completes, registration and login will use your deployed backend.