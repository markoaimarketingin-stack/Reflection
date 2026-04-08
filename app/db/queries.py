"""
Supabase query helpers.
All operations use the Supabase Python client (not raw psycopg2).
Pass the client instance from bootstrap.get_supabase_client().
"""
from __future__ import annotations

import os
from typing import Any

_AGENT_ID = os.getenv("agent_id")


def insert_embedding(
    supabase,
    source_table: str,
    source_id: str,
    summary: str,
    embedding: list[float],
    agent_id: str | None = None,
) -> None:
    supabase.table("agent_embeddings").insert(
        {
            "source_table": source_table,
            "source_id": source_id,
            "agent_id": agent_id or _AGENT_ID,
            "summary": summary,
            "embedding": embedding,
        }
    ).execute()


def search_similar_embeddings(
    supabase,
    query_embedding: list[float],
    match_count: int = 5,
) -> list[dict[str, Any]]:
    response = supabase.rpc(
        "match_agent_embeddings",
        {
            "query_embedding": query_embedding,
            "p_agent_id": agent_id,
            "match_count": match_count,
        },
    ).execute()
    return response.data or []