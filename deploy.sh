#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Build local + push para branch production (Hostinger Git Deploy)
#
# Estratégia: commit .next/ pré-buildado + package-lock.json
# A Hostinger roda: npm ci --omit=dev  (instala node_modules Linux-nativos)
#                   node server.js      (custom server lê o .next/ pré-buildado)
# =============================================================================

set -euo pipefail

# ── Cores ─────────────────────────────────────────────────────────────────────
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}✔${RESET}  $*"; }
info() { echo -e "${CYAN}→${RESET}  $*"; }
warn() { echo -e "${YELLOW}⚠${RESET}  $*"; }
fail() { echo -e "${RED}✖${RESET}  $*"; exit 1; }
sep()  { echo -e "${BOLD}────────────────────────────────────────${RESET}"; }

# ── Diretório do script ───────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Configurações ─────────────────────────────────────────────────────────────
DEPLOY_BRANCH="production"
REQUIRED_NODE_MAJOR=18
NEXT_DIR=".next"

# =============================================================================
sep
echo -e "${BOLD}  CRM 2G — Deploy para Hostinger${RESET}"
echo -e "  crm2g.com  →  branch: $DEPLOY_BRANCH"
sep
echo ""

# ── 1. Pré-requisitos ─────────────────────────────────────────────────────────
info "Verificando pré-requisitos..."

command -v node >/dev/null 2>&1 || fail "Node.js não encontrado."
command -v npm  >/dev/null 2>&1 || fail "npm não encontrado."
command -v git  >/dev/null 2>&1 || fail "git não encontrado."

NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
  fail "Node.js $REQUIRED_NODE_MAJOR+ é necessário (atual: $(node -v))"
fi
ok "Node.js $(node -v) / npm $(npm -v)"

if ! git remote get-url origin >/dev/null 2>&1; then
  fail "Remote 'origin' não configurado. Rode: git remote add origin https://github.com/gprimarano1/crm2g.git"
fi
ok "Remote origin: $(git remote get-url origin)"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "$DEPLOY_BRANCH" ]; then
  fail "Você está na branch '$DEPLOY_BRANCH'. Volte para 'main' antes de fazer deploy."
fi
ok "Branch atual: $CURRENT_BRANCH"

if [ ! -f ".env.local" ]; then
  warn ".env.local não encontrado. Configure as env vars no hPanel da Hostinger."
fi

echo ""

# ── 2. Instala dependências locais (para o build) ─────────────────────────────
sep
info "Instalando dependências..."
npm install --loglevel=error
ok "Dependências instaladas"
echo ""

# ── 3. Build normal (sem output:standalone) ───────────────────────────────────
sep
info "Rodando npm run build..."
echo ""
npm run build
echo ""

# Valida que o build gerou chunks reais (build saudável)
if [ ! -d "$NEXT_DIR/server/chunks" ]; then
  fail "Build falhou — .next/server/chunks/ não encontrado."
fi
CHUNK_COUNT=$(ls "$NEXT_DIR/server/chunks/" | wc -l | tr -d ' ')
[ "$CHUNK_COUNT" -gt 0 ] || fail "Build falhou — nenhum chunk gerado."
ok "Build OK ($CHUNK_COUNT chunks em .next/server/chunks/)"
echo ""

# ── 4. Prepara diretório de deploy ────────────────────────────────────────────
sep
info "Preparando arquivos de produção..."

TEMP_DIR=$(mktemp -d)

# Copia .next/ completo e remove apenas o webpack cache (pesado, não necessário)
cp -r "$NEXT_DIR" "$TEMP_DIR/.next"
rm -rf "$TEMP_DIR/.next/cache/webpack" "$TEMP_DIR/.next/cache/fetch"

# Copia public/
cp -r "public" "$TEMP_DIR/public"

# package.json de produção: mesmas deps, scripts simplificados
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  pkg.scripts = {
    build: \"echo 'pre-built — skipping'\",
    start: 'node server.js'
  };
  fs.writeFileSync('$TEMP_DIR/package.json', JSON.stringify(pkg, null, 2));
"

# next.config.mjs — necessário para next start ler a configuração
[ -f "next.config.mjs" ] && cp "next.config.mjs" "$TEMP_DIR/next.config.mjs"

# package-lock.json — necessário para npm ci na Hostinger
[ -f "package-lock.json" ] && cp "package-lock.json" "$TEMP_DIR/package-lock.json" \
  || warn "package-lock.json não encontrado — Hostinger vai usar npm install"

# .gitignore mínimo (não commita node_modules nem .env)
cat > "$TEMP_DIR/.gitignore" << 'GITEOF'
.DS_Store
*.local
.env.local
node_modules/.cache
GITEOF

# server.js — diagnóstico + next start com hostname fixo
cat > "$TEMP_DIR/server.js" << 'SERVEREOF'
'use strict';

process.on('uncaughtException', function(err) {
  process.stdout.write('[CRASH] ' + err.message + '\n' + (err.stack || '') + '\n');
  process.exit(1);
});
process.on('unhandledRejection', function(reason) {
  process.stdout.write('[CRASH] unhandledRejection: ' + String(reason) + '\n');
  process.exit(1);
});

