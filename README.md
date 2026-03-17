# StageLink Backend API

This is the Node.js / Express backend for the StageLink internship platform.

## Features
- JWT Authentication
- Role-based Access Control (Student, Company, Admin)
- Profile Matchmaking Algorithm
- Supabase Storage & Database (Prisma ORM)
- Nodemailer Email Integration

## Setup
1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill the variables
4. Run `npx prisma db push` or `npx prisma migrate dev`
5. Run `npm run dev`

## API Structure
All API routes are prefixed with `/api`

- `/api/auth`
- `/api/students`
- `/api/companies`
- `/api/matching`
- `/api/messages`
- `/api/admin`
