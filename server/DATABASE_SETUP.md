# PostgreSQL Database Setup for Plannova

## Your Database Configuration

- **Server**: TestServer
- **Username**: postgres
- **Port**: 5432
- **Host**: localhost
- **Database**: Test-db
- **Table**: Test-Table

## Prerequisites

1. **Install PostgreSQL** on your system:
   - Windows: Download from https://www.postgresql.org/download/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Start PostgreSQL service**:
   - Windows: Use Services or `pg_ctl start`
   - macOS: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

## Setup Instructions

### Step 1: Configure Database Credentials

Update the `.env` file in the server directory with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Test-db
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

### Step 2: Create Database and Tables

1. **Connect to PostgreSQL** using pgAdmin or command line:
   ```bash
   psql -U postgres
   ```

2. **Run the setup script**:
   ```bash
   psql -U postgres -f setup_db.sql
   ```

   Or manually create the table (since you already have Test-db):
   ```sql
   \c "Test-db";
   -- Then run the table creation commands from setup_db.sql
   ```

### Step 3: Install Dependencies

The required dependencies are already installed:
- `pg` - PostgreSQL client for Node.js
- `@types/pg` - TypeScript definitions

### Step 4: Start the Server

```bash
npm run build
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Testing the Connection

### Health Check Endpoint

Visit: `http://localhost:3500/api/health/db`

Expected response:
```json
{
  "status": "connected",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "message": "PostgreSQL database connection is healthy"
}
```

### Test Data Endpoints

**GET**: `http://localhost:3500/api/test-data`

Expected response (after running the setup script):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sample Data 1",
      "value": "This is test value 1",
      "created_at": "2024-01-01T12:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 3
}
```

**POST**: `http://localhost:3500/api/test-data`

Send JSON body:
```json
{
  "name": "New Test Data",
  "value": "This is a new test value"
}
```

## File Structure

```
server/
├── src/
│   └── db.ts           # PostgreSQL connection pool
├── .env                # Environment variables
├── app.ts              # Express app with DB routes
├── setup_db.sql        # Database setup script
└── package.json        # Dependencies
```

## Database Connection Features

- **Connection Pooling**: Efficient handling of multiple database connections
- **Environment Variables**: Secure configuration management
- **Error Handling**: Comprehensive error logging and response handling
- **Health Checks**: Endpoint to verify database connectivity
- **TypeScript Support**: Full type safety for database operations

## Switching from SQLite to PostgreSQL

If you want to completely switch from SQLite to PostgreSQL:

1. Update your Prisma schema (`prisma/schema.prisma`) to use PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update the `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/plannova_db"
   ```

3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL is running**:
   ```bash
   pg_isready -U postgres
   ```

2. **Verify credentials** in `.env` file

3. **Check database exists**:
   ```bash
   psql -U postgres -l
   ```

### Common Errors

- **ECONNREFUSED**: PostgreSQL service is not running
- **authentication failed**: Wrong username/password
- **database does not exist**: Run the setup script first

## Production Considerations

- Use connection pooling (already implemented)
- Set up SSL connections for production
- Use environment-specific configuration
- Implement database monitoring and logging
- Set up automated backups