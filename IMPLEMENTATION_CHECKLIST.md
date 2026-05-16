# 🛠️ Implementation Checklist - Mosque Digital Clock Audit Fixes

Generated: April 8, 2026  
Total Items: 25 | Estimated Time: 25-30 hours

---

## 🔴 PHASE 1: CRITICAL SECURITY FIXES (Target: This Week)

### [x] 1. Implement Password Hashing with bcrypt

**File:** `apps/web-admin/app/api/auth/login/route.ts`

```
- [ ] Install bcrypt: npm install bcrypt @types/bcrypt
- [ ] Update login endpoint to use bcrypt.compare()
- [ ] Add password salt rounds config (12 recommended)
- [ ] Test with multiple passwords
- [ ] Update migration script for existing passwords
Estimated Time: 2 hours
```

**Dependencies to Add:**
```json
"bcrypt": "^5.1.1",
"@types/bcrypt": "^5.0.2"
```

---

### [x] 2. Remove Hardcoded Database Credentials

**Files:** 
- `apps/web-admin/lib/db.ts`

```
- [ ] Create .env.example with all required variables
- [ ] Update .env with secure values
- [ ] Remove hardcoded credentials from source
- [ ] Add validation for required env vars at startup
- [ ] Update Dockerfile to not expose credentials
- [ ] Update deployment documentation
Estimated Time: 1 hour
```

**Required Environment Variables:**
```
DATABASE_URL=
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
SESSION_SECRET=
NEXT_PUBLIC_API_BASE_URL=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
MQTT_BROKER_URL=
MQTT_USER=
MQTT_PASSWORD=
```

---

### [x] 3. Add Input Validation to All API Endpoints

**Strategy:** Use Zod for schema validation

```
- [ ] Install zod: npm install zod
- [ ] Create shared validation schemas in packages/shared-types
- [ ] Update GET /api/config with validation
- [ ] Update POST /api/config with validation
- [ ] Update all API endpoints systematically
- [ ] Create middleware for validation
- [ ] Add unit tests for validators
Estimated Time: 4-5 hours
```

**File Structure:**
```
packages/shared-types/
├── src/
│   ├── index.ts
│   └── validators.ts (NEW)

apps/web-admin/
├── app/
│   ├── api/
│   │   ├── _middleware/
│   │   │   └── validate.ts (NEW)
```

---

### [x] 4. Add Rate Limiting to API Endpoints

**Strategy:** Redis-based rate limiting

```
- [ ] Install redis: npm install redis ioredis
- [ ] Create rate limit middleware
- [ ] Apply to auth endpoints (strict: 5 req/min)
- [ ] Apply to config endpoints (moderate: 30 req/min)
- [ ] Apply to upload endpoints (strict: 10 req/min)
- [ ] Add Retry-After headers
- [ ] Test rate limit behavior
Estimated Time: 3 hours
```

---

## 🟡 PHASE 2: HIGH PRIORITY FIXES (Target: Week 1-2)

### [x] 5. Implement Comprehensive Error Handling

**Files:** Multiple across web-client and web-admin

```
- [ ] Add ErrorBoundary component
- [ ] Create error tracking service (Sentry optional)
- [ ] Update fetchConfig with retry logic & exponential backoff
- [ ] Add try-catch to all async operations
- [ ] Create consistent error response format
- [ ] Add error logging to all components
- [ ] Test error scenarios
Estimated Time: 5 hours
```

---

### [x] 6. Add Loading States to All Async Operations

**Components to Update:**
- InfoSlider.tsx
- AdvancedConfigSection.tsx
- PlaylistManager.tsx
- ScheduleManager.tsx
- All API calls in page.tsx

```
- [ ] Create reusable LoadingSpinner component
- [ ] Create LoadingOverlay component
- [ ] Update config fetch to show loading
- [ ] Update upload operations
- [ ] Update API calls in admin dashboard
- [ ] Test loading state transitions
Estimated Time: 3 hours
```

---

### [x] 7. Memory Leak Fixes

**Files:** 
- `apps/web-client/app/page.tsx` (multiple useEffect hooks)

```
- [ ] Review all useEffect dependencies
- [ ] Fix config dependency in main loop
- [ ] Ensure all event listeners are cleaned up
- [ ] Fix interval/timeout leaks
- [ ] Add React DevTools Profiler analysis
- [ ] Test long-running sessions (24+ hours)
Estimated Time: 2 hours
```

---

## 🟠 PHASE 3: PERFORMANCE & UX (Target: Week 2-3)

### [x] 8. Implement Config Caching Strategy

**Approach:** React Query or SWR + Redis backend

```
- [ ] Install @tanstack/react-query or swr
- [ ] Create useConfig custom hook
- [ ] Implement 5-minute cache TTL
- [ ] Add cache invalidation triggers
- [ ] Implement background refresh
- [ ] Add cache statistics dashboard
- [ ] Performance test: measure API call reduction
Estimated Time: 3 hours
```

---

### [x] 9. Accessibility (a11y) Improvements

**WCAG 2.1 AA Compliance**

```
- [ ] Add ARIA labels to all interactive elements
- [ ] Fix color contrast ratios (use WebAIM check)
- [ ] Add keyboard navigation support
- [ ] Update all time displays with proper aria-live
- [ ] Test with screen readers (NVDA/JAWS)
- [ ] Add focus indicators
- [ ] Document accessibility features
Estimated Time: 4 hours
```

---

### [x] 10. Prayer Times Logic Hardening

**File:** `apps/web-client/app/lib/logic.ts`

