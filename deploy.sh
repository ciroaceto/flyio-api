#!/bin/bash

set -e

echo "🚀 Starting deployment process..."

# Check if fly CLI is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Error: fly CLI is not installed"
    echo "Install it from: https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
fi

# Check if user is logged in to fly.io
if ! fly auth whoami &> /dev/null; then
    echo "❌ Error: Not logged in to fly.io"
    echo "Run: fly auth login"
    exit 1
fi

echo "✅ Fly CLI is installed and authenticated"

# Check if organization exists, create if it doesn't
echo "🔍 Checking if organization exists..."
if ! flyctl orgs list | grep -q "acme-inc"; then
    echo "📱 Organization does not exist. Creating organization..."
    flyctl orgs create acme-inc
else
    echo "✅ Organization exists"
fi

# Check if app exists, create if it doesn't
echo "🔍 Checking if app exists..."
if ! flyctl status &>/dev/null; then
    echo "📱 App does not exist. Creating app..."
    # Try to create app
    flyctl apps create loads-dashboard --org acme-inc
else
    echo "✅ App exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Build backend TypeScript
echo "🔨 Building backend..."
npm run build

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build
cd ..

# Check if API_KEY secret is set (only if app exists)
if flyctl status &>/dev/null && ! fly secrets list 2>/dev/null | grep -q "API_KEY"; then
    echo "⚠️  Warning: API_KEY secret is not set"
    echo "Set it with: flyctl secrets set API_KEY=your-secret-api-key"
    read -p "Do you want to set it now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -sp "Enter API_KEY: " api_key
        echo
        flyctl secrets set API_KEY="$api_key"
    else
        echo "⚠️  Continuing without API_KEY. Make sure to set it before deploying."
    fi
fi

# Deploy to fly.io
echo "🚀 Deploying to fly.io..."
flyctl deploy

echo "✅ Deployment complete!"
echo ""
echo "Your application should be available at:"
flyctl status | grep -i "hostname" || echo "Run 'flyctl status' to see your app URL"
echo ""
echo "To view logs: flyctl logs"
echo "To check status: flyctl status"

