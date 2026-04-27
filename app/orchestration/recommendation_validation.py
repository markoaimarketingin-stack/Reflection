from __future__ import annotations

import logging
from typing import Any

from pydantic import ValidationError

from app.orchestration.schemas import AgentRecommendationSchema


logger = logging.getLogger(__name__)

RecommendationSchema = AgentRecommendationSchema


def validate_recommendation_output(
    recommendations: list[Any],
    *,
    agent_name: str,
    request_id: str | None,
) -> list[dict[str, Any]]:
    valid: list[dict[str, Any]] = []

    for rec in recommendations:
        try:
            validated = RecommendationSchema.model_validate(rec)
            valid.append(validated.model_dump())
        except ValidationError as exc:
            logger.warning(
                "recommendation_schema_invalid request_id=%s agent=%s error=%s",
                request_id,
                agent_name,
                exc,
            )
        except Exception as exc:
            logger.warning(
                "recommendation_validation_failed request_id=%s agent=%s error=%s",
                request_id,
                agent_name,
                exc,
            )

    return valid
