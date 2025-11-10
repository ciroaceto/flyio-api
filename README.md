# Loads Dashboard

A full-stack application deployed on fly.io with an Express.js backend and React frontend.

## Prerequisites

Before deploying, ensure you have:

- **Node.js** (v18 or higher recommended)
- **fly CLI** installed ([Installation guide](https://fly.io/docs/getting-started/installing-flyctl/))
- A **fly.io account** (sign up at [fly.io](https://fly.io))

## Quick Start

### 1. Install fly CLI and Login

```bash
# Install fly CLI (if not already installed)
curl -L https://fly.io/install.sh | sh

# Login to fly.io
fly auth login
```

### 2. Deploy

Run the deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:

- Verify fly CLI installation and authentication
- Create the organization (`acme-inc`) and app (`loads-dashboard`) if they don't exist
- Install dependencies for both backend and frontend
- Build the TypeScript backend and React frontend
- Prompt you to set the `API_KEY` secret if not already configured
- Deploy to fly.io

### 3. Set API Key Secret

If prompted during deployment, or to set it manually:

```bash
flyctl secrets set API_KEY=your-secret-api-key
```

## Project Structure

```
├── server.ts          # Express backend server
├── database.ts        # SQLite database setup
├── frontend/          # React frontend application
│   ├── src/          # React source files
│   └── dist/         # Built frontend (generated)
├── deploy.sh         # Deployment script
└── fly.toml          # Fly.io configuration
```

## Development

For local development:

```bash
# Backend
npm install
npm run dev

# Frontend (in separate terminal)
cd frontend
npm install
npm run dev
```
