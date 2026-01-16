"""
Redis Analytics Service
Tracks passage attempts, word difficulty, hint usage, and gameplay statistics
"""

import json
import os
import logging
from datetime import datetime
from typing import List, Dict, Optional

import redis

logger = logging.getLogger(__name__)


class RedisAnalyticsService:
    """
    Service for tracking gameplay analytics using Redis.
    Uses Streams for time-series data and Sorted Sets for aggregates.
    """

    # Redis keys
    STREAM_KEY = "cloze:analytics:stream"
    WORDS_FIRST_TRY = "cloze:analytics:words:first_try"
    WORDS_RETRY = "cloze:analytics:words:needed_retry"
    BOOKS_KEY = "cloze:analytics:books"
    SESSIONS_KEY = "cloze:analytics:sessions"

    MAX_STREAM_LEN = 10000  # Keep last 10k entries

    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize Redis Analytics Service

        Args:
            redis_url: Redis connection URL (default: REDIS_URL env var)
        """
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        self.redis_client: Optional[redis.Redis] = None
        self._connect()

    def _connect(self):
        """Establish Redis connection"""
        if not self.redis_url:
            logger.warning("No REDIS_URL provided for analytics")
            return

        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            self.redis_client.ping()
            logger.info("Redis Analytics Service connected")
        except redis.RedisError as e:
            logger.error(f"Failed to connect Redis for analytics: {e}")
            self.redis_client = None

    def is_available(self) -> bool:
        """Check if Redis is available for analytics"""
        if not self.redis_client:
            return False
        try:
            self.redis_client.ping()
            return True
        except redis.RedisError:
            return False

    def record_passage(self, data: Dict) -> Optional[str]:
        """
        Record a completed passage attempt with summary data.

        Args:
            data: Passage analytics data containing:
                - passageId: Unique ID for this passage attempt
                - sessionId: Browser session ID
                - bookTitle: Title of the book
                - bookAuthor: Author name
                - level: Current game level
                - round: Current round number
                - words: List of word data (word, attemptsToCorrect, hintsUsed, finalCorrect)
                - totalBlanks: Number of blanks in passage
                - correctOnFirstTry: Count of words correct on first attempt
                - totalHintsUsed: Total hints requested
                - passed: Whether passage was passed

        Returns:
            Stream entry ID or None if failed
        """
        if not self.redis_client:
            logger.warning("Analytics unavailable - Redis not connected")
            return None

        try:
            # Add timestamp if not present
            if "timestamp" not in data:
                data["timestamp"] = datetime.utcnow().isoformat()

            # Add to stream (time-series)
            entry_id = self.redis_client.xadd(
                self.STREAM_KEY,
                {"data": json.dumps(data)},
                maxlen=self.MAX_STREAM_LEN,
                approximate=True,
            )

            # Update word difficulty stats
            for word_data in data.get("words", []):
                word = word_data.get("word", "").lower()
                if not word:
                    continue

                attempts = word_data.get("attemptsToCorrect", 1)
                if attempts == 1 and word_data.get("finalCorrect", False):
                    # Word was correct on first try
                    self.redis_client.zincrby(self.WORDS_FIRST_TRY, 1, word)
                elif attempts > 1:
                    # Word needed retry(s)
                    self.redis_client.zincrby(self.WORDS_RETRY, 1, word)

            # Update book usage counter
            book_key = f"{data.get('bookTitle', 'Unknown')}|{data.get('bookAuthor', 'Unknown')}"
            self.redis_client.zincrby(self.BOOKS_KEY, 1, book_key)

            # Track session
            session_id = data.get("sessionId", "unknown")
            self.redis_client.sadd(self.SESSIONS_KEY, session_id)

            logger.debug(f"Recorded passage analytics: {entry_id}")
            return entry_id

        except redis.RedisError as e:
            logger.error(f"Failed to record passage analytics: {e}")
            return None

    def get_summary(self) -> Dict:
        """
        Get aggregate statistics for admin dashboard.

        Returns:
            Dictionary with:
                - totalPassages: Total recorded passages
                - totalSessions: Unique sessions
                - hardestWords: Top 10 words needing retries
                - easiestWords: Top 10 words correct on first try
                - popularBooks: Top 10 most used books
        """
        if not self.redis_client:
            return self._empty_summary()

        try:
            # Get stream length
            total_passages = self.redis_client.xlen(self.STREAM_KEY)

            # Get unique sessions count
            total_sessions = self.redis_client.scard(self.SESSIONS_KEY)

            # Get hardest words (most retries needed)
            hardest_raw = self.redis_client.zrevrange(
                self.WORDS_RETRY, 0, 9, withscores=True
            )
            hardest_words = [
                {"word": word, "retryCount": int(score)}
                for word, score in hardest_raw
            ]

            # Get easiest words (most first-try successes)
            easiest_raw = self.redis_client.zrevrange(
                self.WORDS_FIRST_TRY, 0, 9, withscores=True
            )
            easiest_words = [
                {"word": word, "firstTryCount": int(score)}
                for word, score in easiest_raw
            ]

            # Get popular books
            books_raw = self.redis_client.zrevrange(
                self.BOOKS_KEY, 0, 9, withscores=True
            )
            popular_books = []
            for book_key, count in books_raw:
                parts = book_key.split("|", 1)
                popular_books.append({
                    "title": parts[0] if parts else "Unknown",
                    "author": parts[1] if len(parts) > 1 else "Unknown",
                    "usageCount": int(count),
                })

            return {
                "totalPassages": total_passages,
                "totalSessions": total_sessions,
                "hardestWords": hardest_words,
                "easiestWords": easiest_words,
                "popularBooks": popular_books,
            }

        except redis.RedisError as e:
            logger.error(f"Failed to get analytics summary: {e}")
            return self._empty_summary()

    def _empty_summary(self) -> Dict:
        """Return empty summary structure"""
        return {
            "totalPassages": 0,
            "totalSessions": 0,
            "hardestWords": [],
            "easiestWords": [],
            "popularBooks": [],
        }

    def get_recent_passages(self, count: int = 50) -> List[Dict]:
        """
        Get recent passage attempts for display/export.

        Args:
            count: Number of recent entries to retrieve

        Returns:
            List of passage analytics records (newest first)
        """
        if not self.redis_client:
            return []

        try:
            entries = self.redis_client.xrevrange(
                self.STREAM_KEY, count=count
            )
            return [json.loads(entry[1]["data"]) for entry in entries]

        except redis.RedisError as e:
            logger.error(f"Failed to get recent passages: {e}")
            return []

    def export_all(self) -> List[Dict]:
        """
        Export all analytics data for backup/analysis.

        Returns:
            List of all passage analytics records (oldest first)
        """
        if not self.redis_client:
            return []

        try:
            entries = self.redis_client.xrange(self.STREAM_KEY)
            return [json.loads(entry[1]["data"]) for entry in entries]

        except redis.RedisError as e:
            logger.error(f"Failed to export analytics: {e}")
            return []

    def get_word_stats(self, word: str) -> Dict:
        """
        Get statistics for a specific word.

        Args:
            word: The word to look up

        Returns:
            Dictionary with first_try_count and retry_count
        """
        if not self.redis_client:
            return {"firstTryCount": 0, "retryCount": 0}

        try:
            word_lower = word.lower()
            first_try = self.redis_client.zscore(self.WORDS_FIRST_TRY, word_lower)
            retry = self.redis_client.zscore(self.WORDS_RETRY, word_lower)

            return {
                "word": word_lower,
                "firstTryCount": int(first_try) if first_try else 0,
                "retryCount": int(retry) if retry else 0,
            }

        except redis.RedisError as e:
            logger.error(f"Failed to get word stats: {e}")
            return {"firstTryCount": 0, "retryCount": 0}

    def clear_analytics(self) -> bool:
        """
        Clear all analytics data (admin function).

        Returns:
            True if successful
        """
        if not self.redis_client:
            return False

        try:
            self.redis_client.delete(
                self.STREAM_KEY,
                self.WORDS_FIRST_TRY,
                self.WORDS_RETRY,
                self.BOOKS_KEY,
                self.SESSIONS_KEY,
            )
            logger.info("Analytics data cleared")
            return True

        except redis.RedisError as e:
            logger.error(f"Failed to clear analytics: {e}")
            return False
