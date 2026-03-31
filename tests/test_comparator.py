from datetime import datetime, timezone

from app.models.schemas import Audience, CampaignPerformanceInput, Creative, Metrics
from app.services.comparator import PerformanceComparator
from app.services.scoring import ScoringService


class _SettingsStub:
    pass


def _build_payload() -> CampaignPerformanceInput:
    return CampaignPerformanceInput(
        campaign_id="cmp_test",
        platform="Meta",
        objective="Lead Generation",
        expected_metrics=Metrics(
            impressions=95000,
            clicks=1900,
            conversions=76,
            spend=3800.0,
            revenue=7600.0,
        ),
        actual_metrics=Metrics(
            impressions=140000,
            clicks=4900,
            conversions=205,
            spend=3950.0,
            revenue=22500.0,
        ),
        audiences=[Audience(name="Students 18-25", attributes={"age_range": "18-25"})],
        creatives=[
            Creative(
                id="crt_001",
                type="video",
                headline="Headline",
                primary_text="Body",
            )
        ],
        timestamp=datetime(2026, 3, 29, tzinfo=timezone.utc),
    )


def test_compare_performance_calculates_expected_deltas() -> None:
    comparator = PerformanceComparator(ScoringService(_SettingsStub()))
    report = comparator.compare_performance(_build_payload())

    assert round(report.expected_rates.ctr or 0, 4) == 0.02
    assert round(report.actual_rates.ctr or 0, 4) == 0.035
    assert round(report.deltas.ctr_diff.pct_diff or 0, 2) == 75.0
    assert report.deltas.cpa_diff.favorable is True
    assert report.performance_score > 0
