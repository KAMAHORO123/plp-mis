// Live quiz for the Fun corner, played in the room like Kahoot: a signed-in host builds a quiz and starts a game,
// the system gives it a 6-digit PIN, and anyone with the PIN joins on their phone with a nickname (no account).
// Phones and the host screen poll for the game state about once a second, so this works through any proxy.
import { randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { digest, sessionToken } from "./auth.mjs";
import { transaction } from "./db.mjs";

const MAX_PLAYERS = 300;
const STALE_HOURS = 12;
const question = z
  .object({
    text: z.string().trim().min(1).max(300),
    answers: z.array(z.string().trim().min(1).max(120)).min(2).max(4),
    correct: z.number().int().min(0).max(3),
    seconds: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(60)]).default(20),
  })
  .strict()
  .refine((q) => q.correct < q.answers.length, { message: "Tick the right answer for every question" });
export const quizSchema = z
  .object({ title: z.string().trim().min(1).max(120), questions: z.array(question).min(1).max(50) })
  .strict();

function demand(ok, status, message) {
  if (!ok) throw Object.assign(new Error(message), { status });
}

/** Points for a correct answer: 1000 for an instant answer, falling to 500 at the last second; wrong answers score 0. */
export function pointsFor(correct, elapsedMs, seconds) {
  if (!correct) return 0;
  const share = Math.min(Math.max(elapsedMs / (seconds * 1000), 0), 1);
  return Math.round(1000 * (1 - share / 2));
}

const deadline = (game) => new Date(game.question_started_at).getTime() + game.questions[game.current_index].seconds * 1000;

/** Ends a question once its time is up or everyone has answered, so every screen moves on together. */
async function settle(db, game) {
  if (game.status !== "question") return game;
  const players = (await db.query("SELECT count(*)::int AS n FROM live_players WHERE game_id=$1", [game.id])).rows[0].n;
  const answered = (await db.query("SELECT count(*)::int AS n FROM live_answers WHERE game_id=$1 AND question_index=$2", [game.id, game.current_index])).rows[0].n;
  if (Date.now() < deadline(game) && !(players > 0 && answered >= players)) return game;
  const moved = (await db.query(
    "UPDATE live_games SET status='reveal' WHERE id=$1 AND status='question' AND current_index=$2 RETURNING *",
    [game.id, game.current_index],
  )).rows[0];
  return moved ?? (await db.query("SELECT * FROM live_games WHERE id=$1", [game.id])).rows[0];
}

async function leaderboard(db, gameId, limit = 10) {
  return (await db.query(
    "SELECT nickname, score FROM live_players WHERE game_id=$1 ORDER BY score DESC, joined_at LIMIT $2",
    [gameId, limit],
  )).rows;
}

function publicQuestion(game, { withAnswer }) {
  const q = game.questions[game.current_index];
  if (!q) return null;
  return {
    text: q.text,
    answers: q.answers,
    seconds: q.seconds,
    remainingMs: game.status === "question" ? Math.max(0, deadline(game) - Date.now()) : 0,
    ...(withAnswer ? { correct: q.correct } : {}),
  };
}

async function hostView(db, game) {
  const players = (await db.query("SELECT nickname, score FROM live_players WHERE game_id=$1 ORDER BY joined_at", [game.id])).rows;
  const answers = game.current_index >= 0
    ? (await db.query("SELECT choice, count(*)::int AS n FROM live_answers WHERE game_id=$1 AND question_index=$2 GROUP BY choice", [game.id, game.current_index])).rows
    : [];
  const q = game.questions[game.current_index];
  return {
    id: game.id,
    pin: game.pin,
    title: game.title,
    status: game.status,
    index: game.current_index,
    total: game.questions.length,
    players,
    answered: answers.reduce((sum, a) => sum + a.n, 0),
    // How many chose each answer, shown with the right answer once the question closes.
    counts: q && game.status !== "question" ? q.answers.map((_, i) => answers.find((a) => a.choice === i)?.n ?? 0) : null,
    question: publicQuestion(game, { withAnswer: game.status !== "question" }),
    leaderboard: await leaderboard(db, game.id),
  };
}

