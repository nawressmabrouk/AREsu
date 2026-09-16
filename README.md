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

## Configuration notes

The backend configuration is in:

- `reservation-app/src/main/resources/application.yml`

Important settings include:

- MongoDB connection URI
- JWT secret and expiry
- Mail credentials
- Google Calendar configuration

## Default admin credentials

The application security configuration includes a default admin user:

- Username: `admin`
- Password: `admin`

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