// --- Diagnóstico de ambiente ---
var rawPort = process.env.PORT || '3000';
process.stdout.write('[ENV] PORT=' + rawPort + '\n');
process.stdout.write('[ENV] HOSTNAME=' + (process.env.HOSTNAME || '(não definido)') + '\n');
process.stdout.write('[ENV] NODE_ENV=' + (process.env.NODE_ENV || '(não definido)') + '\n');
process.stdout.write('[ENV] __dirname=' + __dirname + '\n');

var spawn = require('child_process').spawn;
var path  = require('path');
var fs    = require('fs');

var nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');

// Verifica existência do binário next e do BUILD_ID
process.stdout.write('[CHECK] next bin: ' + (fs.existsSync(nextBin) ? 'OK' : 'NAO ENCONTRADO') + '\n');
process.stdout.write('[CHECK] .next/BUILD_ID: ' + (fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID')) ? 'OK' : 'NAO ENCONTRADO') + '\n');

// Porta: se PORT for caminho de socket ou NaN, usa 3000
var port = parseInt(rawPort, 10);
if (isNaN(port) || port < 1) {
  process.stdout.write('[WARN] PORT invalido ("' + rawPort + '"), usando 3000\n');
  port = 3000;
}

// Hostname: NUNCA usa process.env.HOSTNAME (Hostinger define como caminho de socket Unix)
// Sempre escuta em 0.0.0.0 para todas as interfaces
var hostname = '0.0.0.0';

process.stdout.write('[STARTUP] Iniciando: next start -p ' + port + ' -H ' + hostname + '\n');

var child = spawn(nextBin, ['start', '-p', String(port), '-H', hostname], {
  cwd: __dirname,
  stdio: ['ignore', 'inherit', 'inherit'],
  env: process.env,
});

child.on('error', function(err) {
  process.stdout.write('[FATAL] Falha ao iniciar next: ' + err.message + '\n');
  process.exit(1);
});

child.on('exit', function(code, signal) {
  process.stdout.write('[EXIT] next terminou — code=' + code + ' signal=' + signal + '\n');
  process.exit(code != null ? code : 1);
});
SERVEREOF

ok "Arquivos de produção prontos"
echo ""

# ── 5. Push para branch production ───────────────────────────────────────────
sep
info "Fazendo push para branch '$DEPLOY_BRANCH'..."

REMOTE_URL=$(git remote get-url origin)

cd "$TEMP_DIR"
git init -q
git checkout -b "$DEPLOY_BRANCH"
git add -A
git add -f ".next"    # força: ~/.gitignore_global do macOS exclui .next silenciosamente
git commit -q -m "deploy: $(date '+%Y-%m-%d %H:%M') — $CURRENT_BRANCH"

git remote add origin "$REMOTE_URL"
git push origin "$DEPLOY_BRANCH" --force -q

cd "$SCRIPT_DIR"
rm -rf "$TEMP_DIR"

ok "Branch '$DEPLOY_BRANCH' atualizada no GitHub"
echo ""

# ── 6. Resumo ─────────────────────────────────────────────────────────────────
sep
NEXT_SIZE=$(du -sh "$NEXT_DIR/server" | cut -f1)

echo -e "${BOLD}  Deploy concluído!${RESET}"
echo ""
echo -e "  Build server : ${CYAN}$NEXT_SIZE${RESET}"
echo -e "  Branch       : ${CYAN}$DEPLOY_BRANCH${RESET}  (Hostinger aponta aqui)"
echo -e "  Commit       : $(git ls-remote origin $DEPLOY_BRANCH 2>/dev/null | cut -c1-7 || echo 'ver GitHub')"
echo ""
sep
echo -e "${BOLD}  Configuração Hostinger (verifique estas configurações!)${RESET}"
sep
echo ""
echo "  hPanel → Node.js → Seu app:"
echo "  ┌──────────────────────────────────────────────────┐"
echo "  │ Git repository  : github.com/gprimarano1/crm2g  │"
echo "  │ Branch          : production                     │"
echo "  │ Build command   : npm ci --omit=dev              │"
echo "  │ Startup file    : server.js                      │"
echo "  │ Node.js version : 20.x                           │"
echo "  └──────────────────────────────────────────────────┘"
echo ""
echo "  IMPORTANTE: Build command deve ser 'npm ci --omit=dev'"
echo "  (instala node_modules Linux-nativos; NÃO rebuilda o app)"
echo ""
echo "  Env vars no hPanel:"
echo "    NODE_ENV=production"
echo "    PORT=3000"
echo "    NEXT_PUBLIC_APP_URL=https://crm2g.com"
echo "    NEXT_PUBLIC_SUPABASE_URL=..."
echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY=..."
echo "    SUPABASE_SERVICE_ROLE_KEY=..."
echo "    ANTHROPIC_API_KEY=..."
echo "    META_WEBHOOK_VERIFY_TOKEN=..."
echo "    META_APP_SECRET=..."
echo ""
echo "  Para deploys futuros: ./deploy.sh"
echo ""
sep
echo ""
