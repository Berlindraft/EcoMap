Entities:

- USER
- ROLE
- REPORT
- WASTE_CLASSIFICATION
- LOCATION
- HOTSPOT
- ECO_POINTS
- REWARD
- REDEMPTION
- TRASHCARE_JOB
- JOB_APPLICATION
- PAYMENT
- LGU_DASHBOARD
- ANALYTICS_LOG
- PARTNER

User

| Field | Type |
| --- | --- |
| user_id (PK) | UUID |
| full_name | string |
| email | string |
| phone | string |
| role_id (FK) | UUID |
| profile_photo | string |
| barangay | string |
| city | string |
| eco_points_balance | int |
| created_at | timestamp |

ROLE

| Field | Type |
| --- | --- |
| role_id (PK) | UUID |
| role_name | enum (Citizen, Volunteer, JobSeeker, LGU, Partner, Admin) |

REPORT

| Field | Type |
| --- | --- |
| report_id (PK) | UUID |
| user_id (FK) | UUID |
| image_url | string |
| geo_lat | decimal |
| geo_lng | decimal |
| waste_type | enum |
| severity | enum (low, medium, high, critical) |
| ai_confidence | float |
| status | enum (pending, verified, rejected, cleaned) |
| created_at | timestamp |

**WASTE_CLASSIFICATION**

| Field | Type |
| --- | --- |
| classification_id (PK) | UUID |
| report_id (FK) | UUID |
| category | enum (plastic, biodegradable, hazardous, e-waste) |
| ai_model | string |
| confidence | float |

LOCATION

| Field | Type |
| --- | --- |
| location_id (PK) | UUID |
| barangay | string |
| city | string |
| region | string |
| geo_lat | decimal |
| geo_lng | decimal |

HOTSPOT

| Field | Type |
| --- | --- |
| hotspot_id (PK) | UUID |
| location_id (FK) | UUID |
| severity_index | float |
| total_reports | int |
| last_reported | timestamp |

ECO_POINTS

| Field | Type |
| --- | --- |
| points_id (PK) | UUID |
| user_id (FK) | UUID |
| action | enum (report, cleanup, segregation_help) |
| points_earned | int |
| created_at | timestamp |

REWARD

| Field | Type |
| --- | --- |
| reward_id (PK) | UUID |
| partner_id (FK) | UUID |
| name | string |
| description | string |
| points_required | int |
| stock | int |

REDEMPTION

| Field | Type |
| --- | --- |
| redemption_id (PK) | UUID |
| user_id (FK) | UUID |
| reward_id (FK) | UUID |
| status | enum (pending, claimed, expired) |
| redeemed_at | timestamp |

PARTNER

| Field | Type |
| --- | --- |
| partner_id (PK) | UUID |
| business_name | string |
| contact_person | string |
| phone | string |
| email | string |

TRASHCARE_JOB

| Field | Type |
| --- | --- |
| job_id (PK) | UUID |
| posted_by (FK → USER) | UUID |
| job_type | enum (segregation, cleanup, hauling) |
| description | text |
| location_id (FK) | UUID |
| pay_amount | decimal |
| status | enum (open, assigned, completed, cancelled) |
| created_at | timestamp |

JOB_APPLICATION

| Field | Type |
| --- | --- |
| application_id (PK) | UUID |
| job_id (FK) | UUID |
| applicant_id (FK → USER) | UUID |
| status | enum (pending, accepted, rejected, completed) |
| applied_at | timestamp |

**PAYMENT**

| Field | Type |
| --- | --- |
| payment_id (PK) | UUID |
| job_id (FK) | UUID |
| payer_id (FK → USER) | UUID |
| payee_id (FK → USER) | UUID |
| amount | decimal |
| status | enum (pending, paid) |
| payment_date | timestamp |

LGU_DASHBOARD

| Field | Type |
| --- | --- |
| dashboard_id (PK) | UUID |
| lgu_id (FK → USER) | UUID |
| barangay | string |
| active_hotspots | int |
| compliance_rate | float |
| predicted_waste_growth | float |
| generated_at | timestamp |

ANALYTICS_LOG

| Field | Type |
| --- | --- |
| log_id (PK) | UUID |
| report_id (FK) | UUID |
| predicted_risk | float |
| cleanup_priority | int |
| model_version | string |
| created_at | timestamp |