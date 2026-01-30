# Diogo Spera - Portal de Reforço Escolar

## Constitution v1.0

Data: 18/12/2025

---

## ARTICLE I: CONTEXTO DO PROJETO

### Section 1.1: Visão Geral

Este projeto implementa um ecossistema híbrido de reforço escolar que une:

- **Professor Presencial/Remoto**: Aulas particulares humanizadas
- **Portal Digital**: Gestão de exercícios, diagnóstico e acompanhamento
- **CRM Educacional**: Controle de evolução do aluno

### Section 1.2: Público-Alvo

- **Primário**: Pais de alunos do Ensino Fundamental e Médio
- **Secundário**: Alunos buscando performance escolar

### Section 1.3: Diferenciais (USP)

"A Mentoria Híbrida de Resultados: A atenção individual de um professor particular potencializada pela organização de um portal digital de exercícios e acompanhamento."

---

## ARTICLE II: STACK TECNOLÓGICA OBRIGATÓRIA

### Section 2.1: Backend (Node.js)

**Runtime**: Node.js 20+ (LTS)

- Framework: Express.js ou Fastify
- Linguagem: TypeScript (strict mode)
- Validação: Zod
- Type Safety: 100% tipado

**Dependências Permitidas**:

- `express` ou `fastify` (framework)
- `@supabase/supabase-js` (client oficial)
- `zod` (validação de dados)
- `mercadopago` (SDK oficial)
- `dotenv` (variáveis de ambiente)
- `cors` (CORS middleware)

**Proibido**:

- JavaScript puro (sem TypeScript)
- ORMs pesados (Prisma, TypeORM) - usar Supabase diretamente
- Bibliotecas abandonadas (sem commits em 6 meses)

**Estrutura de Pastas Backend**:

server/
├── src/
│ ├── routes/ (endpoints REST)
│ ├── controllers/ (lógica de negócio)
│ ├── services/ (comunicação com Supabase, Mercado Pago)
│ ├── middleware/ (auth, validation, error handling)
│ ├── types/ (tipos TypeScript compartilhados)
│ └── utils/ (helpers puros)
├── tests/ (Jest)
└── tsconfig.json

### Section 2.2: Frontend (React + Vite)

**Build Tool**: Vite 5+
**Framework**: React 18+
**Linguagem**: TypeScript (strict mode)

**Dependências Core**:

- `react`, `react-dom`
- `react-router-dom` v6 (roteamento)
- `@tanstack/react-query` (server state)
- `zustand` (client state - se necessário)
- `react-hook-form` + `zod` (forms)
- `@supabase/supabase-js` (auth + realtime)

**UI & Estilo**:

- `tailwindcss` 3+ (estilo)
- `lucide-react` (ícones)
- `clsx` + `tailwind-merge` (class management)
- `sonner` (toasts/notificações)

**Proibido**:

- Redux (complexidade desnecessária)
- CSS-in-JS (Styled Components, Emotion)
- jQuery ou bibliotecas legadas
- Bootstrap ou Material-UI (usar TailwindCSS)

**Estrutura de Pastas Frontend**:

src/
├── components/
│ ├── ui/ (componentes base reutilizáveis)
│ └── features/ (componentes de negócio)
├── pages/ (rotas principais)
├── hooks/ (custom hooks)
├── lib/ (config Supabase, React Query, utils)
├── types/ (tipos compartilhados)
├── styles/ (global CSS, TailwindCSS config)
└── App.tsx

### Section 2.3: Database & Auth

**Database**: Supabase (PostgreSQL)

- Row Level Security (RLS) obrigatório
- Triggers para auditoria
- Políticas de acesso granulares

**Auth**: Supabase Auth

- Email + Senha (padrão)
- MFA obrigatório para admin
- JWT com refresh token

**Naming Convention (Banco)**:

- Tabelas: `snake_case` (ex: `user_profiles`, `quiz_attempts`)
- Colunas: `snake_case` (ex: `created_at`, `student_id`)

### Section 2.4: Pagamentos

**Provedor**: Mercado Pago

- SDK oficial JavaScript
- API v2 (PIX + Cartão)
- Webhooks para confirmação automática
- Sandbox obrigatório em desenvolvimento

### Section 2.5: Deploy

**Frontend**: Vercel

- Preview automático por PR
- Variáveis de ambiente por branch
- Edge Functions se necessário

**Backend**: Railway ou Render

- Auto-deploy via Git
- Health checks configurados
- Logs estruturados

---

