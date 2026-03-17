# FixBee Frontend Implementation Plan
## Home Services Marketplace - 3-Role Platform (Customer, Service Provider, Admin)

---

## 📋 Context
This plan creates a production-ready frontend for the FixBee home services marketplace, integrating with the existing Drizzle/PostgreSQL/Supabase backend. The platform serves three user roles with distinct workflows: customers book services, providers accept and complete service requests, and admins manage the platform.

**Backend API Structure:**
- Customer: Auth, profile, service requests (create/cancel/reschedule), reviews
- Service Provider: Auth, profile, availability, request management, service completion
- Admin: Auth, dashboard, category management, user management, review moderation
- Service Requests: Full lifecycle (pending → assigned → in-progress → completed)
- Reviews: Create, update, respond, moderate with flagging system

**Technology Stack:**
- Next.js 16.1.7 (App Router)
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui components
- JWT-based authentication (httpOnly cookies)
- Stripe (infrastructure ready for Phase 2)

---

## 🎯 Implementation Phases

### **Phase 1: Foundation & Infrastructure**
*Estimated: 2-3 days*

**Goal:** Set up project structure, authentication system, and core infrastructure.

#### 1.1 Project Setup & Configuration
- [ ] Install and configure shadcn/ui
- [ ] Install required dependencies
- [ ] Configure environment variables
- [ ] Set up folder structure

#### 1.2 Authentication System
- [ ] Create auth context and hooks
- [ ] Build auth API client
- [ ] Implement middleware for route protection
- [ ] Create auth types

#### 1.3 Base UI Components (shadcn)
- [ ] Install core components
- [ ] Create custom base components

---

### **Phase 2: Authentication Flow**
*Estimated: 2-3 days*

**Goal:** Complete authentication UI for all three roles with role-based redirects.

#### 2.1 Authentication Pages
- [ ] `/auth/login` - Role selection page
- [ ] `/auth/login/customer` - Customer login
- [ ] `/auth/login/provider` - Service Provider login
- [ ] `/auth/login/admin` - Admin login
- [ ] `/auth/register/customer` - Customer registration
- [ ] `/auth/register/provider` - Provider registration
- [ ] `/auth/forgot-password` - Password reset request

#### 2.2 Auth Validation & Error Handling
- [ ] Create Zod schemas for all auth forms
- [ ] Implement form validation
- [ ] Add toast notifications
- [ ] Handle API errors gracefully

---

### **Phase 3: Customer Dashboard & Service Requests**
*Estimated: 4-5 days*

**Goal:** Build complete customer workflow - browse services, create requests, manage bookings.

#### 3.1 Customer Dashboard Layout
- [ ] `/customer` layout with navigation
- [ ] `/customer/dashboard` - Customer home

#### 3.2 Browse & Discover Services
- [ ] `/customer/services` - Browse service categories
- [ ] `/customer/services/[slug]` - Service category details
- [ ] `/customer/providers` - Browse service providers
- [ ] `/customer/providers/[id]` - Provider public profile

#### 3.3 Service Request Creation
- [ ] `/customer/requests/new` - Create service request form

#### 3.4 My Service Requests
- [ ] `/customer/requests` - List all customer requests
- [ ] `/customer/requests/[id]` - Request details
- [ ] Cancel request modal
- [ ] Reschedule request modal

#### 3.5 Reviews Management
- [ ] `/customer/reviews` - My reviews
- [ ] Review creation form
- [ ] Review edit/delete

#### 3.6 Customer Profile
- [ ] `/customer/profile` - View and edit profile
- [ ] Account settings

---

### **Phase 4: Service Provider Dashboard**
*Estimated: 4-5 days*

**Goal:** Complete provider workflow - manage profile, discover requests, accept and complete services.

#### 4.1 Provider Dashboard Layout
- [ ] `/provider` layout with navigation
- [ ] `/provider/dashboard` - Provider home

#### 4.2 Provider Profile Setup
- [ ] `/provider/profile/setup` - Initial profile completion
- [ ] `/provider/profile` - View and edit profile

#### 4.3 Discover Service Requests
- [ ] `/provider/requests/available` - Available requests feed
- [ ] Request details modal

#### 4.4 My Assignments
- [ ] `/provider/assignments` - List assigned requests
- [ ] `/provider/assignments/[id]` - Assignment details
- [ ] Start service action
- [ ] Complete service action

#### 4.5 Provider Reviews
- [ ] `/provider/reviews` - My reviews
- [ ] Respond to review

---

### **Phase 5: Admin Dashboard**
*Estimated: 4-5 days*

**Goal:** Build admin interface for platform management - categories, users, reviews, analytics.

#### 5.1 Admin Dashboard Layout
- [ ] `/admin` layout with navigation
- [ ] `/admin/dashboard` - Admin home

#### 5.2 Category Management
- [ ] `/admin/categories` - Categories list
- [ ] `/admin/categories/new` - Create category
- [ ] `/admin/categories/[id]` - Category details/edit

#### 5.3 Service Provider Management
- [ ] `/admin/providers` - Providers list
- [ ] `/admin/providers/[id]` - Provider details

#### 5.4 Customer Management
- [ ] `/admin/customers` - Customers list
- [ ] `/admin/customers/[id]` - Customer details

#### 5.5 Review Moderation
- [ ] `/admin/reviews` - All reviews

---

### **Phase 6: Polish & Optimization**
*Estimated: 2-3 days*

**Goal:** Enhance UX, add animations, optimize performance, prepare for production.

#### 6.1 UI/UX Enhancements
- [ ] Add page transitions
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Error boundaries
- [ ] Responsive design testing
- [ ] Accessibility improvements

#### 6.2 Performance Optimization
- [ ] Implement React Query
- [ ] Add image optimization
- [ ] Code splitting and lazy loading
- [ ] Reduce bundle size

