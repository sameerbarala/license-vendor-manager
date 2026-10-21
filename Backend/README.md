# License & Vendor Manager

A full-stack web app for managing software vendors and licenses.

## Tech stack

- Frontend: HTML, CSS, JavaScript
- Backend: Java, Spring Boot, Spring Data JPA
- Database: PostgreSQL (via Docker)

## Features so far

- Add, edit, delete and list vendors
- Search by name or email and filter by status
- Validation on both the frontend and the backend
- Vendors stored permanently in PostgreSQL

## Run locally

Requirements: JDK 21 or newer, Docker Desktop, VS Code with the Live Server extension.

1. Start the database (from `Backend/license-manager`): docker compose up -d
2. Start the backend (same folder): ./mvnw spring-boot:run
3. Open `vendors.html` with Live Server (the API runs at http://localhost:8080/api/vendors).

## API

| Method | URL | Purpose |
|---|---|---|
| GET | /api/vendors | List all vendors |
| GET | /api/vendors/{id} | Get one vendor |
| POST | /api/vendors | Create a vendor |
| PUT | /api/vendors/{id} | Update a vendor |
| DELETE | /api/vendors/{id} | Delete a vendor |

## Roadmap

- Licenses linked to vendors
- Expiry tracking and alerts
- Authentication
- Deployment