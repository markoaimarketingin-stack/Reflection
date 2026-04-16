from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.core.config import Settings
from app.models.schemas import (
    CampaignPerformanceInput,
    ComparisonReport,
    InsightExtractionOutput,
    PatternReport,
    SemanticSearchResult,
)
from app.services.insight_service import InsightService
from app.storage.vector_store import SemanticMemoryStore
from app.utils.normalization import normalize_signal_value


@dataclass
class InsightAgent:
    settings: Settings
    vector_store: SemanticMemoryStore
    insight_service: InsightService
    supabase: Any

    def generate(
        self,
        payload: CampaignPerformanceInput,
        comparison: ComparisonReport,
        pattern_report: PatternReport,
        *,
        include_similar_campaigns: bool,
    ) -> tuple[str, list[SemanticSearchResult], InsightExtractionOutput]:
        summary_text = self._build_campaign_summary(payload, comparison, pattern_report)

        similar_campaigns: list[SemanticSearchResult] = []
        if include_similar_campaigns:
            similar_campaigns = self.vector_store.query_similar(
                self.supabase,
                summary_text,
                n_results=3,
            )

        insights = self.insight_service.generate_insights(
            pattern_report,
            comparison,
            similar_campaigns,
        )
        return summary_text, similar_campaigns, insights

    def _build_campaign_summary(
        self,
        payload: CampaignPerformanceInput,
        comparison: ComparisonReport,
        pattern_report: PatternReport,
    ) -> str:
        valid_audiences = []
        for audience in payload.audiences:
            audience_key = (
                audience.attributes.get("age_range")
                or audience.attributes.get("age_band")
                or audience.name
            )
            cleaned = normalize_signal_value(audience_key)
            if cleaned:
                valid_audiences.append(cleaned)

        audience_names = ", ".join(valid_audiences)
        if not audience_names:
            audience_names = ""

        valid_creatives = []
        for creative in payload.creatives:
            cleaned = normalize_signal_value(creative.type)
            if cleaned:
                valid_creatives.append(cleaned)

        creative_types = ", ".join(valid_creatives)
        if not creative_types:
            creative_types = ""

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
