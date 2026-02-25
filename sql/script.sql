CREATE TABLE roles (
    role_id SMALLSERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (role_name) VALUES
('Citizen'),
('Volunteer'),
('JobSeeker'),
('LGU'),
('Partner'),
('Admin');

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL,
    phone VARCHAR(30),
    role_id SMALLINT REFERENCES roles(role_id),
    profile_photo TEXT,
    barangay VARCHAR(100),
    city VARCHAR(100),
    eco_points_balance INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
    location_id BIGSERIAL PRIMARY KEY,
    barangay VARCHAR(100),
    city VARCHAR(100),
    region VARCHAR(100),
    latitude  DECIMAL(10,7),
    longitude DECIMAL(10,7)
);

CREATE TABLE hotspots (
    hotspot_id BIGSERIAL PRIMARY KEY,
    location_id BIGINT REFERENCES locations(location_id) ON DELETE CASCADE,
    severity_index NUMERIC(5,2),
    total_reports INT DEFAULT 0,
    last_reported TIMESTAMP
);

CREATE TABLE reports (
    report_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,

    latitude  DECIMAL(10,7),
    longitude DECIMAL(10,7),

    waste_type VARCHAR(30) CHECK (
        waste_type IN ('plastic','biodegradable','hazardous','e_waste','mixed')
    ),

    severity VARCHAR(20) CHECK (
        severity IN ('low','medium','high','critical')
    ),

    ai_confidence NUMERIC(5,2),

    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending','verified','rejected','cleaned')
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE waste_classifications (
    classification_id BIGSERIAL PRIMARY KEY,
    report_id BIGINT REFERENCES reports(report_id) ON DELETE CASCADE,
    category VARCHAR(30) CHECK (
        category IN ('plastic','biodegradable','hazardous','e_waste','mixed')
    ),
    ai_model VARCHAR(100),
    confidence NUMERIC(5,2)
);

CREATE TABLE eco_points (
    points_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,

    action VARCHAR(30) CHECK (
        action IN ('report','cleanup','segregation_help')
    ),

    points_earned INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE partners (
    partner_id BIGSERIAL PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(30),
    email VARCHAR(150)
);


CREATE TABLE rewards (
    reward_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES partners(partner_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    points_required INT NOT NULL,
    stock INT DEFAULT 0
);

CREATE TABLE redemptions (
    redemption_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id),
    reward_id BIGINT REFERENCES rewards(reward_id),

    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending','claimed','expired')
    ),

    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE trashcare_jobs (
    job_id BIGSERIAL PRIMARY KEY,
    posted_by BIGINT REFERENCES users(user_id),

    job_type VARCHAR(30) CHECK (
        job_type IN ('segregation','cleanup','hauling')
    ),

    description TEXT,
    location_id BIGINT REFERENCES locations(location_id),
    pay_amount NUMERIC(10,2),

    status VARCHAR(20) DEFAULT 'open' CHECK (
        status IN ('open','assigned','completed','cancelled')
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_applications (
    application_id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES trashcare_jobs(job_id) ON DELETE CASCADE,
    applicant_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,

    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending','accepted','rejected','completed')
    ),

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(job_id, applicant_id)
);

CREATE TABLE payments (
    payment_id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES trashcare_jobs(job_id),
    payer_id BIGINT REFERENCES users(user_id),
    payee_id BIGINT REFERENCES users(user_id),
    amount NUMERIC(10,2),

    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending','paid')
    ),

    payment_date TIMESTAMP
);


CREATE TABLE lgu_dashboards (
    dashboard_id BIGSERIAL PRIMARY KEY,
    lgu_id BIGINT REFERENCES users(user_id),
    barangay VARCHAR(100),
    active_hotspots INT,
    compliance_rate NUMERIC(5,2),
    predicted_waste_growth NUMERIC(5,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_logs (
    log_id BIGSERIAL PRIMARY KEY,
    report_id BIGINT REFERENCES reports(report_id),
    predicted_risk NUMERIC(5,2),
    cleanup_priority INT,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
