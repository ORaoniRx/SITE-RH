# RH-flow

Database
--------

To initialize the PostgreSQL schema and seed example data:

```bash
cd backend
node db/seed.js
```

The server runs `initDb()` on startup which applies `backend/db/schema.sql`.
