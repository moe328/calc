# Calculator Backend API

Node.js/Express REST API that performs calculator operations on the server and stores the latest calculation history in MySQL. It never uses `eval()` and uses parameterized SQL statements for database writes.

## Project structure

```text
calculator-backend/
|-- config/
|   `-- db.js
|-- controllers/
|   `-- calcController.js
|-- database/
|   `-- schema.sql
|-- routes/
|   `-- calcRoutes.js
|-- .env.example
|-- .gitignore
|-- frontend-integration-guide.js
|-- package.json
|-- README.md
`-- server.js
```

## Prerequisites

- Node.js 18 or newer
- MySQL 8 or newer
- A MySQL account allowed to create a database and table

## 1. Create the database

From the `calculator-backend` directory, import the schema with the MySQL command-line client:

```sh
mysql -u root -p < database/schema.sql
```

Enter the MySQL password when prompted. The script creates `calculator_db` and the `calculations_history` table if they do not already exist.

In PowerShell, use the MySQL client's `source` command:

```powershell
mysql -u root -p -e "source database/schema.sql"
```

You can alternatively open `database/schema.sql` in MySQL Workbench and run the entire script.

For a deployed application, use a dedicated MySQL account with access to `calculator_db` instead of the MySQL root account.

## 2. Install and configure

Install the dependencies:

```sh
npm install
```

Copy `.env.example` to `.env`:

```sh
cp .env.example .env
```

On PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Update `.env` with the MySQL credentials and the origin where the frontend is served:

```dotenv
PORT=5000
CORS_ORIGIN=http://localhost:5500
DB_HOST=localhost
DB_PORT=3306
DB_USER=calculator_user
DB_PASS=your_mysql_password
DB_NAME=calculator_db
```

`CORS_ORIGIN` accepts a comma-separated list when more than one frontend origin is needed, for example `http://localhost:5500,https://calculator.example.com`. When it is empty, all origins are allowed. Requests without an Origin header, including command-line requests, are also accepted.

## 3. Start the API

```sh
npm start
```

The calculator frontend is available at `http://localhost:5000`, and the API base URL is `http://localhost:5000/api`. Startup fails with a clear error if the database is unavailable or required database settings are missing.

For development with automatic restart on file changes:

```sh
npm run dev
```

## API endpoints

### POST `/api/calculate`

Performs one operation on the backend, rounds the result to four decimal places to match the database schema, stores it, and returns its database ID.

Request:

```json
{
  "num1": 12.5,
  "num2": 2,
  "operator": "*"
}
```

Successful response (`201 Created`):

```json
{
  "success": true,
  "result": 25,
  "id": 1
}
```

The only accepted operators are `+`, `-`, `*`, and `/`. Operands must be JSON numbers in the `DECIMAL(10,4)` range and can have at most four decimal places.

Division-by-zero response (`400 Bad Request`):

```json
{
  "success": false,
  "error": "Cannot divide by zero."
}
```

### GET `/api/history`

Returns an array with the 20 newest records, ordered by `created_at` descending and then by ID descending.

Successful response (`200 OK`):

```json
[
  {
    "id": 1,
    "num1": 12.5,
    "num2": 2,
    "operator": "*",
    "result": 25,
    "created_at": "2026-09-02T10:30:00.000Z"
  }
]
```

### DELETE `/api/history`

Deletes every calculation history record.

Successful response (`200 OK`):

```json
{
  "success": true,
  "message": "Calculation history cleared.",
  "deletedCount": 7
}
```

## Frontend integration

Copy the functions from `frontend-integration-guide.js` into the existing frontend JavaScript. They use the browser Fetch API and expose:

- `calculateOnServer(num1, num2, operator)`
- `fetchCalculationHistory()`
- `clearCalculationHistory()`

Make sure `CALCULATOR_API_URL` matches the backend host and port, and make sure the frontend's exact origin is listed in `CORS_ORIGIN`.

## Error behavior

- `400` for invalid operands, malformed JSON, unsupported operators, division by zero, or results outside the database range
- `403` when a browser origin is not allowed by CORS
- `404` for an unknown route
- `500` for an unexpected server or database error; database details are logged only on the server
