from __future__ import annotations

from dataclasses import dataclass

from app.core.config import Settings
from app.models.schemas import (
    AnalyzeCampaignResponse,
    CampaignPerformanceInput,
    RecommendationResponse,
    StorageConfirmation,
)
from app.services.comparator import PerformanceComparator
from app.services.feedback import FeedbackLoopEngine
from app.services.insight_service import InsightService
from app.services.pattern_detector import PatternDetectionEngine
from app.services.scoring import ScoringService
from app.storage.sqlite import SQLiteRepository
from app.storage.vector_store import MemoryDocument, SemanticMemoryStore
from app.utils.io import write_json


@dataclass
class ReflectionLearningEngine:
    settings: Settings
    repository: SQLiteRepository
    vector_store: SemanticMemoryStore
    comparator: PerformanceComparator
    pattern_detector: PatternDetectionEngine
    insight_service: InsightService
    feedback_engine: FeedbackLoopEngine
    scoring_service: ScoringService

    def analyze_campaign(self, payload: CampaignPerformanceInput) -> AnalyzeCampaignResponse:
        history = self.repository.fetch_campaign_history()
        comparison = self.comparator.compare_performance(payload)
        pattern_report = self.pattern_detector.detect_patterns(
            history + [payload],
            focus_campaign_id=payload.campaign_id,
        )

        summary_text = self._build_campaign_summary(payload, comparison, pattern_report)
        similar_campaigns = self.vector_store.query_similar(summary_text, n_results=3)
        insights = self.insight_service.generate_insights(pattern_report, comparison, similar_campaigns)

        self.repository.save_campaign(
            payload,
            summary_text=summary_text,
            auto_tags=pattern_report.auto_tags,
        )
        self.repository.save_performance_log(payload.campaign_id, comparison)
        self.repository.save_pattern_report(payload.campaign_id, pattern_report)
        self.repository.save_insights(payload.campaign_id, insights)

        vector_saved = self.vector_store.upsert_documents(
            [
                MemoryDocument(
                    document_id=f"campaign::{payload.campaign_id}",
                    summary=summary_text,
                    metadata={
                        "campaign_id": payload.campaign_id,
                        "platform": payload.platform,
                        "objective": payload.objective,
                        "timestamp": payload.timestamp.isoformat(),
                        "auto_tags": pattern_report.auto_tags,
                    },
                )
            ]
        )
        weights = self.feedback_engine.update_system_learnings(payload, comparison, pattern_report)
        output_path = self._persist_outputs(payload.campaign_id, comparison, pattern_report, insights, weights)

        return AnalyzeCampaignResponse(
            comparison_report=comparison,
            pattern_report=pattern_report,
            insights=insights,
            weights=weights,
            similar_campaigns=similar_campaigns,
            stored_memory=StorageConfirmation(
                sqlite_saved=True,
                vector_saved=vector_saved,
                output_path=str(output_path),
            ),
        )

    def get_top_insights(self, limit: int | None = None):
        return self.repository.fetch_top_insights(limit or self.settings.insights_limit)

    def get_patterns(self, limit: int = 20):
        return self.repository.fetch_patterns(limit)

    def get_recommendations(
        self,
        *,
        platform: str | None = None,
        objective: str | None = None,
    ) -> RecommendationResponse:
        top_insights = self.repository.fetch_top_insights(self.settings.insights_limit)
        top_patterns = self.repository.fetch_patterns(10)
        weight_snapshot = self.feedback_engine.get_current_snapshot()
        query_text = self.repository.fetch_latest_campaign_summary() or "campaign planning baseline"
        if platform or objective:
            query_text = f"{query_text} platform={platform or 'any'} objective={objective or 'any'}"

        similar_campaigns = self.vector_store.query_similar(query_text, n_results=3)
        return self.insight_service.generate_recommendations(
            top_insights,
            top_patterns,
            weight_snapshot.signal_weights,
            similar_campaigns,
            platform=platform,
            objective=objective,
        )

    def _build_campaign_summary(
        self,
        payload: CampaignPerformanceInput,
        comparison,
        pattern_report,
    ) -> str:
        audience_names = ", ".join(
            [
                audience.attributes.get("age_range")
                or audience.attributes.get("age_band")
                or audience.name
                for audience in payload.audiences
            ]
        ) or "unknown audience"
        creative_types = ", ".join(creative.type for creative in payload.creatives) or "unknown creative"
        comparison_summary = " ".join(comparison.summary[:3]) or "No metric deltas available."
        tags = ", ".join(pattern_report.auto_tags) or "no tags"

        return (
            f"Campaign {payload.campaign_id} on {payload.platform} for {payload.objective}. "
            f"Audiences: {audience_names}. Creatives: {creative_types}. "
            f"Actual CTR {comparison.actual_rates.ctr or 0:.2%}, CVR {comparison.actual_rates.cvr or 0:.2%}, "
            f"CPA {comparison.actual_rates.cpa or 0:.2f}. "
            f"Forecast delta summary: {comparison_summary} "
            f"Campaign tags: {tags}."
        )

    def _persist_outputs(
        self,
        campaign_id: str,
        comparison,
        pattern_report,
        insights,
        weights,
    ):
        campaign_output_dir = self.settings.output_dir / campaign_id
        write_json(campaign_output_dir / "comparison.json", comparison)
        write_json(campaign_output_dir / "patterns.json", pattern_report)
        write_json(campaign_output_dir / "insights.json", insights)
        write_json(campaign_output_dir / "updated_weights.json", weights)
        return campaign_output_dir
