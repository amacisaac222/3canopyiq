# 🌲 CanopyIQ - Intelligence Above Your Code

<div align="center">

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-org%2Fcanopyiq)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2Fyour-org%2Fcanopyiq)

See the forest AND the trees. CanopyIQ provides an AI-powered intelligence layer above your development workflow, tracking every change from Claude Code to production with complete data lineage.

</div>

## ✨ Features

- 🤖 **Complete Claude Code Tracking** - Every AI action captured with full context
- 📊 **Real-time Forest Visualization** - Watch your codebase grow like a living forest
- 🔍 **Full Data Lineage** - Trace every metric back to its source
- 📝 **Auto PR Documentation** - Comprehensive docs generated automatically
- ✅ **Compliance Checking** - Real-time OWASP, SOC2, HIPAA, GDPR validation
- 🚀 **GitHub Integration** - Seamless workflow enhancement

## 🚀 Quick Deploy to Vercel

### Prerequisites

1. **GitHub App** - [Create a GitHub App](https://github.com/settings/apps/new) with:
   - Webhook URL: `https://your-app.vercel.app/api/github/webhook`
   - Permissions: Pull requests (write), Issues (write), Contents (read)
   - Subscribe to: Pull request events

2. **Database** - Choose one:
   - [Supabase](https://supabase.com) (Recommended)
   - [Neon](https://neon.tech)
   - [PlanetScale](https://planetscale.com)

3. **Redis** - [Upstash Redis](https://upstash.com) for rate limiting and caching

4. **Sentry** - [Create a Sentry project](https://sentry.io) for error tracking (optional)

### One-Click Deploy

1. Click the "Deploy with Vercel" button above
2. Add environment variables:

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...
REDIS_TOKEN=your_upstash_token

# GitHub App
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# URLs
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_WS_URL=wss://your-mcp-server.railway.app

# Monitoring (Optional)
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Organization
ORGANIZATION_ID=your-org-id
```

3. Deploy! 🎉

## 🚄 MCP Server Deployment (Railway)

The MCP server handles real-time event capture and WebSocket connections.

### Deploy to Railway

1. Click "Deploy on Railway" button
2. Add environment variables:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ORGANIZATION_ID=your-org-id
PORT=8080
```

3. Get your WebSocket URL from Railway (format: `wss://your-app.railway.app`)
4. Update your Vercel app's `NEXT_PUBLIC_WS_URL` with this value

## 🐳 Docker Deployment

### Production Docker Setup

```bash
# Clone the repository
git clone https://github.com/your-org/canopyiq
cd canopyiq

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec web npm run db:migrate
```

### docker-compose.yml is included with:
- Web application (port 3000)
- MCP server (port 8080)
- PostgreSQL database
- Redis cache

## 🛠️ Local Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Redis 6+

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local values

# Run database migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed

# Start development servers
pnpm dev
```

This starts:
- Web app: http://localhost:3000
- MCP server: http://localhost:8080

### Running Individual Services

```bash
# Web application only
pnpm --filter @canopyiq/web dev

# MCP server only
pnpm --filter @canopyiq/mcp-server dev

# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm typecheck
```

## 📦 Project Structure

```
canopyiq/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   └── middleware.ts # Rate limiting & security
│   └── mcp-server/       # MCP server for Claude Code
│       ├── src/
│       │   ├── core/     # Core services
│       │   └── tools/    # MCP tools
│       └── server.ts     # WebSocket & event handling
├── packages/
│   ├── database/         # Shared database schema & migrations
│   ├── analytics/        # Analytics utilities
│   └── shared/           # Shared types & utils
└── docker-compose.yml    # Production Docker setup
```

## 🔧 Configuration

### GitHub App Setup

1. Create a new GitHub App at https://github.com/settings/apps
2. Configure:
   - **Webhook URL**: `https://your-domain.com/api/github/webhook`
   - **Webhook Secret**: Generate a secure secret
   - **Permissions**:
     - Pull requests: Read & Write
     - Issues: Read & Write
     - Contents: Read
     - Metadata: Read
   - **Subscribe to events**:
     - Pull request
     - Pull request review
     - Issue comment

3. Generate and download a private key
4. Note your App ID

### Database Migrations

```bash
# Run migrations
pnpm db:migrate

# Create a new migration
pnpm db:generate

# Reset database (development only)
pnpm db:reset
```

### Environment Variables

See `.env.example` for all available configuration options.

## 📊 Monitoring & Observability

### Health Check

Monitor your deployment:

```bash
curl https://your-domain.com/api/health
```

Response includes:
- Service status (database, redis, github, websocket)
- Metrics (events, sessions, response time)
- Version and environment info

### Sentry Integration

Automatic error tracking and performance monitoring:

1. Create a project at https://sentry.io
2. Add DSN to environment variables
3. Errors and performance data automatically captured

### Metrics & Logging

- Structured logging with correlation IDs
- Request/response timing
- Rate limit tracking
- Error rates and alerts

## 🚀 CI/CD with GitHub Actions

The included workflow (`.github/workflows/deploy.yml`) provides:

- Automated testing on PR
- Type checking and linting
- Database migration checks
- Automatic deployment to Vercel on merge
- Release tagging and changelog generation

## 🔒 Security

- Rate limiting on all API endpoints
- CORS configuration
- Security headers (CSP, HSTS, etc.)
- Input validation and sanitization
- SQL injection prevention via Drizzle ORM
- Webhook signature verification
- Environment variable validation

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

## 🆘 Support

- [Documentation](https://docs.canopyiq.com)
- [Discord Community](https://discord.gg/canopyiq)
- [GitHub Issues](https://github.com/your-org/canopyiq/issues)

---

<div align="center">
Built with 💚 by the CanopyIQ Team
</div>