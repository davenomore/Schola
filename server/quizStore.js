// Közös, szerverless-kompatibilis állapot-tároló (Upstash Redis / Vercel KV + Helyi fájl fallback)
// Vercelen a Serverless Function-ök több független konténerben futnak, ezért memóriában (RAM)
// nem osztható meg élő játékállapot. Ha be van állítva a Vercel Storage (Upstash Redis / KV),
// minden élő kvíz, csatlakozott diák, válasz és mentett kvíz atomi műveletekkel, közös adatbázisban él.

const fs = require('fs');
const path = require('path');

const REDIS_URL = (
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  ''
).replace(/\/+$/, '');

const REDIS_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  '';

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const HAS_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);

const STORAGE_MODE = HAS_REDIS
  ? 'redis'
  : IS_VERCEL
  ? 'ephemeral-serverless'
  : 'local-file';

const KEYS = {
  META: 'schola:quiz:meta',
  SAVED_QUIZZES: 'schola:quiz:saved_quizzes',
  DASHBOARD_CONFIG: 'schola:dashboard:config',
  playersKey: (sessionId) => `schola:quiz:players:${sessionId}`,
  answersKey: (sessionId, qIdx) => `schola:quiz:answers:${sessionId}:${qIdx}`
};

// --- Upstash / Vercel KV REST kliens (0 külső csomag, natív fetch) ---
async function redisCommand(commandArgs) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commandArgs)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Redis REST hiba (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(`Redis parancs hiba: ${data.error}`);
  }
  return data.result;
}

