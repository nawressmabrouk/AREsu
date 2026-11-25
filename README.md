# ReservationApp (AREsu)

Space-reservation platform for the Université de Sousse: users book rooms,
amphitheatres and other spaces of the partner establishments; secretaries and
room managers approve the requests; admins and the super-admin manage
establishments, spaces and accounts.

- `reservation-app/` — Spring Boot 3.4 REST API (Java 21, MongoDB, JWT)
- `reservationApp-ui/` — Angular 19 frontend (standalone components, Angular Material)

Optional integrations — the app starts and works without them, the feature is
simply disabled with a warning in the backend log:

| Feature | Needs | Without it |
|---|---|---|
| E-mails (activation, password reset, notifications) | `MAIL_USERNAME` + `MAIL_PASSWORD` (Gmail App Password) | E-mails are skipped; activation and reset links are written to the backend log |
| Google Calendar sync | Service-account key file (`GOOGLE_SERVICE_ACCOUNT_KEY_FILE`) | Reservations are approved without calendar sync; the booking calendar still works |
| Chatbot | Python 3.12 + `reservation-app/requirements.txt` | The chat answers "Le chatbot n'est pas disponible pour le moment…" |

## Prerequisites

- **Java 21** (`java -version`). Maven is not needed: use the `mvnw.cmd` wrapper.
- **Node.js 20 or 22 LTS** and npm (`node -v`); Node 24 also works.
- **MongoDB**: either Docker Desktop (local database, see below) or a MongoDB Atlas cluster.
- Optional: **Python 3.12** for the chatbot.

## Quick start (Windows PowerShell)

### 1. One-time setup

```powershell
git clone https://github.com/nawressmabrouk/AREsu.git
cd AREsu
git config core.hooksPath .githooks          # enables the secret-blocking pre-commit hook

cd reservation-app
Copy-Item .env.example .env
notepad .env                                  # see "Configuration and secrets" below
```

