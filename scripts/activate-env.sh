#!/usr/bin/env bash
# Load cluster module (if needed) + conda env with Node/npm for this repo.
#
# Either:
#   source ./scripts/activate-env.sh    # activates current shell
#   ./scripts/activate-env.sh          # opens a new interactive bash (exit to leave)
#
# Environment overrides (optional):
#   SLIDEV_ENV_NAME   conda env name (default: node)
#   ANACONDA_MODULE   Lmod module id (default: anaconda3/2025.12)

_this="${BASH_SOURCE[0]}"
_here="$(cd "$(dirname "$_this")" && pwd)"
REPO_ROOT="$(cd "$_here/.." && pwd)"

if [[ "$_this" == "$0" ]]; then
  echo "Spawning interactive bash with repo Node env (exit when done)..." >&2
  exec bash --rcfile <(
    echo '[ -f "$HOME/.bashrc" ] && . "$HOME/.bashrc"'
    echo ". \"${_this}\""
    echo "cd \"${REPO_ROOT}\""
  ) -i
fi

set -euo pipefail

ENV_NAME="${SLIDEV_ENV_NAME:-node}"
ANACONDA_MODULE="${ANACONDA_MODULE:-anaconda3/2025.12}"

if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  echo "node/npm already on PATH ($(command -v node))"
  return 0 2>/dev/null || exit 0
fi

set +u
module load "${ANACONDA_MODULE}" >/dev/null 2>&1 || true

if ! command -v conda >/dev/null 2>&1; then
  set -u
  echo "conda not on PATH. Load your Anaconda module, e.g.:" >&2
  echo "  module load ${ANACONDA_MODULE}" >&2
  return 1 2>/dev/null || exit 1
fi

export PS1="${PS1-}"
# shellcheck disable=SC1090
source "$(conda info --base)/etc/profile.d/conda.sh"
set -u

if ! conda run -n "${ENV_NAME}" node --version >/dev/null 2>&1; then
  echo "Conda env '${ENV_NAME}' missing Node. Run once from repo root:" >&2
  echo "  ./scripts/setup-della.sh" >&2
  return 1 2>/dev/null || exit 1
fi

set +u
conda activate "${ENV_NAME}"
set -u

echo "Activated conda env '${ENV_NAME}' (Slidev/presentations). Repo: ${REPO_ROOT}"
