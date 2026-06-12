#!/usr/bin/env bash
# Single dev entrypoint: api/app/landing/storybook run in the background
# (no stdin needed), Expo runs in the foreground so its interactive menu
# (i/a/QR) keeps the TTY. `kill 0` tears down the backgrounded moon
# processes when Expo exits or on Ctrl-C.
set -uo pipefail
trap 'kill 0' EXIT

bunx moon run api:dev app:dev landing:dev storybook:dev &
bunx moon run mobile:dev
