def analyse(candles: list[dict], state: dict) -> dict:
    valid = [
        c for c in candles
        if c.get("ema50") is not None and c.get("ema200") is not None
    ]
    if len(valid) < 2:
        last = candles[-1]
        ema50 = last.get("ema50")
        ema200 = last.get("ema200")
        distance = (
            round(abs(ema50 - ema200) / ema200 * 100, 2)
            if ema50 is not None and ema200 is not None
            else None
        )
        return {
            "signal": "NEUTRAL",
            "condition": "Venter på nok data for Golden Cross.",
            "ema50": round(ema50, 2) if ema50 is not None else None,
            "ema200": round(ema200, 2) if ema200 is not None else None,
            "distance_pct": distance,
            "rsi": round(last["rsi"], 1) if last.get("rsi") is not None else None,
            "strength": "Sterk",
            "tp1": None,
            "sl": None,
            "updated_state": {
                "retning": state.get("retning"),
                "crossover_bekreftet": state.get("crossover_bekreftet", False),
            },
        }
    prev = valid[-2]
    last = valid[-1]

    ema50_value = round(last["ema50"], 2)
    ema200_value = round(last["ema200"], 2)
    distance_pct = round(abs(last["ema50"] - last["ema200"]) / last["ema200"] * 100, 2)
    close = last["close"]
    entry = round(close, 2)
    rsi = last.get("rsi")
    rsi_value = round(rsi, 1) if rsi is not None else None
    trend = "Bullish" if last["ema50"] > last["ema200"] else "Bearish"
    crossover_price = ema200_value

    ema50_crossed_above = prev["ema50"] < prev["ema200"] and last["ema50"] > last["ema200"]
    ema50_crossed_below = prev["ema50"] > prev["ema200"] and last["ema50"] < last["ema200"]
    crossover_this_candle = ema50_crossed_above or ema50_crossed_below

    def reset_state():
        state["retning"] = None
        state["crossover_bekreftet"] = False

    def get_tp_sl(signal: str):
        if last["atr"] is None:
            return None, None
        if signal == "LONG":
            return round(entry + last["atr"], 2), round(entry - last["atr"], 2)
        return round(entry - last["atr"], 2), round(entry + last["atr"], 2)

    def build_confirmed_long():
        if last["atr"] is None:
            return (
                f"Golden Cross bekreftet. Sterk bullish trend. Entry: {entry}. "
                "ATR ikke tilgjengelig."
            )
        tp1 = round(entry + last["atr"], 2)
        tp2 = round(entry + 2 * last["atr"], 2)
        sl = round(entry - last["atr"], 2)
        return (
            f"Golden Cross bekreftet. Sterk bullish trend. Entry: {entry}. "
            f"TP1: {tp1}. TP2: {tp2}. SL: {sl}."
        )

    def build_confirmed_short():
        if last["atr"] is None:
            return (
                f"Death Cross bekreftet. Sterk bearish trend. Entry: {entry}. "
                "ATR ikke tilgjengelig."
            )
        tp1 = round(entry - last["atr"], 2)
        tp2 = round(entry - 2 * last["atr"], 2)
        sl = round(entry + last["atr"], 2)
        return (
            f"Death Cross bekreftet. Sterk bearish trend. Entry: {entry}. "
            f"TP1: {tp1}. TP2: {tp2}. SL: {sl}."
        )

    def with_updated_state(result: dict) -> dict:
        result["ema50"] = ema50_value
        result["ema200"] = ema200_value
        result["distance_pct"] = distance_pct
        result["rsi"] = rsi_value
        result["trend"] = trend
        result["crossover_price"] = crossover_price
        result.setdefault("strength", "Sterk")
        result.setdefault("tp1", None)
        result.setdefault("sl", None)
        result["updated_state"] = {
            "retning": state.get("retning"),
            "crossover_bekreftet": state.get("crossover_bekreftet", False),
        }
        return result

    def start_awaiting(retning: str):
        state["retning"] = retning
        state["crossover_bekreftet"] = False
        if retning == "LONG":
            condition = (
                "Golden Cross detektert — EMA 50 krysset over EMA 200. "
                "Neste candle må bekrefte for LONG-signal. "
                "Dette er et sterkt langsiktig signal."
            )
        else:
            condition = (
                "Death Cross detektert — EMA 50 krysset under EMA 200. "
                "Neste candle må bekrefte for SHORT-signal. "
                "Dette er et sterkt langsiktig bearish signal."
            )
        return with_updated_state({
            "signal": "AWAITING_CONFIRMATION",
            "condition": condition,
            "strength": "Sterk",
            "awaiting_confirmation": True,
        })

    def neutral_waiting():
        if state.get("crossover_bekreftet") and state.get("retning"):
            if last["ema50"] > last["ema200"]:
                return (
                    f"Bullish trend (Golden Cross aktiv). EMA 50 over EMA 200 "
                    f"({distance_pct}% avstand). Venter på Death Cross for SHORT-signal."
                )
            if last["ema50"] < last["ema200"]:
                return (
                    f"Bearish trend (Death Cross aktiv). EMA 50 under EMA 200 "
                    f"({distance_pct}% avstand). Venter på Golden Cross for LONG-signal."
                )
        if last["ema50"] > last["ema200"]:
            return f"Bullish trend. EMA 50 over EMA 200 ({distance_pct}% avstand)."
        return f"Bearish trend. EMA 50 under EMA 200 ({distance_pct}% avstand)."

    # Oppstart-sjekk
    if state.get("retning") is None:
        if last["ema50"] > last["ema200"]:
            state["retning"] = "SHORT"
            state["crossover_bekreftet"] = True
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting(),
                "strength": "Sterk",
                "awaiting_confirmation": False,
            })
        if last["ema50"] < last["ema200"]:
            state["retning"] = "LONG"
            state["crossover_bekreftet"] = True
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting(),
                "strength": "Sterk",
                "awaiting_confirmation": False,
            })

    # FASE 2 - Bekreftelse
    if (
        state.get("retning")
        and not state.get("crossover_bekreftet")
        and not crossover_this_candle
    ):
        if state["retning"] == "LONG":
            if last["ema50"] > last["ema200"]:
                state["crossover_bekreftet"] = True
                tp1, sl = get_tp_sl("LONG")
                return with_updated_state({
                    "signal": "LONG",
                    "condition": build_confirmed_long(),
                    "strength": "Sterk",
                    "tp1": tp1,
                    "sl": sl,
                    "awaiting_confirmation": False,
                })
            reset_state()
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting(),
                "strength": "Sterk",
                "awaiting_confirmation": False,
            })

        if state["retning"] == "SHORT":
            if last["ema50"] < last["ema200"]:
                state["crossover_bekreftet"] = True
                tp1, sl = get_tp_sl("SHORT")
                return with_updated_state({
                    "signal": "SHORT",
                    "condition": build_confirmed_short(),
                    "strength": "Sterk",
                    "tp1": tp1,
                    "sl": sl,
                    "awaiting_confirmation": False,
                })
            reset_state()
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting(),
                "strength": "Sterk",
                "awaiting_confirmation": False,
            })

    # FASE 3 - NEUTRAL
    if state.get("crossover_bekreftet") and state.get("retning"):
        prev_distance = abs(prev["ema50"] - prev["ema200"])
        last_distance = abs(last["ema50"] - last["ema200"])
        if last_distance < prev_distance:
            _ema_spread_direction = "nærmer"
        elif last_distance > prev_distance:
            _ema_spread_direction = "beveger fra"
        else:
            _ema_spread_direction = "flat"
        return with_updated_state({
            "signal": "NEUTRAL",
            "condition": neutral_waiting(),
            "strength": "Sterk",
            "awaiting_confirmation": False,
        })

    # FASE 1 - Crossover detektert
    if ema50_crossed_above:
        return start_awaiting("LONG")

    if ema50_crossed_below:
        return start_awaiting("SHORT")

    # Venter fortsatt på bekreftelse samme candle som crossover
    if state.get("retning") and not state.get("crossover_bekreftet"):
        if state["retning"] == "LONG":
            condition = (
                "Golden Cross detektert — EMA 50 krysset over EMA 200. "
                "Neste candle må bekrefte for LONG-signal. "
                "Dette er et sterkt langsiktig signal."
            )
        else:
            condition = (
                "Death Cross detektert — EMA 50 krysset under EMA 200. "
                "Neste candle må bekrefte for SHORT-signal. "
                "Dette er et sterkt langsiktig bearish signal."
            )
        return with_updated_state({
            "signal": "AWAITING_CONFIRMATION",
            "condition": condition,
            "strength": "Sterk",
            "awaiting_confirmation": True,
        })

    reset_state()
    return with_updated_state({
        "signal": "NEUTRAL",
        "condition": neutral_waiting(),
        "strength": "Sterk",
        "awaiting_confirmation": False,
    })
