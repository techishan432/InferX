#!/bin/bash
# Deploy all InferX Soroban contracts
set -e

NETWORK=${1:-testnet}
echo "Deploying contracts to $NETWORK..."

cd "$(dirname "$0")/../contracts"

# Build all contracts
echo "Building contracts..."
cargo build --target wasm32-unknown-unknown --release

echo "Deploying registry contract..."
REGISTRY_ID=$(stellar contract deploy --wasm target/wasm32-unknown-unknown/release/registry.wasm --network $NETWORK --source deployer --ignore-checks)
echo "Registry: $REGISTRY_ID"

echo "Deploying escrow contract..."
ESCROW_ID=$(stellar contract deploy --wasm target/wasm32-unknown-unknown/release/escrow.wasm --network $NETWORK --source deployer --ignore-checks)
echo "Escrow: $ESCROW_ID"

echo "Deploying ratings contract..."
RATINGS_ID=$(stellar contract deploy --wasm target/wasm32-unknown-unknown/release/ratings.wasm --network $NETWORK --source deployer --ignore-checks)
echo "Ratings: $RATINGS_ID"

echo "Deploying history contract..."
HISTORY_ID=$(stellar contract deploy --wasm target/wasm32-unknown-unknown/release/history.wasm --network $NETWORK --source deployer --ignore-checks)
echo "History: $HISTORY_ID"

echo ""
echo "Contract IDs:"
echo "REGISTRY_CONTRACT_ID=$REGISTRY_ID"
echo "ESCROW_CONTRACT_ID=$ESCROW_ID"
echo "RATINGS_CONTRACT_ID=$RATINGS_ID"
echo "HISTORY_CONTRACT_ID=$HISTORY_ID"
echo ""
echo "Add these to your .env file"
