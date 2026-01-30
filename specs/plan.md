# Implementation Plan: Landing Page Institucional

**Feature ID**: 001  
**Created**: 2025-12-18  
**Status**: Planning Complete  
**Estimated Effort**: 5-7 days (1 developer)

---

## Executive Summary

This implementation plan details the technical approach for building the institutional landing page for Diogo Spera. The page will serve as the primary conversion tool, capturing leads through pricing gate and ebook download, while showcasing the hybrid teaching methodology through testimonials and social proof.

**Key Objectives:**

- High conversion rate (>15% to WhatsApp contact)
- Lighthouse score >90 on all metrics
- Mobile-first responsive design
- LGPD-compliant lead capture
- Fast load times (<3s on 3G)

---

## Technology Stack

### Frontend Core

- **Framework**: React 18.2+ with TypeScript 5.3+
- **Build Tool**: Vite 5.0+ (faster than CRA, better DX)
- **Styling**: TailwindCSS 3.4+ with custom design tokens
- **Routing**: React Router v6 (future-ready for multi-page)

### Forms & Validation

- **Forms**: React Hook Form 7.49+ (performant, minimal re-renders)
- **Validation**: Zod 3.22+ (type-safe schema validation)
- **Phone Input**: react-international-phone (Brazilian format support)

### UI Components & Animation

- **Carousel**: Swiper.js 11.0+ (touch-optimized, accessible)
- **Animation**: Framer Motion 11.0+ (smooth, performant animations)
- **Icons**: Lucide React 0.300+ (lightweight, tree-shakeable)
- **Toasts**: Sonner 1.3+ (elegant notifications)

### State & Data Fetching

- **Server State**: @tanstack/react-query 5.17+ (caching, optimistic updates)
- **Client State**: Zustand 4.4+ (only if needed for complex UI state)

### Backend & Database

- **BaaS**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Storage**: Supabase Storage (testimonial photos)
- **Email**: Resend API (ebook delivery, transactional emails)

### Analytics & Monitoring

- **Analytics**: Google Analytics 4 (via react-ga4)
- **Error Tracking**: Sentry (production errors)
- **Performance**: Vercel Analytics (Core Web Vitals)

### Deployment & DevOps

- **Hosting**: Vercel (Edge Network, auto-preview)
- **CI/CD**: Vercel Git integration (auto-deploy on push)
- **Environment**: .env.local (development), Vercel Env Vars (production)

---

## Architecture Overview

### Component Hierarchy

```
App (Router Provider)
└── LandingPage
    ├── Header
    │   ├── BrandLogo (DS icon + "Diogo Spera" text)
    │   ├── NavLinks (Metodologia, Depoimentos, Planos, E-book)
    │   └── WhatsAppCTA (compact variant)
    ├── HeroSection
    │   ├── Tagline
    │   ├── ValueProposition
    │   └── PrimaryCTA (WhatsApp)
    ├── MethodologySection
    │   └── PillarCard (x4)
    ├── TestimonialsSection
    │   ├── SocialProofMetrics
    │   └── TestimonialsCarousel
    │       └── TestimonialCard (x3+)
    ├── PricingSection
    │   ├── PricingGate (locked state)
    │   └── PricingTable (unlocked state)
    ├── EbookSection
    │   └── EbookForm
    └── Footer
        ├── SocialLinks
        └── WhatsAppCTA
```

### Data Flow

```
User Interaction
        ↓
React Component (UI)
        ↓
React Hook Form (validation)
        ↓
Zod Schema (type-safe validation)
        ↓
React Query Mutation (async submit)
        ↓
Supabase Client (API call)
        ↓
PostgreSQL Database (persist data)
        ↓
Email Service (Resend) → User receives ebook
        ↓
UI Update (success toast, reveal pricing)
```

### Folder Structure

