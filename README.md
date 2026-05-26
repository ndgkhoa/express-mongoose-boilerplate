<p align="center">
  <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/express/express.png" width="120" alt="Express Logo" />
</p>

# Express Mongoose Boilerplate

<p align="center">
  <a href="https://nodejs.org" target="_blank"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg" alt="Node Version" /></a>
  <a href="https://www.typescriptlang.org" target="_blank"><img src="https://img.shields.io/badge/typescript-5.x-blue.svg" alt="TypeScript" /></a>
  <a href="https://expressjs.com" target="_blank"><img src="https://img.shields.io/badge/express-5.x-lightgrey.svg" alt="Express" /></a>
  <a href="https://mongoosejs.com" target="_blank"><img src="https://img.shields.io/badge/mongoose-9.x-green.svg" alt="Mongoose" /></a>
  <img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="License" />
</p>

Production-ready REST API boilerplate built with Express 5, TypeScript, MongoDB, and Redis. Ships with OTP-based authentication, JWT token rotation, Google OAuth2, file uploads, background jobs, and Swagger docs out of the box.

## Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Framework  | Express 5                         |
| Language   | TypeScript 5                      |
| Database   | MongoDB (Mongoose 9)              |
| Cache      | Redis 5                           |
| Auth       | JWT · Passport.js · Google OAuth2 |
| Password   | Argon2                            |
| Validation | Zod 4                             |
| Email      | Nodemailer + EJS                  |
| Storage    | Cloudinary                        |
| Logging    | Pino                              |
| Jobs       | node-cron                         |
| Docs       | Swagger UI                        |

## Features

- OTP sign-in and password reset via email
- JWT access + refresh tokens with rotation and reuse detection
- Google OAuth2 social login
- Brute-force protection — failed login tracking, account locking
- Role-based access control (`user` / `admin`)
- File upload to Cloudinary via Multer
- Background job scheduler with system monitor
- Per-route rate limiting
- Helmet + CORS security headers
- Request validation with Zod schemas
- Auto-generated Swagger docs at `/api/docs`
- Graceful shutdown (server, MongoDB, Redis)

## Installation

```bash
pnpm install
```

## Environment Setup

```bash
cp .env.example .env
```

See [`src/shared/configs/env.ts`](src/shared/configs/env.ts) for the full schema — all variables are validated with Zod at startup and the server will fail fast with a clear error on misconfiguration.

## Running the App

```bash
# development
pnpm dev

# production
pnpm build
pnpm start
```

## Scripts

```bash
pnpm typecheck       # TypeScript type check
pnpm lint:check      # ESLint check
pnpm lint:fix        # ESLint fix
pnpm format:check    # Prettier check
pnpm format:fix      # Prettier fix
pnpm docs:gen        # Regenerate Swagger spec
```

## API Routes

| Method   | Route                          | Description               | Auth        |
| -------- | ------------------------------ | ------------------------- | ----------- |
| `GET`    | `/api/health`                  | Health check              | —           |
| `GET`    | `/api/docs`                    | Swagger UI                | —           |
| `POST`   | `/api/auth/signup`             | Register                  | —           |
| `POST`   | `/api/auth/signin`             | Login → sends OTP         | —           |
| `POST`   | `/api/auth/verify-otp`         | Verify OTP → issue tokens | —           |
| `POST`   | `/api/auth/refresh-token`      | Rotate tokens             | —           |
| `POST`   | `/api/auth/logout`             | Revoke refresh tokens     | JWT         |
| `GET`    | `/api/auth/profile`            | Get profile               | JWT         |
| `PATCH`  | `/api/auth/profile`            | Update profile / avatar   | JWT         |
| `POST`   | `/api/auth/forgot-password`    | Send reset OTP            | —           |
| `POST`   | `/api/auth/reset-password`     | Reset password            | —           |
| `POST`   | `/api/auth/change-password`    | Change password           | JWT         |
| `DELETE` | `/api/auth/delete-account`     | Soft / hard delete        | JWT         |
| `PUT`    | `/api/auth/reactivate-account` | Reactivate account        | JWT         |
| `GET`    | `/api/oauth/google`            | Google OAuth2 initiate    | —           |
| `GET`    | `/api/oauth/google/callback`   | Google OAuth2 callback    | —           |
| `GET`    | `/api/users`                   | List users                | JWT + Admin |

## Authentication Flow

```
POST /signup         → create account
POST /signin         → validate credentials → send OTP
POST /verify-otp     → verify OTP → issue access + refresh tokens (HTTP-only cookies)
POST /refresh-token  → rotate tokens (reuse detection)
POST /logout         → revoke all refresh tokens
```

## Project Structure

```
src/
├── app.ts                    # Express app setup
├── server.ts                 # Bootstrap (DB, Redis, jobs)
├── routes/                   # Route aggregator
├── modules/
│   ├── auth/                 # controller · service · routes · validator · refresh-token model
│   ├── oauth/                # Google OAuth2
│   ├── otp/                  # OTP model · service · validator
│   ├── upload/               # Cloudinary upload
│   ├── user/                 # User model · routes
│   └── health/
└── shared/
    ├── configs/              # db · env · redis · passport · cloudinary · nodemailer · swagger
    ├── middlewares/          # auth · rate-limit · error-handler · validation · security
    ├── helpers/              # auth · cookie · token
    ├── utils/                # jwt · logger · api-response · send-mail · shutdown
    ├── jobs/                 # cron job registry
    ├── errors/               # ApiError
    └── constants/
```

## License

MIT
