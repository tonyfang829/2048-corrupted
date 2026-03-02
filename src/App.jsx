import { useState, useEffect, useCallback, useRef } from "react";

let tileId = 0;
const nextId = () => ++tileId;

const TRANSLATIONS = {
  en: {
    score: "SCORE", best: "BEST", gold: "GOLD",
    shop: "SHOP", newGame: "NEW", langToggle: "中文",
    level: "LEVEL", maxChaos: "— MAX CHAOS", danger: "— DANGER", rising: "— RISING",
    shopTitle: "⚙ SHOP",
    purchaseNote: "PURCHASES TAKE EFFECT IMMEDIATELY",
    usedCount: (n) => `USED ${n}×`,
    gameOver: "GAME OVER", youWin: "YOU WIN!",
    scoreGold: (s, g) => `SCORE: ${s} · GOLD: ${g}`,
    newGameBtn: "NEW GAME", keepGoing: "KEEP GOING",
    lvl: "LVL", neg: "NEG", grid: "GRID",
    hint: "ARROW KEYS / SWIPE TO PLAY",
    introBtn: "?",
    closeBtn: "CLOSE",
    introParagraphs: [
      "When order collapses, numbers fall into the abyss.",
      "This is not the 2048 you remember. No gentle openings. No leisurely strategy. The board has been corrupted by an unknown force — every new tile may arrive wearing a minus sign. They are destruction. They are also salvation.",
      "In the 3×3 prison, light and dark take turns like two sides of a coin. Positives collide and grow savage. Positive meets negative — annihilation. Think negatives are a curse? Wrong. In a desperate board, a single cancellation is your only breath of air.",
      "The abyss evolves. Cross the 500, 1000, and 3000 thresholds and larger, wilder numbers will be summoned from the void. The board grows crowded. Unpredictable.",
      "But you are not unarmed. Every merge crystallizes into gold — your weapon against chaos. In the shop: purify the corruption or embrace the madness. Boost your yields, expand the grid, or detonate the board and erase three tiles from existence. Sometimes fate is kind — a golden tile descends in silence. Every merge it touches yields double gold.",
      "Here, every move is a gamble. Every swipe may be your last — or your comeback.",
      "Swipe. Embrace the chaos. Build your 2048 from the ruins of negatives.",
    ],
    shopItems: {
      inc_neg:      { name: "Chaos+",   desc: "Increase negative odds by 5%" },
      dec_neg:      { name: "Purify",   desc: "Decrease negative odds by 5%" },
      gold_boost:   { name: "Alchemy",  desc: "Increase gold ratio by 5%" },
      expand:       { name: "Expand",   desc: "Upgrade board to 4×4" },
      golden_boost: { name: "Midas",    desc: "Increase ×2 gold tile odds by 2%" },
      destroy:      { name: "Purge",    desc: "Destroy 3 random tiles (consumable)" },
    },
  },
  zh: {
    score: "得分", best: "最高", gold: "金币",
    shop: "商店", newGame: "新局", langToggle: "EN",
    level: "等级", maxChaos: "— 极度混乱", danger: "— 危险", rising: "— 升级中",
    shopTitle: "⚙ 商店",
    purchaseNote: "购买立即生效",
    usedCount: (n) => `已用 ${n} 次`,
    gameOver: "游戏结束", youWin: "你赢了！",
    scoreGold: (s, g) => `得分: ${s} · 金币: ${g}`,
    newGameBtn: "新游戏", keepGoing: "继续",
    lvl: "等级", neg: "负片", grid: "棋盘",
    hint: "方向键 / 滑动 操作",
    introBtn: "介绍",
    closeBtn: "关闭",
    introParagraphs: [
      "当秩序崩塌，数字堕入深渊。",
      "这不是你记忆中的 2048。这里没有温柔的开局，没有从容的推演。棋盘被未知力量侵蚀，每一个新生的数字都可能带着负号降临——它们是毁灭，也是救赎。",
      "3×3 的囚笼里，光与暗以命运硬币的正反面轮番登场。正数相撞，野蛮生长；正负相遇，灰飞烟灭。你以为负数是诅咒？不，它们是你在绝境中唯一的解药。当棋盘被数字填满、窒息逼近的瞬间，一次精准的湮灭就是重新呼吸的机会。",
      "而这座深渊并非一成不变——它在进化。当你的分数越过 500、1000、3000 的门槛，更庞大、更狂暴的数字将从虚空中被召唤而出。棋盘会变得越来越拥挤，越来越不可预测。",
      "但你并非赤手空拳。每一次合并都会凝结成金币，而金币是你对抗混沌的武器。在商店中，你可以净化负数的侵蚀，也可以主动拥抱疯狂；你可以炼金提升收益，扩张领地，甚至引爆棋盘、将三块数字化为虚无。偶尔，命运会眷顾你——一块散发着金色光芒的方块悄然降临，它所参与的每一次合并，都将带来双倍的金币回报。",
      "在这里，每一步都是豪赌，每一次滑动都可能是翻盘或终局。",
      "滑动屏幕。拥抱混沌。在负数的废墟中，拼出你的 2048。",
    ],
    shopItems: {
      inc_neg:      { name: "混沌+", desc: "负数概率增加 5%" },
      dec_neg:      { name: "净化",  desc: "负数概率降低 5%" },
      gold_boost:   { name: "炼金",  desc: "金币倍率提升 5%" },
      expand:       { name: "扩展",  desc: "棋盘升级为 4×4" },
      golden_boost: { name: "点金",  desc: "×2 金色格概率提升 2%" },
      destroy:      { name: "清除",  desc: "消灭 3 个随机格（消耗品）" },
    },
  },
};

