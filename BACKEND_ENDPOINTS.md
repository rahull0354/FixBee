# FixBee Backend API Endpoints Reference

This document lists all the backend API endpoints that the FixBee frontend expects.

## Authentication Endpoints

### Customer Authentication
- ✅ `POST /customers/register` - Register new customer
- ✅ `POST /customers/login` - Customer login
- ✅ `POST /customers/logout` - Customer logout
- ❌ `GET /customers/verify-token` - Verify customer token (NOT IMPLEMENTED - uses localStorage fallback)

### Provider Authentication
- ✅ `POST /providers/register` - Register new provider
- ✅ `POST /providers/login` - Provider login
- ✅ `POST /providers/logout` - Provider logout
- ❌ `GET /providers/verify-token` - Verify provider token (NOT IMPLEMENTED - uses localStorage fallback)

### Admin Authentication
- ✅ `POST /author/login` - Admin login
- ✅ `POST /author/logout` - Admin logout
- ❌ `GET /author/verify-token` - Verify admin token (NOT IMPLEMENTED - uses localStorage fallback)

## Customer Endpoints

### Profile Management
- ✅ `GET /customers/profile` - Get customer profile
- ✅ `PUT /customers/update-profile` - Update customer profile
- ✅ `POST /customers/deactivate-account` - Deactivate account

### Service Requests
- ❌ `POST /request/create` - Create new service request (NOT IMPLEMENTED)
- ❌ `GET /request/requests/my-services` - Get customer's service requests (NOT IMPLEMENTED)
- ❌ `GET /request/customer/service-request/:id` - Get specific request details (NOT IMPLEMENTED)
- ❌ `PATCH /request/cancel/:id` - Cancel service request (NOT IMPLEMENTED)
- ❌ `PATCH /request/reschedule/:id` - Reschedule service request (NOT IMPLEMENTED)

### Categories
- ❌ `GET /author/categories` - Get all categories (NOT IMPLEMENTED)
- ❌ `GET /author/category/:slug` - Get category by slug (NOT IMPLEMENTED)

### Reviews
- ❌ `GET /review/customer/my-reviews` - Get customer's reviews (NOT IMPLEMENTED)
- ❌ `POST /review/create/:requestId` - Create review (NOT IMPLEMENTED)
- ❌ `PATCH /review/customer/edit-review/:id` - Update review (NOT IMPLEMENTED)
- ❌ `DELETE /review/customer/delete/:id` - Delete review (NOT IMPLEMENTED)

## Provider Endpoints

### Profile Management
- ✅ `GET /providers/profile` - Get provider profile (authenticated)
- ✅ `PUT /providers/profile` - Update provider profile (authenticated)
- ✅ `PATCH /providers/toggleAvailability` - Toggle availability (authenticated)
- ✅ `GET /providers/list` - Get all providers (public)
- ✅ `GET /providers/list/profile/:serviceProviderId` - Get provider public profile by ID (public) ✅ **FRONTEND FIXED**
- ✅ `GET /providers/list/search` - Search providers (public)
- ✅ `POST /providers/register` - Register new provider
- ✅ `POST /providers/login` - Provider login
- ✅ `POST /providers/request-reactivation` - Request account reactivation
- ✅ `GET /providers/reactivate-account/:token` - Verify and reactivate account
- ✅ `POST /providers/deactivate-account` - Deactivate account (authenticated)

### Service Requests
- ✅ `GET /request/available-requests` - Get available service requests (provider authenticated)
- ✅ `POST /request/accept/:requestId` - Accept service request (provider authenticated)
- ✅ `PATCH /request/start/:id` - Start service (provider authenticated)
- ✅ `PATCH /request/complete/:id` - Complete service (provider authenticated)
- ✅ `GET /request/my-assigned-requests` - Get assigned requests (provider authenticated)
- ❌ `GET /request/provider/service-request/:id` - Get specific request details for provider (NOT IMPLEMENTED - needed for provider view)

### Reviews
- ❌ `GET /review/provider/my-reviews` - Get provider's reviews (NOT IMPLEMENTED)
- ❌ `PATCH /review/provider/respond/:reviewId` - Respond to review (NOT IMPLEMENTED)

## Admin Endpoints

### Dashboard
- ❌ `GET /author/dashboard` - Admin dashboard stats (NOT IMPLEMENTED)

### Category Management
- ❌ `POST /author/createCategory` - Create category (NOT IMPLEMENTED)
- ❌ `GET /author/category/:id` - Get category by ID (NOT IMPLEMENTED)
- ❌ `PUT /author/category/update/:id` - Update category (NOT IMPLEMENTED)
- ❌ `PATCH /author/category/:id/toggle` - Toggle category status (NOT IMPLEMENTED)
- ❌ `DELETE /author/category/delete/:id` - Delete category (NOT IMPLEMENTED)

### Provider Management
- ❌ `GET /author/serviceProviders` - Get all providers (NOT IMPLEMENTED)
- ❌ `GET /author/serviceProvider/:id` - Get provider by ID (NOT IMPLEMENTED)
- ❌ `PATCH /author/serviceProvider/suspend/:id` - Suspend provider (NOT IMPLEMENTED)
- ❌ `PATCH /author/serviceProvider/un-suspend/:id` - Unsuspend provider (NOT IMPLEMENTED)

### Customer Management
- ❌ `GET /author/customers` - Get all customers (NOT IMPLEMENTED)
- ❌ `GET /author/customer/:id` - Get customer by ID (NOT IMPLEMENTED)

### Review Moderation
- ❌ `GET /review/admin/all-reviews` - Get all reviews (NOT IMPLEMENTED)
- ❌ `PATCH /review/admin/flag/:id` - Flag review (NOT IMPLEMENTED)
- ❌ `PATCH /review/admin/un-flag/:id` - Unflag review (NOT IMPLEMENTED)
- ❌ `PATCH /review/admin/visibility/:id` - Toggle review visibility (NOT IMPLEMENTED)

## Implementation Priority

### Phase 1: Essential for Customer Dashboard
1. `GET /request/requests/my-services` - Load dashboard data
2. `POST /request/create` - Create service requests
3. `GET /author/categories` - Browse services
4. `GET /author/category/:slug` - Service category details
5. `GET /request/customer/service-request/:id` - Request details

### Phase 2: Customer Request Management
6. `PATCH /request/cancel/:id` - Cancel requests
7. `PATCH /request/reschedule/:id` - Reschedule requests

### Phase 3: Profile Management
8. `GET /customers/profile` - Customer profile
9. `PUT /customers/profile` - Update profile

### Phase 4: Reviews
10. `POST /review/create/:requestId` - Create reviews
11. `GET /review/customer/my-reviews` - Get reviews

### Phase 5: Provider Features
12. `GET /request/available-requests` - Available requests
13. `POST /request/accept/:requestId` - Accept requests
14. `PATCH /request/start/:id` - Start service
15. `PATCH /request/complete/:id` - Complete service

### Phase 6: Admin Features
16. `POST /author/createCategory` - Create categories
17. `GET /author/categories` - List categories
18. All admin management endpoints

## Notes

- ✅ = Implemented and working
- ❌ = Not implemented (returns 501 or 404)
- The frontend gracefully handles unimplemented endpoints with user-friendly error messages
- Token verification uses localStorage as a fallback until verify-token endpoints are implemented
