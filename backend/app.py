import math
import threading
import time
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

from data_fetcher import fetch_candles
from database import evaluate_outcomes, get_history, get_statistics, init_db, save_signal
from indicator import add_atr, add_ema, add_rsi
from strategy_runner import run_strategies

app = Flask(__name__)
CORS(app)

TIMEFRAMES = ("15m", "1h", "4h", "1d")

cached_candles = {"15m": None, "1h": None, "4h": None, "1d": None}
last_signal_state = {
    tf: {"retning": None, "crossover_bekreftet": False}
    for tf in TIMEFRAMES
}


def parse_timeframe():
    timeframe = request.args.get("timeframe", "1h")
    if timeframe not in TIMEFRAMES:
        return None
    return timeframe


def seconds_until_next_close(timeframe):
    intervals = {"15m": 900, "1h": 3600, "4h": 14400, "1d": 86400}
    interval = intervals[timeframe]
    now = time.time()
    next_close = math.ceil(now / interval) * interval
    remaining = next_close - now
    if remaining == 0:
        return interval
    return remaining


def fetch_loop():
    global cached_candles

    try:
        for timeframe in TIMEFRAMES:
            candles = fetch_candles(timeframe)
            add_ema(candles, 9)
            add_ema(candles, 21)
            add_atr(candles)
            add_rsi(candles)
            cached_candles[timeframe] = candles
            results = run_strategies(candles, last_signal_state[timeframe])
            last = candles[-1]
            for result in results:
                save_signal(
                    result["strategy"],
                    result["signal"],
                    result["condition"],
                    last["close"],
                    last["ema9"],
                    last["ema21"],
                    last["time"],
                    timeframe,
                )
            evaluate_outcomes(candles)
            print(f"Initial fetch {timeframe} at {datetime.now(timezone.utc).isoformat()}")
    except Exception:
        pass

    while True:
        try:
            next_timeframe = min(TIMEFRAMES, key=seconds_until_next_close)
            time.sleep(seconds_until_next_close(next_timeframe) + 30)
            candles = fetch_candles(next_timeframe)
            add_ema(candles, 9)
            add_ema(candles, 21)
            add_atr(candles)
            add_rsi(candles)
            cached_candles[next_timeframe] = candles
            results = run_strategies(candles, last_signal_state[next_timeframe])
            last = candles[-1]
            for result in results:
                save_signal(
                    result["strategy"],
                    result["signal"],
                    result["condition"],
                    last["close"],
                    last["ema9"],
                    last["ema21"],
                    last["time"],
                    next_timeframe,
                )
            evaluate_outcomes(candles)
            print(f"Fetched {next_timeframe} at {datetime.now(timezone.utc).isoformat()}")
        except Exception:
            pass


init_db()
threading.Thread(target=fetch_loop, daemon=True).start()


@app.route("/api/candles")
def api_candles():
    timeframe = parse_timeframe()
    if timeframe is None:
        return jsonify({"message": "Invalid timeframe"}), 400
    if cached_candles[timeframe] is None:
        return jsonify({"message": "Data not ready yet"}), 503
    return jsonify({
        "symbol": "BTCUSDT",
        "timeframe": timeframe,
        "candles": cached_candles[timeframe],
    })


@app.route("/api/signal")
def api_signal():
    timeframe = parse_timeframe()
    if timeframe is None:
        return jsonify({"message": "Invalid timeframe"}), 400
    if cached_candles[timeframe] is None:
        return jsonify({"message": "Data not ready yet"}), 503
    results = run_strategies(cached_candles[timeframe], last_signal_state[timeframe])
    result = results[0]
    last = cached_candles[timeframe][-1]
    return jsonify({
        "strategy": result["strategy"],
        "signal": result["signal"],
        "condition": result["condition"],
        "distance_pct": result["distance_pct"],
        "trend": result["trend"],
        "crossover_price": result["crossover_price"],
        "strength": result["strength"],
        "rsi": result["rsi"],
        "awaiting_confirmation": result["awaiting_confirmation"],
        "timeframe": timeframe,
        "current_price": last["close"],
        "ema9": last["ema9"],
        "ema21": last["ema21"],
        "timestamp": last["time"],
    })


@app.route("/api/history")
def api_history():
    timeframe = parse_timeframe()
    if timeframe is None:
        return jsonify({"message": "Invalid timeframe"}), 400
    return jsonify(get_history(timeframe))


@app.route("/api/statistics")
def api_statistics():
    timeframe = parse_timeframe()
    if timeframe is None:
        return jsonify({"message": "Invalid timeframe"}), 400
    return jsonify(get_statistics(timeframe))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
