#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "[deploy] missing target argument (test|prod)"
  exit 1
fi

case "$TARGET" in
  test)
    PREFIX="TEST"
    ;;
  prod)
    PREFIX="PROD"
    ;;
  *)
    echo "[deploy] unsupported target: $TARGET"
    exit 1
    ;;
esac

get_var() {
  local name="$1"
  eval "echo \${$name:-}"
}

HOST_VAR="${PREFIX}_DEPLOY_HOST"
USER_VAR="${PREFIX}_DEPLOY_USER"
PORT_VAR="${PREFIX}_DEPLOY_PORT"
PATH_VAR="${PREFIX}_DEPLOY_PATH"
URL_VAR="${PREFIX}_DEPLOY_URL"

DEPLOY_HOST="$(get_var "$HOST_VAR")"
DEPLOY_USER="$(get_var "$USER_VAR")"
DEPLOY_PORT="$(get_var "$PORT_VAR")"
DEPLOY_PATH="$(get_var "$PATH_VAR")"
DEPLOY_URL="$(get_var "$URL_VAR")"

DEPLOY_PORT="${DEPLOY_PORT:-22}"
BUILD_OUTPUT="${BUILD_OUTPUT:-apps/admin-web/dist}"
SSH_KEY_CONTENT="${DEPLOY_SSH_PRIVATE_KEY:-}"

missing=()
[[ -z "$DEPLOY_HOST" ]] && missing+=("$HOST_VAR")
[[ -z "$DEPLOY_USER" ]] && missing+=("$USER_VAR")
[[ -z "$DEPLOY_PATH" ]] && missing+=("$PATH_VAR")
[[ -z "$SSH_KEY_CONTENT" ]] && missing+=("DEPLOY_SSH_PRIVATE_KEY")

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "[deploy] missing required CI variables: ${missing[*]}"
  exit 1
fi

if [[ ! -d "$BUILD_OUTPUT" ]]; then
  echo "[deploy] build output directory not found: $BUILD_OUTPUT"
  exit 1
fi

mkdir -p ~/.ssh
chmod 700 ~/.ssh
printf '%s\n' "$SSH_KEY_CONTENT" | tr -d '\r' > ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519
ssh-keyscan -p "$DEPLOY_PORT" "$DEPLOY_HOST" >> ~/.ssh/known_hosts 2>/dev/null || true

RELEASE_ID="$(date +%Y%m%d%H%M%S)-${CI_COMMIT_SHORT_SHA:-local}"
REMOTE_RELEASE_DIR="$DEPLOY_PATH/releases/$RELEASE_ID"
REMOTE_CURRENT_LINK="$DEPLOY_PATH/current"

echo "[deploy] target=$TARGET host=$DEPLOY_HOST path=$DEPLOY_PATH release=$RELEASE_ID"

ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH/releases' '$REMOTE_RELEASE_DIR'"
rsync -az --delete -e "ssh -p $DEPLOY_PORT" "$BUILD_OUTPUT/" "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_RELEASE_DIR/"
ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "ln -sfn '$REMOTE_RELEASE_DIR' '$REMOTE_CURRENT_LINK'"

if [[ -n "$DEPLOY_URL" ]]; then
  echo "[deploy] completed: $DEPLOY_URL"
else
  echo "[deploy] completed. set ${URL_VAR} to show environment URL"
fi