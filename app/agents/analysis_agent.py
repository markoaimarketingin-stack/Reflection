from __future__ import annotations

from dataclasses import dataclass

from app.models.schemas import CampaignPerformanceInput, ComparisonReport
from app.services.comparator import PerformanceComparator


@dataclass
class AnalysisAgent:
    comparator: PerformanceComparator

    def compare(self, payload: CampaignPerformanceInput) -> ComparisonReport:
        return self.comparator.compare_performance(payload)
