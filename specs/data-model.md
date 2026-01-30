# Data Model: Landing Page Database Schema

**Feature**: 001 - Landing Page Institucional  
**Database**: Supabase (PostgreSQL)  
**Created**: 2025-12-18

---

## Overview

Este documento define o esquema do banco de dados para a landing page, incluindo tabelas para captura de leads, depoimentos e métricas de prova social. Todas as tabelas utilizam Row Level Security (RLS) para proteção dos dados.

---

## Tabelas e Estruturas

### 1. `testimonials` (Depoimentos)

Armazena depoimentos reais com fotos e evolução de notas.

**SQL Schema:**

```sql
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name VARCHAR(100) NOT NULL,
  photo_url TEXT NOT NULL,
  grade_before DECIMAL(3,1) NOT NULL,
  grade_after DECIMAL(3,1) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  quote TEXT NOT NULL CHECK (length(quote) <= 150),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**TypeScript Interface:**

```typescript
export interface Testimonial {
  id: string;
  student_name: string;
  photo_url: string;
  grade_before: number;
  grade_after: number;
  subject: string;
  quote: string;
  display_order: number;
}
```

### 2. `pricing_gate_leads` (Leads de Preço)

Captura dados de usuários que desbloqueiam a tabela de preços.

**SQL Schema:**

```sql
CREATE TABLE pricing_gate_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  source VARCHAR(50) DEFAULT 'pricing_gate',
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

### 3. `ebook_leads` (Leads do Ebook)

Captura dados de usuários que baixam o ebook gratuito.

**SQL Schema:**

```sql
CREATE TABLE ebook_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  consented_privacy BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

---

## Segurança (RLS)

As políticas garantem que o público possa inserir leads, mas apenas usuários autorizados possam ler dados sensíveis.

```sql
-- Habilitar RLS
ALTER TABLE pricing_gate_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebook_leads ENABLE ROW LEVEL SECURITY;

-- Permitir inserção pública (Formulários)
CREATE POLICY "Allow public insert" ON pricing_gate_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON ebook_leads FOR INSERT WITH CHECK (consented_privacy = true);

-- Bloquear leitura pública
CREATE POLICY "Restrict read to admin" ON pricing_gate_leads FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

---

## Script de Inicialização Completo

Execute este script no Editor SQL do Supabase para preparar o ambiente:

```sql
-- Criação das Tabelas
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name VARCHAR(100) NOT NULL,
  photo_url TEXT NOT NULL,
  grade_before DECIMAL(3,1) NOT NULL,
  grade_after DECIMAL(3,1) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  quote TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pricing_gate_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  source VARCHAR(50) DEFAULT 'pricing_gate',
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ebook_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  consented_privacy BOOLEAN NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE social_proof_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(50) UNIQUE NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL
);

-- Dados Iniciais
INSERT INTO social_proof_metrics (metric_name, metric_value) VALUES
  ('total_students', 127),
  ('average_improvement', 2.5);

-- Habilitar RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_gate_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebook_leads ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Public read active testimonials" ON testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Public insert leads" ON pricing_gate_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert ebook leads" ON ebook_leads FOR INSERT WITH CHECK (consented_privacy = true);
```