#### 6.3 Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

#### 6.4 Production Preparation
- [ ] Environment variable validation
- [ ] SEO metadata
- [ ] Analytics setup
- [ ] Error tracking
- [ ] Deployment configuration

---

### **Phase 7: Stripe Payment Infrastructure** (Future)
*Estimated: 3-4 days*

**Goal:** Prepare payment infrastructure for when you're ready to implement payments.

#### 7.1 Stripe Setup
- [ ] Stripe account configuration
- [ ] Webhook endpoint setup
- [ ] Products and pricing configuration

#### 7.2 Payment Components (Infrastructure Only)
- [ ] Create payment types
- [ ] Create API route stubs
- [ ] Payment UI stubs

#### 7.3 Backend Integration (When Ready)
- [ ] Connect to actual Stripe API
- [ ] Implement webhook handlers
- [ ] Add payment to service request flow
- [ ] Create invoices

---

## 📁 Complete Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   ├── customer/page.tsx
│   │   │   └── provider/page.tsx
│   │   └── layout.tsx
│   ├── customer/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── services/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── requests/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── provider/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx
│   │   │   └── setup/page.tsx
│   │   ├── requests/
│   │   │   ├── available/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── assignments/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── categories/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── providers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── reviews/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── auth/
│   ├── customer/
│   ├── provider/
│   ├── admin/
│   └── shared/
├── lib/
│   ├── api/
│   ├── hooks/
│   ├── utils/
│   └── validations/
└── types/
    ├── index.ts
    ├── auth.ts
    ├── requests.ts
    ├── providers.ts
    └── reviews.ts
```

---

## ✅ Verification Checklists

### End-to-End User Flows

**Customer Flow:**
1. Register as customer → Redirect to dashboard
2. Browse service categories → Select category
3. Create service request → See in "My Requests"
4. Provider accepts request → Status updates
5. Service completed → Add review
6. View review in "My Reviews"

**Provider Flow:**
1. Register as provider → Complete profile setup
2. Toggle availability to "available"
3. Browse available requests → Accept request
4. Start service → Update status
5. Complete service → Add final price/after images
6. Receive review → Respond to review

**Admin Flow:**
1. Login as admin → View dashboard stats
2. Create new service category
3. Browse providers → Suspend if needed
4. Moderate flagged reviews
5. View customer profiles and history

---

## 📝 API Endpoints Reference

### Authentication
- `POST /customers/register` - Customer registration
- `POST /customers/login` - Customer login
- `POST /providers/register` - Provider registration
- `POST /providers/login` - Provider login
- `GET /author/login` - Admin login
- `POST /author/register` - Admin registration

### Customer
- `GET /customers/profile` - Get customer profile
- `POST /customers/deactivate-account` - Deactivate account
- `GET /customers/reactivate-account/:token` - Reactivate account
- `POST /customers/request-reactivation` - Request reactivation

### Service Provider
- `GET /providers/profile` - Get provider profile
- `PUT /providers/profile` - Update provider profile
- `PUT /providers/toggleAvailability` - Toggle availability status
- `GET /providers/list` - Get all providers (paginated)
- `GET /providers/list/profile/:id` - Get public profile
- `GET /providers/list/search` - Search providers

### Service Requests
- `POST /request/create` - Create service request
- `GET /request/requests/my-services` - Get my service requests
- `GET /request/customer/service-request/:id` - Get request details
- `PATCH /request/cancel/:id` - Cancel request
- `PATCH /request/reschedule/:id` - Reschedule request
- `GET /request/available-requests` - Get available requests (provider)
- `POST /request/accept/:id` - Accept request (provider)
- `GET /request/my-assigned-requests` - Get assigned requests (provider)
- `PATCH /request/start/:id` - Start service (provider)
- `PATCH /request/complete/:id` - Complete service (provider)

### Reviews
- `POST /review/create/:requestId` - Create review
- `GET /review/provider/:providerId` - Get provider reviews
- `GET /review/customer/my-reviews` - Get my reviews (customer)
- `PATCH /review/provider/respond/:reviewId` - Respond to review (provider)
- `PATCH /review/customer/edit-review/:reviewId` - Edit review (customer)
- `DELETE /review/customer/delete/:reviewId` - Delete review (customer)
- `GET /review/provider/my-reviews` - Get my reviews (provider)
- `PATCH /review/admin/flag/:reviewId` - Flag review (admin)
- `PATCH /review/admin/un-flag/:reviewId` - Unflag review (admin)
- `PATCH /review/admin/visibility/:reviewId` - Toggle visibility (admin)
- `GET /review/admin/all-reviews` - Get all reviews (admin)

### Admin
- `GET /author/profile` - Get admin profile
- `POST /author/createCategory` - Create category
- `GET /author/category/:id` - Get category by ID
- `PUT /author/category/update/:id` - Update category
- `PATCH /author/category/:id/toggle` - Toggle category status
- `DELETE /author/category/delete/:id` - Delete category
- `GET /author/categories` - Get all categories
- `GET /author/serviceProviders` - Get all providers
- `GET /author/serviceProvider/:id` - Get provider by ID
- `PATCH /author/serviceProvider/suspend/:id` - Suspend provider
- `PATCH /author/serviceProvider/un-suspend/:id` - Unsuspend provider
- `GET /author/customers` - Get all customers
- `GET /author/customer/:id` - Get customer by ID
- `GET /author/dashboard` - Get dashboard stats

---

## 🎯 Ready to Start!

Now you have the complete implementation plan saved in your project root.

**Next Steps:**
1. Complete the setup steps (shadcn/ui, dependencies, folders)
2. Tell me "Give me the first file" and I'll provide the code file-by-file

This way you'll learn by writing each file yourself! 🚀