```
- [ ] Add coordinate validation
- [ ] Handle edge cases at midnight
- [ ] Improve Friday handling
- [ ] Add calculation error logging
- [ ] Implement fallback calculations
- [ ] Add unit tests (8+ test cases)
- [ ] Performance test calculations
Estimated Time: 2-3 hours
```

---

## 🟢 PHASE 4: NEW FEATURES (Target: Week 3-4)

### [ ] 11. Push Notifications for Adzan

**Architecture:**
- Service Worker Push API
- VAPID credentials
- Backend notification trigger

```
- [ ] Set up VAPID key generation
- [ ] Create notification subscription endpoints
- [ ] Implement service worker notification handler
- [ ] Add admin UI for notification testing
- [ ] Create notification scheduler
- [ ] Test with multiple browsers
- [ ] Add notification analytics
Estimated Time: 6 hours
```

**Files to Create:**
```
apps/web-client/public/sw.js (update)
apps/web-admin/app/api/notifications/subscribe/route.ts (NEW)
apps/web-admin/app/api/notifications/test/route.ts (NEW)
apps/web-admin/lib/notification-service.ts (NEW)
```

---

### [ ] 12. Integration Tests & QA

```
- [ ] Write API endpoint tests (supertest)
- [ ] Write component tests (React Testing Library)
- [ ] Write E2E tests (Cypress/Playwright)
- [ ] Performance profiling
- [ ] Security scanning (npm audit, OWASP ZAP)
- [ ] Load testing
- [ ] UAT checklist
Estimated Time: 8 hours
```

---

## 📊 Implementation Timeline

### Week 1 (CRITICAL PHASE)
```
Mon-Tue: Password hashing + Env secrets
Wed: Input validation (core endpoints)
Thu: Rate limiting setup
Fri: Testing & verification
```

### Week 2 (ESSENTIAL PHASE)
```
Mon-Tue: Error handling improvements
Wed: Loading states & UX fixes
Thu: Memory leak hunting & fixes
Fri: Performance testing
```

### Week 3 (ENHANCEMENT PHASE)
```
Mon-Tue: Config caching implementation
Wed: Accessibility improvements
Thu: Prayer times hardening
Fri: Feature testing
```

### Week 4 (NEW FEATURES)
```
Mon-Wed: Push notifications
Thu-Fri: Testing & documentation
Reserve: Buffer for issues
```

---

## 🧪 Testing Checklist

### Security Testing
- [ ] Password reset flow
- [ ] SQL injection attempts
- [ ] XSS payload testing
- [ ] CSRF token validation
- [ ] Rate limit enforcement
- [ ] Permission checking (multi-mosque)

### Functional Testing
- [ ] Prayer times calculations (5+ dates)
- [ ] Adzan audio playback (multiple devices)
- [ ] Config persistence across sessions
- [ ] Multi-mosque switching
- [ ] Wabot message sending
- [ ] Live stream loading (YouTube embed)

### Performance Testing
- [ ] Page load time (< 3 seconds)
- [ ] Prayer calculation time (< 100ms)
- [ ] Config fetch with caching (< 500ms)
- [ ] Slideshow transitions smooth

### Browser Compatibility
- [ ] Chrome/Edge (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (iOS/macOS)
- [ ] Mobile browsers (Android/iOS)

---

## 📝 Code Review Checklist

Before committing each phase:

```
Security:
- [ ] No hardcoded secrets
- [ ] Input validation in place
- [ ] Authentication checks
- [ ] XSS prevention

Code Quality:
- [ ] TypeScript strict mode
- [ ] No eslint warnings
- [ ] Functions under 50 lines
- [ ] Tests written

Performance:
- [ ] No N+1 queries
- [ ] Proper caching
- [ ] Memory leak checks
- [ ] Bundle size verified

UX:
- [ ] Loading states visible
- [ ] Error messages clear
- [ ] Accessibility tested
- [ ] Mobile responsive
```

---

## 📚 Documentation Requirements

For each phase, update:
- [ ] README.md with new features
- [ ] .env.example with all variables
- [ ] API documentation (if new endpoints)
- [ ] Deployment guide updates
- [ ] User manual (if UI changes)
- [ ] Architecture decision records (ADR)

---

## 🚀 Deployment Checklist

Before production deployment:

```
Pre-deployment:
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Backup strategy confirmed
- [ ] Rollback plan documented

During deployment:
- [ ] Blue-green deployment setup
- [ ] Health checks passing
- [ ] Monitoring alerts active
- [ ] Team on-call

Post-deployment:
- [ ] Smoke tests passed
- [ ] Error tracking verified
- [ ] Analytics working
- [ ] User feedback channels open
```

---

## 📞 Support & Escalation

**Security Issues:** → Escalate to lead immediately  
**Performance Issues:** → Check monitoring dashboards first  
**User Blocking Issues:** → Priority: HIGH  
**Enhancement Requests:** → Queue for next sprint

---

## Version Control & Branching Strategy

```
Feature branches format:
- security/csrf-tokens
- feature/push-notifications
- bugfix/memory-leak
- refactor/config-caching
- docs/api-documentation

PR checklist before merging:
- [ ] Branch up-to-date with main
- [ ] All CI checks passing
- [ ] At least 1 approval
- [ ] Tests added/updated
- [ ] Documentation updated
```

---

## Follow-up Audit Schedule

- **Post-Phase 1 Audit:** 1 week after deployment
- **Post-Phase 2 Audit:** 2 weeks after deployment
- **Quarterly Audits:** Every 3 months
- **Annual Security Audit:** By external firm

---

**Next Action:** Schedule kickoff meeting and assign Phase 1 tasks to team members.