## ARTICLE III: PRINCÍPIOS DE DESENVOLVIMENTO

### Section 3.1: Test-Driven Development (TDD)

**Regra de Ouro**: Nenhum código de produção sem teste.

**Backend** (Jest + Supertest):

// Ordem obrigatória:

1. Escrever teste (RED)
2. Implementar código mínimo (GREEN)
3. Refatorar (REFACTOR)

// Estrutura de teste
describe('POST /api/v1/students', () => {
it('should create student with valid data', async () => {
// Arrange, Act, Assert
});
});

**Frontend** (Vitest + Testing Library):

// Testar comportamento, não implementação
// Focar em user interactions
import { render, screen, userEvent } from '@testing-library/react';

test('should submit form when all fields are valid', async () => {
// ...
});

**Coverage Mínimo**: 80% (medido por jest --coverage e vitest)

### Section 3.2: Mobile First (MANDATÓRIO)

**Justificativa**: 70% do tráfego será mobile (pais e alunos).

**Breakpoints TailwindCSS**:
sm: 640px (mobile landscape)
md: 768px (tablet)
lg: 1024px (desktop)
xl: 1280px (wide desktop)

**Regra**: Desenvolver sempre no `sm` primeiro, depois escalar.

**Teste Obrigatório**: Chrome DevTools mobile emulator (iPhone 12/13).

### Section 3.3: API Design (RESTful + JSON)

**Padrão Obrigatório**:

- Versionamento na URL: `/api/v1/`
- Respostas padronizadas:

// Sucesso
{
"success": true,
"data": {...},
"message": "Operação realizada"
}

// Erro
{
"success": false,
"error": {
"code": "VALIDATION_ERROR",
"message": "Email inválido",
"details": [...]
}
}

**Status HTTP Corretos**:

- 200: Sucesso (GET, PUT, PATCH)
- 201: Criado (POST)
- 204: Sem conteúdo (DELETE)
- 400: Erro de validação
- 401: Não autenticado
- 403: Não autorizado
- 404: Não encontrado
- 500: Erro interno

---

## ARTICLE IV: FILOSOFIA LEAN (TPS APLICADO)

### Section 4.1: Kaizen (Melhoria Contínua)

- Deploy frequente (no mínimo semanal)
- Pequenas melhorias > Grandes refatorações
- Feedback de usuários reais incorporado em 48h

### Section 4.2: Muda (Eliminação de Desperdícios)

**Desperdícios Proibidos**:

- Features não solicitadas
- Over-engineering
- Abstrações prematuras
- Dependências desnecessárias

**Regra dos 3 Usos**: Só criar abstração/componente reutilizável após 3 repetições do código.

### Section 4.3: MVP Funcional Sempre

Toda feature deve ser:

- **Testável**: Rodar em produção sem quebrar
- **Entregável**: Gerar valor imediato
- **Descartável**: Poder ser removida sem dependências

---

## ARTICLE V: LIMITES DE COMPLEXIDADE

### Section 5.1: Tamanho de Código

**Backend (TypeScript/Node)**:

- Função: máximo 50 linhas
- Controller: máximo 150 linhas
- Service: máximo 200 linhas
- Arquivo: máximo 300 linhas

**Frontend (React/TypeScript)**:

- Componente React: máximo 200 linhas
- Hook customizado: máximo 100 linhas
- Página: máximo 300 linhas (quebrar em componentes)
- Arquivo de serviço: máximo 200 linhas

**Exceção**: Testes podem ultrapassar (mas devem ser organizados).

### Section 5.2: Dependências

**Máximo 3 novas dependências por feature**.

**Checklist antes de adicionar dependência**:

- [ ] Funcionalidade nativa do JavaScript/Node não resolve?
- [ ] Bundle size aceitável (< 50KB gzipped)?
- [ ] Tem TypeScript types nativos ou `@types/*`?
- [ ] Commit ativo nos últimos 3 meses?
- [ ] Mais de 100k downloads/semana no npm?

### Section 5.3: Props Drilling

**Máximo 2 níveis de props drilling**.

Se passar de 2 níveis:

- Usar Context API (para features isoladas)
- Usar Zustand (para estado global)
- Reavaliar estrutura de componentes

---

## ARTICLE VI: SEGURANÇA & COMPLIANCE

### Section 6.1: Dados de Alunos (LGPD)

- Criptografia em repouso (AES-256 via Supabase)
- Criptografia em trânsito (TLS 1.3)
- Dados sensíveis NUNCA em logs
- Backup diário automático (Supabase)

