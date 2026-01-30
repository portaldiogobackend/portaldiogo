# Research & Technical Decisions: Landing Page

**Feature**: 001 - Landing Page Institucional  
**Created**: 2025-12-18

---

## R1: Escolha do Framework de UI (TailwindCSS)

**Opções**:

- CSS Modules
- Styled Components
- TailwindCSS

**Decisão**: **TailwindCSS**

- **Justificativa**: Alinha-se com a Article II da Constitution. Proporciona o menor bundle size final (purge de CSS não usado) e garante consistência visual rápida através de design tokens.
- **Impacto**: Alta performance (Lighthouse > 90) e facilidade de manutenção mobile-first.

---

## R2: Biblioteca de Carrossel (Swiper.js)

**Opções**:

- Implementação Nativa (CSS Scroll Snap)
- Swiper.js
- Embla Carousel

**Decisão**: **Swiper.js**

- **Justificativa**: A especificação exige autoplay de 5 segundos e navegação touch avançada. Swiper é a solução mais robusta e acessível (A11y) que cumpre esses requisitos sem "reinventar a roda".
- **Impacto**: Adiciona ~35kb ao bundle, mas economiza 4-6 horas de desenvolvimento de lógica de touch e autoplay.

---

## R3: Validação de Formulários (React Hook Form + Zod)

**Opções**:

- Estado Nativo (useState)
- Formik
- React Hook Form + Zod

**Decisão**: **React Hook Form + Zod**

- **Justificativa**: React Hook Form evita re-renders desnecessários (performance). Zod garante que os dados enviados ao Supabase estejam 100% corretos em tempo de execução e compilação.
- **Impacto**: Redução drástica de bugs de validação no frontend e backend.

---

## R4: Provedor de E-mail (Resend)

**Opções**:

- SendGrid
- Resend
- SMTP local

**Decisão**: **Resend**

- **Justificativa**: Melhor DX (Developer Experience) para Node.js/TypeScript. Permite criar templates de e-mail usando React (React Email), facilitando o envio do Ebook de forma profissional.
- **Impacto**: Configuração rápida e alta entregabilidade para os leads.
