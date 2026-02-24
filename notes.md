# EcoMap Cebu - Project Notes & Research Documentation

## Project Overview
**EcoMap Cebu** is a comprehensive waste management platform designed to address the critical solid waste crisis in Cebu City through AI verification, citizen participation, and economic incentives.

---

## Research Base & Problem Validation

### Philippine Waste Crisis
- **Daily Waste Generation:** 61,000 metric tons nationally (Philippine Statistics Authority, 2023)
- **Plastic Composition:** ~24% of total waste
- **Cebu City Contribution:** 600–1,000 MT daily (15–18% of Central Visayas region)
- **Projection:** Waste generation expected to exceed 1,000 MT/day by 2027

### Cebu City Infrastructure Challenges
1. **Binaliw Landfill Crisis**
   - Operating beyond optimal capacity
   - Nearing maximum lifespan by 2027–2030
   - Seasonal flooding and landslide risks
   - Reference: Limketkai et al., 2022

2. **Health Implications**
   - Unmanaged waste → disease vector proliferation
   - Increases: dengue, diarrhea, respiratory illnesses
   - High-density barangays disproportionately affected
   - Source: De los Reyes et al., 2020

3. **Regulatory Framework**
   - Republic Act 9003 (ESWM Act of 2000)
   - "No Segregation, No Collection" (NSWC) policy mandated
   - Cebu City Ordinance 2031 (2004) institutionalizes RA 9003
   - Challenge: Low compliance due to lack of enforcement infrastructure

### Key Barriers to RA 9003 Implementation (Salin et al., 2019)
```
Barrier Category           Impact Level    Solution Approach
────────────────────────────────────────────────────────────
Inconsistent Enforcement      HIGH         Real-time monitoring dashboard
Limited MRF Infrastructure    HIGH         Community partnership model
Low Public Awareness          MEDIUM       Gamified education + rewards
Lack of Economic Incentive    HIGH         TrashCare micro-jobs
Social/Cultural Factors       MEDIUM       Community engagement strategy
```

---

## Technology Validation & Best Practices

### AI Verification Systems
- **Accuracy Rate:** 85–92% for environmental data classification (Goodchild & Li, 2012)
- **Tools Selected:** Google Gemini Vision API
  - Reasoning: Multi-modal capability, cost-effective for volume, trained on waste categorization
  - Alternative considered: AWS Rekognition (comparable pricing, less customization)

### Crowdsourced Environmental Monitoring
**Evidence Base:**
- Crowdsourced platforms effectively monitor at scale (Haklay, 2013)
- Citizen science data quality validated when AI-assisted (Wiggins & Crowston, 2011)
- Scalability: Can cover 100,000+ hotspots vs. 50–100 with traditional inspections

**Success Indicators from Literature:**
- iNaturalist: 100M+ observations with 95%+ identification accuracy
- Google Maps Community: 200M+ contributors worldwide
- Waze: Real-time crowd-sourced traffic data in 70+ countries

### Gamification & Behavioral Economics
**Research Findings:**
- Gamified environmental programs increase participation 40–60% vs. non-incentivized (Pörtner et al., 2021)
- Reward systems most effective when:
  - Immediate (real-time point accrual)
  - Tangible (redeemable for valued items)
  - Social (leaderboards, badges, recognition)
  - Progressive (tiered rewards encourage mastery)

### Micro-Jobs & Circular Economy
**Economic Potential:**
- Waste segregation workers earn PHP 200–500 daily (Gutierrez, 2020)
- Job creation: 0.5 full-time jobs per 1,000 kg waste recycled (Huysman et al., 2019)
- Income multiplier: Each PHP 1 earned in waste work → PHP 1.80–2.00 in local economy

---

## Market Analysis

### Target Market Size (Cebu City)
- **Population:** ~1.3 million
- **Target User Penetration:** 5–10% Year 1 (65,000–130,000 users)
- **Conservative Goal:** 50,000 active users within 12 months
- **Revenue Assumption:** PHP 5–10 per monthly active user (subscription-adjacent)

### Competitive Landscape
| Competitor | Capability | Gap | EcoMap Advantage |
|-----------|-----------|-----|-----------------|
| Google Maps + Local Reports | Mapping, crowdsourcing | No waste classification, no verification | AI verification + waste-specific |
| Manual LGU Hotlines | Government collection | Slow, unstructured, limited coverage | Real-time, digital, scalable |
| Social Media Posts | Awareness raising | No structured data, no action | Actionable intelligence, verification |
| eBay/OLX Marketplace | Job matching | Not waste/segregation focused | Waste-specific, impact-driven |

### Revenue Streams

