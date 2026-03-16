# Task CRUD Deploy

Aplicação de gerenciamento de tarefas com autenticação, dashboard, labels, subtarefas, comentários, compartilhamento e **2FA com QR Code (TOTP)** usando **React + Vite + TypeScript + Supabase**.

## Stack
- React 18
- Vite 5
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query
- Supabase Auth / Database / Edge Functions

## Principais ajustes aplicados
- sincronização da base para deploy local e cloud
- melhoria da documentação do projeto
- correção de `.gitignore` e criação de `.env.example`
- correção da ordem de `@import` no CSS
- reforço do fluxo de MFA
- inclusão e consolidação do fluxo de **QR Code para Authenticator App**
- proteção das rotas para exigir MFA quando configurado
- testes reais para a regra de MFA

## Fluxo de autenticação com QR Code
1. usuário faz login com email e senha
2. em **Perfil > Autenticação em 2 fatores** ativa o método **App Authenticator (TOTP)**
3. o sistema gera um **QR Code**
4. o usuário escaneia no Google Authenticator, Authy ou similar
5. informa o código de 6 dígitos
6. as rotas protegidas passam a exigir a segunda etapa quando necessário

## Variáveis de ambiente
Crie um arquivo `.env` com base em `.env.example`.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## Como rodar localmente
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Testes
```bash
npm run test
```

## Deploy
### Front-end
Pode publicar na **Vercel** apontando para este repositório GitHub.

Configurações importantes na Vercel:
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Backend / banco / autenticação
Este projeto depende do **Supabase** para:
- banco de dados
- autenticação
- MFA TOTP
- Edge Functions
- policies e migrations

## O que ainda precisa existir fora do GitHub e Vercel
Além de **GitHub + Vercel**, você ainda precisa de:
- **Supabase** → obrigatório

Para este escopo atual, **não falta outro serviço obrigatório**.

Você só precisaria adicionar serviços extras se quiser:
- envio profissional de emails transacionais → Resend / SendGrid
- monitoramento externo → Sentry, Logtail, Datadog etc.

## Estrutura principal
- `src/pages` → telas
- `src/components` → componentes reutilizáveis
- `src/contexts` → autenticação
- `src/lib` → regras auxiliares
- `supabase/migrations` → estrutura SQL
- `supabase/functions` → Edge Functions

## Publicação do Supabase
Antes do deploy final, aplique suas migrations e publique as Edge Functions no projeto Supabase.
