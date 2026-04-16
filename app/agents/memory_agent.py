from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import BackgroundTasks

from app.core.config import Settings
from app.models.schemas import CampaignPerformanceInput, ComparisonReport, InsightExtractionOutput, PatternReport
from app.storage.supabase_repository import SupabaseRepository
from app.storage.vector_store import SemanticMemoryStore


@dataclass
class MemoryAgent:
    settings: Settings
    repository: SupabaseRepository
    vector_store: SemanticMemoryStore
    supabase: Any

    def persist(
        self,
        payload: CampaignPerformanceInput,
        comparison: ComparisonReport,
        pattern_report: PatternReport,
        insights: InsightExtractionOutput,
        *,
        summary_text: str,
        background_tasks: BackgroundTasks | None = None,
    ) -> bool:
        self.repository.save_campaign(
            payload,
            summary_text=summary_text,
            auto_tags=pattern_report.auto_tags,
        )
        self.repository.save_performance_log(payload.campaign_id, comparison)
        self.repository.save_pattern_report(payload.campaign_id, pattern_report)
        self.repository.save_insights(payload.campaign_id, insights)

        vector_payload = [self._build_vector_document(payload, summary_text, pattern_report.auto_tags)]
        vector_saved = False
        if background_tasks is None:
            vector_saved = self.vector_store.upsert_documents(
                self.supabase,
                vector_payload,
            )
        else:
            background_tasks.add_task(
                self.vector_store.upsert_documents,
                self.supabase,
                vector_payload,
            )
        return vector_saved

    def _build_vector_document(
        self,
        payload: CampaignPerformanceInput,
        summary_text: str,
        auto_tags: list[str],
    ) -> dict[str, Any]:
        return {
            "source_table": "campaigns",
            "source_id": payload.campaign_id,
            "agent_id": self.settings.agent_id,
            "summary": summary_text,
            "metadata": {
                "campaign_id": payload.campaign_id,
                "platform": payload.platform,
                "objective": payload.objective,
                "timestamp": payload.timestamp.isoformat(),
                "auto_tags": auto_tags,
            },
        }