async function redisPipeline(commands) {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Redis pipeline hiba (${res.status}): ${text}`);
  }
  const results = await res.json();
  return results.map((item) => {
    if (item && item.error) {
      throw new Error(`Redis pipeline elem hiba: ${item.error}`);
    }
    return item ? item.result : null;
  });
}

function safeJsonParse(raw, fallback = null) {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function parseRedisHash(raw) {
  if (!raw) return {};
  // Upstash REST API HGETALL returns either an array [k1, v1, k2, v2] or an object { k1: v1 }
  if (Array.isArray(raw)) {
    const obj = {};
    for (let i = 0; i < raw.length; i += 2) {
      obj[raw[i]] = safeJsonParse(raw[i + 1], raw[i + 1]);
    }
    return obj;
  }
  if (typeof raw === 'object') {
    const obj = {};
    for (const [k, v] of Object.entries(raw)) {
      obj[k] = safeJsonParse(v, v);
    }
    return obj;
  }
  return {};
}

function createQuizStore({ initialDefaultQuizzes, serverDir }) {
  const SAVED_QUIZZES_FILE = path.join(serverDir, 'saved_quizzes.json');
  const SESSION_FILE = path.join(serverDir, 'quiz_session.json');
  const DASHBOARD_CONFIG_FILE = path.join(serverDir, 'dashboard_config.json');

  // --- Helyi fájl / memória állapot ---
  function readJsonFile(filePath, fallback) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (parsed !== null && parsed !== undefined) return parsed;
      }
    } catch (err) {
      console.error(`Fájl olvasási hiba (${path.basename(filePath)}):`, err.message);
    }
    return fallback;
  }

  function writeJsonFile(filePath, data) {
    if (IS_VERCEL) return; // Vercelen a forráskönyvtár csak olvasható
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error(`Fájl írási hiba (${path.basename(filePath)}):`, err.message);
    }
  }

  function makeDefaultSession(quizzes) {
    const firstQuiz = (Array.isArray(quizzes) && quizzes[0]) || initialDefaultQuizzes[0];
    return {
      id: 'session-default',
      pin: '582914',
      status: 'lobby',
      quizId: firstQuiz.id || 'quiz-math-1',
      title: firstQuiz.title || 'Másodfokú egyenletek és függvények',
      currentQuestionIndex: 0,
      timeLimit: 20,
      questionStartTime: 0,
      questions: firstQuiz.questions || initialDefaultQuizzes[0].questions,
      players: [],
      answersHistory: {},
      updatedAt: Date.now()
    };
  }

  // Helyi memóriás cache (helyi/nem-Redis futáshoz)
  let memSavedQuizzes = (() => {
    const fromFile = readJsonFile(SAVED_QUIZZES_FILE, null);
    if (Array.isArray(fromFile) && fromFile.length > 0) return fromFile;
    if (!IS_VERCEL) writeJsonFile(SAVED_QUIZZES_FILE, initialDefaultQuizzes);
    return JSON.parse(JSON.stringify(initialDefaultQuizzes));
  })();

  let memSession = (() => {
    const fromFile = !IS_VERCEL ? readJsonFile(SESSION_FILE, null) : null;
    if (fromFile && fromFile.id && Array.isArray(fromFile.questions)) {
      return {
        ...fromFile,
        players: Array.isArray(fromFile.players) ? fromFile.players : [],
        answersHistory: fromFile.answersHistory || {},
        updatedAt: fromFile.updatedAt || Date.now()
      };
    }
    return makeDefaultSession(memSavedQuizzes);
  })();

  function persistLocalSession() {
    memSession.updatedAt = Date.now();
    if (!IS_VERCEL) {
      writeJsonFile(SESSION_FILE, memSession);
    }
  }

  // --- Redis alapú teljes session összeállítása ---
  async function loadRedisMeta() {
    const raw = await redisCommand(['GET', KEYS.META]);
    let meta = safeJsonParse(raw, null);
    if (!meta || !meta.id) {
      const saved = await getSavedQuizzes();
      const def = makeDefaultSession(saved);
      meta = {
        id: def.id,
        pin: def.pin,
        status: def.status,
        quizId: def.quizId,
        title: def.title,
        currentQuestionIndex: def.currentQuestionIndex,
        timeLimit: def.timeLimit,
        questionStartTime: def.questionStartTime,
        questions: def.questions,
        updatedAt: Date.now()
      };
      await redisCommand(['SET', KEYS.META, JSON.stringify(meta)]);
    }
    return meta;
  }

  async function saveRedisMeta(meta) {
    meta.updatedAt = Date.now();
    await redisCommand(['SET', KEYS.META, JSON.stringify(meta)]);
    return meta;
  }

  async function loadRedisSession({ includeAnswers = false } = {}) {
    const meta = await loadRedisMeta();
    const pKey = KEYS.playersKey(meta.id);

    const commands = [['HGETALL', pKey]];
    const totalQuestions = Array.isArray(meta.questions) ? meta.questions.length : 0;
    if (includeAnswers && totalQuestions > 0) {
      for (let i = 0; i < totalQuestions; i++) {
        commands.push(['HGETALL', KEYS.answersKey(meta.id, i)]);
      }
    }

    const results = await redisPipeline(commands);
    const playersObj = parseRedisHash(results[0]);
    const players = Object.values(playersObj)
      .filter((p) => p && p.id)
      .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

    const answersHistory = {};
    if (includeAnswers && totalQuestions > 0) {
      for (let i = 0; i < totalQuestions; i++) {
        const ansObj = parseRedisHash(results[i + 1]);
        const list = Object.values(ansObj).filter(Boolean);
        if (list.length > 0) {
          answersHistory[i] = list;
        }
      }
    }

    return {
      ...meta,
      players,
      answersHistory
    };
  }

  // --- Publikus Store API ---
  async function getSavedQuizzes() {
    if (HAS_REDIS) {
      const raw = await redisCommand(['GET', KEYS.SAVED_QUIZZES]);
      const parsed = safeJsonParse(raw, null);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      await redisCommand(['SET', KEYS.SAVED_QUIZZES, JSON.stringify(initialDefaultQuizzes)]);
      return JSON.parse(JSON.stringify(initialDefaultQuizzes));
    }
    return memSavedQuizzes;
  }

  async function saveQuiz(quiz) {
    const list = await getSavedQuizzes();
    const existingIdx = list.findIndex((q) => q.id === quiz.id);
    const saved = { ...quiz, id: quiz.id || 'quiz-' + Date.now() };
    if (existingIdx >= 0) {
      list[existingIdx] = saved;
    } else {
      list.unshift(saved);
    }

    if (HAS_REDIS) {
      await redisCommand(['SET', KEYS.SAVED_QUIZZES, JSON.stringify(list)]);
    } else {
      memSavedQuizzes = list;
      writeJsonFile(SAVED_QUIZZES_FILE, memSavedQuizzes);
    }
    return { quiz: saved, quizzes: list };
  }

  async function deleteQuiz(id) {
    const list = (await getSavedQuizzes()).filter((q) => q.id !== id);
    if (HAS_REDIS) {
      await redisCommand(['SET', KEYS.SAVED_QUIZZES, JSON.stringify(list)]);
    } else {
      memSavedQuizzes = list;
      writeJsonFile(SAVED_QUIZZES_FILE, memSavedQuizzes);
    }
    return list;
  }

  async function getSession({ includeAnswers = false } = {}) {
    if (HAS_REDIS) {
      return await loadRedisSession({ includeAnswers });
    }
    return memSession;
  }

  async function initSession({ quiz, pin }) {
    const savedQuizzes = await getSavedQuizzes();
    const questions =
      quiz?.questions && quiz.questions.length > 0
        ? quiz.questions
        : (savedQuizzes[0]?.questions || initialDefaultQuizzes[0].questions);

    if (HAS_REDIS) {
      const prevMeta = await loadRedisMeta().catch(() => null);
      const sessionPin = (pin && String(pin).trim()) || prevMeta?.pin || '582914';
      const newSessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

      const newMeta = {
        id: newSessionId,
        pin: sessionPin,
        status: 'lobby',
        quizId: quiz?.id || 'custom',
        title: quiz?.title || 'Schola Kvíz',
        currentQuestionIndex: 0,
        timeLimit: questions[0]?.timeLimit || 20,
        questionStartTime: 0,
        questions,
        updatedAt: Date.now()
      };
      await saveRedisMeta(newMeta);

      // Régi session kulcsok takarítása (opcionális, ne hagyjon szemetet)
      if (prevMeta?.id && prevMeta.id !== newSessionId) {
        const delCmds = [['DEL', KEYS.playersKey(prevMeta.id)]];
        const prevCount = Array.isArray(prevMeta.questions) ? prevMeta.questions.length : 0;
        for (let i = 0; i < prevCount; i++) {
          delCmds.push(['DEL', KEYS.answersKey(prevMeta.id, i)]);
        }
        redisPipeline(delCmds).catch(() => {});
      }

      return { ...newMeta, players: [], answersHistory: {} };
    }

    const sessionPin = (pin && String(pin).trim()) || memSession?.pin || '582914';
    memSession = {
      id: 'session-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      pin: sessionPin,
      status: 'lobby',
      quizId: quiz?.id || 'custom',
      title: quiz?.title || 'Schola Kvíz',
      currentQuestionIndex: 0,
      timeLimit: questions[0]?.timeLimit || 20,
      questionStartTime: 0,
      questions,
      players: [],
      answersHistory: {},
      updatedAt: Date.now()
    };
    persistLocalSession();
    return memSession;
  }

  async function updatePin(pin) {
    const nextPin =
      pin && String(pin).trim()
        ? String(pin).trim()
        : String(Math.floor(100000 + Math.random() * 900000));

    if (HAS_REDIS) {
      const meta = await loadRedisMeta();
      meta.pin = nextPin;
      await saveRedisMeta(meta);
      return nextPin;
    }

    memSession.pin = nextPin;
    persistLocalSession();
    return nextPin;
  }

  async function joinPlayer({ name, pin }) {
    const cleanName = String(name || '').trim();
    if (!cleanName) {
      return { error: 'Kérlek adj meg egy nevet!', status: 400 };
    }

    if (HAS_REDIS) {
      const session = await loadRedisSession({ includeAnswers: false });
      if (pin && String(pin).trim() !== String(session.pin).trim()) {
        return { error: 'Érvénytelen PIN kód! Ellenőrizd a kivetítőt.', status: 403 };
      }

      let player = session.players.find(
        (p) => p.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (!player) {
        player = {
          id: 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          name: cleanName,
          score: 0,
          streak: 0,
          answered: false,
          lastAnswerCorrect: null,
          lastPoints: 0,
          joinedAt: Date.now()
        };
        const pKey = KEYS.playersKey(session.id);
        await redisPipeline([
          ['HSET', pKey, player.id, JSON.stringify(player)],
          ['EXPIRE', pKey, 86400] // 24 órás TTL
        ]);
        session.players.push(player);
      }

      return { player, session };
    }

    if (pin && String(pin).trim() !== String(memSession.pin).trim()) {
      return { error: 'Érvénytelen PIN kód! Ellenőrizd a kivetítőt.', status: 403 };
    }

    let player = memSession.players.find(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (!player) {
      player = {
        id: 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: cleanName,
        score: 0,
        streak: 0,
        answered: false,
        lastAnswerCorrect: null,
        lastPoints: 0,
        joinedAt: Date.now()
      };
      memSession.players.push(player);
      persistLocalSession();
    }

    return { player, session: memSession };
  }

  async function kickPlayer({ playerId, clearAll }) {
    if (HAS_REDIS) {
      const meta = await loadRedisMeta();
      const pKey = KEYS.playersKey(meta.id);
      if (clearAll) {
        await redisCommand(['DEL', pKey]);
      } else if (playerId) {
        await redisCommand(['HDEL', pKey, playerId]);
      }
      return await loadRedisSession({ includeAnswers: false });
    }

    if (clearAll) {
      memSession.players = [];
    } else if (playerId) {
      memSession.players = memSession.players.filter((p) => p.id !== playerId);
    }
    persistLocalSession();
    return memSession;
  }

  async function startGame() {
    if (HAS_REDIS) {
      const session = await loadRedisSession({ includeAnswers: false });
      const meta = {
        id: session.id,
        pin: session.pin,
        status: 'question',
        quizId: session.quizId,
        title: session.title,
        currentQuestionIndex: 0,
        timeLimit: session.questions[0]?.timeLimit || 20,
        questionStartTime: Date.now(),
        questions: session.questions,
        updatedAt: Date.now()
      };
      const cmds = [['SET', KEYS.META, JSON.stringify(meta)]];
      const pKey = KEYS.playersKey(meta.id);
      const resetPlayers = session.players.map((p) => ({
        ...p,
        answered: false,
        lastAnswerCorrect: null,
        lastPoints: 0
      }));
      resetPlayers.forEach((p) => {
        cmds.push(['HSET', pKey, p.id, JSON.stringify(p)]);
      });
      await redisPipeline(cmds);
      return { ...meta, players: resetPlayers, answersHistory: {} };
    }

    memSession.status = 'question';
    memSession.currentQuestionIndex = 0;
    memSession.questionStartTime = Date.now();
    memSession.players.forEach((p) => {
      p.answered = false;
      p.lastAnswerCorrect = null;
      p.lastPoints = 0;
    });
    persistLocalSession();
    return memSession;
  }

  async function submitAnswer({ playerId, optionId, numericAnswer, responseTimeMs }) {
    const evaluateAnswer = (currentQ, session) => {
      let isCorrect = false;
      if (currentQ.type === 'numeric') {
        const userNum = parseFloat(String(numericAnswer ?? '').replace(',', '.').trim());
        const targetNum = parseFloat(String(currentQ.correctAnswer ?? '').replace(',', '.').trim());
        const tol = Math.abs(parseFloat(currentQ.tolerance || 0)) || 0;
        if (!isNaN(userNum) && !isNaN(targetNum)) {
          isCorrect = Math.abs(userNum - targetNum) <= tol + 1e-9;
        }
      } else {
        isCorrect = Boolean(optionId && currentQ.correctOptionId === optionId);
      }

      const limitMs = (currentQ.timeLimit || 20) * 1000;
      const elapsed =
        typeof responseTimeMs === 'number'
          ? responseTimeMs
          : Date.now() - (session.questionStartTime || Date.now());
      const remainingRatio = Math.max(0, Math.min(1, 1 - elapsed / limitMs));

      return { isCorrect, elapsed, remainingRatio };
    };

    if (HAS_REDIS) {
      const meta = await loadRedisMeta();
      if (meta.status !== 'question') {
        return { error: 'A válaszadási idő már lezárult!', status: 400 };
      }

      const pKey = KEYS.playersKey(meta.id);
      const rawPlayer = await redisCommand(['HGET', pKey, playerId]);
      const player = safeJsonParse(rawPlayer, null);
      if (!player) {
        return { error: 'A játékos nem található.', status: 404 };
      }

      const currentQ = meta.questions[meta.currentQuestionIndex];
      if (!currentQ) {
        return { error: 'Nincs aktív kérdés.', status: 400 };
      }

      if (player.answered) {
        return {
          alreadyAnswered: true,
          isCorrect: Boolean(player.lastAnswerCorrect),
          points: player.lastPoints || 0,
          currentScore: player.score || 0,
          streak: player.streak || 0
        };
      }

      const { isCorrect, elapsed, remainingRatio } = evaluateAnswer(currentQ, meta);
      let points = 0;
      if (isCorrect) {
        points = Math.round(500 + 500 * remainingRatio);
        player.streak = (player.streak || 0) + 1;
        if (player.streak >= 2) points += 100;
      } else {
        player.streak = 0;
      }

      player.score = (player.score || 0) + points;
      player.answered = true;
      player.lastAnswerCorrect = isCorrect;
      player.lastPoints = points;

      const qIdx = meta.currentQuestionIndex;
      const aKey = KEYS.answersKey(meta.id, qIdx);
      const respItem = {
        playerId: player.id,
        playerName: player.name,
        optionId: optionId || null,
        numericAnswer: numericAnswer !== undefined && numericAnswer !== null ? String(numericAnswer).trim() : null,
        isCorrect,
        points,
        responseTimeMs: elapsed
      };

      // Atomi HSET csak erre az egy játékosra és válaszra -> más diákokat nem érinthet!
      await redisPipeline([
        ['HSET', pKey, player.id, JSON.stringify(player)],
        ['HSET', aKey, player.id, JSON.stringify(respItem)],
        ['EXPIRE', aKey, 86400]
      ]);

      return {
        isCorrect,
        points,
        currentScore: player.score,
        streak: player.streak
      };
    }

    // Helyi futás
    if (memSession.status !== 'question') {
      return { error: 'A válaszadási idő már lezárult!', status: 400 };
    }
    const player = memSession.players.find((p) => p.id === playerId);
    if (!player) {
      return { error: 'A játékos nem található.', status: 404 };
    }
    const currentQ = memSession.questions[memSession.currentQuestionIndex];
    if (!currentQ) {
      return { error: 'Nincs aktív kérdés.', status: 400 };
    }
    if (player.answered) {
      return {
        alreadyAnswered: true,
        isCorrect: Boolean(player.lastAnswerCorrect),
        points: player.lastPoints || 0,
        currentScore: player.score || 0,
        streak: player.streak || 0
      };
    }

    const { isCorrect, elapsed, remainingRatio } = evaluateAnswer(currentQ, memSession);
    let points = 0;
    if (isCorrect) {
      points = Math.round(500 + 500 * remainingRatio);
      player.streak = (player.streak || 0) + 1;
      if (player.streak >= 2) points += 100;
    } else {
      player.streak = 0;
    }

    player.score = (player.score || 0) + points;
    player.answered = true;
    player.lastAnswerCorrect = isCorrect;
    player.lastPoints = points;

    if (!memSession.answersHistory) memSession.answersHistory = {};
    const qIdx = memSession.currentQuestionIndex;
    if (!memSession.answersHistory[qIdx]) memSession.answersHistory[qIdx] = [];

    const existingRespIdx = memSession.answersHistory[qIdx].findIndex((r) => r.playerId === player.id);
    const respItem = {
      playerId: player.id,
      playerName: player.name,
      optionId: optionId || null,
      numericAnswer: numericAnswer !== undefined && numericAnswer !== null ? String(numericAnswer).trim() : null,
      isCorrect,
      points,
      responseTimeMs: elapsed
    };

    if (existingRespIdx >= 0) {
      memSession.answersHistory[qIdx][existingRespIdx] = respItem;
    } else {
      memSession.answersHistory[qIdx].push(respItem);
    }
    persistLocalSession();

    return {
      isCorrect,
      points,
      currentScore: player.score,
      streak: player.streak
    };
  }

  async function setStatus(newStatus) {
    if (HAS_REDIS) {
      const meta = await loadRedisMeta();
      meta.status = newStatus;
      await saveRedisMeta(meta);
      return await loadRedisSession({ includeAnswers: true });
    }
    memSession.status = newStatus;
    persistLocalSession();
    return memSession;
  }

  async function nextQuestion() {
    if (HAS_REDIS) {
      const session = await loadRedisSession({ includeAnswers: true });
      const meta = {
        id: session.id,
        pin: session.pin,
        status: session.status,
        quizId: session.quizId,
        title: session.title,
        currentQuestionIndex: session.currentQuestionIndex,
        timeLimit: session.timeLimit,
        questionStartTime: session.questionStartTime,
        questions: session.questions,
        updatedAt: Date.now()
      };

      const cmds = [];
      let updatedPlayers = session.players;

      if (meta.currentQuestionIndex < meta.questions.length - 1) {
        meta.currentQuestionIndex += 1;
        meta.status = 'question';
        meta.timeLimit = meta.questions[meta.currentQuestionIndex]?.timeLimit || 20;
        meta.questionStartTime = Date.now();
        const pKey = KEYS.playersKey(meta.id);
        updatedPlayers = session.players.map((p) => ({
          ...p,
          answered: false,
          lastAnswerCorrect: null,
          lastPoints: 0
        }));
        updatedPlayers.forEach((p) => {
          cmds.push(['HSET', pKey, p.id, JSON.stringify(p)]);
        });
      } else {
        meta.status = 'podium';
      }

      cmds.unshift(['SET', KEYS.META, JSON.stringify(meta)]);
      await redisPipeline(cmds);
      return { ...meta, players: updatedPlayers, answersHistory: session.answersHistory };
    }

    if (memSession.currentQuestionIndex < memSession.questions.length - 1) {
      memSession.currentQuestionIndex += 1;
      memSession.status = 'question';
      memSession.timeLimit = memSession.questions[memSession.currentQuestionIndex]?.timeLimit || 20;
      memSession.questionStartTime = Date.now();
      memSession.players.forEach((p) => {
        p.answered = false;
        p.lastAnswerCorrect = null;
        p.lastPoints = 0;
      });
    } else {
      memSession.status = 'podium';
    }
    persistLocalSession();
    return memSession;
  }

  async function resetSession() {
    if (HAS_REDIS) {
      const session = await loadRedisSession({ includeAnswers: false });
      const meta = {
        id: session.id,
        pin: session.pin,
        status: 'lobby',
        quizId: session.quizId,
        title: session.title,
        currentQuestionIndex: 0,
        timeLimit: session.questions[0]?.timeLimit || 20,
        questionStartTime: 0,
        questions: session.questions,
        updatedAt: Date.now()
      };
      const cmds = [['SET', KEYS.META, JSON.stringify(meta)]];
      const pKey = KEYS.playersKey(meta.id);
      const resetPlayers = session.players.map((p) => ({
        ...p,
        score: 0,
        streak: 0,
        answered: false,
        lastAnswerCorrect: null,
        lastPoints: 0
      }));
      resetPlayers.forEach((p) => {
        cmds.push(['HSET', pKey, p.id, JSON.stringify(p)]);
      });
      const totalQ = Array.isArray(meta.questions) ? meta.questions.length : 0;
      for (let i = 0; i < totalQ; i++) {
        cmds.push(['DEL', KEYS.answersKey(meta.id, i)]);
      }
      await redisPipeline(cmds);
      return { ...meta, players: resetPlayers, answersHistory: {} };
    }

    memSession.status = 'lobby';
    memSession.currentQuestionIndex = 0;
    memSession.answersHistory = {};
    memSession.players.forEach((p) => {
      p.score = 0;
      p.streak = 0;
      p.answered = false;
      p.lastAnswerCorrect = null;
      p.lastPoints = 0;
    });
    persistLocalSession();
    return memSession;
  }

  // Dashboard config tárolás (Vercel-kompatibilis)
  async function getDashboardConfig() {
    if (HAS_REDIS) {
      const raw = await redisCommand(['GET', KEYS.DASHBOARD_CONFIG]);
      return safeJsonParse(raw, null);
    }
    return readJsonFile(DASHBOARD_CONFIG_FILE, null);
  }

  async function saveDashboardConfig(config) {
    const existing = (await getDashboardConfig()) || {};
    const updated = { ...existing, ...config };
    if (HAS_REDIS) {
      await redisCommand(['SET', KEYS.DASHBOARD_CONFIG, JSON.stringify(updated)]);
    } else {
      writeJsonFile(DASHBOARD_CONFIG_FILE, updated);
    }
    return updated;
  }

  return {
    storageMode: STORAGE_MODE,
    isServerless: IS_VERCEL,
    hasRedis: HAS_REDIS,
    getSavedQuizzes,
    saveQuiz,
    deleteQuiz,
    getSession,
    initSession,
    updatePin,
    joinPlayer,
    kickPlayer,
    startGame,
    submitAnswer,
    setStatus,
    nextQuestion,
    resetSession,
    getDashboardConfig,
    saveDashboardConfig
  };
}

module.exports = { createQuizStore };