const getTileStyle = (value) => {
  if (value === 0) return { bg: "transparent", text: "transparent", shadow: "none" };
  const isNeg = value < 0;
  const abs = Math.abs(value);
  const positiveStyles = {
    2:    { bg: "#1a1a2e", text: "#00ff88", shadow: "0 0 15px rgba(0,255,136,0.3)" },
    4:    { bg: "#1a1a2e", text: "#00ffcc", shadow: "0 0 15px rgba(0,255,204,0.3)" },
    8:    { bg: "#0a2a3a", text: "#00ccff", shadow: "0 0 20px rgba(0,204,255,0.4)" },
    16:   { bg: "#0a2a4a", text: "#3399ff", shadow: "0 0 20px rgba(51,153,255,0.4)" },
    32:   { bg: "#1a1a4a", text: "#6666ff", shadow: "0 0 25px rgba(102,102,255,0.4)" },
    64:   { bg: "#2a1a4a", text: "#9933ff", shadow: "0 0 25px rgba(153,51,255,0.5)" },
    128:  { bg: "#3a1a3a", text: "#cc33ff", shadow: "0 0 30px rgba(204,51,255,0.5)" },
    256:  { bg: "#4a1a2a", text: "#ff33cc", shadow: "0 0 30px rgba(255,51,204,0.5)" },
    512:  { bg: "#4a1a1a", text: "#ff3366", shadow: "0 0 35px rgba(255,51,102,0.6)" },
    1024: { bg: "#4a2a0a", text: "#ff6600", shadow: "0 0 35px rgba(255,102,0,0.6)" },
    2048: { bg: "#3a3a0a", text: "#ffcc00", shadow: "0 0 40px rgba(255,204,0,0.7)" },
  };
  const negativeStyles = {
    2:    { bg: "#2e1a1a", text: "#ff4444", shadow: "0 0 15px rgba(255,68,68,0.4)" },
    4:    { bg: "#2e1a1a", text: "#ff5555", shadow: "0 0 15px rgba(255,85,85,0.4)" },
    8:    { bg: "#3a1a0a", text: "#ff6633", shadow: "0 0 20px rgba(255,102,51,0.4)" },
    16:   { bg: "#3a0a1a", text: "#ff3366", shadow: "0 0 20px rgba(255,51,102,0.4)" },
    32:   { bg: "#3a0a2a", text: "#ff33aa", shadow: "0 0 25px rgba(255,51,170,0.5)" },
    64:   { bg: "#2a0a3a", text: "#cc33ff", shadow: "0 0 25px rgba(204,51,255,0.5)" },
    128:  { bg: "#1a0a3a", text: "#9966ff", shadow: "0 0 30px rgba(153,102,255,0.5)" },
    256:  { bg: "#0a1a3a", text: "#6699ff", shadow: "0 0 30px rgba(102,153,255,0.5)" },
    512:  { bg: "#0a2a2a", text: "#33cccc", shadow: "0 0 35px rgba(51,204,204,0.6)" },
    1024: { bg: "#0a2a1a", text: "#33cc66", shadow: "0 0 35px rgba(51,204,102,0.6)" },
    2048: { bg: "#1a2a0a", text: "#99cc00", shadow: "0 0 40px rgba(153,204,0,0.7)" },
  };
  const styles = isNeg ? negativeStyles : positiveStyles;
  return styles[abs] || { bg: "#1a1a1a", text: isNeg ? "#ff2222" : "#ffffff", shadow: `0 0 40px ${isNeg ? "rgba(255,34,34,0.7)" : "rgba(255,255,255,0.7)"}` };
};

