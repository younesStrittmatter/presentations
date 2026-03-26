#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_NAME="${SLIDEV_ENV_NAME:-slidev}"
ANACONDA_MODULE="${ANACONDA_MODULE:-anaconda3/2024.10}"

echo "Loading module: ${ANACONDA_MODULE}"
module load "${ANACONDA_MODULE}"

CONDA_BASE="$(conda info --base)"
source "${CONDA_BASE}/etc/profile.d/conda.sh"

if ! conda run -n "${ENV_NAME}" node --version >/dev/null 2>&1; then
  echo "Creating conda env '${ENV_NAME}' with nodejs..."
  conda create -y -n "${ENV_NAME}" nodejs
else
  echo "Conda env '${ENV_NAME}' already exists."
fi

conda activate "${ENV_NAME}"
cd "${REPO_ROOT}"

echo "Installing npm dependencies..."
npm install

echo
echo "Setup complete."
echo "Run presentations with:"
echo "  ./scripts/present run dev -- --deck creative-computing-intro"
