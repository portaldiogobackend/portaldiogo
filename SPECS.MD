# Especificação Técnica do Projeto - Portal Diogo

## 1. Visão Geral
O **Portal Diogo** é uma plataforma educacional híbrida que serve tanto como uma landing page institucional para captação de novos alunos quanto como um portal de ensino (LMS - Learning Management System) para gestão de conteúdo, dúvidas e alunos do Professor Diogo Spera.

O projeto visa apresentar a metodologia de ensino, provas sociais e planos de aula, além de oferecer uma área logada segura para interação entre professor e alunos.

## 2. Stack Tecnológica

### Frontend
- **Framework Principal:** [React 19](https://react.dev/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Roteamento:** [React Router DOM v7](https://reactrouter.com/)

### Estilização e UI
- **CSS Framework:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Animações:** [Framer Motion](https://www.framer.com/motion/)
- **Componentes UI:** Componentes customizados baseados em Radix UI (via `@radix-ui/react-slot`) e Sonner (Toasts).

### Gerenciamento de Estado e Dados
- **Data Fetching/Caching:** [TanStack Query (React Query) v5](https://tanstack.com/query/latest)
- **Global State:** [Zustand](https://github.com/pmndrs/zustand)
- **Validação de Schemas:** [Zod](https://zod.dev/)
- **Formulários:** [React Hook Form](https://react-hook-form.com/)

### Backend e Infraestrutura (BaaS)
- **Plataforma:** [Supabase](https://supabase.com/)
- **Banco de Dados:** PostgreSQL
- **Autenticação:** Supabase Auth
- **Segurança:** Row Level Security (RLS)

### Outras Bibliotecas Notáveis
- **Segurança (Captcha):** Altcha
- **Manipulação de Datas:** date-fns
- **Input Mask:** react-international-phone
- **Carrossel:** Swiper

## 3. Estrutura do Projeto

A estrutura de diretórios segue o padrão moderno de aplicações React com Vite:

```
/
├── public/              # Assets estáticos (imagens, ícones)
├── specs/               # Documentação existente (features, data model)
├── src/
│   ├── assets/          # Assets importados via código
│   ├── components/      # Componentes React
│   │   ├── features/    # Componentes específicos de funcionalidades (Hero, Blog, etc.)
│   │   ├── layout/      # Componentes estruturais (Header, Footer, Sidebar)
│   │   └── ui/          # Componentes de UI reutilizáveis (Button, Card, Modal)
│   ├── lib/             # Configurações e utilitários (Supabase client, Utils)
│   ├── pages/           # Componentes de Página (rotas)
│   ├── schemas/         # Definições de validação Zod
│   ├── styles/          # CSS global
│   ├── types/           # Definições de tipos TypeScript globais
│   ├── App.tsx          # Componente raiz com definição de rotas
│   └── main.tsx         # Ponto de entrada da aplicação
├── index.html           # HTML principal
├── package.json         # Dependências e scripts
└── vite.config.ts       # Configuração do Vite
```

## 4. Funcionalidades e Rotas

### Área Pública (Landing Page)
Focada em conversão e apresentação institucional.
- **Home (`/`)**: Apresenta metodologia, depoimentos, planos e captura de leads.
- **Login (`/login`)**: Acesso à área restrita.
- **Cadastro (`/cadastro`)**: Registro de novos alunos.
- **Contato (`/contato`)**: Formulário de contato direto.
- **Redefinir Senha (`/redefinir-senha`)**: Fluxo de recuperação de conta.

### Área Logada (Portal)
Dividida entre funcionalidades de Administrador e Aluno.

#### Administrador
- **Dashboard/Usuários (`/usuarios`)**: Gestão de alunos e permissões.
- **Matérias (`/materias`)**: Gerenciamento de disciplinas oferecidas.
- **Temas (`/temas`)**: Organização de conteúdo por temas.
- **Mensagens (`/mensagens`)**: Comunicação interna.
- **Central de Dúvidas (`/central-duvidas-admin`)**: Resposta às dúvidas dos alunos.

#### Aluno
- **Dashboard (`/aluno/dashboard`)**: Visão geral do progresso.
- **Matérias (`/aluno/materias`)**: Acesso ao conteúdo das aulas.
- **Central de Dúvidas (`/aluno/central-duvidas`)**: Espaço para enviar perguntas.
- **Aguardando Aprovação (`/aguardando-aprovacao`)**: Tela de espera após cadastro.

## 5. Modelo de Dados (Detalhado)

O banco de dados PostgreSQL no Supabase é composto pelas seguintes tabelas principais:

### 5.1 Tabelas de Gestão e Conteúdo

- **tbf_controle_user**: Armazena os perfis detalhados dos usuários (alunos e administradores), complementando o Supabase Auth.
  - Campos: `id` (UUID), `nome`, `sobrenome`, `email` (único), `role` (papel), `signature` (assinatura), `emailpai`, `emailaluno`, `materias` (array de textos), `serie` (FK para tbf_serie).
- **tbf_materias**: Cadastro das disciplinas/matérias disponíveis no portal.
  - Campos: `id` (UUID), `materia` (nome da disciplina), `created_at`.
- **tbf_serie**: Define as séries ou níveis escolares atendidos.
  - Campos: `id` (UUID), `serie` (nome da série, único), `created_at`.
- **tbf_temas**: Organiza o conteúdo em temas específicos, associando-os a matérias e séries.
  - Campos: `id` (UUID), `nometema`, `idmat` (array de UUIDs), `idseries` (array de UUIDs), `created_at`.

### 5.2 Interação e Suporte

- **tbf_duvidas**: Sistema de tickets para perguntas e respostas entre alunos e professores.
  - Campos: `id` (UUID), `idaluno` (FK), `idmateria` (FK), `pergunta`, `resposta`, `created_at`.
- **tbf_mensagens**: Armazena contatos enviados via formulário do site.
  - Campos: `id` (UUID), `nome`, `email`, `celular`, `mensagem`, `respondido` (N/S), `created_at`.

### 5.3 Marketing e Auditoria

- **tbf_rss**: Lista de inscritos para newsletter/RSS.
  - Campos: `id` (UUID), `email` (único), `habilitado` (boolean), `created_at`.
- **audit_logs**: Registro de ações administrativas para segurança e rastreabilidade.
  - Campos: `id` (UUID), `admin_id` (FK para auth.users), `action` (ação executada), `target_id` (ID do alvo), `details` (JSONB com detalhes extras), `created_at`.

### 5.4 Outras Entidades (Resumo)
- **testimonials**: Depoimentos com fotos e notas.
- **pricing_gate_leads**: Leads capturados no interesse por preços.
- **ebook_leads**: Leads de download de materiais.

## 6. Como Executar

### Pré-requisitos
- Node.js (versão LTS recomendada)
- NPM ou Yarn

### Scripts Disponíveis
- `npm run dev`: Inicia o servidor de desenvolvimento (Vite).
- `npm run build`: Compila o projeto para produção (TypeScript + Vite).
- `npm run preview`: Visualiza o build de produção localmente.
- `npm run lint`: Executa a verificação de código com ESLint.

## 7. Convenções e Padrões
- **Commits**: Não especificado, mas recomenda-se Conventional Commits.
- **Estilo de Código**: ESLint configurado com regras para React e TypeScript.
- **Design System**: Utilização de classes utilitárias do Tailwind para manter consistência visual.
