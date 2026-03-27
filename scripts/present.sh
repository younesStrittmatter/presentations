#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_NAME="${SLIDEV_ENV_NAME:-node}"
ANACONDA_MODULE="${ANACONDA_MODULE:-anaconda3/2025.12}"

activate_env_if_needed() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  set +u
  module load "${ANACONDA_MODULE}" >/dev/null 2>&1 || true

  if ! command -v conda >/dev/null 2>&1; then
    set -u
    echo "Conda is not available. Load your anaconda module first."
    exit 1
  fi

  export PS1="${PS1-}"
  # shellcheck disable=SC1090
  source "$(conda info --base)/etc/profile.d/conda.sh"
  set -u

  if ! conda run -n "${ENV_NAME}" node --version >/dev/null 2>&1; then
    echo "Conda env '${ENV_NAME}' missing Node."
    echo "Run one-time setup: ./scripts/setup-della.sh"
    exit 1
  fi

  set +u
  conda activate "${ENV_NAME}"
  set -u
}

usage() {
  cat <<'EOF'
Usage:
  ./scripts/present.sh dev <deck-path>
  ./scripts/present.sh build <deck-path>
  ./scripts/present.sh build-all
  ./scripts/present.sh new -- [args passed to new:presentation]

Deck path can be nested, e.g. class-1/part-1/my-talk

Examples:
  ./scripts/present.sh dev creative-computing-intro
  ./scripts/present.sh dev class-1/part-1/intro
  ./scripts/present.sh new -- --under class-1/part-1 --slug intro --title "Part 1 intro"
EOF
}

main() {
  local command="${1:-}"
  if [[ -z "${command}" ]]; then
    usage
    exit 1
  fi

  activate_env_if_needed
  cd "${REPO_ROOT}"

  case "${command}" in
    dev)
      local deck="${2:-}"
      [[ -n "${deck}" ]] || { echo "Missing deck slug."; usage; exit 1; }
      npm run dev -- --deck "${deck}"
      ;;
    build)
      local deck="${2:-}"
      [[ -n "${deck}" ]] || { echo "Missing deck slug."; usage; exit 1; }
      npm run build -- --deck "${deck}"
      ;;
    build-all)
      npm run build:all
      ;;
    new)
      shift
      [[ $# -gt 0 ]] || { echo "Missing arguments. Example: ./scripts/present.sh new -- --slug talk --title \"My Talk\""; usage; exit 1; }
      npm run new:presentation -- "$@"
      ;;
    *)
      echo "Unknown command: ${command}"
      usage
      exit 1
      ;;
  esac
}

main "$@"
