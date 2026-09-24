// viewers.controller.js
//
// Tracks "N viewing" per product/video using a Redis sorted set per entity:
//   key:   viewers:{entityId}
//   member: sessionId
//   score:  last-seen unix timestamp (ms)
//
// A session counts as "active" if its score is within STALE_AFTER_MS of now.
// Every read/write first trims anything older than that window, so a viewer
// who closes the tab without firing "leave" (crash, killed process, etc.)
// disappears on its own within STALE_AFTER_MS instead of lingering forever.
//
// Assumes the existing Upstash Redis client used elsewhere in the codebase
// (e.g. for refresh tokens). Adjust the import to match your actual client.

import {redis}  from "../lib/redis.js"; // existing Upstash Redis client

const STALE_AFTER_MS = 30_000; // drop a session if no heartbeat in 30s
const KEY_PREFIX = "viewers:";

function keyFor(entityId) {
  return `${KEY_PREFIX}${entityId}`;
}

async function trimStale(key) {
  const cutoff = Date.now() - STALE_AFTER_MS;
  await redis.zremrangebyscore(key, 0, cutoff);
}

async function currentCount(entityId) {
  const key = keyFor(entityId);
  await trimStale(key);
  return redis.zcard(key);
}

// POST /api/products/:entityId/viewers/join
async function join(req, res) {
  const { entityId } = req.params;
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: "sessionId is required" });
  }

  const key = keyFor(entityId);
  await redis.zadd(key, Date.now(), sessionId);
  // Belt-and-braces TTL on the whole key so an abandoned product never
  // holds a Redis key open forever even if trimming never runs again.
  await redis.expire(key, 60);

  const count = await currentCount(entityId);
  res.json({ count });
}

// POST /api/products/:entityId/viewers/heartbeat
async function heartbeat(req, res) {
  const { entityId } = req.params;
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: "sessionId is required" });
  }

  const key = keyFor(entityId);
  await redis.zadd(key, Date.now(), sessionId);
  await redis.expire(key, 60);

  const count = await currentCount(entityId);
  res.json({ count });
}

// POST /api/products/:entityId/viewers/leave
async function leave(req, res) {
  const { entityId } = req.params;
  const { sessionId } = req.body;

  if (sessionId) {
    await redis.zrem(keyFor(entityId), sessionId);
  }

  const count = await currentCount(entityId);
  res.json({ count });
}

// GET /api/products/:entityId/viewers
async function getCount(req, res) {
  const { entityId } = req.params;
  const count = await currentCount(entityId);
  res.json({ count });
}

export default { join, heartbeat, leave, getCount };
