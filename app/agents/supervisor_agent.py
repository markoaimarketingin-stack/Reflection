from __future__ import annotations

from dataclasses import dataclass

from fastapi import BackgroundTasks

from app.agents.analysis_agent import AnalysisAgent
from app.agents.insight_agent import InsightAgent
from app.agents.memory_agent import MemoryAgent
from app.agents.pattern_agent import PatternAgent
from app.core.config import Settings
from app.models.schemas import AnalyzeCampaignResponse, CampaignPerformanceInput, StorageConfirmation
from app.services.feedback import FeedbackLoopEngine
from app.utils.io import write_json


@dataclass
class SupervisorAgent:
    settings: Settings
    analysis_agent: AnalysisAgent
    pattern_agent: PatternAgent
    insight_agent: InsightAgent
    memory_agent: MemoryAgent
    feedback_engine: FeedbackLoopEngine

    def analyze_campaign(
        self,
        payload: CampaignPerformanceInput,
        *,
        background_tasks: BackgroundTasks | None = None,
    ) -> AnalyzeCampaignResponse:
        comparison = self.analysis_agent.compare(payload)
        pattern_report = self.pattern_agent.detect(payload)
        summary_text, similar_campaigns, insights = self.insight_agent.generate(
            payload,
            comparison,
            pattern_report,
            include_similar_campaigns=background_tasks is None,
        )
        vector_saved = self.memory_agent.persist(
            payload,
            comparison,
            pattern_report,
            insights,
            summary_text=summary_text,
            background_tasks=background_tasks,
        )
        weights = self.feedback_engine.update_system_learnings(payload, comparison, pattern_report)
        output_path = (
            self._persist_outputs(payload.campaign_id, comparison, pattern_report, insights, weights)
            if self.settings.enable_local_output
            else None
        )

        return AnalyzeCampaignResponse(
            comparison_report=comparison,
            pattern_report=pattern_report,
            insights=insights,
            weights=weights,
            similar_campaigns=similar_campaigns,
            stored_memory=StorageConfirmation(
                sqlite_saved=False,
                vector_saved=vector_saved,
                output_path=str(output_path) if output_path else "",
            ),
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
