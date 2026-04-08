from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

from app.core.config import Settings
from app.models.schemas import (
    CampaignPerformanceInput,
    ComparisonReport,
    FeedbackSignal,
    InsightExtractionOutput,
    InsightRecord,
    PatternRecord,
    PatternReport,
)


class SQLiteRepository:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._lock = Lock()
        self._connection = sqlite3.connect(
            str(settings.database_path),
            check_same_thread=False,
        )
        self._connection.row_factory = sqlite3.Row
        self._initialize()

    def _initialize(self) -> None:
        schema_path = Path(__file__).with_name("schema.sql")
        with schema_path.open("r", encoding="utf-8") as handle:
            schema = handle.read()
        with self._lock:
            self._connection.executescript(schema)
            self._connection.commit()

    def _execute(
        self,
        query: str,
        params: tuple[Any, ...] = (),
    ) -> sqlite3.Cursor:
        with self._lock:
            cursor = self._connection.execute(query, params)
            self._connection.commit()
            return cursor

    def _executemany(
        self,
        query: str,
        params: list[tuple[Any, ...]],
    ) -> None:
        with self._lock:
            self._connection.executemany(query, params)
            self._connection.commit()

    def save_campaign(
        self,
        payload: CampaignPerformanceInput,
        *,
        summary_text: str,
        auto_tags: list[str],
    ) -> None:
        self._execute(
            """
            INSERT INTO campaigns (
                campaign_id,
                platform,
                objective,
                timestamp,
                expected_metrics_json,
                actual_metrics_json,
                audiences_json,
                creatives_json,
                summary_text,
                auto_tags_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(campaign_id) DO UPDATE SET
                platform = excluded.platform,
                objective = excluded.objective,
                timestamp = excluded.timestamp,
                expected_metrics_json = excluded.expected_metrics_json,
                actual_metrics_json = excluded.actual_metrics_json,
                audiences_json = excluded.audiences_json,
                creatives_json = excluded.creatives_json,
                summary_text = excluded.summary_text,
                auto_tags_json = excluded.auto_tags_json
            """,
            (
                payload.campaign_id,
                payload.platform,
                payload.objective,
                payload.timestamp.isoformat(),
                json.dumps(payload.expected_metrics.model_dump(mode="json")),
                json.dumps(payload.actual_metrics.model_dump(mode="json")),
                json.dumps([audience.model_dump(mode="json") for audience in payload.audiences]),
                json.dumps([creative.model_dump(mode="json") for creative in payload.creatives]),
                summary_text,
                json.dumps(auto_tags),
            ),
        )

    def save_performance_log(
        self,
        campaign_id: str,
        comparison: ComparisonReport,
    ) -> None:
        self._execute(
            """
            INSERT INTO performance_logs (
                campaign_id,
                comparison_json,
                performance_score
            )
            VALUES (?, ?, ?)
            """,
            (
                campaign_id,
                comparison.model_dump_json(),
                comparison.performance_score,
            ),
        )

    def save_pattern_report(
        self,
        campaign_id: str,
        pattern_report: PatternReport,
    ) -> None:
        findings = (
            pattern_report.winning_audiences
            + pattern_report.high_performing_creatives
            + pattern_report.budget_inefficiencies
            + pattern_report.platform_trends
            + pattern_report.clusters
        )
        if not findings:
            return

        rows = [
            (
                campaign_id,
                finding.category,
                finding.signal_key,
                finding.description,
                finding.impact_score,
                json.dumps(finding.metadata),
            )
            for finding in findings
        ]
        self._executemany(
            """
            INSERT INTO patterns (
                campaign_id,
                category,
                signal_key,
                summary,
                impact_score,
                metadata_json
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            rows,
        )

    def save_insights(
        self,
        campaign_id: str,
        insights: InsightExtractionOutput,
    ) -> None:
        rows: list[tuple[Any, ...]] = []
        for index, learning in enumerate(insights.key_learnings):
            rows.append((campaign_id, "key_learning", learning, max(1.0 - index * 0.1, 0.1)))
        for index, recommendation in enumerate(insights.recommendations):
            rows.append((campaign_id, "recommendation", recommendation, max(0.95 - index * 0.1, 0.1)))
        for anomaly in insights.anomalies:
            rows.append((campaign_id, "anomaly", anomaly, 1.0))

        if not rows:
            return

        self._executemany(
            """
            INSERT INTO insights (
                campaign_id,
                kind,
                content,
                priority
            )
            VALUES (?, ?, ?, ?)
            """,
            rows,
        )

    def fetch_campaign_history(self, limit: int | None = None) -> list[CampaignPerformanceInput]:
        query = """
            SELECT *
            FROM campaigns
            ORDER BY timestamp ASC
        """
        params: tuple[Any, ...] = ()
        if limit is not None:
            query += " LIMIT ?"
            params = (limit,)

        cursor = self._execute(query, params)
        rows = cursor.fetchall()
        history: list[CampaignPerformanceInput] = []
        for row in rows:
            history.append(
                CampaignPerformanceInput(
                    campaign_id=row["campaign_id"],
                    platform=row["platform"],
                    objective=row["objective"],
                    expected_metrics=json.loads(row["expected_metrics_json"]),
                    actual_metrics=json.loads(row["actual_metrics_json"]),
                    audiences=json.loads(row["audiences_json"]),
                    creatives=json.loads(row["creatives_json"]),
                    timestamp=datetime.fromisoformat(row["timestamp"]),
                )
            )
        return history

    def fetch_top_insights(self, limit: int) -> list[InsightRecord]:
        cursor = self._execute(
            """
            SELECT id, campaign_id, kind, content, priority, created_at
            FROM insights
            ORDER BY priority DESC, created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [
            InsightRecord(
                id=row["id"],
                campaign_id=row["campaign_id"],
                kind=row["kind"],
                content=row["content"],
                priority=row["priority"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in cursor.fetchall()
        ]

    def fetch_patterns(self, limit: int) -> list[PatternRecord]:
        cursor = self._execute(
            """
            SELECT id, campaign_id, category, signal_key, summary, impact_score, created_at
            FROM patterns
            ORDER BY ABS(impact_score) DESC, created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [
            PatternRecord(
                id=row["id"],
                campaign_id=row["campaign_id"],
                category=row["category"],
                signal_key=row["signal_key"],
                summary=row["summary"],
                impact_score=row["impact_score"],
                created_at=datetime.fromisoformat(row["created_at"]),
            )
            for row in cursor.fetchall()
        ]

    def fetch_signal_weights(self) -> dict[str, FeedbackSignal]:
        cursor = self._execute(
            """
            SELECT signal_key, weight, successes, failures, last_updated
            FROM weights
            """
        )
        result: dict[str, FeedbackSignal] = {}
        for row in cursor.fetchall():
            result[row["signal_key"]] = FeedbackSignal(
                signal_key=row["signal_key"],
                weight=row["weight"],
                successes=row["successes"],
                failures=row["failures"],
                last_updated=datetime.fromisoformat(row["last_updated"]),
            )
        return result

    def upsert_signal_weights(self, signals: list[FeedbackSignal]) -> None:
        if not signals:
            return

        rows = [
            (
                signal.signal_key,
                signal.weight,
                signal.successes,
                signal.failures,
                signal.last_updated.isoformat(),
            )
            for signal in signals
        ]
        self._executemany(
            """
            INSERT INTO weights (
                signal_key,
                weight,
                successes,
                failures,
                last_updated
            )
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(signal_key) DO UPDATE SET
                weight = excluded.weight,
                successes = excluded.successes,
                failures = excluded.failures,
                last_updated = excluded.last_updated
            """,
            rows,
        )

    def fetch_performance_scores(self, limit: int = 25) -> list[float]:
        cursor = self._execute(
            """
            SELECT performance_score
            FROM performance_logs
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [row["performance_score"] for row in cursor.fetchall()]

    def fetch_latest_campaign_summary(self) -> str | None:
        cursor = self._execute(
            """
            SELECT summary_text
            FROM campaigns
            ORDER BY timestamp DESC
            LIMIT 1
            """
        )
        row = cursor.fetchone()
        if row is None:
            return None
        return row["summary_text"]

    def current_timestamp(self) -> datetime:
        return datetime.now(timezone.utc)
