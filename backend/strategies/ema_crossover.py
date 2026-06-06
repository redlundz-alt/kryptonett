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
    crossover_this_candle = ema9_crossed_above or ema9_crossed_below

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
                f"{signal} bekreftet over 2 candles. Entry: {entry}. ATR ikke tilgjengelig."
            )
        if signal == "LONG":
            tp1 = round(entry + last["atr"], 2)
            tp2 = round(entry + 2 * last["atr"], 2)
            sl = round(entry - last["atr"], 2)
            return (
                f"LONG bekreftet over 2 candles. Entry: {entry}. "
                f"TP1: {tp1}. TP2: {tp2}. SL: {sl}."
            )
        tp1 = round(entry - last["atr"], 2)
        tp2 = round(entry - 2 * last["atr"], 2)
        sl = round(entry + last["atr"], 2)
        return (
            f"SHORT bekreftet over 2 candles. Entry: {entry}. "
            f"TP1: {tp1}. TP2: {tp2}. SL: {sl}."
        )

    def get_tp_sl(signal: str):
        if last["atr"] is None:
            return None, None
        if signal == "LONG":
            return round(entry + last["atr"], 2), round(entry - last["atr"], 2)
        return round(entry - last["atr"], 2), round(entry + last["atr"], 2)

    def reset_state():
        state["retning"] = None
        state["crossover_bekreftet"] = False

    def with_updated_state(result: dict) -> dict:
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
                f"LONG signal detektert. Neste candle må close over {crossover_price} for bekreftelse"
            )
        else:
            condition = (
                f"SHORT signal detektert. Neste candle må close under {crossover_price} for bekreftelse"
            )
        return with_updated_state({
            "signal": "AWAITING_CONFIRMATION",
            "condition": condition,
            "distance_pct": distance_pct,
            "trend": trend,
            "crossover_price": crossover_price,
            "strength": None,
            "rsi": rsi_value,
            "awaiting_confirmation": True,
        })

    def neutral_waiting():
        if trend == "Bearish":
            return (
                f"Bearish trend bekreftet. Venter på LONG-signal. "
                f"EMA 9 må krysse over {crossover_price}"
            )
        return (
            f"Bullish trend bekreftet. Venter på SHORT-signal. "
            f"EMA 9 må krysse under {crossover_price}"
        )

    # Oppstart-sjekk
    if state.get("retning") is None:
        if last["ema9"] > last["ema21"]:
            state["retning"] = "SHORT"
            state["crossover_bekreftet"] = True
        elif last["ema9"] < last["ema21"]:
            state["retning"] = "LONG"
            state["crossover_bekreftet"] = True

    # FASE 2 - Bekreftelse (neste candle etter crossover)
    if (
        state.get("retning")
        and not state.get("crossover_bekreftet")
        and not crossover_this_candle
    ):
        if state["retning"] == "LONG":
            if close > crossover_price:
                state["crossover_bekreftet"] = True
                tp1, sl = get_tp_sl("LONG")
                return with_updated_state({
                    "signal": "LONG",
                    "condition": build_confirmed_condition("LONG"),
                    "distance_pct": distance_pct,
                    "trend": trend,
                    "crossover_price": crossover_price,
                    "strength": get_strength("LONG"),
                    "rsi": rsi_value,
                    "tp1": tp1,
                    "sl": sl,
                    "awaiting_confirmation": False,
                })
            reset_state()
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting(),
                "distance_pct": distance_pct,
                "trend": trend,
                "crossover_price": crossover_price,
                "strength": None,
                "rsi": rsi_value,
                "awaiting_confirmation": False,
            })

        if state["retning"] == "SHORT":
            if close < crossover_price:
                state["crossover_bekreftet"] = True
                tp1, sl = get_tp_sl("SHORT")
                return with_updated_state({
                    "signal": "SHORT",
                    "condition": build_confirmed_condition("SHORT"),
                    "distance_pct": distance_pct,
                    "trend": trend,
                    "crossover_price": crossover_price,
                    "strength": get_strength("SHORT"),
                    "rsi": rsi_value,
                    "tp1": tp1,
                    "sl": sl,
                    "awaiting_confirmation": False,
                })
            reset_state()
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting(),
                "distance_pct": distance_pct,
                "trend": trend,
                "crossover_price": crossover_price,
                "strength": None,
                "rsi": rsi_value,
                "awaiting_confirmation": False,
            })

    # FASE 3 - Etter bekreftet signal
    if state.get("crossover_bekreftet") and state.get("retning") == "LONG":
        if ema9_crossed_below:
            return start_awaiting("SHORT")
        if last["ema9"] > last["ema21"]:
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": (
                    f"Bullish trend bekreftet. Venter på SHORT-signal. "
                    f"EMA 9 må krysse under {crossover_price}"
                ),
                "distance_pct": distance_pct,
                "trend": trend,
                "crossover_price": crossover_price,
                "strength": None,
                "rsi": rsi_value,
                "awaiting_confirmation": False,
            })

    if state.get("crossover_bekreftet") and state.get("retning") == "SHORT":
        if ema9_crossed_above:
            return start_awaiting("LONG")
        if last["ema9"] < last["ema21"]:
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": (
                    f"Bearish trend bekreftet. Venter på LONG-signal. "
                    f"EMA 9 må krysse over {crossover_price}"
                ),
                "distance_pct": distance_pct,
                "trend": trend,
                "crossover_price": crossover_price,
                "strength": None,
                "rsi": rsi_value,
                "awaiting_confirmation": False,
            })

    # FASE 1 - Crossover detektert
    if ema9_crossed_above:
        return start_awaiting("LONG")

    if ema9_crossed_below:
        return start_awaiting("SHORT")

    # Venter fortsatt på bekreftelse samme candle som crossover
    if state.get("retning") and not state.get("crossover_bekreftet"):
        if state["retning"] == "LONG":
            condition = (
                f"LONG signal detektert. Neste candle må close over {crossover_price} for bekreftelse"
            )
        else:
            condition = (
                f"SHORT signal detektert. Neste candle må close under {crossover_price} for bekreftelse"
            )
        return with_updated_state({
            "signal": "AWAITING_CONFIRMATION",
            "condition": condition,
            "distance_pct": distance_pct,
            "trend": trend,
            "crossover_price": crossover_price,
            "strength": None,
            "rsi": rsi_value,
            "awaiting_confirmation": True,
        })

    reset_state()
    return with_updated_state({
        "signal": "NEUTRAL",
        "condition": neutral_waiting(),
        "distance_pct": distance_pct,
        "trend": trend,
        "crossover_price": crossover_price,
        "strength": None,
        "rsi": rsi_value,
        "awaiting_confirmation": False,
    })
