from flask import Flask, jsonify
from flask_cors import CORS

from data_fetcher import fetch_candles
from indicator import add_ema
from strategy_runner import run_strategies

app = Flask(__name__)
CORS(app)


@app.route("/api/candles")
def api_candles():
    candles = fetch_candles()
    add_ema(candles, 9)
    add_ema(candles, 21)
    return jsonify({
        "symbol": "BTCUSDT",
        "timeframe": "1h",
        "candles": candles,
    })


@app.route("/api/signal")
def api_signal():
    candles = fetch_candles()
    add_ema(candles, 9)
    add_ema(candles, 21)
    strategies = run_strategies(candles)
    result = strategies[0]
    last = candles[-1]
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
