#!/bin/bash

# AI Reseller SaaS - Quick Setup Script
# This script helps you set up the development environment quickly

set -e

echo "🚀 AI Reseller SaaS - Setup Script"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm --version) detected"
echo ""

# Install root dependencies
echo "📦 Installing dependencies..."
npm install

# Install workspace dependencies
echo "📦 Installing workspace dependencies..."
npm install --workspaces

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check for .env.local file
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local file..."
    cp .env.example .env.local
    echo "✅ Created .env.local - Please update with your credentials!"
    echo ""
    echo "Required credentials:"
    echo "  1. Supabase URL and keys (from supabase.com)"
    echo "  2. OpenRouter API key (from openrouter.ai)"
    echo "  3. Stripe keys (from stripe.com)"
    echo ""
    read -p "Press enter to continue after updating .env.local..."
else
    echo "✅ .env.local already exists"
fi

echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📥 Installing Supabase CLI..."
    npm install -g supabase
    echo "✅ Supabase CLI installed"
else
    echo "✅ Supabase CLI already installed"
fi

echo ""

# Ask about Supabase setup
read -p "Do you want to run Supabase migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Setting up Supabase..."
    cd supabase

    read -p "Enter your Supabase project ID: " PROJECT_ID
    supabase link --project-ref "$PROJECT_ID"

    echo "Running migrations..."
    supabase db push

    cd ..
    echo "✅ Supabase setup complete!"
else
    echo "⏭️  Skipping Supabase setup - run 'cd supabase && supabase db push' later"
fi

echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📥 Installing Wrangler CLI..."
    npm install -g wrangler
    echo "✅ Wrangler CLI installed"
else
    echo "✅ Wrangler CLI already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Update .env.local with your API keys"
echo "  2. Start the development servers:"
echo ""
echo "     Terminal 1 (Worker):"
echo "     cd apps/worker"
echo "     npm run dev"
echo ""
echo "     Terminal 2 (Dashboard):"
echo "     cd apps/dashboard"
echo "     npm run dev"
echo ""
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 Documentation:"
echo "  - Quick Start: docs/QUICK_START.md"
echo "  - API Docs: docs/API.md"
echo "  - Deployment: docs/DEPLOYMENT.md"
echo ""
echo "Happy coding! 🚀"
