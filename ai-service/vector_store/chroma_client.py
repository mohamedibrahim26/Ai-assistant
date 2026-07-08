"""
ChromaDB vector store client.

Wraps chromadb to provide a simple interface for:
  - add_chunks:       store text + embeddings + metadata
  - query_collection: nearest-neighbour search by embedding
  - delete_collection: drop a collection entirely
"""
from __future__ import annotations

import logging
import uuid
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from config import settings

logger = logging.getLogger(__name__)

# ── Client (module-level singleton) ───────────────────────────────────────────

_client: Optional[chromadb.Client] = None


def _get_client() -> chromadb.Client:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        logger.info(f"ChromaDB initialised at: {settings.chroma_persist_dir}")
    return _client


def _get_or_create_collection(name: str) -> chromadb.Collection:
    client = _get_client()
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )


# ── Public API ────────────────────────────────────────────────────────────────

def add_chunks(
    collection_name: str,
    chunks: List[str],
    embeddings: List[List[float]],
    metadatas: List[Dict[str, Any]],
) -> int:
    """
    Store chunks with their pre-computed embeddings.

    Returns the number of chunks successfully stored.
    """
    if not chunks:
        return 0

    collection = _get_or_create_collection(collection_name)

    # Generate unique IDs for each chunk
    ids = [str(uuid.uuid4()) for _ in chunks]

    # Sanitise metadata — ChromaDB requires str/int/float/bool values
    safe_meta = []
    for m in metadatas:
        safe_meta.append({
            k: (str(v) if not isinstance(v, (str, int, float, bool)) else v)
            for k, v in m.items()
        })

    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=safe_meta,
    )

    logger.info(f"Stored {len(chunks)} chunks in collection '{collection_name}'")
    return len(chunks)


def query_collection(
    collection_name: str,
    query_embedding: List[float],
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Return the top-k most similar chunks for a query embedding.

    Each result dict has:
      - text     (str)
      - score    (float, cosine similarity 0-1)
      - metadata (dict)
    """
    try:
        collection = _get_or_create_collection(collection_name)
        count = collection.count()
        if count == 0:
            return []

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, count),
            include=["documents", "metadatas", "distances"],
        )

        output = []
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]

        for doc, meta, dist in zip(docs, metas, dists):
            # ChromaDB cosine distance → similarity: similarity = 1 - distance
            score = max(0.0, 1.0 - dist)
            output.append({"text": doc, "score": score, "metadata": meta or {}})

        return output

    except Exception as e:
        logger.error(f"query_collection error for '{collection_name}': {e}")
        return []


def delete_collection(collection_name: str) -> bool:
    """
    Delete a ChromaDB collection entirely.

    Returns True on success, False if the collection was not found.
    """
    try:
        client = _get_client()
        client.delete_collection(collection_name)
        logger.info(f"Deleted collection '{collection_name}'")
        return True
    except Exception as e:
        logger.warning(f"Could not delete collection '{collection_name}': {e}")
        return False
