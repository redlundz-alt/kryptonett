def analyse(candles: list[dict]) -> dict:
    valid = [c for c in candles if c["ema9"] is not None and c["ema21"] is not None]
    prev = valid[-2]
    last = valid[-1]

    distance_pct = round(abs(last["ema9"] - last["ema21"]) / last["ema21"] * 100, 2)
    trend = "Bullish" if last["ema9"] > last["ema21"] else "Bearish"
    crossover_price = round(last["ema21"], 2)
    close = last["close"]
    entry = round(close, 2)

    ema9_crossed_above = prev["ema9"] < prev["ema21"] and last["ema9"] > last["ema21"]
    ema9_crossed_below = prev["ema9"] > prev["ema21"] and last["ema9"] < last["ema21"]

    if ema9_crossed_above:
        tp1 = round(close * 1.01, 2)
        tp2 = round(close * 1.02, 2)
        sl = round(close * 0.99, 2)
        return {
            "signal": "LONG",
            "condition": (
                f"EMA 9 har krysset over EMA 21 — neste candle må close over {round(close, 0)} for bekreftelse. "
                f"Entry: {entry}. TP1: {tp1} (+1%). TP2: {tp2} (+2%). SL: {sl} (-1%)."
            ),
            "distance_pct": distance_pct,
            "trend": trend,
            "crossover_price": crossover_price,
        }
    elif ema9_crossed_below:
        tp1 = round(close * 0.99, 2)
        tp2 = round(close * 0.98, 2)
        sl = round(close * 1.01, 2)
        return {
            "signal": "SHORT",
            "condition": (
                f"EMA 9 har krysset under EMA 21 — neste candle må close under {round(close, 0)} for bekreftelse. "
                f"Entry: {entry}. TP1: {tp1} (+1%). TP2: {tp2} (+2%). SL: {sl} (+1%)."
            ),
            "distance_pct": distance_pct,
            "trend": trend,
            "crossover_price": crossover_price,
        }
    else:
        crossover_direction = "under"
        return {
            "signal": "NEUTRAL",
            "condition": (
                f"Avstand: {distance_pct}%. Trend: {trend}. "
                f"Neste candle må close {crossover_direction} {crossover_price} for crossover."
            ),
            "distance_pct": distance_pct,
            "trend": trend,
            "crossover_price": crossover_price,
        }
