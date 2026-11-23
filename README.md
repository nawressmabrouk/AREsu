# ReservationApp

ReservationApp is a full-stack reservation system for managing university spaces and bookings. It includes:

- A Spring Boot REST API backend
- An Angular frontend
- MongoDB persistence
- Google Calendar integration
- JWT-based authentication and authorization
- AI chatbot support via Spring AI / Ollama integration

## Project structure

- `reservation-app/` — Spring Boot backend
- `reservationApp-ui/` — Angular frontend

## Prerequisites

Before running the project, make sure you have:

- Java 21
- Maven (the project includes `mvnw` wrapper, so Maven is not strictly required)
- Node.js 18+ and npm
- Access to the configured MongoDB Atlas connection
- Internet access for Google Calendar and mail features

## Backend setup

1. Open a terminal in the project root.
2. Set Java 21 as `JAVA_HOME`.

Example on Windows PowerShell:

```powershell
$env:JAVA_HOME = 'C:\Users\nawre\AppData\Local\Programs\jdk-21\jdk-21.0.12.1+1'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

3. Start the backend:

```powershell
cd reservation-app
.\mvnw.cmd spring-boot:run
```

The backend runs by default on:

- http://localhost:8080

## Frontend setup

1. Open a second terminal.
2. Install dependencies:

```powershell
cd reservationApp-ui
npm install
```

3. Start the Angular app:

```powershell
npm start
```

The frontend runs by default on:

- http://localhost:4200

## Running the whole app

Start the backend first, then the frontend.

Once both are running, open:

- http://localhost:4200

The Angular app is configured to proxy `/api` calls to the backend via the file `reservationApp-ui/proxy.conf.json`.

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
| `MAIL_USERNAME` / `MAIL_PASSWORD` | no | Gmail address + **App Password**. |
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | no | Defaults to `file:./secrets/service-account.json`. |

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

## Common issues

### Java error: `JAVA_HOME is not defined correctly`

Install Java 21 and set `JAVA_HOME` before running the backend.

### MongoDB SRV/DNS errors

The backend currently uses a MongoDB Atlas connection string. If you see DNS/SRV resolution errors, verify:

- your network can resolve the configured MongoDB host
- the MongoDB URI is valid and still active
- the Atlas cluster is reachable from this environment

### Frontend dependency install issues

Run:

```powershell
npm install
```

If needed, delete `node_modules` and the lock file and reinstall.

## Useful commands

Backend:

```powershell
cd reservation-app
.\mvnw.cmd clean install
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd reservationApp-ui
npm install
npm start
```

## License

This project is for internal academic / university reservation management usage.
