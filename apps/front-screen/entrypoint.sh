#!/bin/sh
set -e

node -e "
const fs = require('fs');
const env = {
  VITE_SCREEN_TOKEN:   process.env.VITE_SCREEN_TOKEN   || '',
  VITE_WS_URL:         process.env.VITE_WS_URL         || '',
  VITE_SCREEN_HUB_URL: process.env.VITE_SCREEN_HUB_URL || '',
  VITE_ENVIRONMENT:    process.env.VITE_ENVIRONMENT    || 'local',
};
fs.writeFileSync(
  'apps/front-screen/dist/config.js',
  'window.__ENV__ = ' + JSON.stringify(env) + ';\n'
);
console.log('[entrypoint] runtime config written for front-screen');
"

exec pnpm --filter @frontend/front-screen preview --host 0.0.0.0 --port 80
