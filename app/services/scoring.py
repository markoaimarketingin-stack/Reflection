from __future__ import annotations

from dataclasses import dataclass

from app.core.config import Settings
from app.models.schemas import Metrics
from app.utils.metrics import compute_metric_snapshot, finite_or_default


DEFAULT_SCORING_WEIGHTS = {
    "conversion_weight": 1.0,
    "ctr_weight": 1000.0,
    "cpa_weight": 1.0,
}


@dataclass
class ScoringService:
    settings: Settings

    def base_weights(self) -> dict[str, float]:
        return dict(DEFAULT_SCORING_WEIGHTS)

    def compute_performance_score(
        self,
        metrics: Metrics,
        weights: dict[str, float] | None = None,
    ) -> float:
        active_weights = weights or self.base_weights()
        snapshot = compute_metric_snapshot(metrics)
        ctr = finite_or_default(snapshot.ctr)
        cpa = finite_or_default(snapshot.cpa, default=metrics.spend)

        score = (
            (active_weights["conversion_weight"] * metrics.conversions)
            + (active_weights["ctr_weight"] * ctr)
            - (active_weights["cpa_weight"] * cpa)
        )
        return round(score, 4)
