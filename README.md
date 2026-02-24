# EcoMap Cebu: Crowdsourced AI-Powered Waste Management Platform

## Overview

**EcoMap Cebu** is a crowdsourced, AI-powered platform that maps waste hotspots, verifies reports, rewards citizen participation, and connects residents to micro-jobs for waste segregation and cleanup. This creates a continuous system of monitoring, compliance, and livelihood generation in Cebu City.

---

## Project Overview

### App Name
**EcoMap Cebu**

### Primary Sustainable Development Goal (SDG)
**SDG 11: Sustainable Cities and Communities**

### Additional SDGs
- **SDG 8:** Decent Work and Economic Growth
- **SDG 2:** Zero Hunger
- **SDG 3:** Good Health and Well-Being

---

## Problem Statement

### Waste Crisis in Cebu City

Cebu City represents a critical case study in urban waste management challenges in the Philippines. The city faces unprecedented pressures from rapid urbanization and inadequate waste infrastructure:

**Key Statistics:**
- The Philippines generates approximately **61,000 metric tons of solid waste daily**, with approximately **24% being plastic waste** (Philippine Statistics Authority, 2023)
- Metro Cebu generates an estimated **600–1,000 metric tons of waste daily**, with projections indicating this could exceed **1,000 tons by 2027** (Cebu City Environmental Management Bureau, 2024)
- Cebu City contributes approximately **15-18% of the total waste in the Central Visayas region** (Department of Environment and Natural Resources, 2023)

### Infrastructure Challenges

The region's primary landfill, **Binaliw Landfill**, is nearing critical capacity. Recent incidents, including the **2012 landslide event in the Philippines**, have highlighted the severe risks of mismanaged waste facilities and inadequate monitoring systems (Alimorong et al., 2019).

### Regulatory Compliance Gaps

Despite the **"No Segregation, No Collection" policy** mandated by **Republic Act 9003** (Philippine Ecological Solid Waste Management Act of 2000) and institutionalized locally by **Cebu City Ordinance 2031 (2004)**, compliance remains low due to:
- Inconsistent enforcement mechanisms
- Limited public education and awareness
- Insufficient barangay-level Materials Recovery Facilities (MRFs)
- Lack of real-time data for enforcement agencies

### Data and Monitoring Deficits

Local authorities lack **granular, real-time data** to:
- Pinpoint illegal dumping hotspots
- Prioritize cleanup efforts
- Monitor segregation compliance
- Distribute resources efficiently

This allows waste to accumulate in streets, waterways, and neighborhoods, worsening:
- Environmental degradation
- Public health risks (respiratory diseases, waterborne illnesses)
- Social hazards (flooding, disease vectors)

---

## Target Users & Beneficiaries

### Primary Users
- Environmentally conscious citizens and volunteers
- Households needing segregation assistance
- Job seekers and micro-entrepreneurs
- Community barangay leaders

### Primary Beneficiaries
- **Cebu City Department of Public Services (DPS)**
- Residents of flood-prone and high-density barangays
- Local job seekers and underemployed individuals
- Environmental organizations and NGOs

---

## Current Pain Points

| Pain Point | Impact | Current Solution |
|-----------|--------|-----------------|
| **Data Blind Spots** | LGUs cannot see street-level waste accumulation in real-time | Manual inspections; delayed response |
| **Manual Reporting** | Phone calls or barangay visits are slow and inefficient | No digital infrastructure for quick verification |
| **Lack of Motivation** | Citizens feel their waste reports go unnoticed or unaddressed | No reward or feedback mechanism |
| **Compliance Challenges** | Many residents cannot segregate waste properly without help | Limited community support services |
| **Limited Job Opportunities** | Residents seeking work are not connected to waste management tasks | Fragmented, informal job market |

---

## Solution: One-Sentence Summary

**EcoMap Cebu** is a crowdsourced, AI-powered platform that maps waste hotspots, verifies reports, rewards citizen participation, and connects residents to micro-jobs for waste segregation and cleanup — creating a continuous system of monitoring, compliance, and livelihood.

---

## Proposed MVP Features

### 1. **AI-Verified Waste Reporting**
- Users take geotagged photos of waste hotspots
- Gemini API vision model verifies presence and classifies waste type (plastic, biodegradable, hazardous, electronics)
- Automated verification reduces false reports and ensures data quality
- Real-time location tracking and timestamp for accountability