portaldiogo/
├── .env.local # Local environment variables
├── .env.example # Template for environment setup
├── .gitignore
├── package.json
├── tsconfig.json # Composite root config
├── tsconfig.app.json # App-specific TS config
├── tsconfig.node.json # Vite config TS config
├── vite.config.ts # Vite config (using Rolldown-vite)
├── tailwind.config.js # Custom design tokens
├── postcss.config.js
├── index.html
├── vercel.json # Vercel deployment config
│
├── public/
│ ├── ebook.pdf # Free ebook file
│ ├── logo.svg # Brand logo
│ └── og-image.png # Open Graph image (1200x630)
│
├── src/
│ ├── main.tsx # App entry point
│ ├── App.tsx # Root component with providers
│ ├── vite-env.d.ts # Vite types
│ │
│ ├── components/
│ │ ├── ui/ # Reusable base components (Shadcn-like)
│ │ │ ├── Button.tsx
│ │ │ ├── Input.tsx
│ │ │ ├── Card.tsx
│ │ │ ├── Modal.tsx
│ │ │ └── Spinner.tsx
│ │ │
│ │ └── features/ # Business logic components
│ │ ├── Header.tsx
│ │ ├── HeroSection.tsx
│ │ ├── MethodologySection.tsx
│ │ ├── PillarCard.tsx
│ │ ├── TestimonialsSection.tsx
│ │ ├── TestimonialsCarousel.tsx
│ │ ├── TestimonialCard.tsx
│ │ ├── SocialProofMetrics.tsx
│ │ ├── PricingSection.tsx
│ │ ├── PricingGate.tsx
│ │ ├── PricingTable.tsx
│ │ ├── EbookSection.tsx
│ │ ├── EbookForm.tsx
│ │ ├── Footer.tsx
│ │ └── WhatsAppButton.tsx
│ │
│ ├── pages/
│ │ └── LandingPage.tsx # Main landing page composition
│ │
│ ├── hooks/
│ │ ├── usePricingGate.ts # Pricing unlock logic + mutation
│ │ ├── useEbookDownload.ts # Ebook form submission + mutation
│ │ ├── useTestimonials.ts # Fetch testimonials from Supabase
│ │ ├── useMetrics.ts # Fetch social proof metrics
│ │ └── useAnalytics.ts # GA4 event tracking
│ │
│ ├── lib/
│ │ ├── supabase.ts # Supabase client initialization
│ │ ├── queryClient.ts # React Query client config
│ │ ├── analytics.ts # GA4 setup and helpers
│ │ ├── utils.ts # Helper functions (cn, formatPhone)
│ │ └── constants.ts # App-wide constants
│ │
│ ├── types/
│ │ ├── testimonial.ts # Testimonial entity types
│ │ ├── lead.ts # Lead entity types
│ │ ├── metrics.ts # Social proof metrics types
│ │ └── forms.ts # Form schema types
│ │
│ ├── styles/
│ │ └── globals.css # Global styles + TailwindCSS imports
│ │
│ └── schemas/
│ ├── pricingGateSchema.ts # Zod schema for pricing form

---

## Phase -1: Pre-Implementation Gates (Constitution Compliance)

### Simplicity Gate (Article V)

- ✅ Using ≤3 projects? **YES** (1 frontend project only)
- ✅ No future-proofing? **YES** (building MVP only)
- ✅ Dependencies justified? **YES** (see research.md)

### Anti-Abstraction Gate (Article V)

- ✅ Using framework directly? **YES** (React + Vite + TailwindCSS as-is)
- ✅ Single model representation? **YES** (Supabase as sole data source)
- ✅ Avoiding premature optimization? **YES** (optimize after metrics)

### Integration-First Gate (Article III)

- ✅ Contracts defined? **YES** (see contracts/ folder)
- ✅ Contract tests planned? **YES** (Supabase integration tests)
- ✅ Real environment testing? **YES** (staging Supabase project)

**GATE STATUS**: ✅ **PASSED** - Ready to proceed

---

## Phase 0: Research & Unknowns Resolution

### Research Items

#### R1: Swiper.js vs Native CSS Scroll Snap