**Stream 1: SaaS for LGUs**
- Target: Cebu City DPS (primary), 3–5 municipalities
- Pricing: PHP 50,000–200,000/month (tiered by population)
- 24-month projection: 5 LGUs × PHP 100,000 avg = PHP 6M/year

**Stream 2: B2B Partnerships**
- Partners: Eco-brands, food establishments, retailers
- Commission: 5–10% on redeemed vouchers
- Projection: 20–30 partners × PHP 50,000 avg annual spend = PHP 1–1.5M/year

**Stream 3: Impact Data Sales**
- Buyers: NGOs, researchers, environmental consultants, ESG funds
- Premium reports: PHP 50,000–500,000 per dataset
- Projection: 10–15 clients × PHP 100,000 avg = PHP 1–1.5M/year

**Year 1 Blended Revenue Target:** PHP 8–9 million

---

## Development Roadmap

### Phase 1: MVP (Months 1–4)
**Deliverables:**
- [ ] Core mobile app (iOS/Android via React Native + Expo)
- [ ] Waste reporting + photo upload with geotagging
- [ ] Gemini API integration for waste classification
- [ ] Basic Eco-Points reward system
- [ ] Simple OpenStreetMap heatmap dashboard
- [ ] User authentication & profiles

**Success Metrics:**
- 100+ beta testers
- 500+ verified waste reports
- 85%+ AI classification accuracy

### Phase 2: Marketplace & Dashboard (Months 5–8)
**Deliverables:**
- [ ] TrashCare micro-job marketplace
- [ ] LGU command center (SaaS dashboard)
- [ ] Reward redemption partner integration
- [ ] Leaderboards & achievement system
- [ ] Mobile notifications for new jobs/hotspots

**Success Metrics:**
- 50 job postings
- 1,000+ active users
- 3+ LGU deployments (pilot)

### Phase 3: Scale & Optimization (Months 9–12)
**Deliverables:**
- [ ] Advanced predictive analytics (hotspot forecasting)
- [ ] Compliance monitoring dashboard enhancement
- [ ] Payment gateway integration (GCash, bank transfer)
- [ ] Community forums & educational content
- [ ] API for third-party integration

**Success Metrics:**
- 50,000+ users
- 100,000+ verified reports
- 5 LGU live deployments
- PHP 2M+ generated revenue

---

## Data & Privacy Considerations

### Data Collection
1. **User-Generated Data**
   - Photos (with metadata: GPS, timestamp)
   - Location data (continuous tracking for hotspot mapping)
   - User profile (basic demographics for segmentation)

2. **Sensitive Data Handling**
   - GDPR/LGPD compliance mechanisms
   - Data Privacy Act of 2012 (RA 10173) compliance
   - Anonymization for aggregate reporting

### Privacy Safeguards
- [ ] End-to-end encryption for photos
- [ ] Geofencing (blur exact location for sensitive areas)
- [ ] User consent management
- [ ] Data retention policies (30–90 days for photos, 2 years for aggregates)
- [ ] Regular security audits

---

## Stakeholder Engagement Strategy

### Local Government (Cebu City DPS)
**Value Proposition:**
- Real-time waste hotspot data for resource allocation
- Automated compliance monitoring for NSWC policy
- Reduced landfill operational pressure
- Data-driven policy recommendations

**Engagement Timeline:**
- Month 2: Initial meeting with City Environment Officer
- Month 4: Pilot deployment (1–2 barangays)
- Month 8: Citywide rollout discussion

### Community Partners
**Types:**
- Barangay officials (implementation support)
- Environmental NGOs (promotion, community trust)
- Business improvement districts (job opportunities)
- Hawkers/vendors association (awareness, participation)

**Incentives:**
- Free app usage for community leaders
- Co-branding opportunities
- Community recognition (leaderboards, events)

### Private Sector Partners
**Eco-friendly Brands:**
- Reward sponsorship
- Co-marketing campaigns
- ESG impact reporting

---

## Technical Architecture Notes

### Frontend Stack (Mobile)
```
App Architecture: React Native + Expo
├── Navigation: Expo Router
├── Styling: NativeWind + Tailwind CSS
├── State Management: Context API / Zustand
├── Maps: React-Leaflet (web), Leaflet.gl (mobile)
├── File Upload: Expo Document Picker + Firebase Storage
└── Forms: React Hook Form + Zod validation
```

### Backend Services
```
Firebase Architecture:
├── Firestore: User profiles, reports, jobs, points
├── Realtime DB: Live chatting (TrashCare messaging)
├── Cloud Functions: AI validation trigger, notifications
├── Cloud Storage: Photo archives
├── Authentication: Email/Phone with OAuth2
└── Hosting: Firebase Hosting (web dashboard)
```

