def analyse(candles: list[dict]) -> dict:
    valid = [c for c in candles if c["ema9"] is not None and c["ema21"] is not None]
    prev = valid[-2]
    last = valid[-1]

    ema9_crossed_above = prev["ema9"] < prev["ema21"] and last["ema9"] > last["ema21"]
    ema9_crossed_below = prev["ema9"] > prev["ema21"] and last["ema9"] < last["ema21"]

    if ema9_crossed_above:
        return {
            "signal": "LONG",
            "condition": f"EMA 9 har krysset over EMA 21 — neste candle må close over {round(last['close'], 0)} for bekreftelse",
        }
    elif ema9_crossed_below:
        return {
            "signal": "SHORT",
            "condition": f"EMA 9 har krysset under EMA 21 — neste candle må close under {round(last['close'], 0)} for bekreftelse",
        }
    else:
        diff = round(last["ema9"] - last["ema21"], 0)
        direction = "over" if diff > 0 else "under"
        return {
            "signal": "NEUTRAL",
            "condition": f"EMA 9 er {abs(diff)} {direction} EMA 21 — ingen crossover ennå",
        }