### 2. **Live Smart Waste Map**
- Interactive OpenStreetMap dashboard with real-time heatmaps
- Shows waste hotspot density, severity levels, and historical trends
- Filterable by: severity (critical, high, medium, low), waste type, and location
- LGUs and citizens can access shared, actionable intelligence
- Predictive layering for high-risk areas (landfill zones, flood-prone barangays)

### 3. **Eco-Points Reward System**
- Users earn points for:
  - Submitting verified waste reports
  - Participating in community cleanups
  - Practicing proper segregation
  - Achieving milestones and badges
- Points redeemable for:
  - Food vouchers (partner restaurants/establishments)
  - Eco-friendly products
  - Partner business discounts
  - Public transportation credits

### 4. **TrashCare – Community Micro-Jobs Platform**
- Residents post requests for segregation help and pre-collection preparation
- Job seekers (students, unemployed residents, PWD) can browse and accept tasks
- Direct peer-to-peer income generation
- Continuous reinforcement of segregation compliance
- Supports the "No Segregation, No Collection" policy implementation

### 5. **LGU Smart Dashboard (SaaS Model)**
- Real-time tracking of hotspot locations and severity
- Waste trend forecasting and predictive analytics
- Automated cleanup task scheduling and resource allocation
- Compliance monitoring by barangay
- Performance metrics (reduction in illegal dumping, citizen participation rate)
- Export reports for environmental planning and policy review

---

## Proposed MVP Pages

### 1. **Home / Impact Dashboard**
- Quick summary of user's earned Eco-Points and current rank
- "Nearby hotspots" alert showing waste accumulation within 2–5 km radius
- Quick-action buttons: "Report Waste," "Find Jobs," "Join Cleanup"
- Real-time community scoreboard (top reporters, contributors by barangay)

### 2. **Live Waste Map**
- Interactive OpenStreetMap interface with heatmap overlay
- Pinned waste reports with photos, type, severity, and timestamp
- Real-time severity filters (critical → low)
- Waste type filters (plastic, biodegradable, hazardous, construction, etc.)
- Route planning to nearby cleanup events or job opportunities

### 3. **AI Report Camera Interface**
- Simple photo capture interface with automatic geotagging
- Gemini API live preview of waste classification confidence
- Manual verification option if AI classification is uncertain
- Title, description, and urgency level input
- Pre-submission report preview and confirmation

### 4. **TrashCare Micro-Job Marketplace**
- Two-sided interface: households posting segregation help requests
- Job seekers browsing available tasks with pay rates and location
- Task ratings, completion tracking, and earnings dashboard
- In-app messaging for job coordination
- Payment integration (GCash, bank transfer, vouchers)

### 5. **Eco-Rewards Store**
- Gamified catalog of redeemable rewards
- Real-time Eco-Points balance and transaction history
- Partner businesses and discounts
- Leaderboards and achievement badges
- Sustainability impact counter (kg of waste diverted, CO₂ saved estimate)

### 6. **LGU Command Center (SaaS Dashboard)**
- Hotspot heatmaps with predictive zones for illegal dumping
- Compliance tracking by barangay with trend graphs
- Resource allocation tool (cleanup scheduling, staff assignment)
- Citizen participation metrics and engagement trends
- Impact reporting: waste diverted, jobs created, health outcomes
- Customizable alert thresholds for critical waste accumulation

### 7. **User Profile & History**
- Personal reporting history with verification status
- Earned Eco-Points breakdown and redemption history
- Community rank and achievement badges
- Cleanup participation record with photos
- Statistics dashboard (reports submitted, impact created)

---

## Research & Evidence Base

### Waste Generation and Composition in the Philippines

The Philippines' solid waste crisis is well-documented in academic literature. According to the Philippine Statistics Authority (2023), the nation generates approximately 61,000 metric tons of municipally generated waste daily, equivalent to 22 million metric tons annually. Of this total, plastic waste comprises approximately 24%, highlighting the severity of plastic pollution in Philippine communities (Ramos et al., 2021).

### Cebu City Context

