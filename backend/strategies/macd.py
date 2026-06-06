def analyse(candles: list[dict], state: dict) -> dict:
    valid = [
        c for c in candles
        if c.get("macd") is not None
        and c.get("macd_signal") is not None
        and c.get("macd_histogram") is not None
    ]
    prev = valid[-2]
    last = valid[-1]

    close = last["close"]
    entry = round(close, 2)
    rsi = last.get("rsi")
    rsi_value = round(rsi, 1) if rsi is not None else None
    macd_value = round(last["macd"], 2)
    macd_signal_value = round(last["macd_signal"], 2)
    macd_histogram_value = round(last["macd_histogram"], 2)
    macd_distance_pct = round(
        abs(last["macd"] - last["macd_signal"]) / abs(last["macd_signal"]) * 100,
        2,
    )

    prev_histogram = prev["macd_histogram"]
    last_histogram = last["macd_histogram"]
    if last_histogram < 0:
        if last_histogram < prev_histogram:
            momentum = "forsterkes bearish"
        else:
            momentum = "svekkes — crossover kan nærme seg"
    elif last_histogram > 0:
        if last_histogram > prev_histogram:
            momentum = "forsterkes bullish"
        else:
            momentum = "svekkes — crossover kan nærme seg"
    else:
        momentum = "svekkes — crossover kan nærme seg"

    macd_crossed_above = prev["macd"] < prev["macd_signal"] and last["macd"] > last["macd_signal"]
    macd_crossed_below = prev["macd"] > prev["macd_signal"] and last["macd"] < last["macd_signal"]
    crossover_this_candle = macd_crossed_above or macd_crossed_below

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
            return f"{signal} bekreftet. Entry: {entry}. ATR ikke tilgjengelig."
        if signal == "LONG":
            tp1 = round(entry + last["atr"], 2)
            tp2 = round(entry + 2 * last["atr"], 2)
            sl = round(entry - last["atr"], 2)
            return f"LONG bekreftet. Entry: {entry}. TP1: {tp1}. TP2: {tp2}. SL: {sl}."
        tp1 = round(entry - last["atr"], 2)
        tp2 = round(entry - 2 * last["atr"], 2)
        sl = round(entry + last["atr"], 2)
        return f"SHORT bekreftet. Entry: {entry}. TP1: {tp1}. TP2: {tp2}. SL: {sl}."

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
        result["macd"] = macd_value
        result["macd_signal"] = macd_signal_value
        result["macd_histogram"] = macd_histogram_value
        result["momentum"] = momentum
        result["macd_distance_pct"] = macd_distance_pct
        result["rsi"] = rsi_value
        result["updated_state"] = {
            "retning": state.get("retning"),
            "crossover_bekreftet": state.get("crossover_bekreftet", False),
        }
        return result

    def start_awaiting(retning: str):
        state["retning"] = retning
        state["crossover_bekreftet"] = False
        if retning == "LONG":
            condition = "MACD krysset over Signal-linje. Neste candle må bekrefte for LONG-signal"
        else:
            condition = "MACD krysset under Signal-linje. Neste candle må bekrefte for SHORT-signal"
        return with_updated_state({
            "signal": "AWAITING_CONFIRMATION",
            "condition": condition,
            "strength": None,
            "awaiting_confirmation": True,
        })

    def neutral_waiting():
        avstand = macd_distance_pct
        far = avstand > 5
        svekkes = momentum.startswith("svekkes")
        forsterkes = momentum.startswith("forsterkes")

        if last["macd"] > last["macd_signal"]:
            if far and svekkes:
                return (
                    "Bullish trend. MACD over Signal-linje. "
                    f"Momentum svekkes men crossover er ikke nært ({avstand}% avstand)."
                )
            if far and forsterkes:
                return (
                    "Bullish trend. MACD over Signal-linje. "
                    f"Momentum forsterkes — crossover usannsynlig nå ({avstand}% avstand)."
                )
            if not far and svekkes:
                return (
                    f"Bullish trend. MACD nærmer seg Signal-linje ({avstand}% avstand) "
                    "— crossover kan komme snart."
                )
            return (
                "Bullish trend. MACD over Signal-linje. "
                f"Momentum forsterkes ({avstand}% avstand)."
            )

        if far and svekkes:
            return (
                "Bearish trend. MACD under Signal-linje. "
                f"Momentum svekkes men crossover er ikke nært ({avstand}% avstand)."
            )
        if far and forsterkes:
            return (
                "Bearish trend. MACD under Signal-linje. "
                f"Momentum forsterkes — crossover usannsynlig nå ({avstand}% avstand)."
            )
        if not far and svekkes:
            return (
                f"Bearish trend. MACD nærmer seg Signal-linje ({avstand}% avstand) "
                "— crossover kan komme snart."
            )
        return (
            "Bearish trend. MACD under Signal-linje. "
            f"Momentum forsterkes ({avstand}% avstand)."
        )

    # Oppstart-sjekk
    if state.get("retning") is None:
        if last["macd"] > last["macd_signal"]:
            state["retning"] = "SHORT"
            state["crossover_bekreftet"] = True
        elif last["macd"] < last["macd_signal"]:
            state["retning"] = "LONG"
            state["crossover_bekreftet"] = True

    # FASE 2 - Bekreftelse
    if (
        state.get("retning")
        and not state.get("crossover_bekreftet")
        and not crossover_this_candle
    ):
        if state["retning"] == "LONG":
            if last["macd"] > last["macd_signal"]:
                state["crossover_bekreftet"] = True
                tp1, sl = get_tp_sl("LONG")
                return with_updated_state({
                    "signal": "LONG",
                    "condition": build_confirmed_condition("LONG"),
                    "strength": get_strength("LONG"),
                    "tp1": tp1,
                    "sl": sl,
                    "awaiting_confirmation": False,
                })
            reset_state()
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting(),
                "strength": None,
                "awaiting_confirmation": False,
            })

        if state["retning"] == "SHORT":
            if last["macd"] < last["macd_signal"]:
                state["crossover_bekreftet"] = True
                tp1, sl = get_tp_sl("SHORT")
                return with_updated_state({
                    "signal": "SHORT",
                    "condition": build_confirmed_condition("SHORT"),
                    "strength": get_strength("SHORT"),
                    "tp1": tp1,
                    "sl": sl,
                    "awaiting_confirmation": False,
                })
            reset_state()
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting(),
                "strength": None,
                "awaiting_confirmation": False,
            })

    # FASE 3 - Etter bekreftet signal
    if state.get("crossover_bekreftet") and state.get("retning") == "LONG":
        if macd_crossed_below:
            return start_awaiting("SHORT")
        if last["macd"] > last["macd_signal"]:
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting(),
                "strength": None,
                "awaiting_confirmation": False,
            })

    if state.get("crossover_bekreftet") and state.get("retning") == "SHORT":
        if macd_crossed_above:
            return start_awaiting("LONG")
        if last["macd"] < last["macd_signal"]:
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting(),
                "strength": None,
                "awaiting_confirmation": False,
            })

    # FASE 1 - Crossover detektert
    if macd_crossed_above:
        return start_awaiting("LONG")

    if macd_crossed_below:
        return start_awaiting("SHORT")

    # Venter fortsatt på bekreftelse samme candle som crossover
    if state.get("retning") and not state.get("crossover_bekreftet"):
        if state["retning"] == "LONG":
            condition = "MACD krysset over Signal-linje. Neste candle må bekrefte for LONG-signal"
        else:
            condition = "MACD krysset under Signal-linje. Neste candle må bekrefte for SHORT-signal"
        return with_updated_state({
            "signal": "AWAITING_CONFIRMATION",
            "condition": condition,
            "strength": None,
            "awaiting_confirmation": True,
        })

    reset_state()
    return with_updated_state({
        "signal": "NEUTRAL",
        "condition": neutral_waiting(),
        "strength": None,
        "awaiting_confirmation": False,
    })