**Question**: Is Swiper.js necessary or can we use native CSS?

**Research**:

- Native CSS scroll-snap: Lightweight, no dependencies
- Swiper.js: 35KB gzipped, full touch support, autoplay, accessibility

**Decision**: **Use Swiper.js**

**Justification**:

- Spec requires autoplay (5s intervals) - not possible with CSS alone
- Touch gestures (swipe on mobile) require JS anyway
- Accessibility (keyboard navigation) built-in
- Constitution allows up to 3 deps per feature - this is #1

#### R2: Framer Motion vs CSS Animations

**Question**: Is Framer Motion needed or use CSS transitions?

**Research**:

- CSS animations: Free, performant, limited control
- Framer Motion: 28KB gzipped, declarative API, scroll-triggered animations

**Decision**: **Use Framer Motion**

**Justification**:

- Scroll-triggered animations for metrics counter (spec requirement)
- Smooth page transitions for better UX
- Easier to maintain than complex CSS keyframes
- Constitution allows up to 3 deps per feature - this is #2

#### R3: Phone Input Library

**Question**: Build custom phone input or use library?

**Research**:

- Custom: 100+ lines of code, need to handle formatting + validation
- react-international-phone: 12KB, Brazilian format out-of-box

**Decision**: **Use react-international-phone**

**Justification**:

- Brazilian phone format is complex (DDD + 9 digits)
- Library handles edge cases (formatting, country code)
- Constitution allows up to 3 deps per feature - this is #3
- Saves 2-3 hours of development time

#### R4: Email Service Selection

**Question**: Which email service for ebook delivery?

**Options**:

- SendGrid: Free tier 100 emails/day
- Resend: Free tier 100 emails/day, better DX, React Email integration
- AWS SES: Complex setup, overkill for MVP

**Decision**: **Use Resend**

**Justification**:

- Modern API, TypeScript-first
- React Email templates (future-ready)
- Better deliverability than SendGrid for transactional emails
- 100 emails/day sufficient for MVP

---

## Phase 1: Setup & Configuration (Day 1)

### P1.1: Initialize Project

```bash
# Create Vite project with React + TypeScript
npm create vite@latest landing-page-diogo -- --template react-ts

cd landing-page-diogo
npm install
```

### P1.2: Install Dependencies

```bash
# Core
npm install react-router-dom @tanstack/react-query zustand

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers react-international-phone

# UI & Animation
npm install swiper framer-motion lucide-react sonner

# Styling
npm install -D tailwindcss postcss autoprefixer
npm install clsx tailwind-merge

# Supabase
npm install @supabase/supabase-js

# Analytics
npm install react-ga4

# Dev Dependencies
npm install -D @types/node vitest @testing-library/react @testing-library/user-event jsdom
```

