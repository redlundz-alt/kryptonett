import threading
import time

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
    tf: {"signal": None, "confirmed": False, "crossover_candle": None}
    for tf in TIMEFRAMES
}


def parse_timeframe():
    timeframe = request.args.get("timeframe", "1h")
    if timeframe not in TIMEFRAMES:
        return None
    return timeframe


def fetch_loop():
    global cached_candles
    while True:
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
        except Exception:
            pass
        time.sleep(300)


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
