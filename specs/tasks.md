# Tasks: Landing Page Institucional

**Input**: Design documents from `/specs/[001-landing-page]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

---
## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create Vite project with React + TypeScript in landing-page-diogo directory
- [X] T002 Install core dependencies (React Router, TanStack Query, Zustand)
- [X] T003 [P] Install form dependencies (React Hook Form, Zod, react-international-phone)
- [X] T004 [P] Install UI dependencies (Swiper, Framer Motion, Lucide React, Sonner)
- [X] T005 [P] Install styling dependencies (TailwindCSS, clsx, tailwind-merge)
- [X] T006 [P] Install Supabase client and analytics dependencies
- [X] T007 [P] Install dev dependencies (Vitest, Testing Library, jsdom)
- [X] T008 Configure TailwindCSS with brand colors and fonts
- [X] T009 Configure TypeScript with strict mode and path aliases
- [X] T010 Create project folder structure following plan.md
- [X] T011 Setup environment variables for Supabase and Google Analytics

---
## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T012 Setup Supabase client in src/lib/supabase.ts
- [X] T013 [P] Create global CSS file with Tailwind imports in src/styles/globals.css
- [X] T014 [P] Create constants file in src/lib/constants.ts
- [X] T015 [P] Create utility functions in src/lib/utils.ts (cn function, phone formatting)
- [X] T016 Create React Query client in src/lib/queryClient.ts
- [X] T017 Setup Google Analytics in src/lib/analytics.ts
- [X] T018 Create base UI components (Button, Input, Card, Modal, Spinner) in src/components/ui/
- [X] T019 [P] Create type definitions for entities in src/types/
- [X] T020 [P] Create Zod schemas for forms in src/schemas/
- [X] T021 Configure Supabase database tables and RLS policies
- [X] T022 Create Supabase storage bucket for testimonial photos
- [X] T023 Setup Resend for email delivery

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---
## Phase 3: User Story 1 - View Value Proposition (Priority: P1) 🎯 MVP

**Goal**: Display hero section with value proposition and primary CTA for WhatsApp contact

**Independent Test**: User should see hero section with tagline "Aqui o conhecimento te Spera", hybrid methodology explanation, and WhatsApp CTA button when visiting the page

### Implementation for User Story 1

- [X] T024 [P] [US1] Create HeroSection component in src/components/features/HeroSection.tsx
- [X] T025 [P] [US1] Create Tagline component in src/components/features/Tagline.tsx
- [X] T026 [P] [US1] Create ValueProposition component in src/components/features/ValueProposition.tsx
- [X] T027 [US1] Create WhatsAppButton component in src/components/features/WhatsAppButton.tsx
- [X] T028 [US1] Implement Google Analytics tracking for WhatsApp button clicks
- [X] T029 [US1] Add responsive design for hero section to work on all devices
- [X] T030 [US1] Add accessibility attributes to hero section components
- [ ] T031 [US1] Test page load time and optimize for under 3 seconds on 3G

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---
## Phase 4: User Story 2 - Understand Methodology (Priority: P2)

**Goal**: Display the 4 pillars of Diogo's methodology with icons and descriptions

**Independent Test**: User should see a clearly titled "Por que escolher o Professor Diogo" section with 4 pillars displayed with icons and concise descriptions

### Implementation for User Story 2

- [X] T032 [P] [US2] Create MethodologySection component in src/components/features/MethodologySection.tsx
- [X] T033 [P] [US2] Create PillarCard component in src/components/features/PillarCard.tsx
- [X] T034 [US2] Implement responsive grid layout for 4 pillars
- [X] T035 [US2] Add icons for each pillar using Lucide React
- [X] T036 [US2] Implement proper typography and visual hierarchy for scanning
- [X] T037 [US2] Add mobile-first responsive design ensuring readability on small screens
- [X] T038 [US2] Add accessibility attributes to methodology components

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---
## Phase 5: User Story 3 - View Social Proof (Priority: P3)

**Goal**: Display testimonials carousel with student photos and metrics showing success

**Independent Test**: User should see testimonials carousel with real student photos, before/after grades, navigation controls, auto-advance every 5 seconds, plus metrics display

### Implementation for User Story 3

- [X] T039 [P] [US3] Create TestimonialsSection component in src/components/features/TestimonialsSection.tsx
- [X] T040 [P] [US3] Create TestimonialsCarousel component in src/components/features/TestimonialsCarousel.tsx
- [X] T041 [P] [US3] Create TestimonialCard component in src/components/features/TestimonialCard.tsx
- [X] T042 [P] [US3] Create SocialProofMetrics component in src/components/features/SocialProofMetrics.tsx
- [X] T043 [US3] Integrate Swiper.js for testimonial carousel functionality
- [X] T044 [US3] Implement auto-advance every 5 seconds with pause on interaction
- [X] T045 [US3] Add touch/swipe navigation for mobile devices
- [X] T046 [US3] Fetch testimonials data from Supabase using custom hook
- [X] T047 [US3] Fetch social proof metrics from Supabase using custom hook
- [X] T048 [US3] Add animation to metrics counters when scrolled into view
- [X] T049 [US3] Implement accessibility for carousel navigation

**Checkpoint**: All user stories should now be independently functional

---
## Phase 6: User Story 4 - Access Pricing Information (Priority: P4)

**Goal**: Implement pricing gate that requires Name and WhatsApp to unlock pricing table

**Independent Test**: User should see pricing section with unlock message, form requesting Name and WhatsApp, validation preventing invalid submissions, reveal pricing table after submission, and data stored in database

### Implementation for User Story 4

- [X] T050 [P] [US4] Create PricingSection component in src/components/features/PricingSection.tsx
- [X] T051 [P] [US4] Create PricingGate component in src/components/features/PricingGate.tsx
- [X] T052 [P] [US4] Create PricingTable component in src/components/features/PricingTable.tsx
- [X] T053 [US4] Implement Zod schema for pricing gate form validation
- [X] T054 [US4] Integrate React Hook Form with pricing gate component
- [X] T055 [US4] Create usePricingGate custom hook for form submission to Supabase
- [X] T056 [US4] Implement conditional rendering (locked/unlocked state)
- [X] T057 [US4] Persist unlocked state in localStorage
- [X] T058 [US4] Validate Name (min 3 chars, letters only) and WhatsApp (Brazilian format)
- [X] T059 [US4] Show appropriate error messages for validation failures
- [X] T060 [US4] Handle form submission success and failure states

**Checkpoint**: At this point, User Stories 1-4 should all work independently

---
## Phase 7: User Story 5 - Download Free Ebook (Priority: P5)

**Goal**: Implement lead capture form for ebook download with LGPD compliance

**Independent Test**: User should see lead capture form with Name, Email, WhatsApp fields, privacy policy checkbox, validation, automatic ebook download on submission, and confirmation email

### Implementation for User Story 5

- [X] T061 [P] [US5] Create EbookSection component in src/components/features/EbookSection.tsx
- [X] T062 [P] [US5] Create EbookForm component in src/components/features/EbookForm.tsx
- [X] T063 [US5] Implement Zod schema for ebook form with LGPD compliance
- [X] T064 [US5] Integrate React Hook Form with ebook form component
- [X] T065 [US5] Create useEbookDownload custom hook for form submission
- [X] T066 [US5] Implement validation for all form fields (Name, Email, WhatsApp format)
- [X] T067 [US5] Add mandatory LGPD privacy policy checkbox
- [X] T068 [US5] Handle form submission for ebook download and email confirmation
- [X] T069 [US5] Store lead data in ebook_leads table in Supabase
- [X] T070 [US5] Trigger email with ebook link via Resend after successful submission
- [X] T071 [US5] Show success message and download link after form submission
- [X] T072 [US5] Implement error handling for form submission failures

**Checkpoint**: At this point, User Stories 1-5 should all work independently

---
## Phase 8: User Story 6 - Contact via WhatsApp (Priority: P6)

**Goal**: Implement WhatsApp contact buttons in multiple locations with pre-filled messages

**Independent Test**: User should see WhatsApp buttons in hero section and footer, clicking opens WhatsApp with pre-filled message, works on both desktop and mobile, with click tracking

### Implementation for User Story 6

- [X] T073 [P] [US6] Update WhatsAppButton to support different contexts (hero, footer)
- [X] T074 [US6] Create Footer component with WhatsApp CTA in src/components/features/Footer.tsx
- [X] T075 [US6] Implement pre-filled WhatsApp message with contextual content
- [X] T076 [US6] Ensure WhatsApp deep link works on both desktop (WhatsApp Web) and mobile
- [X] T077 [US6] Add Google Analytics tracking for WhatsApp button clicks
- [X] T078 [US6] Add consistent styling for WhatsApp buttons across the page
- [X] T079 [US6] Implement click tracking for analytics and attribution

**Checkpoint**: All 6 user stories should now be independently functional

---
## Phase 9: Integration & Composition

**Goal**: Combine all components into a cohesive landing page

- [ ] T080 Create LandingPage component in src/pages/LandingPage.tsx
- [ ] T081 Compose all feature components in correct order
- [ ] T082 Implement smooth scrolling between sections
- [ ] T083 Add overall page metadata (title, description, Open Graph tags)
- [ ] T084 Implement Google Analytics pageview tracking
- [ ] T085 Add structured data (JSON-LD) for organization
- [ ] T086 Test full user flow from hero to all interactions

---
## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T087 [P] Add comprehensive meta tags and SEO optimizations in index.html
- [X] T088 [P] Create and add brand assets (logo, favicon, og-image.png)
- [X] T089 Implement responsive design refinements across all components
- [X] T090 Add loading states and spinners for async operations
- [X] T091 [P] Add toast notifications for user feedback using Sonner
- [X] T092 Add comprehensive error boundaries and error handling
- [X] T093 Optimize images and implement lazy loading
- [X] T094 Conduct accessibility audit with automated tools
- [X] T095 Run Lighthouse audit and optimize for 90+ scores in all categories
- [X] T096 [P] Add unit tests for custom hooks in src/hooks/
- [X] T097 [P] Add component tests for UI components in src/components/
- [X] T098 [P] Add integration tests for Supabase operations
- [X] T099 Deploy to staging environment for validation
- [X] T100 Run end-to-end tests to validate all user flows

---
## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5 → P6)
- **Integration (Phase 9)**: Depends on all user stories being complete
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on UI components from foundational phase
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Depends on form components and validation
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Depends on form components and validation
- **User Story 6 (P6)**: Can start after Foundational (Phase 2) - May reuse WhatsAppButton from US1

### Within Each User Story

- Components should be built with proper dependencies
- Forms before submission logic
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---
## Parallel Example: User Story 1

```bash
# Launch all components for User Story 1 together:
Task: "Create HeroSection component in src/components/features/HeroSection.tsx"
Task: "Create Tagline component in src/components/features/Tagline.tsx"
Task: "Create ValueProposition component in src/components/features/ValueProposition.tsx"
Task: "Create WhatsAppButton component in src/components/features/WhatsAppButton.tsx"
```

---
## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
   - Developer D: User Story 4
   - Developer E: User Story 5
   - Developer F: User Story 6
3. Stories complete and integrate independently

---