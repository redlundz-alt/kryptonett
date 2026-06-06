def analyse(candles: list[dict], state: dict) -> dict:
    valid = [c for c in candles if c.get("rsi") is not None]
    prev = valid[-2]
    last = valid[-1]

    rsi = last["rsi"]
    rsi_value = round(rsi, 1)
    rsi_direction = last.get("rsi_direction") or "flat"
    close = last["close"]
    entry = round(close, 2)
    distance_to_oversold = round(rsi - 30, 1)
    distance_to_overbought = round(70 - rsi, 1)

    crossed_under_30 = prev["rsi"] >= 30 and rsi < 30
    crossed_over_70 = prev["rsi"] <= 70 and rsi > 70
    crossover_this_candle = crossed_under_30 or crossed_over_70

    def reset_state():
        state["retning"] = None
        state["crossover_bekreftet"] = False

    def with_updated_state(result: dict) -> dict:
        result["rsi"] = rsi_value
        result["rsi_direction"] = rsi_direction
        result["distance_to_oversold"] = distance_to_oversold
        result["distance_to_overbought"] = distance_to_overbought
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
                f"RSI krysset under 30 — oversold detektert (RSI: {rsi_value}). "
                "Neste candle må bekrefte for LONG-signal."
            )
        else:
            condition = (
                f"RSI krysset over 70 — overbought detektert (RSI: {rsi_value}). "
                "Neste candle må bekrefte for SHORT-signal."
            )
        return with_updated_state({
            "signal": "AWAITING_CONFIRMATION",
            "condition": condition,
            "strength": None,
            "awaiting_confirmation": True,
        })

    def build_confirmed_long():
        strength = "Sterk" if rsi < 20 else "Moderat"
        if last["atr"] is None:
            return (
                f"LONG bekreftet. RSI: {rsi_value} — ekstremt oversold. Entry: {entry}. "
                "ATR ikke tilgjengelig.",
                strength,
            )
        tp1 = round(entry + last["atr"], 2)
        tp2 = round(entry + 2 * last["atr"], 2)
        sl = round(entry - last["atr"], 2)
        return (
            f"LONG bekreftet. RSI: {rsi_value} — ekstremt oversold. Entry: {entry}. "
            f"TP1: {tp1}. TP2: {tp2}. SL: {sl}.",
            strength,
        )

    def build_confirmed_short():
        strength = "Sterk" if rsi > 80 else "Moderat"
        if last["atr"] is None:
            return (
                f"SHORT bekreftet. RSI: {rsi_value} — ekstremt overbought. Entry: {entry}. "
                "ATR ikke tilgjengelig.",
                strength,
            )
        tp1 = round(entry - last["atr"], 2)
        tp2 = round(entry - 2 * last["atr"], 2)
        sl = round(entry + last["atr"], 2)
        return (
            f"SHORT bekreftet. RSI: {rsi_value} — ekstremt overbought. Entry: {entry}. "
            f"TP1: {tp1}. TP2: {tp2}. SL: {sl}.",
            strength,
        )

    def neutral_waiting():
        if rsi_direction == "faller":
            poeng = round(rsi - 30, 1)
            return (
                f"RSI: {rsi_value}, faller. {poeng} poeng til oversold (30) — LONG-signal mulig."
            )
        if rsi_direction == "stiger":
            poeng = round(70 - rsi, 1)
            return (
                f"RSI: {rsi_value}, stiger. {poeng} poeng til overbought (70) — SHORT-signal mulig."
            )
        poeng = round(min(rsi - 30, 70 - rsi), 1)
        return f"RSI: {rsi_value}, flat. {poeng} poeng til nærmeste signal-nivå."

    # FASE 2 - Bekreftelse
    if (
        state.get("retning")
        and not state.get("crossover_bekreftet")
        and not crossover_this_candle
    ):
        if state["retning"] == "LONG":
            if rsi < 30:
                state["crossover_bekreftet"] = True
                condition, strength = build_confirmed_long()
                return with_updated_state({
                    "signal": "LONG",
                    "condition": condition,
                    "strength": strength,
                    "awaiting_confirmation": False,
                })
            reset_state()
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting() if 30 <= rsi <= 70 else f"RSI: {rsi_value}.",
                "strength": None,
                "awaiting_confirmation": False,
            })

        if state["retning"] == "SHORT":
            if rsi > 70:
                state["crossover_bekreftet"] = True
                condition, strength = build_confirmed_short()
                return with_updated_state({
                    "signal": "SHORT",
                    "condition": condition,
                    "strength": strength,
                    "awaiting_confirmation": False,
                })
            reset_state()
            return with_updated_state({
                "signal": "NEUTRAL",
                "condition": neutral_waiting() if 30 <= rsi <= 70 else f"RSI: {rsi_value}.",
                "strength": None,
                "awaiting_confirmation": False,
            })

    # FASE 3 - Etter bekreftet signal / NEUTRAL
    if state.get("crossover_bekreftet") and 30 <= rsi <= 70:
        return with_updated_state({
            "signal": "NEUTRAL",
            "condition": neutral_waiting(),
            "strength": None,
            "awaiting_confirmation": False,
        })

    # FASE 1 - Signal detektert
    if crossed_under_30:
        return start_awaiting("LONG")

    if crossed_over_70:
        return start_awaiting("SHORT")

    # Venter fortsatt på bekreftelse samme candle som crossover
    if state.get("retning") and not state.get("crossover_bekreftet"):
        if state["retning"] == "LONG":
            condition = (
                f"RSI krysset under 30 — oversold detektert (RSI: {rsi_value}). "
                "Neste candle må bekrefte for LONG-signal."
            )
        else:
            condition = (
                f"RSI krysset over 70 — overbought detektert (RSI: {rsi_value}). "
                "Neste candle må bekrefte for SHORT-signal."
            )
        return with_updated_state({
            "signal": "AWAITING_CONFIRMATION",
            "condition": condition,
            "strength": None,
            "awaiting_confirmation": True,
        })

    reset_state()
    return with_updated_state({
        "signal": "NEUTRAL",
        "condition": neutral_waiting() if 30 <= rsi <= 70 else f"RSI: {rsi_value}.",
        "strength": None,
        "awaiting_confirmation": False,
    })
