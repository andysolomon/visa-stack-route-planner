# IMPLEMENTATION_PLAN

## Objective
Build a visa-compliance route planner that helps long-term travelers sequence destinations while staying inside legal stay windows.

## Phases

### Phase 1: Foundation
- User accounts and traveler profile model
- Passport and trip-preference setup
- App shell with protected dashboard routes

### Phase 2: Visa Rules Model
- Country-level visa constraints model
- Rolling window logic (including Schengen tracking)
- Rule source ingestion and update pipeline

### Phase 3: Route Planning Engine
- Itinerary input and destination sequence builder
- Compliance validator across planned date ranges
- Alternative route suggestion for invalid sequences

### Phase 4: Alerts and Change Tracking
- Deadline and overstay-risk alerts
- Policy-change impact checks for saved itineraries
- Timeline and compliance status views

### Phase 5: Monetization and Access
- Free tier with limited route scope
- Paid tiers for unlimited routes and advanced alerts
- Subscription entitlement checks in app/API layer

### Phase 6: Hardening and Launch
- Reliability and validation edge-case hardening
- Regression coverage for visa/rule logic
- Deployment and release readiness
