import math
import threading
import time
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

from data_fetcher import fetch_candles
from database import evaluate_outcomes, get_history, get_signal_state, get_statistics, init_db, save_signal, save_signal_state
from indicator import add_atr, add_ema, add_macd, add_rsi, add_rsi_direction
from strategy_runner import run_strategies

app = Flask(__name__)
CORS(app)

TIMEFRAMES = ("15m", "1h", "4h", "1d")

cached_candles = {"15m": None, "1h": None, "4h": None, "1d": None}


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
            add_rsi_direction(candles)
            add_macd(candles)
            cached_candles[timeframe] = candles
            state = get_signal_state(timeframe)
            results = run_strategies(candles, state)
            if results:
                updated = results[0]["updated_state"]
                save_signal_state(
                    timeframe,
                    updated["retning"],
                    updated["crossover_bekreftet"],
                )
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
                    result.get("tp1"),
                    result.get("sl"),
                    last["close"],
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
            add_rsi_direction(candles)
            add_macd(candles)
            cached_candles[next_timeframe] = candles
            state = get_signal_state(next_timeframe)
            results = run_strategies(candles, state)
            if results:
                updated = results[0]["updated_state"]
                save_signal_state(
                    next_timeframe,
                    updated["retning"],
                    updated["crossover_bekreftet"],
                )
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
                    result.get("tp1"),
                    result.get("sl"),
                    last["close"],
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
    state = get_signal_state(timeframe)
    results = run_strategies(cached_candles[timeframe], state)
    if results:
        updated = results[0]["updated_state"]
        save_signal_state(
            timeframe,
            updated["retning"],
            updated["crossover_bekreftet"],
        )
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


@app.route("/api/signals")
def api_signals():
    timeframe = parse_timeframe()
    if timeframe is None:
        return jsonify({"message": "Invalid timeframe"}), 400
    if cached_candles[timeframe] is None:
        return jsonify({"message": "Data not ready yet"}), 503
    state = get_signal_state(timeframe)
    results = run_strategies(cached_candles[timeframe], state)
    if results:
        updated = results[0]["updated_state"]
        save_signal_state(
            timeframe,
            updated["retning"],
            updated["crossover_bekreftet"],
        )
    last = cached_candles[timeframe][-1]
    signals = []
    for result in results:
        signal_obj = {
            "strategy": result["strategy"],
            "signal": result["signal"],
            "condition": result["condition"],
            "strength": result.get("strength"),
            "rsi": result.get("rsi"),
            "awaiting_confirmation": result.get("awaiting_confirmation", False),
            "timeframe": timeframe,
            "current_price": last["close"],
            "timestamp": last["time"],
        }
        if "distance_pct" in result:
            signal_obj["distance_pct"] = result["distance_pct"]
            signal_obj["trend"] = result["trend"]
            signal_obj["crossover_price"] = result["crossover_price"]
            signal_obj["ema9"] = last["ema9"]
            signal_obj["ema21"] = last["ema21"]
        if "macd" in result:
            signal_obj["macd"] = result["macd"]
            signal_obj["macd_signal"] = result["macd_signal"]
            signal_obj["macd_histogram"] = result["macd_histogram"]
            signal_obj["momentum"] = result.get("momentum")
            signal_obj["macd_distance_pct"] = result.get("macd_distance_pct")
        if "rsi_direction" in result:
            signal_obj["rsi_direction"] = result["rsi_direction"]
            signal_obj["distance_to_oversold"] = result["distance_to_oversold"]
            signal_obj["distance_to_overbought"] = result["distance_to_overbought"]
        signals.append(signal_obj)
    return jsonify(signals)


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
