#!/usr/bin/env node
/**
 * CRM 2G — Setup Script
 * Executa migrations e cria usuário admin no Supabase.
 *
 * Uso (interativo):
 *   node scripts/setup.js
 *
 * Uso (sem prompt):
 *   SUPABASE_PAT=<token> node scripts/setup.js
 *
 * Como obter o PAT:
 *   https://app.supabase.com/account/tokens  →  New token
 */

const fs       = require("fs");
const path     = require("path");
const readline = require("readline");

// ──────────────────────────────────────────────────────────────
// 1. Carregar .env.local
// ──────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let   PAT              = process.env.SUPABASE_PAT;

if (!SUPABASE_URL) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL não configurada em .env.local");
  process.exit(1);
}

const PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0];

// ──────────────────────────────────────────────────────────────
// 2. Verificar service_role key
// ──────────────────────────────────────────────────────────────
function decodeJwt(token) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch { return null; }
}

const servicePayload    = SERVICE_ROLE_KEY ? decodeJwt(SERVICE_ROLE_KEY) : null;
const isServiceRoleValid = servicePayload?.role === "service_role";

// ──────────────────────────────────────────────────────────────
// 3. Helpers
// ──────────────────────────────────────────────────────────────

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); });
  });
}

/** Executa SQL via Supabase Management API (requer PAT) */
async function execSql(sql) {
  const res  = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${PAT}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || JSON.stringify(data);
    throw new Error(`Management API ${res.status}: ${msg}`);
  }
  return data;
}

/** Cria usuário via Auth Admin API (requer service_role) */
async function createAuthUser(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "apikey":        SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.msg || data?.message || data?.error_description || JSON.stringify(data);
    throw new Error(`Auth API ${res.status}: ${msg}`);
  }
  return data;
}

/** Busca usuário existente por e-mail */
async function findUser(email) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`,
    {
      headers: {
        "apikey":        SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const data = await res.json().catch(() => ({ users: [] }));
  return data?.users?.find((u) => u.email === email) ?? null;
}

/** Insere perfil admin via REST (requer service_role) */
async function upsertPerfil(userId, email) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/perfis`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Prefer":        "resolution=merge-duplicates",
      "apikey":        SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ id: userId, email, nome: "Admin", role: "admin" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `perfis upsert ${res.status}`);
  }
}

// ──────────────────────────────────────────────────────────────
// 4. Main
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log("══════════════════════════════════════════");
  console.log("  CRM 2G — Setup de Banco de Dados");
  console.log("══════════════════════════════════════════");
  console.log(`Projeto:          ${PROJECT_REF}`);
  console.log(`Service role key: ${isServiceRoleValid ? "✅ válida" : "❌ inválida"}`);
  console.log(`PAT:              ${PAT ? "✅ disponível" : "❌ não configurado"}`);
  console.log("");

  // ── Obter PAT se não disponível ────────────────────────────
  if (!PAT) {
    console.log("O script usa a Supabase Management API para executar SQL.");
    console.log("Isso requer um Personal Access Token (PAT).");
    console.log("");
    console.log("Como obter:");
    console.log("  1. Acesse https://app.supabase.com/account/tokens");
    console.log("  2. Clique em 'New token'");
    console.log("  3. Dê um nome (ex: 'setup-crm2g') e clique em 'Generate token'");
    console.log("  4. Copie o token gerado");
    console.log("");
    PAT = await prompt("Cole o PAT aqui: ");
    if (!PAT) {
      console.error("❌  PAT não fornecido. Abortando.");
      process.exit(1);
    }
  }

  // ── Validar PAT com uma query simples ──────────────────────
  process.stdout.write("  Validando PAT... ");
  try {
    await execSql("SELECT 1");
    console.log("✅");
  } catch (err) {
    console.log("❌");
    console.error(`  Erro: ${err.message}`);
    console.error("  Verifique se o PAT é válido e tem permissão no projeto.");
    process.exit(1);
  }

  // ── Executar migrations ─────────────────────────────────────
  const migrationsDir  = path.join(__dirname, "..", "supabase", "migrations");
  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  console.log(`\nEncontradas ${migrationFiles.length} migrations:\n`);
  migrationFiles.forEach((f) => console.log(`  · ${f}`));
  console.log("");

  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    process.stdout.write(`  Rodando ${file}... `);
    try {
      await execSql(sql);
      console.log("✅");
    } catch (err) {
      console.log("❌");
      console.error(`    ${err.message}`);
      // Erros esperados em 001 (arquivo stub) — continua
      if (file.startsWith("001")) {
        console.warn("    ⚠️  001 é um stub — ignorando erro.");
        continue;
      }
      const continueOnError = await prompt("    Continuar mesmo assim? (s/N): ");
      if (!continueOnError.toLowerCase().startsWith("s")) {
        process.exit(1);
      }
    }
  }

  console.log("\n✅ Migrations concluídas!\n");

  // ── Criar usuário admin ─────────────────────────────────────
  if (!isServiceRoleValid) {
    console.warn("⚠️  Criação de usuário requer service_role key válida.");
    console.warn("   Corrija SUPABASE_SERVICE_ROLE_KEY e rode novamente.");
    return showFinalInstructions();
  }

  const ADMIN_EMAIL    = "gprimarano@gmail.com";
  const ADMIN_PASSWORD = "123Testando!";

  let userId;

  process.stdout.write(`  Criando usuário admin (${ADMIN_EMAIL})... `);
  try {
    const user = await createAuthUser(ADMIN_EMAIL, ADMIN_PASSWORD);
    userId     = user.id;
    console.log(`✅  id: ${userId}`);
  } catch (err) {
    if (err.message.includes("already been registered") || err.message.includes("already exists")) {
      console.log("⚠️  Já existe, buscando...");
      const existing = await findUser(ADMIN_EMAIL);
      if (existing) {
        userId = existing.id;
        console.log(`  ℹ️  Usuário encontrado: ${userId}`);
      } else {
        console.error("  Não foi possível localizar o usuário existente.");
      }
    } else {
      console.log("❌");
      console.error(`  ${err.message}`);
    }
  }

  if (userId) {
    process.stdout.write("  Inserindo perfil admin na tabela perfis... ");
    try {
      await upsertPerfil(userId, ADMIN_EMAIL);
      console.log("✅");
    } catch (err) {
      console.log("❌");
      console.error(`  ${err.message}`);
    }
  }

  showFinalInstructions();
}

function showFinalInstructions() {
  console.log("\n══════════════════════════════════════════");
  console.log("  Setup concluído!");
  console.log("══════════════════════════════════════════");
  console.log("\nPróximos passos:");
  console.log("  1. Crie o bucket 'propostas-logos' no Supabase:");
  console.log("     Dashboard → Storage → New bucket → propostas-logos → Public");
  console.log("  2. Inicie o app:");
  console.log("     npm run dev");
  console.log("  3. Acesse http://localhost:3000/login");
  console.log("     Email: gprimarano@gmail.com");
  console.log("     Senha: 123Testando!");
  console.log("");
}

main().catch((err) => {
  console.error("\nErro fatal:", err.message);
  process.exit(1);
});