async function playerView(db, game, player) {
  const mine = game.current_index >= 0
    ? (await db.query("SELECT choice, correct, points FROM live_answers WHERE player_id=$1 AND question_index=$2", [player.id, game.current_index])).rows[0]
    : null;
  const rank = (await db.query(
    "SELECT count(*)::int + 1 AS rank FROM live_players WHERE game_id=$1 AND (score > $2 OR (score = $2 AND joined_at < $3))",
    [game.id, player.score, player.joined_at],
  )).rows[0].rank;
  const players = (await db.query("SELECT count(*)::int AS n FROM live_players WHERE game_id=$1", [game.id])).rows[0].n;
  const revealed = game.status === "reveal" || game.status === "finished";
  return {
    title: game.title,
    status: game.status,
    index: game.current_index,
    total: game.questions.length,
    nickname: player.nickname,
    score: player.score,
    rank,
    players,
    question: game.status === "lobby" ? null : publicQuestion(game, { withAnswer: revealed }),
    answer: mine ? { choice: mine.choice, ...(revealed ? { correct: mine.correct, points: mine.points } : {}) } : null,
    podium: game.status === "finished" ? await leaderboard(db, game.id, 3) : null,
  };
}

async function newPin(db) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const pin = String(randomInt(100000, 1000000));
    const taken = (await db.query("SELECT 1 FROM live_games WHERE pin=$1 AND status<>'finished'", [pin])).rowCount;
    if (!taken) return pin;
  }
  throw Object.assign(new Error("Could not create a game PIN. Try again."), { status: 503 });
}

/**
 * Public routes (players, no account) and host routes (signed-in user). Called before the sign-in check with
 * `user` null, then again after it; each call only answers the routes it can.
 */
