-- Live quiz (Fun corner): a host builds a quiz, starts a game with a PIN, and people in the room play on their phones.
CREATE TABLE IF NOT EXISTS live_quizzes (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  questions jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS live_quizzes_owner ON live_quizzes(owner_id, updated_at DESC);

-- A game keeps its own copy of the questions, so editing the quiz never changes a game in progress.
CREATE TABLE IF NOT EXISTS live_games (
  id uuid PRIMARY KEY,
  quiz_id uuid REFERENCES live_quizzes(id) ON DELETE SET NULL,
  host_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin text NOT NULL CHECK (pin ~ '^[0-9]{6}$'),
  title text NOT NULL,
  questions jsonb NOT NULL,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'question', 'reveal', 'finished')),
  current_index int NOT NULL DEFAULT -1,
  question_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
-- A PIN belongs to one open game at a time; finished games release it.
CREATE UNIQUE INDEX IF NOT EXISTS live_games_open_pin ON live_games(pin) WHERE status <> 'finished';

CREATE TABLE IF NOT EXISTS live_players (
  id uuid PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES live_games(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  score int NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS live_players_nickname ON live_players(game_id, lower(nickname));

CREATE TABLE IF NOT EXISTS live_answers (
  game_id uuid NOT NULL REFERENCES live_games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES live_players(id) ON DELETE CASCADE,
  question_index int NOT NULL,
  choice int NOT NULL,
  correct boolean NOT NULL,
  points int NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, question_index)
);
CREATE INDEX IF NOT EXISTS live_answers_question ON live_answers(game_id, question_index);
