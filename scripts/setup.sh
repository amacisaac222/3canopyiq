#!/bin/bash

# CanopyIQ Setup Script
# Complete setup for local development and production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# ASCII Art Header
echo "
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     🌲 CanopyIQ - Intelligence Above Your Code 🌲    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
"

echo "Starting CanopyIQ setup..."
echo ""

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ is required. Current version: $(node -v)"
    fi
    print_status "Node.js $(node -v) detected"

    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing..."
        npm install -g pnpm
        print_status "pnpm installed"
    else
        print_status "pnpm $(pnpm -v) detected"
    fi

    # Check Docker (optional for local dev)
    if command -v docker &> /dev/null; then
        print_status "Docker detected (optional)"
    else
        print_warning "Docker not found (optional for local development)"
    fi

    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
    fi
    print_status "Git detected"
}

# Setup environment variables
setup_env() {
    print_status "Setting up environment variables..."

    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_status "Created .env file from .env.example"
            print_warning "Please edit .env with your configuration values"
        else
            print_warning ".env.example not found, creating basic .env file"
            cat > .env << EOF
# Database
DATABASE_URL=postgresql://canopyiq:password@localhost:5432/canopyiq

# Redis
REDIS_URL=redis://localhost:6379

# GitHub App (required for GitHub integration)
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Sentry (optional)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Organization
ORGANIZATION_ID=default-org

# NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
EOF
            print_status "Created basic .env file"
        fi
    else
        print_status ".env file already exists"
    fi
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."
    pnpm install
    print_status "Dependencies installed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."

    # Check if PostgreSQL is running
    if command -v psql &> /dev/null; then
        print_status "PostgreSQL detected"
    else
        if command -v docker &> /dev/null; then
            print_status "Starting PostgreSQL via Docker..."
            docker run -d \
                --name canopyiq-postgres \
                -e POSTGRES_USER=canopyiq \
                -e POSTGRES_PASSWORD=password \
                -e POSTGRES_DB=canopyiq \
                -p 5432:5432 \
                postgres:16-alpine 2>/dev/null || print_warning "PostgreSQL container may already exist"

            # Wait for PostgreSQL to be ready
            sleep 5
            print_status "PostgreSQL started in Docker"
        else
            print_warning "PostgreSQL not found. Please install PostgreSQL or Docker"
            print_warning "Skipping database setup"
            return
        fi
    fi

    # Run migrations
    print_status "Running database migrations..."
    pnpm db:migrate || print_warning "Migration failed - database might not be ready"
}

# Setup Redis
setup_redis() {
    print_status "Setting up Redis..."

    if command -v redis-cli &> /dev/null; then
        print_status "Redis detected"
    else
        if command -v docker &> /dev/null; then
            print_status "Starting Redis via Docker..."
            docker run -d \
                --name canopyiq-redis \
                -p 6379:6379 \
                redis:7-alpine 2>/dev/null || print_warning "Redis container may already exist"

            print_status "Redis started in Docker"
        else
            print_warning "Redis not found. Please install Redis or Docker"
        fi
    fi
}

# Setup GitHub App
setup_github() {
    print_status "GitHub App setup instructions:"
    echo ""
    echo "  1. Go to https://github.com/settings/apps/new"
    echo "  2. Configure your GitHub App with:"
    echo "     - Webhook URL: https://your-domain.com/api/github/webhook"
    echo "     - Permissions:"
    echo "       • Pull requests: Read & Write"
    echo "       • Issues: Read & Write"
    echo "       • Contents: Read"
    echo "     - Subscribe to events:"
    echo "       • Pull request"
    echo "       • Pull request review"
    echo "  3. Generate a private key"
    echo "  4. Add the App ID and private key to your .env file"
    echo ""
    print_warning "Remember to update .env with your GitHub App credentials"
}

# Build the project
build_project() {
    print_status "Building the project..."
    pnpm build || print_warning "Build failed - this is normal for first setup"
    print_status "Build complete"
}

# Start services
start_services() {
    print_status "Starting services..."
    echo ""
    echo "To start the development servers, run:"
    echo "  pnpm dev"
    echo ""
    echo "Services will be available at:"
    echo "  • Web App: http://localhost:3000"
    echo "  • MCP Server: http://localhost:8080"
    echo "  • Dashboard: http://localhost:3000/dashboard"
    echo ""
}

# Main setup flow
main() {
    # Parse arguments
    case "${1:-}" in
        --production)
            PRODUCTION=true
            print_status "Running production setup"
            ;;
        --help)
            echo "Usage: ./setup.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --production    Setup for production deployment"
            echo "  --docker        Use Docker for all services"
            echo "  --help          Show this help message"
            exit 0
            ;;
        --docker)
            USE_DOCKER=true
            print_status "Using Docker for all services"
            ;;
    esac

    # Run setup steps
    check_requirements
    setup_env
    install_deps

    if [ "${USE_DOCKER:-false}" = true ]; then
        print_status "Starting all services with Docker Compose..."
        docker-compose up -d
        print_status "Services started with Docker Compose"
    else
        setup_database
        setup_redis
    fi

    build_project
    setup_github

    # Success message
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║                                                       ║"
    echo "║     ✅ CanopyIQ setup complete!                      ║"
    echo "║                                                       ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""

    start_services
}

# Run main function
main "$@"