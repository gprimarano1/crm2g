#!/usr/bin/env node
// scripts/subscribe-page.js
// Assina o app Meta na página para receber eventos de leadgen em tempo real.
//
// Uso:
//   node scripts/subscribe-page.js
//   USER_ACCESS_TOKEN=xxx PAGE_ID=yyy node scripts/subscribe-page.js

'use strict';

const META_VERSION = 'v19.0';

// ── Configurações ─────────────────────────────────────────────────────────────

// Lê do .env.local se existir (sem depender de dotenv)
function loadEnvLocal() {
  try {
    const fs   = require('fs');
    const path = require('path');
    const file = path.join(__dirname, '..', '.env.local');
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local não existe — usa variáveis de ambiente normalmente
  }
}

loadEnvLocal();

const USER_ACCESS_TOKEN = process.env.USER_ACCESS_TOKEN
  || process.env.META_SYSTEM_USER_ACCESS_TOKEN;

const PAGE_ID = process.env.PAGE_ID || '104497849195845';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok || json.error) {
    const err = json.error || { message: `HTTP ${res.status}` };
    throw new Error(`Meta API erro: [${err.code ?? res.status}] ${err.message} (type=${err.type ?? '-'})`);
  }
  return json;
}

// ── 1. Obtém Page Access Token via /me/accounts ───────────────────────────────

async function getPageAccessToken(userToken, pageId) {
  console.log(`\n→ Buscando páginas do usuário em /me/accounts...`);
  const url = `https://graph.facebook.com/${META_VERSION}/me/accounts?access_token=${userToken}`;
  const data = await apiFetch(url);

  const pages = data.data ?? [];
  console.log(`  ${pages.length} página(s) encontrada(s):`);
  for (const p of pages) {
    const marker = p.id === pageId ? ' ◀ alvo' : '';
    console.log(`  • [${p.id}] ${p.name}${marker}`);
  }

  const page = pages.find((p) => p.id === pageId);
  if (!page) {
    throw new Error(
      `Página ${pageId} não encontrada em /me/accounts.\n` +
      `Verifique se o token tem permissão pages_show_list e manage_pages na página correta.`
    );
  }

  return page.access_token;
}

// ── 2. Assina o app na página ─────────────────────────────────────────────────

async function subscribeApp(pageAccessToken, pageId) {
  console.log(`\n→ Assinando app na página ${pageId} (leadgen)...`);
  const url = `https://graph.facebook.com/${META_VERSION}/${pageId}/subscribed_apps`;

  const body = new URLSearchParams({
    subscribed_fields: 'leadgen',
    access_token:      pageAccessToken,
  });

  const data = await apiFetch(url, { method: 'POST', body });
  return data;
}

// ── 3. Verifica assinatura existente ──────────────────────────────────────────

async function checkSubscription(pageAccessToken, pageId) {
  console.log(`\n→ Verificando assinatura atual...`);
  const url = `https://graph.facebook.com/${META_VERSION}/${pageId}/subscribed_apps?access_token=${pageAccessToken}`;
  const data = await apiFetch(url);
  return data.data ?? [];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('════════════════════════════════════════');
  console.log('  Meta App Subscription — CRM 2G');
  console.log('════════════════════════════════════════');
  console.log(`  PAGE_ID  : ${PAGE_ID}`);
  console.log(`  API      : ${META_VERSION}`);

  if (!USER_ACCESS_TOKEN) {
    console.error('\n✖  USER_ACCESS_TOKEN não encontrado.');
    console.error('   Defina META_SYSTEM_USER_ACCESS_TOKEN no .env.local ou passe USER_ACCESS_TOKEN=xxx');
    process.exit(1);
  }
  console.log(`  Token    : ${USER_ACCESS_TOKEN.slice(0, 12)}...`);

  // 1. Obtém page access token
  const pageToken = await getPageAccessToken(USER_ACCESS_TOKEN, PAGE_ID);
  console.log(`\n✔  Page Access Token obtido: ${pageToken.slice(0, 12)}...`);

  // 2. Assina
  const result = await subscribeApp(pageToken, PAGE_ID);
  if (result.success) {
    console.log('\n✔  Assinatura realizada com sucesso!');
  } else {
    console.warn('\n⚠  Resposta inesperada:', JSON.stringify(result));
  }

  // 3. Confirma assinatura ativa
  const subs = await checkSubscription(pageToken, PAGE_ID);
  if (subs.length === 0) {
    console.log('\n⚠  Nenhuma assinatura encontrada após o POST (pode levar alguns segundos).');
  } else {
    console.log('\n  Apps assinados na página:');
    for (const s of subs) {
      const fields = (s.subscribed_fields ?? []).join(', ');
      console.log(`  • ${s.name ?? s.id} → campos: [${fields}]`);
    }
  }

  console.log('\n════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n✖  Erro:', err.message);
  process.exit(1);
});