function createEmptyGrid(size) {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

function getEmptyCells(grid, size) {
  const cells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!grid[r][c]) cells.push({ r, c });
  return cells;
}

function getDifficultyLevel(score) {
  if (score >= 3000) return 4;
  if (score >= 1000) return 3;
  if (score >= 500) return 2;
  return 1;
}

function getSpawnPool(level, negChance) {
  const positivePools = { 1: [2], 2: [2, 4], 3: [2, 4, 8], 4: [2, 4, 8, 16] };
  const positives = positivePools[level] || [2];
  const isNeg = Math.random() < negChance;
  const baseValue = positives[Math.floor(Math.random() * positives.length)];
  return isNeg ? -baseValue : baseValue;
}

function addRandomTile(grid, size, negChance, score, goldenChance) {
  const empty = getEmptyCells(grid, size);
  if (empty.length === 0) return grid;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  const level = getDifficultyLevel(score);
  const value = getSpawnPool(level, negChance);
  const golden = Math.random() < goldenChance;
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = { id: nextId(), value, mergedFrom: null, isNew: true, golden };
  return newGrid;
}

function initializeGrid(size, negChance, goldenChance) {
  let grid = createEmptyGrid(size);
  grid = addRandomTile(grid, size, negChance, 0, goldenChance);
  grid = addRandomTile(grid, size, negChance, 0, goldenChance);
  return grid;
}

function slideLine(line) {
  let tiles = line.filter(t => t !== null);
  const result = [];
  let scoreGained = 0;
  let goldenScoreGained = 0;
  let i = 0;
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
      const newVal = tiles[i].value * 2;
      const mergeScore = Math.abs(newVal);
      const eitherGolden = tiles[i].golden || tiles[i + 1].golden;
      scoreGained += mergeScore;
      if (eitherGolden) goldenScoreGained += mergeScore;
      if (newVal === 0) {
        const cancelScore = Math.abs(tiles[i].value) * 2;
        scoreGained += cancelScore;
        if (eitherGolden) goldenScoreGained += cancelScore;
      } else {
        result.push({ id: nextId(), value: newVal, mergedFrom: [tiles[i], tiles[i + 1]], isNew: false, golden: eitherGolden });
      }
      i += 2;
    } else if (i + 1 < tiles.length && tiles[i].value === -tiles[i + 1].value) {
      const cancelScore = Math.abs(tiles[i].value);
      const eitherGolden = tiles[i].golden || tiles[i + 1].golden;
      scoreGained += cancelScore;
      if (eitherGolden) goldenScoreGained += cancelScore;
      i += 2;
    } else {
      result.push({ ...tiles[i], mergedFrom: null, isNew: false });
      i++;
    }
  }
  while (result.length < line.length) result.push(null);
  return { line: result, scoreGained, goldenScoreGained };
}