At minimum set `JWT_SECRET`, and on the very first start `ADMIN_USERNAME` /
`ADMIN_PASSWORD` (see [First SUPER_ADMIN account](#2-first-super_admin-account)).

### 2. Database

Local MongoDB with Docker (no account needed — this is the default `MONGODB_URI`):

```powershell
docker compose up -d          # from the repository root; "docker compose down" to stop
```

Or use MongoDB Atlas: put the connection string in `MONGODB_URI` in `.env`.

### 3. Backend — http://localhost:8080

```powershell
cd reservation-app
.\mvnw.cmd spring-boot:run
```

The log ends with `Started ReservationAppApplication`, followed by one line per
optional feature (e-mails, Google Calendar, chatbot) saying whether it is enabled.

### 4. Frontend — http://localhost:4200

In a second terminal:

```powershell
cd reservationApp-ui
npm install
npm start
```

`npm start` runs `ng serve` with `proxy.conf.json`, which forwards `/api` to the
backend on port 8080. Open http://localhost:4200.

### 5. Optional: chatbot

```powershell
cd reservation-app
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

The backend uses `reservation-app\.venv` automatically (or the interpreter in
`CHATBOT_PYTHON`). The language model (~470 MB) is downloaded on first use; on a
slow connection, warm the cache once before using the chat (the backend gives up
on a question after 120 s):

```powershell
"Comment réserver une salle ?" | .\.venv\Scripts\python.exe ask_bot.py --stdin
```

After that each answer takes about 10–15 seconds, because the model is loaded for
every question.

## Configuration and secrets

`reservation-app/src/main/resources/application.yml` contains **no secrets**, only
`${VARIABLE}` placeholders. The values come from environment variables or from a
git-ignored `reservation-app/.env` file. Real environment variables take precedence
over `.env`.

### 1. Create your `.env`

```powershell
cd reservation-app
Copy-Item .env.example .env
notepad .env
```

`.env.example` lists every variable with an explanation. The essentials:

| Variable | Required | Notes |
|---|---|---|
| `JWT_SECRET` | yes | Base64, at least 256 bits. Generate it with the command below. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | on first start | Creates the first SUPER_ADMIN (see below). |
| `MONGODB_URI` | no | Defaults to `mongodb://localhost:27017/reservation`. |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | no | Gmail address + **App Password** (16 letters, no spaces). |
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | no | Defaults to `file:./secrets/service-account.json`. |
| `CHATBOT_PYTHON` | no | Python with the chatbot packages; defaults to `.venv`, then `python`. |
| `APP_FRONTEND_URL` / `APP_BACKEND_URL` | no | Used in e-mail links; default to localhost:4200 / localhost:8080. |

Generate a JWT secret (PowerShell):

```powershell
$b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

Google credential files (service-account key) go in `reservation-app/secrets/`,
which is git-ignored. Never put them in `src/main/resources`.

### 2. First SUPER_ADMIN account

There is **no default login**. On startup, if no SUPER_ADMIN exists in the database,
the backend creates one from `ADMIN_USERNAME` (an e-mail address, used to log in) and
`ADMIN_PASSWORD` (stored as a BCrypt hash). The backend refuses to start if the
password is weak (minimum 12 characters and 3 of: lowercase, uppercase, digit, symbol)
or if the variables are missing while no SUPER_ADMIN exists. An existing account is
never modified, so after the first start you can remove `ADMIN_PASSWORD` from `.env`.

### 3. Secret protection (pre-commit hook)

The repository ships a pre-commit hook that blocks commits containing secrets
(`.env` files, credential JSON files, keys, passwords, MongoDB URIs with a password,
Google API keys...). Enable it once per clone:

```powershell
git config core.hooksPath .githooks
```

It works out of the box. If [gitleaks](https://github.com/gitleaks/gitleaks) is
installed (`winget install --id Gitleaks.Gitleaks`), the hook also runs it.

## Roles

| Role (backend `Role`) | Landing page |
|---|---|
| `DEMANDEUR_INTERNE`, `DEMANDEUR_EXTERNE` | `/spaces` — browse spaces and book through the calendar |
| `SECRETAIRE_GENERALE` | `/secretary` — approve or refuse requests |
| `RESPONSABLE_SALLE` | `/room-manager` — approve requests for managed spaces |
| `ADMIN` | `/admin` — establishment administration |
| `SUPER_ADMIN` | `/super-admin/dashboard` — all establishments |

The frontend guards these pages by role; the backend checks the role again on
`/api/admin`, `/api/secretaire`, `/api/responsable`, `/api/demandeur` and `/api/super-admin`.

## Useful commands

```powershell
# Backend (from reservation-app/)
.\mvnw.cmd clean install          # build + tests (tests need the database from .env)
.\mvnw.cmd spring-boot:run        # run

# Frontend (from reservationApp-ui/)
npm start                         # dev server with /api proxy
npx ng build                      # production build into dist/
```

## Troubleshooting

- **`JAVA_HOME is not defined correctly`** — install Java 21 and point `JAVA_HOME`
  to it, e.g. `$env:JAVA_HOME = Split-Path (Split-Path (Get-Command java).Source)`.
- **The backend refuses to start** — read the last lines of the log: missing or weak
  `JWT_SECRET` / `ADMIN_PASSWORD` are reported in French with the fix.
- **MongoDB SRV / DNS / timeout errors (Atlas)** — check the URI, that the cluster is
  not paused, and that your IP is in Atlas *Network Access*. Or use the local Docker
  database (`docker compose up -d` and remove `MONGODB_URI` from `.env`).
- **Port 8080 or 4200 already in use** — stop the other process, or run the backend
  with `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"`
  and change the target in `reservationApp-ui/proxy.conf.json`.
- **`npm warn allow-scripts`** during `npm install` (npm 11) — harmless: the build
  tools ship prebuilt Windows binaries.
- **Chatbot answers "pas disponible"** — check the backend log line starting with
  `Chatbot`; it tells whether Python or the packages are missing.

## License

This project is for internal academic / university reservation management usage.
