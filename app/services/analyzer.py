from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import BackgroundTasks

from app.agents.supervisor_agent import SupervisorAgent
from app.core.config import Settings
from app.models.schemas import (
    AnalyzeCampaignResponse,
    CampaignPerformanceInput,
    RecommendationResponse,
)
from app.services.comparator import PerformanceComparator
from app.services.feedback import FeedbackLoopEngine
from app.services.insight_service import InsightService
from app.services.pattern_detector import PatternDetectionEngine
from app.services.scoring import ScoringService
from app.storage.supabase_repository import SupabaseRepository
from app.storage.vector_store import SemanticMemoryStore


@dataclass
class ReflectionLearningEngine:
    settings: Settings
    repository: SupabaseRepository
    vector_store: SemanticMemoryStore
    comparator: PerformanceComparator
    pattern_detector: PatternDetectionEngine
    insight_service: InsightService
    feedback_engine: FeedbackLoopEngine
    scoring_service: ScoringService
    supabase: Any
    supervisor_agent: SupervisorAgent

    def analyze_campaign(
        self,
        payload: CampaignPerformanceInput,
        *,
        background_tasks: BackgroundTasks | None = None,
    ) -> AnalyzeCampaignResponse:
        return self.supervisor_agent.analyze_campaign(
            payload,
            background_tasks=background_tasks,
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
        include_similar_campaigns: bool = True,
    ) -> RecommendationResponse:
        top_insights = self.repository.fetch_top_insights(self.settings.insights_limit)
        top_patterns = self.repository.fetch_patterns(10)
        weight_snapshot = self.feedback_engine.get_current_snapshot()
        query_text = self.repository.fetch_latest_campaign_summary() or "campaign planning baseline"
        if platform or objective:
            query_text = f"{query_text} platform={platform or 'any'} objective={objective or 'any'}"

        similar_campaigns = []
        if include_similar_campaigns:
            similar_campaigns = self.vector_store.query_similar(
                self.supabase,
                query_text,
                n_results=3,
            )
        return self.insight_service.generate_recommendations(
            top_insights,
            top_patterns,
            weight_snapshot.signal_weights,
            similar_campaigns,
            platform=platform,
            objective=objective,
        )
