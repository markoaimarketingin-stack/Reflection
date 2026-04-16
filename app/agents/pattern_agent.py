from __future__ import annotations

from dataclasses import dataclass

from app.models.schemas import CampaignPerformanceInput, PatternReport
from app.services.pattern_detector import PatternDetectionEngine
from app.storage.supabase_repository import SupabaseRepository


@dataclass
class PatternAgent:
    repository: SupabaseRepository
    pattern_detector: PatternDetectionEngine

    def detect(self, payload: CampaignPerformanceInput) -> PatternReport:
        history = self.repository.fetch_campaign_history()
        return self.pattern_detector.detect_patterns(
            history + [payload],
            focus_campaign_id=payload.campaign_id,
        )
