import threading
import time

from flask import Flask, jsonify
from flask_cors import CORS

from data_fetcher import fetch_candles
from indicator import add_ema
from strategy_runner import run_strategies

app = Flask(__name__)
CORS(app)

cached_candles = None


def fetch_loop():
    global cached_candles
    while True:
        try:
            candles = fetch_candles()
            add_ema(candles, 9)
            add_ema(candles, 21)
            cached_candles = candles
        except Exception:
            pass
        time.sleep(300)


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
    if cached_candles is None:
        return jsonify({"message": "Data not ready yet"}), 503
    strategies = run_strategies(cached_candles)
    result = strategies[0]
    last = cached_candles[-1]
    return jsonify({
        "strategy": result["strategy"],
        "signal": result["signal"],
        "condition": result["condition"],
        "current_price": last["close"],
        "ema9": last["ema9"],
        "ema21": last["ema21"],
        "timestamp": last["time"],
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