### AI/ML Pipeline
```
Waste Classification Pipeline:
├── Input: Photo + location + timestamp
├── Validation: Gemini Vision API (multi-label classification)
├── Output: [waste_type, confidence, severity, location]
├── Storage: Firestore + BigQuery (analytics)
└── Feedback Loop: User corrections → retraining signal
```

---

## Success Criteria & KPIs (Year 1)

### User Adoption
- 50,000+ active monthly users
- 10,000+ job completions
- 100,000+ verified waste reports
- 5+ LGU deployments

### Environmental Impact
- 500–800 MT waste diverted to proper facilities
- 10,000+ households converted to segregation practice
- 3–5 illegal dumping hotspots eliminated

### Financial Health
- Revenue: PHP 8–10 million
- Cost-per-acquisition: < PHP 100/user
- Lifetime value: PHP 500–1,000/user (Year 1+)

### Community Engagement
- 40,000+ Eco-Points distributed (PHP 10–15M value)
- 200+ business partnerships
- 90%+ user satisfaction score (NPS > 50)

---

## Risk Assessment & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Low adoption rate | HIGH | Intensive community marketing, influencer partnerships |
| AI classification errors | MEDIUM | Manual verification option, continuous retraining |
| LGU resistance to change | HIGH | Demonstrate ROI quickly with pilot data |
| Payment gateway delays | MEDIUM | Phased rollout (vouchers → mobile money → bank) |
| Data privacy concerns | HIGH | Transparent privacy policy, third-party audit, GDPR ready |
| Waste report fraud | MEDIUM | Human spot-checks, AI anomaly detection, reputation system |
| Platform scaling bottlenecks | MEDIUM | Early load testing, auto-scaling Firebase config |

---

## Future Features (Post-MVP)

1. **AI Predictive Hotspot Model**
   - Machine learning model predicting waste accumulation 7–14 days ahead
   - Integrates: historical data, weather patterns, event calendar

2. **Mobile Payment Integration**
   - GCash, PayMaya, bank transfer for job completions
   - Blockchain-based impact certificates for ESG reporting

3. **AR Waste Segregation Guide**
   - In-app AR tutorial for household waste segregation
   - Guides: materials → bin color → collection info

4. **Community Challenges**
   - Monthly competitions: "Cleanest Barangay," "Most Active Reporter"
   - Prizes: cash, vouchers, public recognition

5. **Integration with Existing Systems**
   - Connect to LGU billing systems for job payment
   - Export data to DENR waste management databases
   - API for third-party waste collection services

---

## Learning Resources & References

### Academic Literature
- **Waste Management:** Salin et al., 2019; De los Reyes et al., 2020
- **Crowdsourcing:** Haklay, 2013; Goodchild & Li, 2012
- **Gamification:** Pörtner et al., 2021
- **Economics:** Gutierrez, 2020; Huysman et al., 2019

### Technical References
- OpenStreetMap API: https://docs.openstreetmap.org
- Google Gemini Vision: https://cloud.google.com/vertex-ai/docs/vision
- Firebase Documentation: https://firebase.google.com/docs
- React Native Best Practices: https://reactnative.dev/docs/getting-started

### Policy & Compliance
- Republic Act 9003 (full text): https://lawphil.net/statutes/repacts/ra2000/ra_9003_2000.html
- RA 10173 (Data Privacy Act): https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html
- DENR Administrative Order: https://www.denr.gov.ph/

---

## Team Roles & Responsibilities (Planning)

| Role | Responsibility | Skills |
|------|---------------|---------|-|
| **Project Lead** | Overall vision, LGU relations, funding | Product strategy, government relations |
| **Backend Engineer** | Firebase setup, cloud functions, APIs | Python, Node.js, cloud infrastructure |
| **Frontend Engineer** | React Native app, web dashboard UI | React, mobile dev, UI/UX |
| **ML/AI Specialist** | Gemini integration, waste classification, training | Python, computer vision, ML Ops |
| **Community Manager** | User onboarding, partnerships, feedback | Community engagement, communication |
| **Data Analyst** | Reporting, impact metrics, insights | Analytics, SQL, data visualization |

---

## Meeting Notes & Decisions

### Decision Log
1. **Tech Stack:** Firebase chosen for rapid scaling without managing infrastructure
2. **AI Provider:** Google Gemini selected over AWS Rekognition (cost + customization)
3. **MVP Scope:** Focus on reporting + mapping before marketplace (validate core value)
4. **Revenue Priority:** SaaS LGU dashboard prioritized over B2B partnerships (higher margin)

---

## Contact & Resources
- **Project Repository:** [GitHub Link]
- **Documentation Wiki:** [Notion/Confluence Link]
- **Slack Channel:** #ecomap-cebu
- **Weekly Standup:** Tuesdays, 2:00 PM

---

**Last Updated:** February 24, 2026
**Document Version:** 1.0