import { Redis } from '@upstash/redis';

const kv = Redis.fromEnv();
const SCORES_KEY = 'leaderboard_scores';
const MAX_STORED = 100;
const MAX_RETURNED = 10;
const MAX_NAME_LEN = 20;
const MAX_SCORE = 10_000_000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const scores = (await kv.get(SCORES_KEY)) ?? [];
      return res.status(200).json(scores.slice(0, MAX_RETURNED));
    }

    if (req.method === 'POST') {
      const { name, score, gold } = req.body ?? {};

      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name required' });
      }
      if (typeof score !== 'number' || score < 0 || score > MAX_SCORE || !isFinite(score)) {
        return res.status(400).json({ error: 'Invalid score' });
      }

      const entry = {
        name: name.trim().slice(0, MAX_NAME_LEN).replace(/[<>&"]/g, ''),
        score: Math.floor(score),
        gold: typeof gold === 'number' ? Math.floor(Math.max(0, gold)) : 0,
        date: new Date().toISOString().split('T')[0],
      };

      const scores = (await kv.get(SCORES_KEY)) ?? [];
      scores.push(entry);
      scores.sort((a, b) => b.score - a.score);
      const trimmed = scores.slice(0, MAX_STORED);
      await kv.set(SCORES_KEY, trimmed);

      const rank = trimmed.findIndex(
        (s) => s.name === entry.name && s.score === entry.score && s.date === entry.date
      ) + 1;

      return res.status(200).json({
        rank,
        scores: trimmed.slice(0, MAX_RETURNED),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    // KV not connected — return empty gracefully
    if (req.method === 'GET') return res.status(200).json([]);
    return res.status(503).json({ error: 'Leaderboard unavailable' });
  }
}
