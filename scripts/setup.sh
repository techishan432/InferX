#!/bin/bash
set -e

echo "=== InferX Setup ==="

check_tool() {
  if command -v "$1" &> /dev/null; then
    echo "✓ $1 found: $($1 --version 2>/dev/null | head -1)"
  else
    echo "✗ $1 not found. Please install $1 and try again."
    exit 1
  fi
}

echo ""
echo "Checking required tools..."
check_tool rustc
check_tool node
check_tool python3
check_tool docker
check_tool stellar

echo ""
echo "Creating .env from .env.example..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ .env created"
else
  echo ".env already exists, skipping"
fi

echo ""
echo "Installing backend dependencies..."
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..

echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "Building smart contracts..."
cd contracts
stellar contract build
cd ..

echo ""
echo "Setting up database..."
docker compose up -d postgres
echo "Waiting for PostgreSQL to be ready..."
sleep 3

cd backend
source .venv/bin/activate
alembic upgrade head
echo ""
echo "Seeding database..."
python -m app.db.seeds
cd ..

echo ""
echo "=== Setup complete! ==="
echo "Run 'docker compose up' to start all services."
