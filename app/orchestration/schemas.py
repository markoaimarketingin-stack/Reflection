from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class RequestTraceContext(BaseModel):
    request_id: str = Field(min_length=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AgentReasoningSchema(BaseModel):
    triggered_by: str
    metric_name: str
    metric_change: str
    supporting_data: str


class AgentMetricContextSchema(BaseModel):
    ctr: float
    cpa: float
    roas: float
    cvr: float
    trend: str


class AgentRecommendationSchema(BaseModel):
    source_recommendation_key: str
    recommendation_type: str
    platform: str
    action: str
    reasoning: AgentReasoningSchema
    confidence: float
    priority: Literal["high", "medium", "low"]
    context: AgentMetricContextSchema
    version: int
    agent_specific: dict[str, Any] = Field(default_factory=dict)


class AgentOutputSchema(BaseModel):
    agent_name: str
    recommendations: list[AgentRecommendationSchema] = Field(default_factory=list)


class AgentExecutionResultSchema(BaseModel):
    agent_name: str
    status: Literal["success", "failed"]
    request_id: str
    latency_ms: int = Field(ge=0)
    data: dict[str, Any] | None = None
    error: str | None = None
    failure_reason: str | None = None
