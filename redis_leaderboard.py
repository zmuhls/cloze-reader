"""
Redis Leaderboard Service
Manages leaderboard data using Redis sorted sets with HF Space fallback
"""

import json
import os
import logging
import threading
from datetime import datetime
from typing import List, Dict, Optional

import redis
import httpx

logger = logging.getLogger(__name__)


class RedisLeaderboardService:
    """
    Service for managing leaderboard data using Redis sorted sets.
    Falls back to HF Space API when Redis is unavailable.
    Syncs to HF Space as backup on each write.
    """

    LEADERBOARD_KEY = "cloze:leaderboard"
    MAX_ENTRIES = 10

    def __init__(
        self,
        redis_url: Optional[str] = None,
        hf_fallback_url: str = "https://milwright-cloze-leaderboard.hf.space",
        hf_token: Optional[str] = None,
    ):
        """
        Initialize Redis Leaderboard Service

        Args:
            redis_url: Redis connection URL (default: REDIS_URL env var)
            hf_fallback_url: HF Space URL for fallback operations
            hf_token: HF token for syncing to HF Space (default: HF_TOKEN env var)
        """
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        self.hf_fallback_url = hf_fallback_url
        self.hf_token = hf_token or os.getenv("HF_TOKEN")
        self.redis_client: Optional[redis.Redis] = None

        self._connect_redis()

        if self.redis_client:
            logger.info("Redis Leaderboard Service initialized with Redis")
            # Seed from HF Space if Redis is empty (data migration)
            self._seed_from_hf_if_empty()
        else:
            logger.warning("Redis unavailable, using HF Space fallback only")

    def _connect_redis(self):
        """Establish Redis connection if URL is available"""
        if not self.redis_url:
            logger.warning("No REDIS_URL provided")
            return

        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            # Test connection
            self.redis_client.ping()
            logger.info(f"Connected to Redis")
        except redis.RedisError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None

    def _compute_score(self, level: int, round_num: int, passages: int) -> float:
        """
        Compute composite score for Redis sorted set ordering.
        Higher scores = better performance.

        Score formula: level * 1,000,000 + round * 1,000 + passages
        This ensures proper ordering: level > round > passages
        """
        return level * 1_000_000 + round_num * 1_000 + passages

    def _entry_to_member(self, entry: Dict) -> str:
        """Convert entry dict to Redis sorted set member (JSON string)"""
        # Ensure date is set
        if "date" not in entry or not entry["date"]:
            entry["date"] = datetime.utcnow().isoformat()
        return json.dumps(entry, sort_keys=True)

    def _member_to_entry(self, member: str) -> Dict:
        """Convert Redis sorted set member back to entry dict"""
        return json.loads(member)

    def get_leaderboard(self) -> List[Dict]:
        """
        Get current leaderboard data (top 10 entries)

        Returns:
            List of leaderboard entries sorted by rank (best first)
        """
        if self.redis_client:
            try:
                # Get top entries from sorted set (highest scores first)
                members = self.redis_client.zrevrange(
                    self.LEADERBOARD_KEY, 0, self.MAX_ENTRIES - 1
                )
                return [self._member_to_entry(m) for m in members]
            except redis.RedisError as e:
                logger.error(f"Redis error in get_leaderboard: {e}")
                # Fall through to HF fallback

        return self._fallback_get()

    def add_entry(self, entry: Dict) -> bool:
        """
        Add new entry to leaderboard

        Args:
            entry: Leaderboard entry with keys: initials, level, round, passagesPassed

        Returns:
            True if successful, False otherwise
        """
        # Normalize entry
        normalized = {
            "initials": entry.get("initials", "???"),
            "level": entry.get("level", 1),
            "round": entry.get("round", 1),
            "passagesPassed": entry.get("passagesPassed", 0),
            "date": entry.get("date") or datetime.utcnow().isoformat(),
        }

        if self.redis_client:
            try:
                score = self._compute_score(
                    normalized["level"],
                    normalized["round"],
                    normalized["passagesPassed"],
                )
                member = self._entry_to_member(normalized)

                # Add to sorted set
                self.redis_client.zadd(self.LEADERBOARD_KEY, {member: score})

                # Trim to top N entries (remove lowest scores)
                # zremrangebyrank removes by rank (0 = lowest score)
                current_size = self.redis_client.zcard(self.LEADERBOARD_KEY)
                if current_size > self.MAX_ENTRIES:
                    self.redis_client.zremrangebyrank(
                        self.LEADERBOARD_KEY, 0, current_size - self.MAX_ENTRIES - 1
                    )

                logger.info(
                    f"Added entry to Redis: {normalized['initials']} - Level {normalized['level']}"
                )

                # Sync to HF Space in background (non-blocking)
                self._async_sync_to_hf()

                return True

            except redis.RedisError as e:
                logger.error(f"Redis error in add_entry: {e}")
                # Fall through to HF fallback

        return self._fallback_add(normalized)

    def update_leaderboard(self, entries: List[Dict]) -> bool:
        """
        Replace entire leaderboard with new data

        Args:
            entries: Complete leaderboard data

        Returns:
            True if successful, False otherwise
        """
        if self.redis_client:
            try:
                # Clear existing leaderboard
                self.redis_client.delete(self.LEADERBOARD_KEY)

                # Add all entries
                for entry in entries[: self.MAX_ENTRIES]:
                    normalized = {
                        "initials": entry.get("initials", "???"),
                        "level": entry.get("level", 1),
                        "round": entry.get("round", 1),
                        "passagesPassed": entry.get("passagesPassed", 0),
                        "date": entry.get("date") or datetime.utcnow().isoformat(),
                    }
                    score = self._compute_score(
                        normalized["level"],
                        normalized["round"],
                        normalized["passagesPassed"],
                    )
                    member = self._entry_to_member(normalized)
                    self.redis_client.zadd(self.LEADERBOARD_KEY, {member: score})

                logger.info(f"Updated leaderboard with {len(entries)} entries")

                # Sync to HF Space
                self._async_sync_to_hf()

                return True

            except redis.RedisError as e:
                logger.error(f"Redis error in update_leaderboard: {e}")

        return self._fallback_update(entries)

    def clear_leaderboard(self) -> bool:
        """
        Clear all leaderboard data (admin function)

        Returns:
            True if successful, False otherwise
        """
        if self.redis_client:
            try:
                self.redis_client.delete(self.LEADERBOARD_KEY)
                logger.info("Leaderboard cleared from Redis")

                # Sync empty state to HF Space
                self._async_sync_to_hf()

                return True

            except redis.RedisError as e:
                logger.error(f"Redis error in clear_leaderboard: {e}")

        return self._fallback_clear()

    # ===== HF SPACE FALLBACK METHODS =====

    def _fallback_get(self) -> List[Dict]:
        """Fetch leaderboard from HF Space when Redis unavailable"""
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(f"{self.hf_fallback_url}/api/leaderboard")
                resp.raise_for_status()
                data = resp.json()
                return data.get("leaderboard", [])
        except Exception as e:
            logger.error(f"HF Space fallback get failed: {e}")
            return []

    def _fallback_add(self, entry: Dict) -> bool:
        """Add entry via HF Space when Redis unavailable"""
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    f"{self.hf_fallback_url}/api/leaderboard/add",
                    json=entry,
                )
                resp.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"HF Space fallback add failed: {e}")
            return False

    def _fallback_update(self, entries: List[Dict]) -> bool:
        """Update leaderboard via HF Space when Redis unavailable"""
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    f"{self.hf_fallback_url}/api/leaderboard/update",
                    json=entries,
                )
                resp.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"HF Space fallback update failed: {e}")
            return False

    def _fallback_clear(self) -> bool:
        """Clear leaderboard via HF Space when Redis unavailable"""
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.delete(f"{self.hf_fallback_url}/api/leaderboard/clear")
                resp.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"HF Space fallback clear failed: {e}")
            return False

    # ===== HF SPACE SYNC (BACKGROUND) =====

    def _async_sync_to_hf(self):
        """Sync current leaderboard to HF Space in background thread"""
        thread = threading.Thread(target=self._sync_to_hf, daemon=True)
        thread.start()

    def _sync_to_hf(self):
        """
        Sync current Redis leaderboard to HF Space.
        This keeps HF Space as a backup of the Redis data.
        """
        if not self.redis_client:
            return

        try:
            # Get current leaderboard from Redis
            entries = self.get_leaderboard()

            # POST to HF Space
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    f"{self.hf_fallback_url}/api/leaderboard/update",
                    json=entries,
                )
                if resp.status_code == 200:
                    logger.debug("Synced leaderboard to HF Space")
                else:
                    logger.warning(f"HF Space sync returned {resp.status_code}")

        except Exception as e:
            # Non-critical - HF Space is just backup
            logger.debug(f"HF Space sync failed (non-critical): {e}")

    def is_redis_available(self) -> bool:
        """Check if Redis connection is active"""
        if not self.redis_client:
            return False
        try:
            self.redis_client.ping()
            return True
        except redis.RedisError:
            return False

    # ===== DATA MIGRATION =====

    def _seed_from_hf_if_empty(self):
        """
        Seed Redis from HF Space if Redis leaderboard is empty.
        This ensures existing leaderboard data is preserved during migration.
        """
        if not self.redis_client:
            return

        try:
            # Check if Redis already has data
            current_count = self.redis_client.zcard(self.LEADERBOARD_KEY)
            if current_count > 0:
                logger.info(f"Redis already has {current_count} entries, skipping HF seed")
                return

            # Fetch from HF Space
            logger.info("Redis empty, seeding from HF Space...")
            hf_entries = self._fallback_get()

            if not hf_entries:
                logger.info("No entries in HF Space to seed")
                return

            # Add all entries to Redis
            for entry in hf_entries[: self.MAX_ENTRIES]:
                normalized = {
                    "initials": entry.get("initials", "???"),
                    "level": entry.get("level", 1),
                    "round": entry.get("round", 1),
                    "passagesPassed": entry.get("passagesPassed", 0),
                    "date": entry.get("date") or datetime.utcnow().isoformat(),
                }
                score = self._compute_score(
                    normalized["level"],
                    normalized["round"],
                    normalized["passagesPassed"],
                )
                member = self._entry_to_member(normalized)
                self.redis_client.zadd(self.LEADERBOARD_KEY, {member: score})

            logger.info(f"Seeded Redis with {len(hf_entries)} entries from HF Space")

        except redis.RedisError as e:
            logger.error(f"Failed to seed Redis from HF Space: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during HF seed: {e}")

    def force_seed_from_hf(self) -> bool:
        """
        Force re-seed Redis from HF Space (admin function).
        Clears existing Redis data and pulls fresh from HF Space.

        Returns:
            True if successful, False otherwise
        """
        if not self.redis_client:
            logger.warning("Cannot force seed: Redis not available")
            return False

        try:
            # Fetch from HF Space first
            hf_entries = self._fallback_get()
            if not hf_entries:
                logger.warning("No entries in HF Space to seed")
                return False

            # Clear Redis and repopulate
            self.redis_client.delete(self.LEADERBOARD_KEY)

            for entry in hf_entries[: self.MAX_ENTRIES]:
                normalized = {
                    "initials": entry.get("initials", "???"),
                    "level": entry.get("level", 1),
                    "round": entry.get("round", 1),
                    "passagesPassed": entry.get("passagesPassed", 0),
                    "date": entry.get("date") or datetime.utcnow().isoformat(),
                }
                score = self._compute_score(
                    normalized["level"],
                    normalized["round"],
                    normalized["passagesPassed"],
                )
                member = self._entry_to_member(normalized)
                self.redis_client.zadd(self.LEADERBOARD_KEY, {member: score})

            logger.info(f"Force-seeded Redis with {len(hf_entries)} entries from HF Space")
            return True

        except Exception as e:
            logger.error(f"Force seed failed: {e}")
            return False