function moveGrid(grid, direction, size) {
  let newGrid = createEmptyGrid(size);
  let totalScore = 0;
  let totalGoldenScore = 0;
  let moved = false;
  for (let i = 0; i < size; i++) {
    let line = [];
    for (let j = 0; j < size; j++) {
      switch (direction) {
        case "left":  line.push(grid[i][j]); break;
        case "right": line.push(grid[i][size - 1 - j]); break;
        case "up":    line.push(grid[j][i]); break;
        case "down":  line.push(grid[size - 1 - j][i]); break;
      }
    }
    const { line: newLine, scoreGained, goldenScoreGained } = slideLine(line);
    totalScore += scoreGained;
    totalGoldenScore += goldenScoreGained;
    for (let j = 0; j < size; j++) {
      switch (direction) {
        case "left":  newGrid[i][j] = newLine[j]; break;
        case "right": newGrid[i][size - 1 - j] = newLine[j]; break;
        case "up":    newGrid[j][i] = newLine[j]; break;
        case "down":  newGrid[size - 1 - j][i] = newLine[j]; break;
      }
    }
  }
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const oldVal = grid[r][c]?.value ?? null;
      const newVal = newGrid[r][c]?.value ?? null;
      if (oldVal !== newVal) moved = true;
    }
  return { grid: newGrid, scoreGained: totalScore, goldenScoreGained: totalGoldenScore, moved };
}

function canMove(grid, size) {
  if (getEmptyCells(grid, size).length > 0) return true;
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const val = grid[r][c]?.value;
      if (c + 1 < size) {
        const right = grid[r][c + 1]?.value;
        if (val === right || val === -right) return true;
      }
      if (r + 1 < size) {
        const below = grid[r + 1][c]?.value;
        if (val === below || val === -below) return true;
      }
    }
  return false;
}

function hasWon(grid, size) {
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c]?.value === 2048) return true;
  return false;
}

function destroyRandomTiles(grid, size, count) {
  const occupied = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (grid[r][c]) occupied.push({ r, c });
  const shuffled = [...occupied].sort(() => Math.random() - 0.5);
  const newGrid = grid.map(row => [...row]);
  for (let i = 0; i < Math.min(count, shuffled.length); i++)
    newGrid[shuffled[i].r][shuffled[i].c] = null;
  return newGrid;
}

const SHOP_ITEMS = [
  { id: "inc_neg",      icon: "☢", costs: [100, 200, 400],  maxTier: 3,        color: "#ff4444" },
  { id: "dec_neg",      icon: "✦", costs: [100, 200, 400],  maxTier: 3,        color: "#00ff88" },
  { id: "gold_boost",   icon: "⚗", costs: [100, 500, 1000], maxTier: 3,        color: "#ffcc00" },
  { id: "expand",       icon: "⬡", costs: [1000],           maxTier: 1,        color: "#00ccff" },
  { id: "golden_boost", icon: "👑", costs: [100, 200, 500],  maxTier: 3,        color: "#ffd700" },
  { id: "destroy",      icon: "💥", costs: [100, 200, 400],  maxTier: Infinity, repeatable: true, color: "#ff6600" },
];

