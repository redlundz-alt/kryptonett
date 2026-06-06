import os

import psycopg2


def _connect():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def init_db():
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS signals (
                    id SERIAL PRIMARY KEY,
                    strategy TEXT NOT NULL,
                    signal TEXT NOT NULL,
                    condition TEXT NOT NULL,
                    price FLOAT NOT NULL,
                    ema9 FLOAT NOT NULL,
                    ema21 FLOAT NOT NULL,
                    timestamp BIGINT NOT NULL,
                    outcome TEXT,
                    outcome_price FLOAT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
        conn.commit()


def save_signal(strategy, signal, condition, price, ema9, ema21, timestamp, timeframe):
    if signal not in ("LONG", "SHORT"):
        return

    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM signals WHERE strategy = %s AND timestamp = %s AND timeframe = %s",
                (strategy, timestamp, timeframe),
            )
            if cur.fetchone():
                return

            cur.execute(
                """
                INSERT INTO signals (strategy, signal, condition, price, ema9, ema21, timestamp, timeframe)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (strategy, signal, condition, price, ema9, ema21, timestamp, timeframe),
            )
        conn.commit()


def evaluate_outcomes(current_candles):
    latest_time = current_candles[-1]["time"]
    current_price = current_candles[-1]["close"]
    cutoff = latest_time - 3600

    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, signal, price
                FROM signals
                WHERE outcome IS NULL AND timestamp <= %s
                """,
                (cutoff,),
            )
            rows = cur.fetchall()

            for row_id, signal, price in rows:
                if signal == "LONG":
                    if current_price > price:
                        outcome = "WIN"
                    elif current_price < price:
                        outcome = "LOSS"
                    else:
                        outcome = "NEUTRAL"
                elif signal == "SHORT":
                    if current_price < price:
                        outcome = "WIN"
                    elif current_price > price:
                        outcome = "LOSS"
                    else:
                        outcome = "NEUTRAL"
                else:
                    continue

                cur.execute(
                    """
                    UPDATE signals
                    SET outcome = %s, outcome_price = %s
                    WHERE id = %s
                    """,
                    (outcome, current_price, row_id),
                )
        conn.commit()


def get_statistics(timeframe="1h"):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT strategy,
                       COUNT(*) FILTER (WHERE outcome IN ('WIN', 'LOSS')) AS total,
                       COUNT(*) FILTER (WHERE outcome = 'WIN') AS wins,
                       COUNT(*) FILTER (WHERE outcome = 'LOSS') AS losses
                FROM signals
                WHERE timeframe = %s
                GROUP BY strategy
            """, (timeframe,))
            rows = cur.fetchall()

    stats = {}
    for strategy, total, wins, losses in rows:
        stats[strategy] = {
            "total": total,
            "wins": wins,
            "losses": losses,
            "win_rate": wins / total if total > 0 else 0,
        }
    return stats


def get_history(timeframe="1h", limit=50):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, strategy, signal, condition, price, ema9, ema21,
                       timestamp, outcome, outcome_price, created_at, timeframe
                FROM signals
                WHERE timeframe = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (timeframe, limit),
            )
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]


def get_signal_state(timeframe):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT retning, crossover_bekreftet FROM signal_state WHERE timeframe = %s",
                (timeframe,),
            )
            row = cur.fetchone()

    if not row:
        return {"retning": None, "crossover_bekreftet": False}

    return {"retning": row[0], "crossover_bekreftet": row[1]}


def save_signal_state(timeframe, retning, crossover_bekreftet):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO signal_state (timeframe, retning, crossover_bekreftet, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (timeframe) DO UPDATE SET
                    retning = EXCLUDED.retning,
                    crossover_bekreftet = EXCLUDED.crossover_bekreftet,
                    updated_at = NOW()
                """,
                (timeframe, retning, crossover_bekreftet),
            )
        conn.commit()
