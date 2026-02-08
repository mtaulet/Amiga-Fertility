#!/bin/bash
# Start the Amiga Fertility AI Assistant (Cartesia Line Agent)

cd "$(dirname "$0")"

echo "🚀 Starting Amiga Fertility AI Assistant..."
echo ""

# Export PATH for uv
export PATH="/Users/marta/.local/bin:$PATH"

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the agent with uv
uv run python main.py