export default function App() {
  const [lang, setLang] = useState("en");
  const [gridSize, setGridSize] = useState(3);
  const [negChance, setNegChance] = useState(0.5);
  const [goldenChance, setGoldenChance] = useState(0.03);
  const [goldMultiplier, setGoldMultiplier] = useState(1.0);
  const [grid, setGrid] = useState(() => initializeGrid(3, 0.5, 0.03));
  const [score, setScore] = useState(0);
  const [gold, setGold] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [purchaseCounts, setPurchaseCounts] = useState({ inc_neg: 0, dec_neg: 0, gold_boost: 0, expand: 0, golden_boost: 0, destroy: 0 });
  const [flashGold, setFlashGold] = useState(false);
  const touchStart = useRef(null);

  const t = TRANSLATIONS[lang];

  const handleMove = useCallback((direction) => {
    if (gameOver || (won && !keepPlaying)) return;

    const { grid: newGrid, scoreGained, goldenScoreGained, moved } = moveGrid(grid, direction, gridSize);
    if (!moved) return;

    const newScore = score + scoreGained;
    const baseGold = Math.ceil(scoreGained * goldMultiplier);
    const goldenBonus = Math.ceil(goldenScoreGained * goldMultiplier);
    const goldEarned = baseGold + goldenBonus;
    const withNewTile = addRandomTile(newGrid, gridSize, negChance, newScore, goldenChance);

    setGrid(withNewTile);
    setScore(newScore);
    setGold(g => g + goldEarned);
    if (newScore > bestScore) setBestScore(newScore);

    if (goldEarned > 0) {
      setFlashGold(true);
      setTimeout(() => setFlashGold(false), 400);
    }

    if (!keepPlaying && hasWon(withNewTile, gridSize)) {
      setWon(true);
    } else if (!canMove(withNewTile, gridSize)) {
      setGameOver(true);
    }
  }, [grid, score, bestScore, gameOver, won, keepPlaying, gridSize, negChance, goldenChance, goldMultiplier]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
      if (map[e.key]) { e.preventDefault(); handleMove(map[e.key]); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  const handleTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    handleMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    touchStart.current = null;
  };

  const resetGame = () => {
    tileId = 0;
    setGridSize(3);
    setNegChance(0.5);
    setGoldenChance(0.03);
    setGoldMultiplier(1.0);
    setGrid(initializeGrid(3, 0.5, 0.03));
    setScore(0);
    setGold(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    setShopOpen(false);
    setPurchaseCounts({ inc_neg: 0, dec_neg: 0, gold_boost: 0, expand: 0, golden_boost: 0, destroy: 0 });
  };

  const buyItem = (item) => {
    const count = purchaseCounts[item.id];
    if (!item.repeatable && count >= item.maxTier) return;
    const costIndex = item.repeatable ? Math.min(count, item.costs.length - 1) : count;
    const cost = item.costs[costIndex];
    if (gold < cost) return;
    setGold(g => g - cost);
    setPurchaseCounts(p => ({ ...p, [item.id]: p[item.id] + 1 }));
    switch (item.id) {
      case "inc_neg":    setNegChance(n => Math.min(1, n + 0.05)); break;
      case "dec_neg":    setNegChance(n => Math.max(0, n - 0.05)); break;
      case "gold_boost": setGoldMultiplier(m => m + 0.05); break;
      case "golden_boost": setGoldenChance(c => Math.min(1, c + 0.02)); break;
      case "expand":
        setGridSize(prev => {
          if (prev < 4) {
            setGrid(g => {
              const bigGrid = createEmptyGrid(4);
              for (let r = 0; r < prev; r++)
                for (let c = 0; c < prev; c++)
                  bigGrid[r][c] = g[r][c];
              return bigGrid;
            });
            return 4;
          }
          return prev;
        });
        break;
      case "destroy": setGrid(g => destroyRandomTiles(g, gridSize, 3)); break;
    }
  };

  const getItemStatus = (item) => {
    const count = purchaseCounts[item.id];
    if (!item.repeatable && count >= item.maxTier) return { canBuy: false, cost: null, label: "MAX" };
    const costIndex = item.repeatable ? Math.min(count, item.costs.length - 1) : count;
    const cost = item.costs[costIndex];
    return { canBuy: gold >= cost, cost, label: `${cost}g` };
  };

  const lvl = getDifficultyLevel(score);
  const lvlSuffix = lvl >= 4 ? t.maxChaos : lvl >= 3 ? t.danger : lvl >= 2 ? t.rising : "";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(0,255,136,0.03) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 50%, rgba(255,68,68,0.03) 0%, transparent 50%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      padding: "12px", overflow: "hidden", position: "relative",
    }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)", pointerEvents: "none", zIndex: 100 }} />

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 900, color: "#00ff88", textShadow: "0 0 30px rgba(0,255,136,0.5)", margin: 0, letterSpacing: 4, lineHeight: 1, transform: "rotate(180deg)" }}>-2048</h1>
      </div>

      {/* Score / Gold bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, width: "min(95vw, 440px)", justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap" }}>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <ScoreBox label={t.score} value={score} color="#00ff88" />
          <ScoreBox label={t.best} value={bestScore} color="#00ccff" />
          <ScoreBox label={t.gold} value={gold} color="#ffcc00" flash={flashGold} />
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <SmallBtn label={t.langToggle} onClick={() => setLang(l => l === "en" ? "zh" : "en")} color="#9966ff" />
          <SmallBtn label={t.introBtn} onClick={() => setIntroOpen(true)} color="#00ccff" />
          <SmallBtn label={t.shop} onClick={() => setShopOpen(!shopOpen)} color="#ffcc00" active={shopOpen} />
          <SmallBtn label={t.newGame} onClick={resetGame} color="#ff4444" />
        </div>
      </div>

      {/* Difficulty level indicator */}
      {score > 0 && (
        <div style={{
          marginBottom: 8, padding: "4px 14px", borderRadius: 6,
          background: lvl >= 3 ? "rgba(255,68,68,0.08)" : "rgba(255,204,0,0.08)",
          border: `1px solid ${lvl >= 3 ? "rgba(255,68,68,0.2)" : "rgba(255,204,0,0.2)"}`,
          color: lvl >= 3 ? "#ff4444" : "#ffcc00",
          fontSize: 10, letterSpacing: 2,
        }}>
          ⚡ {t.level} {lvl} {lvlSuffix}
        </div>
      )}

      {/* Shop panel */}
      {shopOpen && (
        <div style={{
          width: "min(95vw, 440px)", marginBottom: 10,
          background: "rgba(15,15,25,0.95)", borderRadius: 12,
          border: "1px solid rgba(255,204,0,0.15)", padding: "12px",
          animation: "fadeIn 0.2s ease-out",
        }}>
          <div style={{ fontSize: 11, color: "#ffcc00", letterSpacing: 3, marginBottom: 10, textAlign: "center", textTransform: "uppercase" }}>{t.shopTitle}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SHOP_ITEMS.map(item => {
              const status = getItemStatus(item);
              const count = purchaseCounts[item.id];
              const itemText = t.shopItems[item.id];
              return (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${item.color}15`,
                  opacity: !item.repeatable && status.label === "MAX" ? 0.5 : 1,
                }}>
                  <div style={{ fontSize: 20, width: 30, textAlign: "center" }}>{item.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: item.color, letterSpacing: 1 }}>{itemText.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{itemText.desc}</div>
                    {item.maxTier > 1 && !item.repeatable && (
                      <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                        {Array(item.maxTier).fill(0).map((_, i) => (
                          <div key={i} style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: i < count ? item.color : "rgba(255,255,255,0.1)",
                            boxShadow: i < count ? `0 0 6px ${item.color}66` : "none",
                          }} />
                        ))}
                      </div>
                    )}
                    {item.repeatable && count > 0 && (
                      <div style={{ fontSize: 9, color: `${item.color}88`, marginTop: 3, letterSpacing: 1 }}>{t.usedCount(count)}</div>
                    )}
                  </div>
                  <button
                    onClick={() => buyItem(item)}
                    disabled={!status.canBuy || status.label === "MAX"}
                    style={{
                      background: status.canBuy && status.label !== "MAX" ? `${item.color}18` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${status.canBuy && status.label !== "MAX" ? `${item.color}44` : "rgba(255,255,255,0.08)"}`,
                      color: status.canBuy && status.label !== "MAX" ? item.color : "rgba(255,255,255,0.25)",
                      padding: "5px 12px", borderRadius: 6,
                      cursor: status.canBuy && status.label !== "MAX" ? "pointer" : "default",
                      fontFamily: "inherit", fontSize: 11, fontWeight: 700, letterSpacing: 1,
                      whiteSpace: "nowrap", transition: "all 0.2s",
                    }}
                  >
                    {status.label}
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 8, letterSpacing: 1 }}>
            {t.purchaseNote}
          </div>
        </div>
      )}

      {/* Game board */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          width: "min(90vw, 420px)", aspectRatio: "1",
          background: "rgba(15,15,25,0.9)", borderRadius: 12,
          padding: "clamp(6px, 2vw, 12px)",
          border: "1px solid rgba(0,255,136,0.15)",
          boxShadow: "0 0 40px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3)",
          touchAction: "none",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)`, gap: "clamp(4px, 1.5vw, 8px)", width: "100%", height: "100%" }}>
          {Array(gridSize * gridSize).fill(null).map((_, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }} />
          ))}
        </div>

        <div style={{
          position: "absolute",
          top: "clamp(6px, 2vw, 12px)", left: "clamp(6px, 2vw, 12px)", right: "clamp(6px, 2vw, 12px)", bottom: "clamp(6px, 2vw, 12px)",
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap: "clamp(4px, 1.5vw, 8px)",
        }}>
          {grid.flat().map((tile, idx) => {
            if (!tile) return <div key={`e-${idx}`} />;
            const style = getTileStyle(tile.value);
            const isNeg = tile.value < 0;
            const isGolden = tile.golden;
            const absVal = Math.abs(tile.value);
            const fontSize = absVal >= 1024 ? "clamp(12px, 3.5vw, 20px)" : absVal >= 128 ? "clamp(14px, 4vw, 24px)" : "clamp(18px, 5vw, 30px)";
            const goldenBorder = isGolden ? "1px solid rgba(255,204,0,0.6)" : `1px solid ${isNeg ? "rgba(255,68,68,0.2)" : "rgba(0,255,136,0.1)"}`;
            const goldenShadow = isGolden ? `${style.shadow}, 0 0 12px rgba(255,204,0,0.5), 0 0 25px rgba(255,204,0,0.25), inset 0 0 8px rgba(255,204,0,0.15)` : style.shadow;
            return (
              <div key={tile.id} style={{
                background: style.bg, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize, fontWeight: 800, color: isGolden ? "#ffdd44" : style.text,
                boxShadow: goldenShadow, border: goldenBorder,
                animation: tile.isNew ? "popIn 0.3s ease-out, borderGlow 0.8s ease-out" : tile.mergedFrom ? "merge 0.2s ease-out" : isGolden ? "goldenPulse 2s ease-in-out infinite" : "none",
                position: "relative", overflow: "hidden", userSelect: "none",
              }}>
                {tile.value}
                {isGolden && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(255,204,0,0.12) 0%, transparent 40%, rgba(255,220,100,0.08) 60%, transparent 100%)", pointerEvents: "none" }} />
                )}
                {isGolden && (
                  <div style={{ position: "absolute", top: 2, right: 4, fontSize: 8, color: "rgba(255,204,0,0.7)", fontWeight: 700 }}>×2</div>
                )}
                {isNeg && !isGolden && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,0,0,0.03) 3px, rgba(255,0,0,0.03) 6px)", pointerEvents: "none" }} />}
              </div>
            );
          })}
        </div>

        {(gameOver || won) && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: gameOver ? "rgba(10,0,0,0.85)" : "rgba(0,10,0,0.85)",
            borderRadius: 12, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12,
            animation: "fadeIn 0.3s ease-out",
          }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: gameOver ? "#ff4444" : "#00ff88", textShadow: `0 0 30px ${gameOver ? "rgba(255,68,68,0.6)" : "rgba(0,255,136,0.6)"}`, letterSpacing: 4 }}>
              {gameOver ? t.gameOver : t.youWin}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: 2 }}>{t.scoreGold(score, gold)}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <OverlayButton label={t.newGameBtn} onClick={resetGame} color={gameOver ? "#ff4444" : "#00ff88"} />
              {won && <OverlayButton label={t.keepGoing} onClick={() => { setKeepPlaying(true); setWon(false); }} color="#00ccff" />}
            </div>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ marginTop: 10, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <StatPill label={t.lvl} value={lvl} color={lvl >= 3 ? "#ff4444" : "#ffcc00"} />
        <StatPill label={t.neg} value={`${Math.round(negChance * 100)}%`} color="#ff4444" />
        <StatPill label={t.grid} value={`${gridSize}×${gridSize}`} color="#00ccff" />
        <StatPill label="×2" value={`${Math.round(goldenChance * 100)}%`} color="#ffd700" />
        <StatPill label={t.gold + "×"} value={`${goldMultiplier.toFixed(2)}`} color="#ffcc00" />
      </div>

      <div style={{ marginTop: 8, color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: 2, textAlign: "center", lineHeight: 1.6 }}>
        {t.hint}
      </div>

      {/* Intro modal */}
      {introOpen && (
        <div
          onClick={() => setIntroOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.85)", zIndex: 300,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px", backdropFilter: "blur(4px)",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0a0a12",
              border: "1px solid rgba(0,255,136,0.2)",
              borderRadius: 16,
              padding: "28px 24px",
              maxWidth: 480, width: "100%",
              maxHeight: "80vh", overflowY: "auto",
              boxShadow: "0 0 60px rgba(0,255,136,0.08), 0 0 120px rgba(0,0,0,0.8)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setIntroOpen(false)}
              style={{
                position: "absolute", top: 14, right: 16,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.4)",
                padding: "4px 12px", borderRadius: 6,
                cursor: "pointer", fontFamily: "inherit",
                fontSize: 10, letterSpacing: 2,
              }}
            >{t.closeBtn}</button>

            {t.introParagraphs.map((para, i) => (
              <p key={i} style={{
                color: i === 0
                  ? "#00ff88"
                  : i === t.introParagraphs.length - 1
                    ? "#ffcc00"
                    : "rgba(255,255,255,0.65)",
                fontSize: i === 0
                  ? 15
                  : i === t.introParagraphs.length - 1
                    ? 13
                    : 12,
                fontWeight: i === 0 || i === t.introParagraphs.length - 1 ? 700 : 400,
                lineHeight: 1.8,
                letterSpacing: i === 0 ? 2 : 0.5,
                marginBottom: i < t.introParagraphs.length - 1 ? 14 : 0,
                textShadow: i === 0 ? "0 0 20px rgba(0,255,136,0.3)" : "none",
              }}>
                {para}
              </p>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes borderGlow {
          0% { box-shadow: 0 0 15px 4px rgba(255,255,255,0.7), inset 0 0 10px rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.8); }
          50% { box-shadow: 0 0 10px 2px rgba(255,255,255,0.3), inset 0 0 5px rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.4); }
          100% { box-shadow: none; border-color: rgba(255,255,255,0.1); }
        }
        @keyframes merge { 0% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @keyframes goldenPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(255,204,0,0.4), 0 0 25px rgba(255,204,0,0.15), inset 0 0 8px rgba(255,204,0,0.1); }
          50% { box-shadow: 0 0 18px rgba(255,204,0,0.6), 0 0 35px rgba(255,204,0,0.25), inset 0 0 12px rgba(255,204,0,0.2); }
        }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes glitch { 0%, 90%, 100% { opacity: 1; transform: translateX(0); } 92% { opacity: 0.8; transform: translateX(-2px); } 94% { opacity: 0.6; transform: translateX(2px); } 96% { opacity: 0.8; transform: translateX(-1px); } 98% { opacity: 1; transform: translateX(1px); } }
        @keyframes goldFlash { 0% { text-shadow: 0 0 20px rgba(255,204,0,0.8); } 100% { text-shadow: 0 0 10px rgba(255,204,0,0.3); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

function ScoreBox({ label, value, color, flash }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22`, borderRadius: 8, padding: "3px 8px", textAlign: "center", minWidth: 55 }}>
      <div style={{ fontSize: 7, color: `${color}88`, letterSpacing: 2, marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color, textShadow: `0 0 10px ${color}44`, animation: flash ? "goldFlash 0.4s ease-out" : "none" }}>{value}</div>
    </div>
  );
}

function SmallBtn({ label, onClick, color, active }) {
  return (
    <button onClick={onClick} style={{
      background: active ? `${color}20` : `${color}10`,
      border: `1px solid ${active ? `${color}55` : `${color}30`}`,
      color, padding: "5px 8px", borderRadius: 6, cursor: "pointer",
      fontFamily: "inherit", fontSize: 10, letterSpacing: 1,
      textTransform: "uppercase", transition: "all 0.2s",
      boxShadow: active ? `0 0 12px ${color}22` : "none",
    }}>{label}</button>
  );
}

function OverlayButton({ label, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      background: `${color}15`, border: `1px solid ${color}44`, color,
      padding: "8px 18px", borderRadius: 8, cursor: "pointer",
      fontFamily: "inherit", fontSize: 11, fontWeight: 700, letterSpacing: 2, transition: "all 0.2s",
    }}>{label}</button>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ fontSize: 10, color: `${color}88`, letterSpacing: 1, background: `${color}08`, border: `1px solid ${color}15`, padding: "3px 10px", borderRadius: 20 }}>
      {label} <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
