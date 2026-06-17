#!/bin/sh
set -e

node -e "
const fs = require('fs');
const env = {
  VITE_SCREEN_TOKEN:   process.env.VITE_SCREEN_TOKEN   || '',
  VITE_SCREEN_HUB_URL: process.env.VITE_SCREEN_HUB_URL || '',
};
fs.writeFileSync(
  'apps/dmd-screen/dist/config.js',
  'window.__ENV__ = ' + JSON.stringify(env) + ';\n'
);
console.log('[entrypoint] runtime config written for dmd-screen');
"

exec pnpm --filter @frontend/dmd-screen preview --host 0.0.0.0 --port 80
