from __future__ import annotations

from math import isfinite

from app.models.schemas import MetricDelta, MetricSnapshot, Metrics


def safe_divide(numerator: float, denominator: float) -> float | None:
    if denominator == 0:
        return None
    return numerator / denominator


def compute_metric_snapshot(metrics: Metrics) -> MetricSnapshot:
    ctr = safe_divide(metrics.clicks, metrics.impressions)
    cvr = safe_divide(metrics.conversions, metrics.clicks)
    cpa = safe_divide(metrics.spend, metrics.conversions)
    roas = None
    if metrics.revenue is not None:
        roas = safe_divide(metrics.revenue, metrics.spend)

    return MetricSnapshot(
        ctr=round(ctr, 6) if ctr is not None else None,
        cvr=round(cvr, 6) if cvr is not None else None,
        cpa=round(cpa, 6) if cpa is not None else None,
        roas=round(roas, 6) if roas is not None else None,
    )


def percentage_deviation(expected: float | None, actual: float | None) -> float | None:
    if expected is None or actual is None:
        return None
    if expected == 0:
        if actual == 0:
            return 0.0
        return 100.0
    return round(((actual - expected) / expected) * 100, 4)


def build_delta(
    expected: float | None,
    actual: float | None,
    *,
    lower_is_better: bool = False,
) -> MetricDelta:
    pct_diff = percentage_deviation(expected, actual)
    favorable = None
    if pct_diff is not None:
        favorable = pct_diff <= 0 if lower_is_better else pct_diff >= 0
    return MetricDelta(expected=expected, actual=actual, pct_diff=pct_diff, favorable=favorable)


def finite_or_default(value: float | None, default: float = 0.0) -> float:
    if value is None or not isfinite(value):
        return default
    return value