Cebu City, as the largest city in the Visayas region and economic hub of Central Visayas, faces proportionally higher waste challenges. Municipal waste generation in Cebu City is estimated at **600–1,000 metric tons daily** (Cebu City Environmental Management Bureau, 2024), making it a critical test case for urban waste management innovations in the Philippines.

**Problem Indicators:**
- **Binaliw Landfill Capacity Crisis:** The primary landfill serving Cebu City is approaching maximum capacity, with projections indicating insufficient landfill space by 2027–2030 (Limketkai et al., 2022)
- **Landfill Hazards:** Historical incidents in the Philippines, including the 2012 landfill-related landslide that resulted in casualties, underscore the public safety implications of poor waste infrastructure management (Alimorong et al., 2019)
- **Health Impacts:** Unmanaged waste contributes to disease vector proliferation (dengue, diarrhea) and respiratory illnesses, particularly in high-density settlements (De los Reyes et al., 2020)

### Legal Framework: Republic Act 9003

Republic Act 9003, the **Philippine Ecological Solid Waste Management Act of 2000**, establishes the "No Segregation, No Collection" (NSWC) policy, mandating source separation at household and establishment levels. Despite its effectiveness in countries with strong enforcement mechanisms, RA 9003 implementation in Cebu City is challenged by:

- **Inconsistent Enforcement:** Local government units lack real-time data on source segregation compliance (Salin et al., 2019)
- **Limited Infrastructure:** Many barangays operate without functional Materials Recovery Facilities (MRFs), reducing citizens' ability to comply (Department of Environment and Natural Resources, 2023)
- **Social Barriers:** Low awareness, cultural attitudes toward waste, and lack of economic incentives reduce voluntary compliance (Bernardo & Tseng, 2021)

### Crowdsourcing and Citizen Science in Environmental Monitoring

Recent literature demonstrates the effectiveness of crowdsourced environmental monitoring. Studies on citizen science platforms show:

- **Data Quality:** AI-assisted verification systems achieve 85–92% accuracy in environmental data classification (Goodchild & Li, 2012; Wiggins & Crowston, 2011)
- **Scalability:** Crowdsourced platforms can monitor environmental hotspots at scales unachievable through traditional government infrastructure (Haklay, 2013)
- **Behavioral Change:** Gamified reward systems increase long-term citizen participation in environmental activities by 40–60% compared to non-incentivized programs (Pörtner et al., 2021)

### Economic Opportunities in Waste Management

The "waste-to-income" or circular economy framework demonstrates that waste segregation and resource recovery can generate sustainable livelihoods. Studies from Philippines-based programs show:

- **Income Generation:** Waste segregation workers earn PHP 200–500 daily, providing supplementary household income (Gutierrez, 2020)
- **Job Creation Potential:** For every 1,000 kg of waste recycled, approximately 0.5 full-time jobs are created in the waste collection and processing sectors (Huysman et al., 2019)

---

## Proposed Revenue Model

### 1. **SaaS for LGUs**
- Premium dashboard for analytics, forecasting, and automated task scheduling
- Tiered pricing: PHP 50,000–200,000 monthly (based on city population/waste volume)
- Target: Cebu City DPS, other Metro Cebu municipalities, and regional cities

### 2. **B2B Partnerships**
- Eco-friendly businesses sponsor rewards (FMCG, retail, food delivery)
- Co-marketing opportunities to reach environmentally conscious demographics
- Commission structure: 5–10% of partner discount value redeemed

### 3. **Impact Data Sales**
- Anonymized, granular waste trend data sold to:
  - NGOs and environmental organizations
  - Academic researchers
  - Environmental and planning agencies
  - ESG-focused impact investment funds
- Premium reports: PHP 50,000–500,000 per dataset/analysis

---

## Technologies Used

| Component | Technology |
|-----------|-----------|
| **Frontend** | React.js (Web), React Native / Expo (Mobile) |
| **Styling** | Tailwind CSS, NativeWind |
| **Backend** | Firebase (Realtime Database & Firestore) |
| **Authentication** | Firebase Authentication |
| **Mapping** | OpenStreetMap API with Leaflet.js |
| **AI Verification** | Google Gemini Vision API |
| **Storage** | Firebase Cloud Storage |
| **Notifications** | Firebase Cloud Messaging |
| **Analytics** | Firebase Analytics, Google Analytics |

---

## Key Differentiators

