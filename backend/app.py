import threading
import time

from flask import Flask, jsonify
from flask_cors import CORS

from data_fetcher import fetch_candles
from database import evaluate_outcomes, get_history, get_statistics, init_db, save_signal
from indicator import add_atr, add_ema, add_rsi
from strategy_runner import run_strategies

app = Flask(__name__)
CORS(app)

cached_candles = None
cached_strategy_results = None
last_signal_state = {"signal": None, "confirmed": False, "crossover_candle": None}


def fetch_loop():
    global cached_candles, cached_strategy_results
    while True:
        try:
            candles = fetch_candles()
            add_ema(candles, 9)
            add_ema(candles, 21)
            add_atr(candles)
            add_rsi(candles)
            cached_candles = candles
            cached_strategy_results = run_strategies(candles, last_signal_state)
            last = candles[-1]
            for result in cached_strategy_results:
                save_signal(
                    result["strategy"],
                    result["signal"],
                    result["condition"],
                    last["close"],
                    last["ema9"],
                    last["ema21"],
                    last["time"],
                )
            evaluate_outcomes(candles)
        except Exception:
            pass
        time.sleep(300)


init_db()
threading.Thread(target=fetch_loop, daemon=True).start()


@app.route("/api/candles")
def api_candles():
    if cached_candles is None:
        return jsonify({"message": "Data not ready yet"}), 503
    return jsonify({
        "symbol": "BTCUSDT",
        "timeframe": "1h",
        "candles": cached_candles,
    })


@app.route("/api/signal")
def api_signal():
    if cached_candles is None or cached_strategy_results is None:
        return jsonify({"message": "Data not ready yet"}), 503
    result = cached_strategy_results[0]
    last = cached_candles[-1]
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
        "current_price": last["close"],
        "ema9": last["ema9"],
        "ema21": last["ema21"],
        "timestamp": last["time"],
    })


@app.route("/api/history")
def api_history():
    return jsonify(get_history())


@app.route("/api/statistics")
def api_statistics():
    return jsonify(get_statistics())


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
