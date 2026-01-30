# Feature Specification: Institutional Landing Page for Diogo Spera

## Feature Overview

This feature implements an institutional landing page for Diogo Spera's educational services. The page focuses on showcasing his hybrid teaching methodology, providing social proof through testimonials and metrics, offering a pricing structure with a contact gate, and capturing leads for a free educational ebook.

---

## User Stories

### US-000: Navigate Page Sections

**As a** visitor on the landing page  
**I want to** easily navigate between page sections  
**So that** I can quickly find the information I need

**Acceptance Criteria:**

- [ ] Header is visible and sticky at the top of the page
- [ ] Brand logo/name is displayed and links to top of page
- [ ] Navigation links are visible on desktop: Metodologia, Depoimentos, Planos, E-book Grátis
- [ ] Clicking a navigation link scrolls smoothly to the corresponding section
- [ ] WhatsApp contact button is accessible from the header
- [ ] Header is responsive and adapts to mobile devices
- [ ] Header has a professional appearance with brand colors

### US-001: View Value Proposition

**As a** parent of a struggling student  
**I want to** quickly understand Diogo Spera's hybrid methodology  
**So that** I can decide if this service might help my child

**Acceptance Criteria:**

- [ ] Hero section is visible above the fold on all devices
- [ ] Tagline "Aqui o conhecimento te Spera" is prominently displayed
- [ ] Hybrid methodology (Professor + Portal) is clearly explained
- [ ] Primary CTA "Falar com Professor Diogo" is visible and functional
- [ ] Section loads in under 2 seconds on 3G connection

### US-002: Understand Methodology

**As a** potential client  
**I want to** learn about the 4 pillars of Diogo's methodology  
**So that** I can evaluate if this approach aligns with my needs

**Acceptance Criteria:**

- [ ] "Por que escolher o Professor Diogo" section is clearly titled
- [ ] All 4 pillars are displayed with icons and descriptions
- [ ] Each pillar explanation is concise (max 2 sentences)
- [ ] Visual hierarchy makes pillars easy to scan
- [ ] Section is fully responsive on mobile devices

### US-003: View Social Proof

**As a** skeptical parent  
**I want to** see evidence of student success  
**So that** I can trust this service delivers results

**Acceptance Criteria:**

- [ ] Testimonials carousel displays real student photos
- [ ] Each testimonial shows "before" and "after" grades
- [ ] Navigation controls (prev/next) are intuitive
- [ ] Auto-advance carousel every 5 seconds
- [ ] At least 3 testimonials are visible
- [ ] Metrics display: total students served and average grade improvement
- [ ] Metrics are visually prominent with large numbers

### US-004: Access Pricing Information

**As a** interested parent  
**I want to** know the pricing  
**So that** I can determine if it fits my budget

**Acceptance Criteria:**

- [ ] Pricing section is visible and clearly titled
- [ ] Initial view shows "unlock pricing" message
- [ ] Form requires Name and WhatsApp (both mandatory)
- [ ] Form validation prevents submission with invalid data
- [ ] After submission, pricing table is revealed
- [ ] Submitted data is stored for follow-up
- [ ] User receives confirmation message after submission
- [ ] Pricing includes: Monthly Plan and Single Class options

### US-005: Download Free Ebook

**As a** parent interested in modern education  
**I want to** download the free ebook about AI in education  
**So that** I can learn practical study techniques

**Acceptance Criteria:**

- [ ] Lead capture form is clearly labeled "Como usar IA para estudar melhor"
- [ ] Form collects: Name, Email, WhatsApp (all required)
- [ ] Form validation prevents invalid submissions
- [ ] Upon submission, ebook downloads automatically
- [ ] User receives confirmation email with download link
- [ ] Lead data is stored in database for marketing
- [ ] Form includes privacy policy checkbox (LGPD compliance)

### US-006: Contact via WhatsApp

**As a** convinced prospect  
**I want to** quickly contact Diogo via WhatsApp  
**So that** I can ask questions and schedule a trial class

**Acceptance Criteria:**

- [ ] WhatsApp button is visible in multiple locations (hero, footer)
- [ ] Button opens WhatsApp with pre-filled message
- [ ] Message includes: "Olá, vim pelo site e gostaria de saber mais sobre..."
- [ ] Works on both desktop (WhatsApp Web) and mobile (WhatsApp app)
- [ ] Click tracking is implemented for analytics
- [ ] Button is styled consistently across the page

---

## User Scenarios & Testing

### Scenario 1: First-time visitor exploring the service

**Given** a parent searching for educational help  
**When** they land on the page  
**Then** they should see:

