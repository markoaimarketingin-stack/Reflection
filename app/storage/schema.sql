CREATE TABLE IF NOT EXISTS campaigns (
    campaign_id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    objective TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    expected_metrics_json TEXT NOT NULL,
    actual_metrics_json TEXT NOT NULL,
    audiences_json TEXT NOT NULL,
    creatives_json TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    auto_tags_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT NOT NULL,
    comparison_json TEXT NOT NULL,
    performance_score REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
);

CREATE TABLE IF NOT EXISTS patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT NOT NULL,
    category TEXT NOT NULL,
    signal_key TEXT NOT NULL,
    summary TEXT NOT NULL,
    impact_score REAL NOT NULL,
    metadata_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
);

CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    content TEXT NOT NULL,
    priority REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
);

CREATE TABLE IF NOT EXISTS weights (
    signal_key TEXT PRIMARY KEY,
    weight REAL NOT NULL,
    successes INTEGER NOT NULL DEFAULT 0,
    failures INTEGER NOT NULL DEFAULT 0,
    last_updated TEXT NOT NULL
);
