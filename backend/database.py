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


def save_signal(strategy, signal, condition, price, ema9, ema21, timestamp, timeframe, tp1, sl, entry_price):
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
                INSERT INTO signals (
                    strategy, signal, condition, price, ema9, ema21,
                    timestamp, timeframe, tp1, sl, entry_price
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    strategy, signal, condition, price, ema9, ema21,
                    timestamp, timeframe, tp1, sl, entry_price,
                ),
            )
        conn.commit()


def evaluate_outcomes(current_candles):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, signal, timestamp, tp1, sl
                FROM signals
                WHERE outcome IS NULL AND tp1 IS NOT NULL AND sl IS NOT NULL
                """,
            )
            rows = cur.fetchall()

            for row_id, signal, timestamp, tp1, sl in rows:
                candles_after = [c for c in current_candles if c["time"] > timestamp]
                outcome = None
                outcome_price = None

                for candle in candles_after:
                    if signal == "LONG":
                        if candle["low"] <= sl:
                            outcome = "LOSS"
                            outcome_price = sl
                            break
                        if candle["high"] >= tp1:
                            outcome = "WIN"
                            outcome_price = tp1
                            break
                    elif signal == "SHORT":
                        if candle["high"] >= sl:
                            outcome = "LOSS"
                            outcome_price = sl
                            break
                        if candle["low"] <= tp1:
                            outcome = "WIN"
                            outcome_price = tp1
                            break

                if outcome is not None:
                    cur.execute(
                        """
                        UPDATE signals
                        SET outcome = %s, outcome_price = %s
                        WHERE id = %s
                        """,
                        (outcome, outcome_price, row_id),
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


def get_history(timeframe="1h", limit=10):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, strategy, signal, condition, price, ema9, ema21,
                       timestamp, outcome, outcome_price, created_at, timeframe
                FROM signals
                WHERE timeframe = %s
                ORDER BY timestamp DESC
                LIMIT %s
                """,
                (timeframe, limit),
            )
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    return [dict(zip(columns, row)) for row in rows]


def get_signal_state(timeframe, strategy):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT retning, crossover_bekreftet
                FROM signal_state
                WHERE timeframe = %s AND strategy = %s
                """,
                (timeframe, strategy),
            )
            row = cur.fetchone()

    if not row:
        return {"retning": None, "crossover_bekreftet": False}

    return {"retning": row[0], "crossover_bekreftet": row[1]}


def save_signal_state(timeframe, strategy, retning, crossover_bekreftet):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO signal_state (timeframe, strategy, retning, crossover_bekreftet, updated_at)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT (timeframe, strategy) DO UPDATE SET
                    retning = EXCLUDED.retning,
                    crossover_bekreftet = EXCLUDED.crossover_bekreftet,
                    updated_at = NOW()
                """,
                (timeframe, strategy, retning, crossover_bekreftet),
            )
        conn.commit()


def save_friday_close(week_start, friday_close):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT 1 FROM cme_gaps WHERE week_start = %s",
                (week_start,),
            )
            if cur.fetchone():
                return
            cur.execute(
                """
                INSERT INTO cme_gaps (week_start, friday_close)
                VALUES (%s, %s)
                """,
                (week_start, friday_close),
            )
        conn.commit()


def save_sunday_open(week_start, sunday_open):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT friday_close, sunday_open
                FROM cme_gaps
                WHERE week_start = %s
                """,
                (week_start,),
            )
            row = cur.fetchone()
            if not row or row[1] is not None or row[0] is None:
                return
            friday_close = row[0]
            gap_size = sunday_open - friday_close
            gap_pct = (gap_size / friday_close) * 100
            direction = "up" if gap_size > 0 else "down"
            cur.execute(
                """
                UPDATE cme_gaps
                SET sunday_open = %s,
                    gap_size = %s,
                    gap_pct = %s,
                    direction = %s
                WHERE week_start = %s AND sunday_open IS NULL
                """,
                (sunday_open, gap_size, gap_pct, direction, week_start),
            )
        conn.commit()


def _gap_row_to_dict(row):
    gap = dict(row)
    if gap.get("week_start") is not None:
        gap["week_start"] = gap["week_start"].isoformat()
    if gap.get("filled_at") is not None:
        gap["filled_at"] = gap["filled_at"].isoformat()
    if gap.get("created_at") is not None:
        gap["created_at"] = gap["created_at"].isoformat()
    return gap


def get_current_gap():
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, week_start, friday_close, sunday_open, gap_size, gap_pct,
                       direction, filled, filled_at, created_at
                FROM cme_gaps
                ORDER BY week_start DESC
                LIMIT 1
                """,
            )
            row = cur.fetchone()
            if not row:
                return None
            columns = [desc[0] for desc in cur.description]

    return _gap_row_to_dict(dict(zip(columns, row)))


def get_gap_history(limit=8):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, week_start, friday_close, sunday_open, gap_size, gap_pct,
                       direction, filled, filled_at, created_at
                FROM cme_gaps
                ORDER BY week_start DESC
                LIMIT %s
                """,
                (limit,),
            )
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()

    return [_gap_row_to_dict(dict(zip(columns, row))) for row in rows]


def update_gap_filled(gap_id, filled_at):
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE cme_gaps
                SET filled = TRUE, filled_at = %s
                WHERE id = %s
                """,
                (filled_at, gap_id),
            )
        conn.commit()
