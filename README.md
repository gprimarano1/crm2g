# CRM 2G CRM

CRM de performance digital para gestão de leads, campanhas Meta Ads, propostas comerciais e relatórios de resultados — com inteligência artificial integrada.

**Produção:** [crm2g.com](https://crm2g.com)

---

## O que é

CRM 2G é um painel administrativo completo para agências de tráfego pago. Centraliza:

- **Leads** — recebidos via webhook do Meta Lead Ads em tempo real
- **Campanhas** — sincronizadas da API do Meta Ads com métricas atualizadas
- **Meta CAPI** — Conversions API disparada automaticamente por evento de lead (Lead, Contact, Purchase)
- **Clientes** — cadastro com configuração de Pixel, token CAPI e conta Meta Ads
- **Insights IA** — Claude analisa performance e gera recomendações estratégicas
- **Propostas** — gerador de propostas comerciais animadas com link público compartilhável
- **Relatórios** — relatórios semanais de performance com link público e contador de visualizações
- **Dashboard** — KPIs globais, gráfico semanal, alertas automáticos

---

## Stack

| Camada        | Tecnologia                          |
|---------------|-------------------------------------|
| Framework     | Next.js 14 App Router               |
| Linguagem     | TypeScript                          |
| Banco / Auth  | Supabase (Postgres + RLS + Realtime)|
| Estilo        | Tailwind CSS (tema dark customizado)|
| Animações     | Framer Motion                       |
| Gráficos      | Recharts                            |
| Ícones        | Lucide React                        |
| IA            | Anthropic Claude (claude-sonnet-4-6)|
| Datas         | date-fns (pt-BR)                    |
| Deploy        | Hostinger Node.js (standalone)      |

---

## Pré-requisitos

- Node.js **20.x** ou superior
- Conta [Supabase](https://supabase.com) (gratuita serve para dev)
- Chave de API [Anthropic](https://console.anthropic.com) (para Insights IA)
- App [Meta for Developers](https://developers.facebook.com) (para webhook e Meta Ads — opcional em dev)

---

## Setup local

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd crm2g
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local   # se existir o exemplo
# ou crie manualmente:
touch .env.local
```

Preencha com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-...

# Meta for Developers (opcional em dev)
META_APP_ID=1234567890
META_APP_SECRET=abc123...
META_WEBHOOK_VERIFY_TOKEN=qualquer-string-secreta

# URL pública da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Rodar as migrations do Supabase

No painel do Supabase → **SQL Editor**, execute os arquivos em ordem:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_complete_schema.sql
supabase/migrations/003_meta_sync.sql
supabase/migrations/004_leads_history.sql
supabase/migrations/005_capi_eventos.sql
supabase/migrations/006_insights_dados.sql
supabase/migrations/007_relatorios_status.sql
supabase/migrations/008_propostas.sql
```

> **Dica:** Copie o conteúdo de cada arquivo e execute no SQL Editor do Supabase Dashboard.

### 5. Criar bucket de storage (para logos de propostas)

No Supabase Dashboard → **Storage** → **New bucket**:
- Nome: `propostas-logos`
- Marcar como **Public**

### 6. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Como adicionar o primeiro usuário admin

O acesso ao painel requer autenticação Supabase. Para criar o primeiro admin:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard) do seu projeto
2. Vá em **Authentication** → **Users** → **Invite user**
3. Digite seu e-mail e clique em **Send invite**
4. Você receberá um e-mail — clique no link para definir sua senha
5. Faça login em `https://crm2g.com/login` (ou `localhost:3000/login`)

> Todos os usuários autenticados via Supabase Auth têm acesso admin ao painel. Para controle granular de permissões, use a tabela `perfis` e ajuste as RLS policies.

---

## Como configurar o webhook da Meta

O webhook recebe leads em tempo real do Facebook/Instagram Lead Ads.

### 1. Criar o App no Meta for Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App**
2. Tipo: **Business**
3. Adicione o produto **Webhooks**

### 2. Registrar o webhook

Em **Webhooks** → **Leads**:

| Campo          | Valor                                      |
|----------------|--------------------------------------------|
| Callback URL   | `https://crm2g.com/api/webhook/meta`       |
| Verify Token   | O valor de `META_WEBHOOK_VERIFY_TOKEN`     |

Clique em **Verify and Save**, depois subscribe no campo `leadgen`.

### 3. Testar

No Meta for Developers → **Webhooks** → **Test** → envie um lead de teste.
O lead deve aparecer em `/leads` do painel em segundos.

---

## Como conectar a conta Meta Ads de um cliente

1. No painel, acesse **Clientes** → selecione ou crie o cliente
2. Na aba **Configurações**, preencha:
   - **Meta Ad Account ID** — ex: `act_123456789` (encontre no Meta Ads Manager)
   - **Meta Pixel ID** — ex: `1234567890`
   - **Meta CAPI Token** — gere em Events Manager → Data Sources → seu Pixel → Settings → Conversions API
3. Salve e vá em **Campanhas** → clique em **Sincronizar Meta Ads**

A sincronização busca campanhas ativas da conta e atualiza métricas (gasto, leads, CTR, frequência, CPL).

---

## Estrutura do projeto

```
crm2g/
├── app/
│   ├── (admin)/            # Rotas protegidas do painel admin
│   │   ├── campanhas/      # Listagem e sincronização de campanhas
│   │   ├── clientes/       # CRUD de clientes + tabs (insights, CAPI)
│   │   ├── dashboard/      # KPIs globais + alertas + gráficos
│   │   ├── leads/          # Kanban de leads em tempo real
│   │   ├── propostas/      # Gestão de propostas comerciais
│   │   └── relatorios/     # Gestão de relatórios semanais
│   ├── (auth)/
│   │   └── login/          # Página de login (Supabase Auth)
│   ├── (cliente)/
│   │   └── painel/         # Painel do cliente (acesso restrito)
│   ├── api/
│   │   ├── capi/           # Endpoint interno para disparar CAPI events
│   │   ├── insights/       # Geração de insights via Claude
│   │   ├── leads/          # CRUD de leads + histórico de status
│   │   ├── meta/           # Proxy para Meta Graph API
│   │   ├── propostas/      # Geração de texto via Claude + interações públicas
│   │   └── webhook/meta/   # Recebe leads do Meta Lead Ads (HMAC-verified)
│   ├── proposta/[slug]/    # Página pública animada da proposta
│   └── relatorio/[slug]/   # Página pública animada do relatório
├── components/
│   ├── clientes/           # Tabs de cliente (InsightsDisplay, CAPITab, etc.)
│   ├── dashboard/          # DashboardKPIs, DashboardChart, DashboardAlerts
│   ├── propostas/          # NovaPropostaForm, PropostaPagina, PropostaAcoes
│   ├── relatorios/         # AnimatedCounter, FunnelChart, RelatorioPagina
│   └── ui/                 # Componentes base (Button, Badge, EmptyState, etc.)
├── lib/
│   ├── actions/            # Server actions (clientes, leads, propostas, etc.)
│   ├── capi/               # Conversions API helper (sendCAPIEvent)
│   ├── claude/             # Anthropic SDK wrapper + generateInsights
│   ├── meta/               # Meta Ads API client (campanhas sync)
│   └── supabase/           # Supabase clients (browser, server, middleware)
├── supabase/
│   └── migrations/         # SQL migrations (001 a 008)
├── next.config.mjs         # Configuração Next.js (standalone, headers, images)
├── tailwind.config.ts      # Tema dark customizado
├── middleware.ts            # Proteção de rotas via Supabase Auth
├── DEPLOY.md               # Guia de deploy na Hostinger
└── README.md               # Este arquivo
```

---

## Scripts disponíveis

```bash
npm run dev             # Servidor de desenvolvimento (localhost:3000)
npm run build           # Build de produção + copia assets para standalone
npm run start           # Inicia servidor Node.js de produção
npm run lint            # ESLint
npm run deploy:prepare  # Build + mensagem de instrução de upload
```

---

## Deploy

Veja o [DEPLOY.md](./DEPLOY.md) para o guia completo de deploy na Hostinger.

---

## Variáveis de ambiente — referência

| Variável                       | Obrigatório | Descrição                                    |
|--------------------------------|-------------|----------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`     | ✅          | URL do projeto Supabase                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| ✅          | Chave anon pública do Supabase               |
| `SUPABASE_SERVICE_ROLE_KEY`    | ✅          | Chave de service role (bypassa RLS)          |
| `ANTHROPIC_API_KEY`            | ✅          | Chave da API Anthropic para Claude           |
| `META_APP_ID`                  | ⚠️ produção | ID do App no Meta for Developers             |
| `META_APP_SECRET`              | ⚠️ produção | Secret do App (geração de access tokens)     |
| `META_WEBHOOK_VERIFY_TOKEN`    | ⚠️ produção | Token de verificação do webhook              |
| `NEXT_PUBLIC_APP_URL`          | ✅          | URL base da aplicação (sem barra final)      |

> `NEXT_PUBLIC_*` são embutidas em tempo de build. Mudanças exigem rebuild.

---

## Banco de dados — tabelas principais

| Tabela              | Descrição                                           |
|---------------------|-----------------------------------------------------|
| `clientes`          | Cadastro de clientes com credenciais Meta           |
| `leads`             | Leads recebidos via webhook e manuais               |
| `lead_status_history` | Histórico de mudanças de status dos leads         |
| `campanhas`         | Campanhas Meta Ads sincronizadas                    |
| `metricas_manuais`  | Métricas semanais inseridas manualmente             |
| `insights`          | Análises geradas pela IA (Claude)                   |
| `capi_eventos`      | Log de eventos enviados à Meta Conversions API      |
| `propostas`         | Propostas comerciais com dados estruturados         |
| `proposta_duvidas`  | Dúvidas enviadas pelos prospects via página pública |
| `relatorios`        | Relatórios semanais com snapshot de dados           |
| `perfis`            | Perfis de usuário vinculados ao Supabase Auth       |
