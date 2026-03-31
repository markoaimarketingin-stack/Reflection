from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from threading import Lock
from typing import Any

import numpy as np

from app.core.config import Settings
from app.models.schemas import SemanticSearchResult
from app.utils.io import read_json, write_json

try:
    import chromadb
except ImportError:  # pragma: no cover - optional dependency
    chromadb = None

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - optional dependency
    OpenAI = None


@dataclass
class MemoryDocument:
    document_id: str
    summary: str
    metadata: dict[str, Any]


class SemanticMemoryStore:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._lock = Lock()
        self._backend = "fallback"
        self._client = None
        self._collection = None
        self._openai_client = None

        if settings.openai_api_key and OpenAI is not None:
            self._openai_client = OpenAI(api_key=settings.openai_api_key)

        if settings.vector_backend == "chroma" and chromadb is not None:
            try:
                self._client = chromadb.PersistentClient(path=str(settings.vector_path))
                self._collection = self._client.get_or_create_collection("reflection_memory")
                self._backend = "chroma"
            except Exception:
                self._client = None
                self._collection = None
                self._backend = "fallback"

    @property
    def backend_name(self) -> str:
        return self._backend

    def _embed_texts(self, texts: list[str]) -> list[list[float]]:
        if self._openai_client is not None:
            try:
                response = self._openai_client.embeddings.create(
                    model=self.settings.embedding_model,
                    input=texts,
                )
                return [item.embedding for item in response.data]
            except Exception:
                pass
        return [self._hash_embed(text) for text in texts]

    def _hash_embed(self, text: str, dimensions: int = 256) -> list[float]:
        vector = np.zeros(dimensions, dtype=np.float32)
        for token in text.lower().split():
            digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
            index = int(digest[:8], 16) % dimensions
            vector[index] += 1.0

        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.astype(float).tolist()

    def upsert_documents(self, documents: list[MemoryDocument]) -> bool:
        if not documents:
            return True

        summaries = [document.summary for document in documents]
        embeddings = self._embed_texts(summaries)

        if self._backend == "chroma" and self._collection is not None:
            try:
                self._collection.upsert(
                    ids=[document.document_id for document in documents],
                    documents=summaries,
                    embeddings=embeddings,
                    metadatas=[self._clean_metadata(document.metadata) for document in documents],
                )
                return True
            except Exception:
                self._backend = "fallback"

        self._upsert_fallback(documents, embeddings)
        return True

    def query_similar(
        self,
        query_text: str,
        *,
        n_results: int = 3,
    ) -> list[SemanticSearchResult]:
        query_embedding = self._embed_texts([query_text])[0]

        if self._backend == "chroma" and self._collection is not None:
            try:
                result = self._collection.query(
                    query_embeddings=[query_embedding],
                    n_results=n_results,
                )
                ids = result.get("ids", [[]])[0]
                documents = result.get("documents", [[]])[0]
                distances = result.get("distances", [[]])[0]
                metadatas = result.get("metadatas", [[]])[0]
                return [
                    SemanticSearchResult(
                        document_id=document_id,
                        campaign_id=(metadata or {}).get("campaign_id"),
                        score=round(1.0 - float(distance), 4),
                        summary=document,
                        metadata=metadata or {},
                    )
                    for document_id, document, distance, metadata in zip(
                        ids,
                        documents,
                        distances,
                        metadatas,
                    )
                ]
            except Exception:
                self._backend = "fallback"

        return self._query_fallback(query_embedding, n_results)

    def _clean_metadata(self, metadata: dict[str, Any]) -> dict[str, Any]:
        cleaned: dict[str, Any] = {}
        for key, value in metadata.items():
            if isinstance(value, (str, int, float, bool)) or value is None:
                cleaned[key] = value
            else:
                cleaned[key] = json.dumps(value)
        return cleaned

    def _upsert_fallback(
        self,
        documents: list[MemoryDocument],
        embeddings: list[list[float]],
    ) -> None:
        with self._lock:
            store = read_json(self.settings.vector_fallback_path, [])
            by_id = {item["document_id"]: item for item in store}
            for document, embedding in zip(documents, embeddings):
                by_id[document.document_id] = {
                    "document_id": document.document_id,
                    "campaign_id": document.metadata.get("campaign_id"),
                    "summary": document.summary,
                    "metadata": document.metadata,
                    "embedding": embedding,
                }
            write_json(self.settings.vector_fallback_path, list(by_id.values()))

    def _query_fallback(
        self,
        query_embedding: list[float],
        n_results: int,
    ) -> list[SemanticSearchResult]:
        with self._lock:
            store = read_json(self.settings.vector_fallback_path, [])

        if not store:
            return []

        query = np.asarray(query_embedding, dtype=np.float32)
        results: list[SemanticSearchResult] = []
        for item in store:
            embedding = np.asarray(item["embedding"], dtype=np.float32)
            score = float(np.dot(query, embedding))
            results.append(
                SemanticSearchResult(
                    document_id=item["document_id"],
                    campaign_id=item.get("campaign_id"),
                    score=round(score, 4),
                    summary=item["summary"],
                    metadata=item.get("metadata", {}),
                )
            )
        results.sort(key=lambda row: row.score, reverse=True)
        return results[:n_results]
