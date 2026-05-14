# Deploy — CRM 2G CRM na Hostinger (Node.js)

Domínio: **crm2g.com** | Hospedagem: Hostinger Node.js Hosting

---

## Pré-requisitos

- Node.js **20.x** instalado localmente
- Conta Hostinger com plano que suporte **Node.js** (Business ou superior)
- Acesso ao **hPanel** da Hostinger
- Projeto Supabase configurado (URL + chaves)
- Chave da API Anthropic (Claude)
- App Meta configurado (opcional, para webhooks)

---

## 1. Build local

```bash
# Na pasta do projeto
npm install
npm run build
```

O comando `npm run build` executa automaticamente o `postbuild`, que copia os assets estáticos para dentro da pasta standalone:

```
.next/standalone/          ← pasta completa para deploy
  ├── server.js            ← ponto de entrada Node.js
  ├── node_modules/        ← dependências de produção
  ├── public/              ← copiado pelo postbuild
  └── .next/
      └── static/          ← copiado pelo postbuild
```

---

## 2. Configurar Node.js App na Hostinger

1. Acesse o **hPanel** → **Node.js**
2. Clique em **Create Application**
3. Configure:
   - **Node.js version:** `20.x` (ou 18.x)
   - **Application root:** `domains/crm2g.com/public_nodejs` (ou o caminho exibido)
   - **Application URL:** `crm2g.com`
   - **Application startup file:** `server.js`
4. Clique em **Create**

---

## 3. Upload dos arquivos

### Opção A — FTP (recomendado para primeiro deploy)

1. Conecte via FTP (use Filezilla ou o gerenciador da Hostinger):
   - Host: `ftp.crm2g.com`
   - Usuário e senha: credenciais FTP do hPanel
2. Navegue até o diretório da aplicação: `domains/crm2g.com/public_nodejs/`
3. **Delete** qualquer conteúdo existente
4. Faça upload de **todo o conteúdo** da pasta `.next/standalone/`:
   ```
   .next/standalone/server.js          → public_nodejs/server.js
   .next/standalone/node_modules/      → public_nodejs/node_modules/
   .next/standalone/public/            → public_nodejs/public/
   .next/standalone/.next/             → public_nodejs/.next/
   ```

> **Atenção:** Faça upload do *conteúdo* de `.next/standalone/`, não da pasta em si.

### Opção B — Git (recomendado para deploys contínuos)

1. Faça push do projeto para um repositório Git (GitHub/GitLab)
2. No hPanel → **Git** → conecte o repositório
3. Configure o branch (`main`)
4. No painel Git, adicione o comando de build:
   ```bash
   npm install && npm run build
   ```
5. Clique em **Deploy**

> Com Git, a Hostinger executa o build remotamente. Certifique-se de que o servidor tem memória suficiente.

---

## 4. Configurar variáveis de ambiente

No **hPanel** → **Node.js** → sua aplicação → **Environment Variables**, adicione:

```
NEXT_PUBLIC_SUPABASE_URL        = https://XXXXXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY       = eyJhbGci...
ANTHROPIC_API_KEY               = sk-ant-...
META_APP_ID                     = 1234567890
META_APP_SECRET                 = abc123...
META_WEBHOOK_VERIFY_TOKEN       = seu-token-secreto-aqui
NEXT_PUBLIC_APP_URL             = https://crm2g.com
NODE_ENV                        = production
PORT                            = (deixe vazio — Hostinger define automaticamente)
```

> **Nunca** commite o arquivo `.env.local` no Git.

---

## 5. Iniciar a aplicação

1. No hPanel → **Node.js** → sua aplicação
2. Verifique que o **startup file** está como `server.js`
3. Clique em **Restart** (ou **Start** se for a primeira vez)
4. Aguarde o status mudar para **Running**

Para verificar os logs em caso de erro:
- hPanel → **Node.js** → **Logs**

---

## 6. Apontar domínio

Se o domínio **crm2g.com** ainda não está apontando para a Hostinger:

1. No painel DNS do seu registrador de domínio, configure:
   ```
   Tipo: A
   Nome: @
   Valor: [IP da sua hospedagem Hostinger]
   TTL: 3600

   Tipo: A
   Nome: www
   Valor: [IP da sua hospedagem Hostinger]
   TTL: 3600
   ```
2. Se o domínio já está na Hostinger, vá em **hPanel** → **Domains** → verifique que `crm2g.com` aponta para a aplicação Node.js

### SSL/HTTPS

1. hPanel → **SSL** → **Let's Encrypt**
2. Emita o certificado para `crm2g.com` e `www.crm2g.com`
3. Ative **Force HTTPS**

---

## 7. Configurar webhook da Meta

O webhook recebe leads em tempo real do Facebook/Instagram Lead Ads.

### No painel do Meta for Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com) → seu App
2. Vá em **Webhooks** → **Leads**
3. Configure:
   - **Callback URL:** `https://crm2g.com/api/webhook/meta`
   - **Verify Token:** o mesmo valor que você colocou em `META_WEBHOOK_VERIFY_TOKEN`
4. Clique em **Verify and Save**
5. Subscribe nos eventos: `leadgen`

### Verificar que está funcionando

```bash
# Teste o endpoint de verificação
curl "https://crm2g.com/api/webhook/meta?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=teste123"
# Deve retornar: teste123
```

---

## 8. Testar fluxo completo

Após o deploy, teste nesta ordem:

### ✅ Checklist de verificação

- [ ] `https://crm2g.com` abre o painel de login
- [ ] Login com usuário admin funciona
- [ ] Dashboard carrega sem erros
- [ ] `/dashboard` exibe KPIs (podem estar zerados inicialmente)
- [ ] `/clientes/novo` permite criar um cliente
- [ ] `/propostas/nova` gera uma proposta e o link público funciona
- [ ] `/proposta/[slug]` abre a página animada da proposta
- [ ] Botões "Aceitar / Dúvida / Recusar" funcionam na proposta
- [ ] `/leads` exibe os leads (inicialmente vazio)
- [ ] Webhook da Meta responde com 200 ao receber um lead de teste
- [ ] `/relatorios/novo` gera relatório e o link público funciona

### Testar webhook com lead simulado

No Meta for Developers → **Webhooks** → clique em **Test** para enviar um lead de teste. O lead deve aparecer em `/leads` em alguns segundos.

---

## 9. Deploys subsequentes

Para atualizar a aplicação após mudanças:

```bash
# Local
npm run build

# Via FTP: faça upload novamente de .next/standalone/
# Via Git: git push → hPanel → Node.js → Restart
```

> Sempre reinicie a aplicação no hPanel após um novo deploy.

---

## Troubleshooting

### Aplicação não inicia
- Verifique os logs em hPanel → Node.js → Logs
- Confirme que todas as variáveis de ambiente estão configuradas
- Verifique que o `startup file` é `server.js`

### Erro 502 Bad Gateway
- A aplicação não está rodando. Verifique os logs e reinicie.

### Variáveis de ambiente não carregam
- No Next.js standalone, as variáveis de ambiente devem estar configuradas no hPanel, não em `.env` local.
- Variáveis `NEXT_PUBLIC_*` são embutidas em tempo de build — se mudar, precisa rebuildar.

### Imagens não carregam
- Verifique que o domínio está em `next.config.mjs` em `images.remotePatterns`
- Verifique que o bucket do Supabase Storage é público

### Webhook não valida
- Confirme que `META_WEBHOOK_VERIFY_TOKEN` no hPanel é idêntico ao que foi registrado no Meta for Developers
- Confirme que a URL é `https://crm2g.com/api/webhook/meta` (com HTTPS)
