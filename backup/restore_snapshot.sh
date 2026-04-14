#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: backup/restore_snapshot.sh <YYYYMMDD-HHMMSS>"
  exit 1
fi

STAMP="$1"
TAG="app-snapshot-${STAMP}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GAS_DIR="${ROOT_DIR}/apps/erp/src/gas"

if ! git -C "${ROOT_DIR}" rev-parse --verify "${TAG}" >/dev/null 2>&1; then
  echo "Snapshot tag not found: ${TAG}"
  echo "Available tags:"
  git -C "${ROOT_DIR}" tag --list 'app-snapshot-*' | tail -n 20
  exit 1
fi

if [ -n "$(git -C "${ROOT_DIR}" status --porcelain)" ]; then
  echo "Working tree is dirty. Commit/stash first."
  exit 1
fi

RESTORE_BRANCH="restore-${STAMP}"
git -C "${ROOT_DIR}" checkout -B "${RESTORE_BRANCH}" "${TAG}"

echo "Restored to snapshot: ${TAG}"
echo "Checked out branch: ${RESTORE_BRANCH}"
echo "If you need GAS deploy:"
echo "  cd ${GAS_DIR} && clasp push"
