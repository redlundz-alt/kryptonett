def analyse(candles: list[dict], state: dict) -> dict:
    valid = [c for c in candles if c["ema9"] is not None and c["ema21"] is not None]
    prev = valid[-2]
    last = valid[-1]

    distance_pct = round(abs(last["ema9"] - last["ema21"]) / last["ema21"] * 100, 2)
    trend = "Bullish" if last["ema9"] > last["ema21"] else "Bearish"
    crossover_price = round(last["ema21"], 2)
    close = last["close"]
    entry = round(close, 2)
    rsi = last.get("rsi")
    rsi_value = round(rsi, 1) if rsi is not None else None

    ema9_crossed_above = prev["ema9"] < prev["ema21"] and last["ema9"] > last["ema21"]
    ema9_crossed_below = prev["ema9"] > prev["ema21"] and last["ema9"] < last["ema21"]

    def get_strength(signal: str):
        if rsi is None:
            return None
        if signal == "LONG":
            if rsi > 55:
                return "Sterk"
            if rsi >= 45:
                return "Moderat"
            return "Svak"
        if signal == "SHORT":
            if rsi < 45:
                return "Sterk"
            if rsi <= 55:
                return "Moderat"
            return "Svak"
        return None

    def build_confirmed_condition(signal: str):
        if last["atr"] is None:
            return (
                f"EMA 9 krysset {'over' if signal == 'LONG' else 'under'} EMA 21 — "
                f"{signal} signal bekreftet. Signal bekreftet over 2 candles. ATR ikke tilgjengelig."
            )
        if signal == "LONG":
            tp1 = round(entry + last["atr"], 2)
            tp2 = round(entry + 2 * last["atr"], 2)
            sl = round(entry - last["atr"], 2)
        else:
            tp1 = round(entry - last["atr"], 2)
            tp2 = round(entry - 2 * last["atr"], 2)
            sl = round(entry + last["atr"], 2)
        return (
            f"EMA 9 krysset {'over' if signal == 'LONG' else 'under'} EMA 21 — "
            f"{signal} signal bekreftet. Signal bekreftet over 2 candles. "
            f"Entry: {entry}. Take profit 1: {tp1}. Take profit 2: {tp2}. Stop loss: {sl}."
        )

    def neutral_condition():
        if trend == "Bearish":
            return (
                f"Bullish trend bekreftet. Venter på SHORT-signal. "
                f"EMA 9 må krysse under {crossover_price} for SHORT-signal."
            )
        return (
            f"Bearish trend bekreftet. Venter på LONG-signal. "
            f"EMA 9 må krysse over {crossover_price} for LONG-signal."
        )

    def reset_state():
        state["signal"] = None
        state["confirmed"] = False
        state["crossover_candle"] = None
        state["direction"] = None

    def awaiting_condition(direction: str):
        if direction == "LONG":
            return (
                f"EMA crossover detektert. Venter på bekreftelse — "
                f"neste candle må close over {crossover_price} (for LONG)"
            )
        return (
            f"EMA crossover detektert. Venter på bekreftelse — "
            f"neste candle må close under {crossover_price} (for SHORT)"
        )

    if state.get("signal") == "AWAITING_CONFIRMATION" and state.get("crossover_candle") is not None:
        direction = state.get("direction")
        if last["time"] > state["crossover_candle"]:
            if direction == "LONG" and close > crossover_price:
                state["signal"] = "LONG"
                state["confirmed"] = True
                return {
                    "signal": "LONG",
                    "condition": build_confirmed_condition("LONG"),
                    "distance_pct": distance_pct,
                    "trend": trend,
                    "crossover_price": crossover_price,
                    "strength": get_strength("LONG"),
                    "rsi": rsi_value,
                    "awaiting_confirmation": False,
                }
            if direction == "SHORT" and close < crossover_price:
                state["signal"] = "SHORT"
                state["confirmed"] = True
                return {
                    "signal": "SHORT",
                    "condition": build_confirmed_condition("SHORT"),
                    "distance_pct": distance_pct,
                    "trend": trend,
                    "crossover_price": crossover_price,
                    "strength": get_strength("SHORT"),
                    "rsi": rsi_value,
                    "awaiting_confirmation": False,
                }
            reset_state()
            return {
                "signal": "NEUTRAL",
                "condition": neutral_condition(),
                "distance_pct": distance_pct,
                "trend": trend,
                "crossover_price": crossover_price,
                "strength": None,
                "rsi": rsi_value,
                "awaiting_confirmation": False,
            }

        return {
            "signal": "AWAITING_CONFIRMATION",
            "condition": awaiting_condition(direction),
            "distance_pct": distance_pct,
            "trend": trend,
            "crossover_price": crossover_price,
            "strength": None,
            "rsi": rsi_value,
            "awaiting_confirmation": True,
        }

    if ema9_crossed_above and state.get("signal") != "LONG":
        state["signal"] = "AWAITING_CONFIRMATION"
        state["confirmed"] = False
        state["crossover_candle"] = last["time"]
        state["direction"] = "LONG"
        return {
            "signal": "AWAITING_CONFIRMATION",
            "condition": awaiting_condition("LONG"),
            "distance_pct": distance_pct,
            "trend": trend,
            "crossover_price": crossover_price,
            "strength": None,
            "rsi": rsi_value,
            "awaiting_confirmation": True,
        }

    if ema9_crossed_below and state.get("signal") != "SHORT":
        state["signal"] = "AWAITING_CONFIRMATION"
        state["confirmed"] = False
        state["crossover_candle"] = last["time"]
        state["direction"] = "SHORT"
        return {
            "signal": "AWAITING_CONFIRMATION",
            "condition": awaiting_condition("SHORT"),
            "distance_pct": distance_pct,
            "trend": trend,
            "crossover_price": crossover_price,
            "strength": None,
            "rsi": rsi_value,
            "awaiting_confirmation": True,
        }

    reset_state()
    return {
        "signal": "NEUTRAL",
        "condition": neutral_condition(),
        "distance_pct": distance_pct,
        "trend": trend,
        "crossover_price": crossover_price,
        "strength": None,
        "rsi": rsi_value,
        "awaiting_confirmation": False,
    }