export async function liveQuizRoute({ p, req, db, user, body, send, limit }) {
  // ---- Players ---------------------------------------------------------------------------------------------
  if (p === "/public/play/join" && req.method === "POST") {
    await limit("play-join", 40);
    const input = z
      .object({ pin: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit game PIN"), nickname: z.string().trim().min(1, "Choose a nickname").max(24) })
      .strict()
      .parse(await body());
    const token = sessionToken();
    await transaction(db, async (tx) => {
      const game = (await tx.query(
        "SELECT * FROM live_games WHERE pin=$1 AND status<>'finished' AND created_at > now() - make_interval(hours => $2) FOR UPDATE",
        [input.pin, STALE_HOURS],
      )).rows[0];
      demand(game, 404, "No game is open with this PIN. Check the PIN on the host's screen.");
      const count = (await tx.query("SELECT count(*)::int AS n FROM live_players WHERE game_id=$1", [game.id])).rows[0].n;
      demand(count < MAX_PLAYERS, 409, "This game is full.");
      const added = await tx.query(
        "INSERT INTO live_players(id,game_id,nickname,token_hash) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id",
        [randomUUID(), game.id, input.nickname, digest(token)],
      );
      demand(added.rowCount, 409, "Someone in this game already has that nickname. Choose another.");
    });
    send(201, { token });
    return true;
  }
  if (p === "/public/play/state" || p === "/public/play/answer") {
    const token = String(req.headers["x-play-token"] ?? "");
    const player = token && (await db.query("SELECT * FROM live_players WHERE token_hash=$1", [digest(token)])).rows[0];
    demand(player, 404, "This game has ended or you left it. Join again with the PIN.");
    let game = (await db.query("SELECT * FROM live_games WHERE id=$1", [player.game_id])).rows[0];
    demand(game, 404, "This game has ended.");
    if (p === "/public/play/state" && req.method === "GET") {
      game = await settle(db, game);
      send(200, await playerView(db, game, player));
      return true;
    }
    if (req.method === "POST") {
      const { choice } = z.object({ choice: z.number().int().min(0).max(3) }).strict().parse(await body());
      demand(game.status === "question", 409, "This question is closed.");
      const q = game.questions[game.current_index];
      demand(choice < q.answers.length, 400, "Choose one of the answers");
      const elapsed = Date.now() - new Date(game.question_started_at).getTime();
      demand(elapsed <= q.seconds * 1000 + 500, 409, "Time is up for this question.");
      const correct = choice === q.correct;
      const points = pointsFor(correct, elapsed, q.seconds);
      await transaction(db, async (tx) => {
        const saved = await tx.query(
          "INSERT INTO live_answers(game_id,player_id,question_index,choice,correct,points) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
          [game.id, player.id, game.current_index, choice, correct, points],
        );
        demand(saved.rowCount, 409, "You already answered this question.");
        if (points) await tx.query("UPDATE live_players SET score=score+$2 WHERE id=$1", [player.id, points]);
      });
      send(200, { ok: true });
      return true;
    }
    return false;
  }
  // ---- Hosts -----------------------------------------------------------------------------------------------
  if (!user || !(p.startsWith("/live-quizzes") || p.startsWith("/live-games"))) return false;

  if (p === "/live-quizzes" && req.method === "GET") {
    send(200, (await db.query(
      "SELECT id,title,questions,updated_at FROM live_quizzes WHERE owner_id=$1 ORDER BY updated_at DESC LIMIT 100",
      [user.id],
    )).rows);
    return true;
  }
  if (p === "/live-quizzes" && req.method === "POST") {
    const input = quizSchema.parse(await body());
    const id = randomUUID();
    await db.query("INSERT INTO live_quizzes(id,owner_id,title,questions) VALUES($1,$2,$3,$4)", [id, user.id, input.title, JSON.stringify(input.questions)]);
    send(201, { id });
    return true;
  }
  const quizMatch = p.match(/^\/live-quizzes\/([0-9a-f-]{36})(\/games)?$/);
  if (quizMatch) {
    const id = z.string().uuid().parse(quizMatch[1]);
    const quiz = (await db.query("SELECT * FROM live_quizzes WHERE id=$1 AND owner_id=$2", [id, user.id])).rows[0];
    demand(quiz, 404, "Quiz not found");
    if (!quizMatch[2] && req.method === "PUT") {
      const input = quizSchema.parse(await body());
      await db.query("UPDATE live_quizzes SET title=$2,questions=$3,updated_at=now() WHERE id=$1", [id, input.title, JSON.stringify(input.questions)]);
      send(200, { ok: true });
      return true;
    }
    if (!quizMatch[2] && req.method === "DELETE") {
      await db.query("DELETE FROM live_quizzes WHERE id=$1", [id]);
      send(200, { ok: true });
      return true;
    }
    if (quizMatch[2] && req.method === "POST") {
      // A host runs one game at a time; starting a new one closes their earlier games and frees old PINs.
      await db.query("UPDATE live_games SET status='finished', ended_at=now() WHERE status<>'finished' AND (host_id=$1 OR created_at < now() - make_interval(hours => $2))", [user.id, STALE_HOURS]);
      const game = { id: randomUUID(), pin: await newPin(db) };
      await db.query(
        "INSERT INTO live_games(id,quiz_id,host_id,pin,title,questions) VALUES($1,$2,$3,$4,$5,$6)",
        [game.id, quiz.id, user.id, game.pin, quiz.title, JSON.stringify(quiz.questions)],
      );
      send(201, game);
      return true;
    }
    return false;
  }
  const gameMatch = p.match(/^\/live-games\/([0-9a-f-]{36})(\/action)?$/);
  if (gameMatch) {
    const id = z.string().uuid().parse(gameMatch[1]);
    let game = (await db.query("SELECT * FROM live_games WHERE id=$1 AND host_id=$2", [id, user.id])).rows[0];
    demand(game, 404, "Game not found");
    if (!gameMatch[2] && req.method === "GET") {
      game = await settle(db, game);
      send(200, await hostView(db, game));
      return true;
    }
    if (gameMatch[2] && req.method === "POST") {
      const { action } = z.object({ action: z.enum(["next", "reveal", "end"]) }).strict().parse(await body());
      game = await settle(db, game);
      if (action === "end") {
        await db.query("UPDATE live_games SET status='finished', ended_at=now() WHERE id=$1", [id]);
      } else if (action === "reveal") {
        demand(game.status === "question", 409, "No question is open.");
        await db.query("UPDATE live_games SET status='reveal' WHERE id=$1 AND status='question'", [id]);
      } else {
        demand(game.status === "lobby" || game.status === "reveal", 409, game.status === "finished" ? "This game has finished." : "Wait for this question to close.");
        if (game.status === "lobby")
          demand((await db.query("SELECT 1 FROM live_players WHERE game_id=$1 LIMIT 1", [id])).rowCount, 409, "Wait for at least one player to join.");
        const next = game.current_index + 1;
        if (next >= game.questions.length)
          await db.query("UPDATE live_games SET status='finished', ended_at=now() WHERE id=$1", [id]);
        else
          await db.query("UPDATE live_games SET status='question', current_index=$2, question_started_at=now() WHERE id=$1", [id, next]);
      }
      game = (await db.query("SELECT * FROM live_games WHERE id=$1", [id])).rows[0];
      send(200, await hostView(db, game));
      return true;
    }
  }
  return false;
}
