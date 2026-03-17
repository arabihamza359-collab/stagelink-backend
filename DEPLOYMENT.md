# StageLink Deployment & Configuration

## Railway.app Deployment Guide
Railway allows you to deploy the NodeJS application effortlessly from your GitHub repository.

1. **Push your code to GitHub**: Create a repository named `stagelink-backend` and push all the source code to the `.main` branch.
2. **Create a Railway Project**:
   - Go to [Railway.app](https://railway.app/).
   - Click `New Project` -> `Deploy from GitHub repo`.
   - Select your newly created `stagelink-backend` repository.
3. **Set Environment Variables in Railway**:
   - Navigate to the `Variables` tab of your new Railway service.
   - Click `Raw Editor` and copy/paste the variables from your `.env.example`.
   - Ensure `DATABASE_URL` is pointing to your active Supabase PostgreSQL URI.
   - Set `FRONTEND_URL` to your production frontend link (`https://stagelink.ma`).
   - Set `JWT_SECRET` to a strong, random hash.
4. **Build and Deploy**:
   - Railway will automatically detect the `package.json` and build the Node environment.
   - By default, it runs the `npm start` command (which maps to `node src/server.js`).
5. **Database Scaffolding (Initial Run)**:
   - Once the DB is connected, you need to push your Prisma schema.
   - The easiest way on Railway is to define a custom start command: `npx prisma db push && node src/server.js`, OR map a task to run migrations contextually.

## Endpoint Summary Request / Response Examples

### 1. Register [POST] `/api/auth/register`
**Request**:
```json
{
  "email": "test@stagelink.ma",
  "password": "mypassword123",
  "role": "student"
}
```
**Response (201)**:
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "test@...", "role": "student" },
    "token": "eyJhbGci..."
  }
}
```

### 2. Login [POST] `/api/auth/login`
**Request**:
```json
{
  "email": "test@stagelink.ma",
  "password": "mypassword123"
}
```
**Response (200)**:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "test@..." },
    "token": "eyJhbGci...",
    "role": "student"
  }
}
```

### 3. Student Profile [POST] `/api/students/profile`
**Headers**: `Authorization: Bearer <token>`  
**Request**:
```json
{
  "first_name": "Hamza",
  "last_name": "Amigo",
  "skills": ["React", "Express"],
  "city": "Rabat"
}
```
**Response (200)**: returns the updated profile and completeness percentage.

### 4. Create Offer [POST] `/api/companies/offers`
**Headers**: `Authorization: Bearer <token>`  
**Request**:
```json
{
  "title": "Stagiaire Développeur Full Stack",
  "domain": "Informatique",
  "level_required": "bac3",
  "city": "Casablanca"
}
```
**Response (201)**: Trigger match automatically and returns the created offer.

### 5. Get Candidates [GET] `/api/companies/candidates`
**Headers**: `Authorization: Bearer <token>`  
**Response (200)**: Returns `matches` associated with the company, sorted sequentially by heuristic match score.
