#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_NAME="${SLIDEV_ENV_NAME:-node}"
ANACONDA_MODULE="${ANACONDA_MODULE:-anaconda3/2025.12}"

# Some module/conda shell hooks reference unset vars (for example PS1).
# Relax nounset only during environment initialization.
set +u
echo "Loading module: ${ANACONDA_MODULE}"
module load "${ANACONDA_MODULE}"

CONDA_BASE="$(conda info --base)"
export PS1="${PS1-}"
source "${CONDA_BASE}/etc/profile.d/conda.sh"
set -u

if ! conda run -n "${ENV_NAME}" node --version >/dev/null 2>&1; then
  echo "Creating conda env '${ENV_NAME}' with nodejs..."
  conda create -y -n "${ENV_NAME}" nodejs
else
  echo "Conda env '${ENV_NAME}' already exists."
fi

set +u
conda activate "${ENV_NAME}"
set -u
cd "${REPO_ROOT}"

echo "Installing npm dependencies..."
npm install

echo
echo "Setup complete."
echo "Run presentations with:"
echo "  ./scripts/present.sh dev creative-computing-intro"