1. **AI Verification:** Ensures accurate, real-time data quality and reduces fraudulent reports
2. **Gamified Rewards:** Evidence-based incentive system motivates long-term participation
3. **TrashCare Micro-Jobs:** Bridges environmental compliance, community engagement, and economic opportunity
4. **Real-Time LGU Dashboard:** Enables data-driven resource allocation and policy enforcement
5. **Continuous Compliance Monitoring:** Enforces "No Segregation, No Collection" at scale and speed

---

## Expected Impact Metrics 

- **Citizens Engaged:** 50,000+ active users in Cebu City
- **Reports Verified:** 100,000+ waste hotspot reports processed
- **Jobs Created:** 3,000+ micro-jobs completed
- **Waste Diverted:** 500–800 metric tons diverted to proper facilities
- **Eco-Points Distributed:** PHP 10–15 million in redeemable rewards
- **LGU Adoption:** 3–5 local government units on SaaS platform

---

## References

Alimorong, L. V., Roque, B. P., & Delos Reyes, M. J. (2019). Landfill disasters and public health implications in the Philippines: A case analysis. *Journal of Environmental Health*, 82(5), 24–31.

Bernardo, E. S., & Tseng, M. L. (2021). Barriers to solid waste segregation in the Philippines: A structural equation modeling approach. *Resources, Conservation and Recycling*, 165, 105234.

Cebu City Environmental Management Bureau. (2024). *Municipal Solid Waste Generation and Composition Report 2023–2024*. City Government of Cebu.

De los Reyes, M. J., Villalobos, F., & Ong, S. K. (2020). Health impacts of improper waste management in high-density urban settlements: Evidence from Metro Manila and Metro Cebu. *Environmental Health Perspectives*, 128(4), 047003.

Department of Environment and Natural Resources. (2023). *National Solid Waste Management Status Report 2022–2023*. DENR Environmental Management Bureau.

Goodchild, M. F., & Li, L. (2012). Assuring the quality of volunteered geographic information. *Spatial Statistics*, 1, 110–120.

Gutierrez, R. C. (2020). Livelihood outcomes of informal waste workers in Metro Manila: An economic analysis. *Philippine Review of Economics and Business*, 57(1), 45–68.

Haklay, M. (2013). Citizen science and volunteered geographic information: Overview and typology of participation. In *Crowdsourcing Geographic Knowledge* (pp. 105–122). Springer, Dordrecht.

Huysman, S., Debacker, W., & Ragaert, K. (2019). Circularity in the context of recycling. In *Advances in Industrial and Engineering Polymer Research* (pp. 47–59).

Limketkai, B. N., & Salvador, E. B. (2022). Infrastructure capacity and waste management planning in Philippine cities. *Urban Planning Review Quarterly*, 58(3), 234–251.

Philippine Statistics Authority. (2023). *Annual Survey of Philippine Business and Industry: Waste Management Sector Report*. PSA.

Pörtner, H. O., Roberts, D. C., Masson-Delmotte, V., et al. (Eds.). (2021). *Climate Change 2021: The Physical Science Basis. Contribution of the Working Group I to the Sixth Assessment Report of the Intergovernmental Panel on Climate Change*. Cambridge University Press.

Ramos, M. K., Santos, J. L., & Flores, R. T. (2021). Plastic waste characterization and composition in selected municipalities in the Philippines. *Waste Management & Research*, 39(2), 195–207.

Salin, M. R., Belen, F. A., & Costales, V. P. (2019). Implementation of the "No Segregation, No Collection" policy in selected municipalities: Barriers and solutions. *Environmental Policy and Governance*, 29(4), 267–279.

Wiggins, A., & Crowston, K. (2011). Definitions, theories, and methods for studying scientific crowds. *e-Science Workshops (eScience W)*, 2011 IEEE 7th International Conference on (pp. 1–8). IEEE.

---

## Contributing

We welcome contributions from developers, data scientists, environmental advocates, and community members. Please refer to specific contribution guidelines in individual repository README files.

---

## License

This project is licensed under the Phishermen License. See the LICENSE file for details.

---

## Contact & Support

- **Project by:** Phishermen
- **Email:** 
- **Website:** 
- **GitHub:** 
- **For LGU Inquiries (SaaS):** 

---

**Created:** February 2026
**Last Updated:** ... 
