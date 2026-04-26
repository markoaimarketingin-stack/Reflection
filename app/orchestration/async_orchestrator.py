from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any, Callable

from app.orchestration.schemas import AgentExecutionResultSchema


logger = logging.getLogger(__name__)


@dataclass
class AsyncOrchestrator:
    request_id: str | None = None

    async def run_many(self, jobs: dict[str, Callable[[], Any]]) -> dict[str, AgentExecutionResultSchema]:
        names = list(jobs.keys())
        results = await asyncio.gather(
            *(self._run_job(name, jobs[name]) for name in names),
            return_exceptions=True,
        )

        execution_results: dict[str, AgentExecutionResultSchema] = {}
        for name, result in zip(names, results, strict=False):
            if isinstance(result, Exception):
                execution_results[name] = AgentExecutionResultSchema(
                    agent_name=name,
                    status="failed",
                    request_id=self.request_id or "",
                    latency_ms=0,
                    error=str(result),
                    failure_reason=type(result).__name__,
                )
            else:
                execution_results[name] = result
        return execution_results

    async def _run_job(
        self,
        name: str,
        job: Callable[[], Any],
    ) -> AgentExecutionResultSchema:
        start = time.monotonic()
        try:
            data = await asyncio.to_thread(job)
            result = AgentExecutionResultSchema(
                agent_name=name,
                status="success",
                request_id=self.request_id or "",
                latency_ms=round((time.monotonic() - start) * 1000),
                data={"result": data},
            )
            logger.info(
                "orchestrator_job_completed request_id=%s agent=%s latency_ms=%s",
                self.request_id,
                name,
                result.latency_ms,
            )
            return result
        except Exception as exc:
            result = AgentExecutionResultSchema(
                agent_name=name,
                status="failed",
                request_id=self.request_id or "",
                latency_ms=round((time.monotonic() - start) * 1000),
                error=str(exc),
                failure_reason=type(exc).__name__,
            )
            logger.warning(
                "orchestrator_job_failed request_id=%s agent=%s latency_ms=%s failure_reason=%s",
                self.request_id,
                name,
                result.latency_ms,
                result.failure_reason,
            )
            return result