### P1.3: Configure TailwindCSS

Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0D47A1",
          orange: "#FF6D00",
          gray: "#F5F7FA",
        },
      },
      fontFamily: {
        heading: ["Montserrat", "sans-serif"],
        body: ["Open Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

### P1.4: Configure TypeScript (strict mode)

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### P1.5: Setup Supabase

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Create `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## Phase 2: Database Setup (Day 1-2)

See `data-model.md` for complete Supabase schema.

**Key Tables:**

1. `testimonials` - Student testimonials with photos
2. `pricing_gate_leads` - Leads from pricing unlock
3. `ebook_leads` - Leads from ebook download
4. `social_proof_metrics` - Aggregated metrics

**Storage Buckets:**

1. `testimonial-photos` - Student profile photos (public read)

---

## Phase 3: Core Components (Day 2-4)

### P3.1: Base UI Components (Reusable)

Build in this order (TDD):

1. **Button.tsx** - Primary, secondary, ghost variants
2. **Input.tsx** - Text, email, tel with error states
3. **Card.tsx** - Container with padding and shadow
4. **Modal.tsx** - Overlay with close button
5. **Spinner.tsx** - Loading indicator

### P3.2: Feature Components (Business Logic)

Build in this order:

1. **Header.tsx** ✅ IMPLEMENTED

   - Sticky header with glassmorphism (blur + semi-transparent)
   - Brand logo: "DS" gradient icon + "Diogo Spera" text + subtitle
   - Navigation links: Metodologia, Depoimentos, Planos, E-book Grátis
   - Smooth scroll to sections on click
   - WhatsApp CTA button (compact variant)
   - Framer Motion entrance animation
   - Responsive: hide nav links on mobile, show on desktop
   - Brand colors: Blue (#0D47A1) text, Orange (#FF6D00) CTA

2. **HeroSection.tsx**

   - Tagline + value prop
   - WhatsApp CTA button
   - Responsive image/illustration

3. **MethodologySection.tsx**

   - Grid of 4 PillarCard components
   - Icons + titles + descriptions
   - Responsive (2x2 on mobile, 4x1 on desktop)

4. **TestimonialsSection.tsx**

   - SocialProofMetrics (students served, avg improvement)
   - TestimonialsCarousel wrapper

5. **TestimonialsCarousel.tsx**

   - Swiper.js integration
   - TestimonialCard mapping
   - Autoplay + navigation
   - Touch gestures

6. **PricingSection.tsx**

   - Conditional rendering (locked/unlocked)
   - PricingGate form (locked)
   - PricingTable (unlocked)
   - Session persistence (localStorage)

7. **EbookSection.tsx**

   - EbookForm with validation
   - Success state with download link
   - LGPD privacy checkbox

8. **Footer.tsx**
   - Social media links
   - WhatsApp CTA
   - Copyright + privacy policy link

---

## Phase 4: Forms & Validation (Day 3-4)

### P4.1: Zod Schemas

**`src/schemas/pricingGateSchema.ts`**:

```typescript
import { z } from "zod";

export const pricingGateSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
  whatsapp: z
    .string()
    .regex(
      /^\(\d{2}\) \d{5}-\d{4}$/,
      "WhatsApp inválido (ex: (11) 98765-4321)"
    ),
});

export type PricingGateFormData = z.infer<typeof pricingGateSchema>;
```

**`src/schemas/ebookFormSchema.ts`**:

```typescript
import { z } from "zod";

export const ebookFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "WhatsApp inválido"),
  consented: z
    .boolean()
    .refine(
      (val) => val === true,
      "Você deve concordar com a política de privacidade"
    ),
});

export type EbookFormData = z.infer<typeof ebookFormSchema>;
```

### P4.2: React Hook Form Integration

Example for PricingGate:

```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<PricingGateFormData>({
  resolver: zodResolver(pricingGateSchema),
});
```

---

## Phase 5: Data Fetching & Mutations (Day 4-5)

### P5.1: Custom Hooks with React Query

**`src/hooks/usePricingGate.ts`**:

```typescript
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PricingGateFormData } from "@/schemas/pricingGateSchema";

