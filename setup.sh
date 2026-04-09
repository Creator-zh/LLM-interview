#!/bin/bash
set -e

PYTHON_VERSION="3.11"
ENV_NAME="pyre"

# Create and activate virtual environment
if command -v uv &> /dev/null; then
  echo "Using uv..."
  uv venv --python "$PYTHON_VERSION" .venv
  source .venv/bin/activate
  uv pip install -e .
elif command -v conda &> /dev/null; then
  echo "Using conda..."
  conda create -n "$ENV_NAME" python="$PYTHON_VERSION" -y
  # shellcheck disable=SC1091
  source "$(conda info --base)/etc/profile.d/conda.sh"
  conda activate "$ENV_NAME"
  pip install -e .
else
  echo "Using system python venv..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -e .
fi

# Install Node deps
npm install

echo ""
echo "Setup complete."
echo "To start: npm run dev"
echo "(No need to activate the virtual environment manually.)"