### Section 6.2: Variáveis de Ambiente

**Nunca commitar**:

- API keys
- Senhas de banco
- Secrets do Mercado Pago
- JWT secrets

**Estrutura**:

# Backend (.env)

SUPABASE_URL=
SUPABASE_SERVICE_KEY=
MERCADOPAGO_ACCESS_TOKEN=
JWT_SECRET=

# Frontend (.env)

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

**Prefixo obrigatório para Vite**: `VITE_*` (variáveis públicas).

### Section 6.3: Autenticação

- Senha com mínimo 8 caracteres
- MFA obrigatório para admin (Supabase MFA)
- Session timeout: 7 dias (aluno), 1 dia (admin)
- Rate limiting: 5 tentativas de login por minuto

### Section 6.4: Auditoria

**Log obrigatório de**:

- Login/Logout
- Alteração de dados de aluno
- Transações financeiras (Mercado Pago)
- Acesso a informações sensíveis

**Formato**: JSON estruturado com timestamp UTC.

**Ferramenta**: `pino` (Node.js) ou `console.log` estruturado.

---

## ARTICLE VII: WORKFLOW GIT

### Section 7.1: Branches

main (produção - protegida)
develop (staging - integração)
feature/xxx (desenvolvimento de feature)
hotfix/xxx (correção urgente)

### Section 7.2: Commits Semânticos

feat: Nova funcionalidade
fix: Correção de bug
docs: Documentação
test: Testes
refactor: Refatoração sem mudança de comportamento
style: Formatação (prettier, linting)
chore: Manutenção (deps, config)

**Exemplo**:

git commit -m "feat: adiciona quiz de diagnóstico com timer"
git commit -m "fix: corrige validação de email no formulário"

### Section 7.3: Pull Requests

**Obrigatório antes de merge**:

- [ ] Todos os testes passando (npm test)
- [ ] Build de produção funcionando (npm run build)
- [ ] Coverage não diminuiu
- [ ] Código revisado por pelo menos 1 pessoa
- [ ] Spec/Plan atualizado se necessário

---

## ARTICLE VIII: DEFINIÇÕES DE PRONTO (DoD)

Uma feature só está PRONTA quando:

1. [ ] Spec completa e revisada
2. [ ] Plan detalhado com tasks
3. [ ] Testes escritos E passando (backend + frontend)
4. [ ] Código implementado seguindo constitution
5. [ ] TypeScript sem erros (`tsc --noEmit`)
6. [ ] ESLint sem warnings
7. [ ] Deploy em staging realizado
8. [ ] Testado manualmente por não-desenvolvedor
9. [ ] Lighthouse score > 90 (se for página frontend)
10. [ ] Aprovado pelo Diogo (Product Owner)

---

## ARTICLE IX: MÉTRICAS & MONITORAMENTO

### Section 9.1: Performance

**Frontend** (Lighthouse - Chrome DevTools):

- Performance: mínimo 90
- Accessibility: mínimo 95
- Best Practices: mínimo 90
- SEO: mínimo 95

**Backend**:

- Response time: p95 < 200ms
- Uptime: > 99.5%
- Memory usage: < 512MB (Railway/Render free tier)

### Section 9.2: Negócio (KPIs)

- Taxa de conversão (visita → contato): > 3%
- Taxa de ativação (cadastro → quiz completo): > 60%
- Retenção mensal: > 80%

---

## ARTICLE X: FERRAMENTAS DE DESENVOLVIMENTO

### Section 10.1: Obrigatórias

- **VS Code** (editor recomendado)
  - Extension: ESLint
  - Extension: Prettier
  - Extension: Tailwind CSS IntelliSense
  - Extension: Error Lens
- **Node.js 20+** (runtime)
- **pnpm** ou **npm** (gerenciador de pacotes)
- **Git** (controle de versão)

### Section 10.2: Formatação Automática

**Prettier** (configuração obrigatória):

{
"semi": true,
"singleQuote": true,
"tabWidth": 2,
"trailingComma": "es5"
}

**ESLint** (rules obrigatórias):

- `@typescript-eslint/no-explicit-any`: error
- `no-console`: warn (exceto em logs estruturados)
- `react-hooks/exhaustive-deps`: warn

---

## AMENDMENT LOG

### v1.0 - 18/12/2025

- Constitution inicial do projeto Diogo Spera
- Stack: React + Node.js + Vite + TypeScript
- Baseada em GitHub Spec-Kit template
- Adaptada para contexto educacional brasileiro

---
