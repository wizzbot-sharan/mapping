# Client–CA Mapping Dashboard

A full-stack application for managing and synchronizing client mappings to Chartered Accountants (CAs). Built with **React (Vite)**, **Tailwind CSS**, **Node.js (Express)**, and **Azure PostgreSQL**.

---

## Features

1. **Database Setup & Integrity**:
   - Manages a dedicated `client_ca` table with columns: `client_id` (PRIMARY KEY), `applywizz_id`, `full_name`, `company_email`, `ca_id`, `name`, `email`, and audit timestamps.
   - Enforces unique client-to-CA mappings at the database level.
   - Preserves client identifiers and company email upon assignment updates.

2. **Client Synchronization**:
   - Synchronizes client records directly from the `clients_additional_info` table (`id`, `full_name`, `applywizz_id`, `company_email`).
   - Implements **Strict Mirror Upsert**: updates existing clients, adds new clients, preserves existing CA assignments, and deletes client mappings that have been removed from `clients_additional_info`.

3. **CA Directory & 8-Hour Persistent Cache**:
   - Fetches the latest list of Chartered Accountants from your external CA API.
   - Persists the CA list in the browser's `localStorage` with an **8-hour TTL**.
   - No RAM bloat and avoids repeated API requests across reloads and dropdowns.
   - Dedicated "CAs Directory" tab displaying all CAs and their assigned client counts.

4. **Searchable Dropdowns & Instant Assignment**:
   - Built with `react-select` for fast, keyboard-friendly search and filtering by CA name or email.
   - **OK** confirmation button with loading indicator and disabled states to prevent duplicate submissions.
   - Changes persist immediately to Azure PostgreSQL and remain editable at any time.

---

## Configuration (`.env`)

Create a `.env` file in the project root (or inside `backend/`):

```env
# Azure PostgreSQL Connection String
DATABASE_URL=postgresql://<username>:<password>@<azure-postgres-host>.postgres.database.azure.com:5432/<dbname>?sslmode=require

# External CA API URL
CA_API_URL=https://api.example.com/v1/cas

# Optional CA API Key (if your API requires Authorization header)
# CA_API_KEY=your_token_or_key_here

# Backend Port (defaults to 5000)
PORT=5000
```

---

## Running the Application

### 1. Install Dependencies
```bash
# In the root directory
npm run install:all
```

### 2. Start Backend Server
```bash
npm run dev:backend
# Server runs on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 3. Start Frontend Dashboard
```bash
npm run dev:frontend
# Frontend runs on http://localhost:5173
```

---

## API Endpoints

- `GET /api/health`: Server status and PostgreSQL connection verification.
- `GET /api/clients`: Returns all current clients in `client_ca`.
- `POST /api/clients/sync`: Synchronizes and upserts records from `clients_additional_info` into `client_ca`.
- `PUT /api/clients/:clientId/assign-ca`: Assigns or updates a Chartered Accountant (`ca_id`, `name`, `email`) for a client.
- `GET /api/cas`: Queries external CA API, standardizes JSON format, and returns CA list.
