#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Build + push para branch production (Hostinger Git Deploy)
# Uso: ./deploy.sh
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
STANDALONE_DIR=".next/standalone"
DEPLOY_BRANCH="production"
REQUIRED_NODE_MAJOR=18

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

# Verifica remote origin
if ! git remote get-url origin >/dev/null 2>&1; then
  fail "Remote 'origin' não configurado. Rode: git remote add origin https://github.com/gprimarano1/crm2g.git"
fi
ok "Remote origin: $(git remote get-url origin)"

# Verifica branch atual
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "$DEPLOY_BRANCH" ]; then
  fail "Você está na branch '$DEPLOY_BRANCH'. Volte para 'main' antes de fazer deploy."
fi
ok "Branch atual: $CURRENT_BRANCH"

# Verifica .env.local
if [ ! -f ".env.local" ]; then
  warn ".env.local não encontrado. Configure as env vars no hPanel da Hostinger."
fi

echo ""

# ── 2. Instala dependências ───────────────────────────────────────────────────
sep
info "Instalando dependências..."
npm install --loglevel=error
ok "Dependências instaladas"
echo ""

# ── 4. Build (com output:standalone temporário) ───────────────────────────────
sep
info "Ativando output:standalone temporário para build..."

# Garante restauração do next.config.mjs mesmo em caso de falha
restore_config() {
  if [ -f next.config.mjs.bak ]; then
    cp next.config.mjs.bak next.config.mjs
    rm next.config.mjs.bak
  fi
}
trap restore_config EXIT

cp next.config.mjs next.config.mjs.bak
node -e "
  const fs = require('fs');
  let c = fs.readFileSync('next.config.mjs', 'utf8');
  c = c.replace(/([ \t]*)(poweredByHeader:)/, '\$1output: \"standalone\",\n\$1\$2');
  fs.writeFileSync('next.config.mjs', c);
"
ok "output:standalone ativado"

info "Rodando npm run build..."
echo ""
npm run build
echo ""

restore_config
trap - EXIT
ok "next.config.mjs restaurado"
echo ""

# ── 5. Copia assets estáticos para standalone ─────────────────────────────────
sep
info "Copiando assets estáticos para standalone..."
[ -d "$STANDALONE_DIR" ] || fail "$STANDALONE_DIR não gerado."
[ -f "$STANDALONE_DIR/server.js" ] || fail "server.js não encontrado."

# Next.js não copia automaticamente — precisa copiar manualmente
cp -r ".next/static" "$STANDALONE_DIR/.next/static"
cp -r "public" "$STANDALONE_DIR/public"

[ -d "$STANDALONE_DIR/.next/static" ] || fail ".next/static não copiado."
[ -d "$STANDALONE_DIR/public" ]        || fail "public/ não copiado."
ok "Estrutura standalone OK"
echo ""

# ── 6. Prepara branch production ─────────────────────────────────────────────
sep
info "Preparando branch '$DEPLOY_BRANCH'..."

TEMP_DIR=$(mktemp -d)
cp -r "$STANDALONE_DIR/." "$TEMP_DIR/"

# Injeta error handlers no início do server.js para capturar crashes no stdout
ORIGINAL_SERVER=$(cat "$TEMP_DIR/server.js")
cat > "$TEMP_DIR/server.js" << 'SERVEREOF'
// ── Error handlers (injected by deploy.sh) ──
process.on('uncaughtException', function(err) {
  process.stdout.write('[CRASH uncaughtException] ' + err.message + '\n' + (err.stack || '') + '\n');
  process.exit(1);
});
process.on('unhandledRejection', function(reason) {
  process.stdout.write('[CRASH unhandledRejection] ' + String(reason) + '\n');
  process.exit(1);
});
process.stdout.write('[STARTUP] server.js iniciando...\n');
SERVEREOF
echo "$ORIGINAL_SERVER" >> "$TEMP_DIR/server.js"

# Cria .gitignore mínimo para a branch de produção
cat > "$TEMP_DIR/.gitignore" << 'EOF'
.DS_Store
*.local
EOF

# Cria package.json mínimo para a Hostinger saber o entry point
# "build" é no-op: app já veio buildado, Hostinger só precisa do script existir
cat > "$TEMP_DIR/package.json" << 'EOF'
{
  "name": "crm2g",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "echo 'App already built — skipping'",
    "start": "node server.js"
  }
}
EOF

ok "Arquivos de produção prontos"
echo ""

# ── 7. Push para branch production ───────────────────────────────────────────
sep
info "Fazendo push para branch '$DEPLOY_BRANCH'..."

ORIGINAL_DIR="$SCRIPT_DIR"

cd "$TEMP_DIR"
git init -q
git checkout -b "$DEPLOY_BRANCH"
git add -A
git commit -q -m "deploy: $(date '+%Y-%m-%d %H:%M') — $CURRENT_BRANCH"

REMOTE_URL=$(cd "$ORIGINAL_DIR" && git remote get-url origin)
git remote add origin "$REMOTE_URL"
git push origin "$DEPLOY_BRANCH" --force -q

cd "$ORIGINAL_DIR"
rm -rf "$TEMP_DIR"

ok "Branch '$DEPLOY_BRANCH' atualizada no GitHub"
echo ""

# ── 8. Também cria deploy.zip (backup / upload manual) ───────────────────────
sep
info "Gerando deploy.zip (backup para upload manual)..."

if command -v zip >/dev/null 2>&1; then
  (
    cd "$STANDALONE_DIR"
    zip -r "../../deploy.zip" . \
      --exclude "*.DS_Store" \
      --exclude "*/__pycache__/*" \
      -q
  )
  ZIP_SIZE=$(du -sh "deploy.zip" | cut -f1)
  ok "deploy.zip gerado ($ZIP_SIZE)"
else
  warn "zip não encontrado — pulando geração do deploy.zip"
fi
echo ""

# ── 9. Resumo ─────────────────────────────────────────────────────────────────
sep
STANDALONE_SIZE=$(du -sh "$STANDALONE_DIR" | cut -f1)

echo -e "${BOLD}  Deploy concluído!${RESET}"
echo ""
echo -e "  Build   : ${CYAN}$STANDALONE_SIZE${RESET}"
echo -e "  Branch  : ${CYAN}$DEPLOY_BRANCH${RESET}  (Hostinger aponta aqui)"
echo -e "  Commit  : $(git ls-remote origin $DEPLOY_BRANCH 2>/dev/null | cut -c1-7 || echo 'ver GitHub')"
echo ""
sep
echo -e "${BOLD}  Configuração Hostinger (apenas 1ª vez)${RESET}"
sep
echo ""
echo "  hPanel → Node.js → Seu app:"
echo "  ┌─────────────────────────────────────────────┐"
echo "  │ Git repository : github.com/gprimarano1/crm2g │"
echo "  │ Branch         : production                  │"
echo "  │ Startup file   : server.js                   │"
echo "  │ Node.js version: 20.x                        │"
echo "  └─────────────────────────────────────────────┘"
echo ""
echo "  Env vars no hPanel:"
echo "    NODE_ENV=production"
echo "    PORT=3000"
echo "    NEXT_PUBLIC_APP_URL=https://crm2g.com"
echo "    NEXT_PUBLIC_SUPABASE_URL=..."
echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY=..."
echo "    SUPABASE_SERVICE_ROLE_KEY=..."
echo "    ANTHROPIC_API_KEY=..."
echo ""
echo "  Para deploys futuros: ./deploy.sh"
echo ""
sep
echo ""
