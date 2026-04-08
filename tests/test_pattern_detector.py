from datetime import datetime, timezone

from app.models.schemas import Audience, CampaignPerformanceInput, Creative, Metrics
from app.services.pattern_detector import PatternDetectionEngine
from app.services.scoring import ScoringService


class _SettingsStub:
    pass


def _campaign(
    campaign_id: str,
    audience_name: str,
    creative_type: str,
    clicks: int,
    conversions: int,
    spend: float,
) -> CampaignPerformanceInput:
    return CampaignPerformanceInput(
        campaign_id=campaign_id,
        platform="Meta",
        objective="Lead Generation",
        expected_metrics=Metrics(
            impressions=100000,
            clicks=2000,
            conversions=80,
            spend=4000.0,
            revenue=8000.0,
        ),
        actual_metrics=Metrics(
            impressions=120000,
            clicks=clicks,
            conversions=conversions,
            spend=spend,
            revenue=16000.0,
        ),
        audiences=[Audience(name=audience_name, attributes={"age_range": audience_name})],
        creatives=[
            Creative(
                id=f"{campaign_id}-creative",
                type=creative_type,
                headline="Headline",
                primary_text="Body",
            )
        ],
        timestamp=datetime(2026, 3, 1, tzinfo=timezone.utc),
    )


def test_pattern_detector_surfaces_high_performing_signals() -> None:
    engine = PatternDetectionEngine(ScoringService(_SettingsStub()))
    report = engine.detect_patterns(
        [
          _campaign("cmp_a", "18-25", "video", 4000, 180, 3900.0),
          _campaign("cmp_b", "18-25", "video", 4200, 190, 4000.0),
          _campaign("cmp_c", "30-45", "image", 1800, 70, 4300.0),
        ],
        focus_campaign_id="cmp_b",
    )

    assert any("18-25" in finding.title for finding in report.winning_audiences)
    assert any(finding.signal_key == "creative_type:video" for finding in report.high_performing_creatives)
