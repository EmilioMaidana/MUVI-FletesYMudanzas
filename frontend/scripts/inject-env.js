#!/usr/bin/env node
/**
 * Post-build script that runs after `ng build`.
 *
 * Replaces `__GOOGLE_MAPS_API_KEY__` placeholder in the built index.html
 * with the value of the GOOGLE_MAPS_API_KEY environment variable.
 *
 * On Vercel, set GOOGLE_MAPS_API_KEY in Project Settings → Environment Variables.
 * Locally (dev), `npm start` proxies to the backend so this script is irrelevant.
 *
 * If the env var is missing, the script logs a warning and leaves the
 * placeholder untouched so the failure is visible in the browser DevTools.
 */
const fs = require('fs');
const path = require('path');

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const indexPath = path.join(__dirname, '..', 'dist', 'fletea', 'browser', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error(`[inject-env] ERROR: ${indexPath} not found. Did 'ng build' run first?`);
  process.exit(1);
}

if (!KEY) {
  console.warn('[inject-env] WARNING: GOOGLE_MAPS_API_KEY is not set. ' +
               'Maps autocomplete will fail. Set it in Vercel project settings.');
  process.exit(0); // Don't fail the build — let the deploy succeed and surface the issue at runtime
}

const html = fs.readFileSync(indexPath, 'utf8');
const placeholder = '__GOOGLE_MAPS_API_KEY__';

if (!html.includes(placeholder)) {
  console.log(`[inject-env] No placeholder found in index.html — nothing to inject.`);
  process.exit(0);
}

const replaced = html.split(placeholder).join(KEY);
fs.writeFileSync(indexPath, replaced, 'utf8');
console.log(`[inject-env] Injected GOOGLE_MAPS_API_KEY into ${indexPath}`);
