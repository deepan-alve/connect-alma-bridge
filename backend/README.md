# Alumni Career & Networking Hub - Backend API

Production-ready Node.js/Express backend with TypeScript, Supabase integration, and comprehensive business logic.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Get your Supabase keys from:** https://supabase.com/dashboard → Your Project → Settings → API

### 3. Start Development Server

```bash
npm run dev
```

Backend will run on: **http://localhost:3001**

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── lib/
│   │   └── supabase.ts          # Supabase client setup
│   ├── middleware/
│   │   ├── auth.ts              # Authentication & authorization
│   │   └── validate.ts          # Request validation with Zod
│   ├── services/
│   │   ├── messageService.ts    # Messaging business logic
│   │   ├── connectionService.ts # Connection request logic
│   │   └── jobService.ts        # Job posting & application logic
│   ├── routes/
│   │   ├── messages.ts          # Message endpoints
│   │   ├── connections.ts       # Connection endpoints
│   │   └── jobs.ts              # Job endpoints
│   └── server.ts                # Express app setup
├── package.json
├── tsconfig.json
└── .env                         # Environment variables (create this!)
```

---

## 🔌 API Endpoints

### Authentication
All endpoints (except GET /api/jobs) require `Authorization: Bearer <token>` header.

### Messages API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | Get all conversations |
| GET | `/api/messages/:partnerId` | Get messages with specific user |
| POST | `/api/messages` | Send a message |

### Connections API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/connections` | Get user's connections |
| GET | `/api/connections/suggestions` | Get suggested connections |
| POST | `/api/connections/request` | Send connection request |
| POST | `/api/connections/accept/:id` | Accept connection request |
| POST | `/api/connections/reject/:id` | Reject connection request |

### Jobs API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | Get all jobs (public) |
| GET | `/api/jobs/:jobId` | Get single job |
| POST | `/api/jobs` | Create job (alumni only) |
| POST | `/api/jobs/:jobId/apply` | Apply to job (students only) |
| GET | `/api/jobs/:jobId/applications` | Get job applications (poster only) |
| GET | `/api/jobs/my/applications` | Get user's applications |
| PATCH | `/api/jobs/applications/:id/status` | Update application status (poster only) |

---

## 🔐 Security Features

✅ **JWT Authentication** - Verifies Supabase auth tokens
✅ **Role-Based Access Control** - Student vs Alumni permissions
✅ **Rate Limiting** - 100 requests per 15 minutes per IP
✅ **Input Validation** - Zod schemas validate all inputs
✅ **CORS Protection** - Only allows requests from frontend
✅ **Helmet Security Headers** - XSS, clickjacking protection
✅ **Business Logic Validation** - Prevents self-connections, duplicate applications, etc.

---

## 🧪 Testing API

### Using curl:

```bash
# Health check
curl http://localhost:3001/health

# Get jobs (no auth required)
curl http://localhost:3001/api/jobs

# Send message (with auth)
curl -X POST http://localhost:3001/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiverId": "uuid-here", "messageText": "Hello!"}'
```

### Using Postman/Insomnia:

1. Import collection from `/backend/postman_collection.json` (create if needed)
2. Set environment variable `API_URL` to `http://localhost:3001`
3. Get JWT token from frontend (login → check localStorage)
4. Add token to Authorization header: `Bearer <token>`

---

## 🚀 Deployment

### Railway (Recommended)

1. Push code to GitHub
2. Connect Railway to your repo
3. Add environment variables in Railway dashboard
4. Deploy!

### Render

1. Create new Web Service
2. Connect GitHub repo
3. Build command: `cd backend && npm install && npm run build`
4. Start command: `cd backend && npm start`
5. Add environment variables

### Vercel (Serverless)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Add environment variables in Vercel dashboard

---

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm run lint` | Check code quality |

---

## 🔧 Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
```

### "Missing Supabase environment variables"
Check `.env` file exists and has correct values

### "CORS error"
Update `FRONTEND_URL` in `.env` to match your frontend URL

### "Unauthorized" errors
- Check JWT token is valid (not expired)
- Verify token in `Authorization: Bearer <token>` header
- Check user exists in Supabase Auth

---

## 📚 Next Steps

1. ✅ Backend API running
2. Update frontend to use API (see `/frontend/README.md`)
3. Test all features end-to-end
4. Deploy backend to Railway/Render
5. Update frontend `API_URL` to production backend
6. Deploy frontend to Vercel/Netlify

---

## 💡 Features

### Business Logic Implemented:

✅ **Connection Validation** - Prevents self-connections, duplicate requests
✅ **Message Permissions** - Only connected users can message
✅ **Job Permissions** - Alumni post, students apply
✅ **Application Tracking** - Status updates with notifications
✅ **Smart Suggestions** - Connections by department & graduation year
✅ **Notifications** - Auto-created for all major events
✅ **Rate Limiting** - Prevents API abuse
✅ **Error Handling** - Consistent error responses

---

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Backend deployed and accessible
- [ ] CORS configured for production frontend URL
- [ ] Database indexes created (see `/enable-realtime.sql`)
- [ ] Monitoring/logging set up (Railway/Render logs)
- [ ] Error tracking (Sentry, optional)
- [ ] Backups configured (Supabase automatic backups)

---

**Built with ❤️ using Node.js, Express, TypeScript, and Supabase**