1. Hero section explaining hybrid methodology immediately
2. "Why Choose Professor Diogo" with 4 pillars
3. Testimonials carousel with real results
4. Pricing gate requiring contact info
5. Free ebook download option
6. WhatsApp contact in footer

**Expected Behavior:**

- User scrolls through content naturally
- User engages with at least 2 sections
- User either unlocks pricing OR downloads ebook OR clicks WhatsApp

### Scenario 2: Mobile user seeking quick information

**Given** a parent on mobile device  
**When** they access the landing page  
**Then** they should:

1. See hero section optimized for small screen
2. Navigate carousel with touch gestures
3. Complete forms without keyboard issues
4. Tap WhatsApp button and open app directly
5. Experience fast load times (< 3s)

### Scenario 3: User focused on social proof

**Given** a skeptical parent  
**When** they scroll to testimonials  
**Then** they should:

1. View multiple real student photos
2. See verified grade improvements (e.g., "6.5 → 9.2")
3. Read authentic testimonial quotes
4. See aggregate metrics (students served, avg improvement)
5. Feel confident in service quality

---

## Functional Requirements

### FR-000: Header Navigation

- System SHALL display a sticky header at the top of the page
- System SHALL include brand logo/name "Diogo Spera" with subtitle "Metodologia Híbrida"
- System SHALL display navigation links: Metodologia, Depoimentos, Planos, E-book Grátis
- System SHALL implement smooth scroll navigation to respective sections on link click
- System SHALL display WhatsApp CTA button in the header
- System SHALL use semi-transparent background with blur effect (glassmorphism)
- System SHALL animate header entrance on page load
- System SHALL remain fixed at top when user scrolls (sticky positioning)
- System SHALL be responsive: hide navigation links on mobile, show only logo and CTA
- System SHALL use brand colors: Blue (#0D47A1) for text, Orange (#FF6D00) for CTA button

### FR-001: Hero Section Display

- System SHALL display hero section with main value proposition
- System SHALL include tagline "Aqui o conhecimento te Spera"
- System SHALL explain hybrid methodology (Professor + Portal)
- System SHALL display primary CTA button linking to WhatsApp
- System SHALL ensure hero is visible above the fold on all devices

### FR-002: Methodology Section

- System SHALL display section titled "Por que escolher o Professor Diogo"
- System SHALL present exactly 4 pillars of methodology
- System SHALL include icon/visual for each pillar
- System SHALL provide concise description (max 100 words) per pillar
- System SHALL maintain visual hierarchy for scannability

### FR-003: Testimonials Carousel

- System SHALL display carousel with minimum 3 testimonials
- System SHALL show real student photos (with consent)
- System SHALL display before/after grades for each testimonial
- System SHALL include student quote (max 150 characters)
- System SHALL provide prev/next navigation controls
- System SHALL auto-advance carousel every 5 seconds
- System SHALL pause auto-advance on user interaction
- System SHALL be swipeable on touch devices

### FR-004: Social Proof Metrics

- System SHALL display metric: "Total de Alunos Atendidos"
- System SHALL display metric: "Média de Melhoria de Nota"
- System SHALL present metrics with large, prominent numbers
- System SHALL update metrics from database (not hardcoded)
- System SHALL use animated counter on scroll-into-view

### FR-005: Pricing Gate

- System SHALL display pricing section with "Unlock" state initially
- System SHALL present form requiring: Name (text), WhatsApp (phone format)
- System SHALL validate Name is not empty and contains only letters
- System SHALL validate WhatsApp follows Brazilian format (DDD + 9 digits)
- System SHALL prevent form submission if validation fails
- System SHALL store submitted data securely in database
- System SHALL reveal pricing table after successful submission
- System SHALL display pricing: Monthly Plan and Single Class options
- System SHALL prevent re-locking once unlocked (session-based)

### FR-006: Lead Capture Form (Ebook)

- System SHALL display form titled "Baixe o Ebook Gratuito: Como usar IA para estudar melhor"
- System SHALL collect: Name, Email, WhatsApp (all required)
- System SHALL validate Email format (RFC 5322 compliant)
- System SHALL include LGPD-compliant privacy checkbox (required)
- System SHALL store lead data in database with timestamp
- System SHALL trigger ebook download immediately after submission
- System SHALL send confirmation email with download link
- System SHALL display success message after submission

### FR-007: WhatsApp Contact Integration

- System SHALL display WhatsApp button in hero section
- System SHALL display WhatsApp link in footer
- System SHALL open WhatsApp with pre-filled message on click
- System SHALL use WhatsApp Web on desktop (wa.me link)
- System SHALL open WhatsApp app on mobile devices
- System SHALL track clicks for analytics purposes
- Pre-filled message format: "Olá, vim pelo site Diogo Spera e gostaria de saber mais sobre [contexto da seção]"

### FR-008: Footer Display

- System SHALL display footer with social media links
- System SHALL include links to: Instagram, Facebook, LinkedIn (if applicable)
- System SHALL display WhatsApp contact prominently
- System SHALL include copyright notice
- System SHALL display privacy policy link
- System SHALL be responsive and mobile-friendly

---

## Non-Functional Requirements

### NFR-001: Performance

- Page SHALL load in under 3 seconds on 3G connection
- Largest Contentful Paint (LCP) SHALL be under 2.5 seconds
- First Input Delay (FID) SHALL be under 100ms
- Cumulative Layout Shift (CLS) SHALL be under 0.1
- Images SHALL be optimized and lazy-loaded
- Lighthouse Performance score SHALL be minimum 90

### NFR-002: Mobile-First Design

- Page SHALL be fully functional on 360px viewport width
- Touch targets SHALL be minimum 44x44px (WCAG 2.1)
- Text SHALL be readable without zooming (minimum 16px base)
- Forms SHALL not cause viewport zoom on focus
- Navigation SHALL be thumb-friendly on mobile devices

### NFR-003: Accessibility

- Page SHALL comply with WCAG 2.1 Level AA
- All images SHALL have descriptive alt text
- Color contrast SHALL meet minimum ratio of 4.5:1
- Keyboard navigation SHALL be fully functional
- Screen reader compatibility SHALL be tested
- Form labels SHALL be properly associated with inputs
- Lighthouse Accessibility score SHALL be minimum 95

### NFR-004: Browser Compatibility

- Page SHALL function correctly on Chrome (latest 2 versions)
- Page SHALL function correctly on Safari (latest 2 versions)
- Page SHALL function correctly on Firefox (latest 2 versions)
- Page SHALL function correctly on Edge (latest 2 versions)
- Page SHALL degrade gracefully on older browsers

### NFR-005: Security & Privacy (LGPD)

- All form data SHALL be transmitted over HTTPS
- Personal data SHALL be stored encrypted at rest
- User consent SHALL be obtained before data collection
- Privacy policy SHALL be linked and accessible
- Data retention policy SHALL be documented
- User SHALL have right to data deletion (future feature)

### NFR-006: SEO Optimization

- Page SHALL have unique, descriptive title tag
- Page SHALL have meta description (max 160 characters)
- Page SHALL use semantic HTML5 elements
- Page SHALL have Open Graph tags for social sharing
- Page SHALL have structured data (JSON-LD) for organization
- Lighthouse SEO score SHALL be minimum 95

### NFR-007: Analytics & Tracking

- Page SHALL integrate Google Analytics 4
- Page SHALL track CTA button clicks
- Page SHALL track pricing gate submissions
- Page SHALL track ebook downloads
- Page SHALL track WhatsApp button clicks
- Page SHALL track scroll depth
- Page SHALL respect Do Not Track preferences

---

## Assumptions

- Target audience has basic smartphone literacy
- Majority of users access via mobile devices (70%)
- WhatsApp is the preferred communication channel in Brazil
- Parents are primary decision-makers, not students
- Testimonials and metrics are accurate and verifiable
- Ebook content is ready and hosted
- Diogo has active WhatsApp Business account
- Domain and hosting are already configured
- SSL certificate is installed and active

---

## Success Criteria

**User Engagement:**

- At least 70% of visitors scroll past hero section
- At least 50% of visitors engage with testimonials carousel
- Average session duration exceeds 2 minutes
- Bounce rate below 60%

**Conversion Metrics:**

- At least 20% of visitors unlock pricing table
- At least 30% of visitors download ebook
- At least 15% of visitors click WhatsApp button
- Pricing unlock → WhatsApp conversion rate exceeds 10%

**Technical Metrics:**

- Lighthouse Performance score > 90
- Page load time < 3 seconds (3G)
- Zero console errors on production
- 100% uptime during business hours (8am-10pm)

**Business Impact:**

- Generate minimum 10 qualified leads per week
- At least 2 new student enrollments per month attributed to landing page
- Positive ROI on hosting and maintenance costs within 3 months

---

## Key Entities

### Student Testimonial

- `id`: Unique identifier
- `student_name`: String (may be first name only for privacy)
- `photo_url`: String (URL to profile photo)
- `grade_before`: Decimal (e.g., 6.5)
- `grade_after`: Decimal (e.g., 9.2)
- `subject`: String (e.g., "Matemática")
- `quote`: String (max 150 characters)
- `display_order`: Integer (for carousel sequencing)
- `is_active`: Boolean (for admin control)

### Lead (Pricing Gate)

- `id`: Unique identifier
- `name`: String (required)
- `whatsapp`: String (Brazilian format, required)
- `source`: String (fixed value: "pricing_gate")
- `timestamp`: DateTime (UTC)
- `ip_address`: String (for fraud detection)
- `user_agent`: String (device/browser info)

### Lead (Ebook Download)

- `id`: Unique identifier
- `name`: String (required)
- `email`: String (required, validated)
- `whatsapp`: String (Brazilian format, required)
- `consented_privacy`: Boolean (required, true)
- `source`: String (fixed value: "ebook_download")
- `timestamp`: DateTime (UTC)
- `ebook_sent`: Boolean (email delivery confirmation)

### Social Proof Metrics

- `total_students`: Integer (updated manually or automatically)
- `average_improvement`: Decimal (calculated from testimonials)
- `last_updated`: DateTime (for cache invalidation)

---

## Database Schema

### New Tables (Feature 001)

These tables are defined in `data-model.md` and support the landing page features.

```sql
-- 1. Testimonials
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

-- 2. Pricing Gate Leads
CREATE TABLE pricing_gate_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  source VARCHAR(50) DEFAULT 'pricing_gate',
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 3. Ebook Leads
CREATE TABLE ebook_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  consented_privacy BOOLEAN NOT NULL DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT now()
);
```

### Existing Tables (Reference)

The following tables exist in the current Supabase project and serve the student portal:

- **`tbf_controle_user`**: Main user table (Students/Admins). Contains profile data like `emailpai`, `emailaluno`, `signature`.
- **`tbf_mensagens`**: Stores contact messages.
- **`tbf_rss`**: Newsletter email storage.
- **`tbf_materias`**: Subjects/Disciplines definitions.
- **`tbf_duvidas`**: Student questions/doubts.
- **`tbf_serie`**: School series/grades definitions.
- **`tbf_temas`**: Content themes.
- **`audit_logs`**: Administrative action logs.

---

## Constraints

### Business Constraints

- Pricing table MUST be gated (no public pricing display)
- All testimonials MUST be verified and consented
- Ebook MUST be deliverable immediately upon form submission
- WhatsApp MUST be the primary contact method (no phone calls)

### Technical Constraints

- Must work on devices as old as 3 years
- Must function with JavaScript disabled (graceful degradation)
- Must load under 2MB total page weight
- Must use TailwindCSS (no custom CSS frameworks)
- Must be deployable to Vercel with zero config

### Legal Constraints (LGPD)

- Must obtain explicit consent before collecting personal data
- Must provide privacy policy link before form submission
- Must allow users to request data deletion (future feature)
- Must not share data with third parties without consent
- Must store data encrypted and access-controlled

### Design Constraints

- Must follow brand colors: Blue (#0D47A1), Orange (#FF6D00), Gray (#F5F7FA)
- Must use brand fonts: Montserrat (headings), Open Sans (body)
- Must maintain 8px grid system (TailwindCSS default)
- Must have maximum content width of 1280px (xl breakpoint)

---

## Dependencies

### Content Dependencies

- [ ] Final copy for 4 methodology pillars
- [ ] Minimum 3 verified student testimonials with photos and grades
- [ ] Accurate metrics (students served, average improvement)
- [ ] Ebook PDF file "Como usar IA para estudar melhor"
- [ ] Privacy policy document (LGPD-compliant)
- [ ] Brand assets (logo, color palette, typography)

### Technical Dependencies

- [ ] Supabase project created with database tables
- [ ] Supabase storage bucket for testimonial photos
- [ ] Email service configured (SendGrid, Resend, or similar)
- [ ] WhatsApp Business account active and verified
- [ ] Domain configured and SSL active
- [ ] Google Analytics 4 property created
- [ ] Vercel account for deployment

### External Dependencies

- [ ] Mercado Pago account (for future payment integration)
- [ ] CDN for image optimization (Vercel automatic or Cloudinary)
- [ ] Email delivery service (for ebook and confirmations)

---

## Out of Scope (Future Features)

- Online payment processing (coming in Feature 005)
- Student dashboard/portal access (coming in Feature 004)
- Quiz diagnostic tool (coming in Feature 003)
- Admin panel for content management (coming in Feature 007)
- Multi-language support (Portuguese only for MVP)
- Live chat widget (WhatsApp only for MVP)
- Blog/content marketing section (future phase)
- Video testimonials (text and photo only for MVP)

---

**Feature ID**: 001  
**Feature Name**: Landing Page Institucional  
**Created**: 2025-12-18  
**Status**: Specification Complete  
**Next Step**: Implementation Plan (`/speckit.plan`)
