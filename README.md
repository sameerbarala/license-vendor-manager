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

## Run with Docker

Requirements: Docker Desktop.

From `Backend/license-manager`:

```
docker compose up --build -d
```

- App: http://localhost:3000
- API: http://localhost:8080/api/vendors

Stop with `docker compose down`.

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