export const usePricingGate = () => {
  return useMutation({
    mutationFn: async (data: PricingGateFormData) => {
      const { error } = await supabase.from("pricing_gate_leads").insert({
        name: data.name,
        whatsapp: data.whatsapp,
        source: "pricing_gate",
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Store unlock state in localStorage
      localStorage.setItem("pricing_unlocked", "true");
    },
  });
};
```

**`src/hooks/useEbookDownload.ts`**:

```typescript
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { EbookFormData } from "@/schemas/ebookFormSchema";

export const useEbookDownload = () => {
  return useMutation({
    mutationFn: async (data: EbookFormData) => {
      // Insert lead into database
      const { error: insertError } = await supabase.from("ebook_leads").insert({
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        consented_privacy: data.consented,
        source: "ebook_download",
        timestamp: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // Trigger ebook email via Edge Function
      const { error: emailError } = await supabase.functions.invoke(
        "send-ebook",
        {
          body: { email: data.email, name: data.name },
        }
      );

      if (emailError) throw emailError;

      return data;
    },
  });
};
```

**`src/hooks/useTestimonials.ts`**:

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useTestimonials = () => {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
};
```

---

## Phase 6: Analytics & Tracking (Day 5)

### P6.1: Google Analytics 4 Setup

**`src/lib/analytics.ts`**:

```typescript
import ReactGA from "react-ga4";

export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (measurementId) {
    ReactGA.initialize(measurementId);
  }
};

export const trackEvent = (
  category: string,
  action: string,
  label?: string
) => {
  ReactGA.event({
    category,
    action,
    label,
  });
};

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: "pageview", page: path });
};
```

**Usage in components**:

```tsx
// Track WhatsApp button click
<Button
  onClick={() => {
    trackEvent("CTA", "click_whatsapp", "hero_section");
    window.open("https://wa.me/5511987654321?text=Olá...", "_blank");
  }}
>
  Falar com Professor Diogo
</Button>
```

---

## Phase 7: Optimization & Performance (Day 6)

### P7.1: Image Optimization

- Use WebP format with JPEG fallback
- Implement lazy loading (`loading="lazy"`)
- Use Vercel Image Optimization (automatic)

### P7.2: Code Splitting

- Lazy load carousel component (defer Swiper.js until needed)
- Use React.lazy for heavy components

### P7.3: Bundle Optimization

- Tree-shake unused Lucide icons
- Purge unused TailwindCSS classes
- Enable Vite's build optimizations

---

## Phase 8: Testing (Day 6-7)

### P8.1: Component Tests (Vitest + Testing Library)

Example for `PricingGate.test.tsx`:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PricingGate } from "@/components/features/PricingGate";

test("should unlock pricing table after valid form submission", async () => {
  const user = userEvent.setup();
  render(<PricingGate />);

  // Fill form
  await user.type(screen.getByLabelText(/nome/i), "João Silva");
  await user.type(screen.getByLabelText(/whatsapp/i), "(11) 98765-4321");

  // Submit
  await user.click(screen.getByRole("button", { name: /ver preços/i }));

  // Assert pricing table is visible
  await waitFor(() => {
    expect(screen.getByText(/plano mensal/i)).toBeInTheDocument();
  });
});
```

### P8.2: Integration Tests

- Test Supabase connectivity
- Test email delivery (mock Resend API)

### P8.3: E2E Tests (Optional for MVP)

- Use Playwright for critical user flows

---

## Phase 9: Deployment (Day 7)

### P9.1: Vercel Setup

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GA_MEASUREMENT_ID`

### P9.2: Domain Configuration

- Point domain to Vercel
- Enable HTTPS (automatic)

### P9.3: Post-Deployment Checks

- [ ] Lighthouse audit (all scores >90)
- [ ] Test forms in production
- [ ] Verify analytics tracking
- [ ] Test WhatsApp links on mobile

---

## Success Metrics

**Technical:**

- ✅ Lighthouse Performance: >90
- ✅ Lighthouse Accessibility: >95
- ✅ Lighthouse Best Practices: >90
- ✅ Lighthouse SEO: >95
- ✅ Mobile load time: <3s (3G)
- ✅ Zero console errors

**Business:**

- ✅ Pricing unlock rate: >20%
- ✅ Ebook download rate: >30%
- ✅ WhatsApp click rate: >15%

---

## Risk Mitigation

| Risk                    | Impact | Mitigation                                                  |
| ----------------------- | ------ | ----------------------------------------------------------- |
| Supabase downtime       | HIGH   | Implement retry logic, show user-friendly error             |
| Slow testimonial images | MEDIUM | Use Supabase Storage CDN, compress images to <100KB         |
| Form spam               | MEDIUM | Add honeypot field, implement rate limiting                 |
| LGPD non-compliance     | HIGH   | Legal review of privacy policy, explicit consent checkboxes |

---

**Next Step**: Execute `/speckit.tasks` to generate task breakdown.
