def add_ema(candles: list[dict], period: int) -> list[dict]:
    key = f"ema{period}"
    multiplier = 2 / (period + 1)

    for i, candle in enumerate(candles):
        if i < period - 1:
            candle[key] = None
        elif i == period - 1:
            candle[key] = sum(c["close"] for c in candles[:period]) / period
        else:
            prev_ema = candles[i - 1][key]
            candle[key] = candle["close"] * multiplier + prev_ema * (1 - multiplier)

    return candles


def add_atr(candles: list[dict], period: int = 14) -> list[dict]:
    true_ranges = []

    for i, candle in enumerate(candles):
        if i == 0:
            tr = candle["high"] - candle["low"]
        else:
            prev_close = candles[i - 1]["close"]
            tr = max(
                candle["high"] - candle["low"],
                abs(candle["high"] - prev_close),
                abs(candle["low"] - prev_close),
            )
        true_ranges.append(tr)

        if i < period - 1:
            candle["atr"] = None
        else:
            candle["atr"] = sum(true_ranges[i - period + 1:i + 1]) / period

    return candles


def add_rsi(candles: list[dict], period: int = 14) -> list[dict]:
    for i in range(period):
        candles[i]["rsi"] = None

    if len(candles) <= period:
        return candles

    gains = []
    losses = []
    for i in range(1, len(candles)):
        change = candles[i]["close"] - candles[i - 1]["close"]
        gains.append(max(change, 0))
        losses.append(max(-change, 0))

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    if avg_loss == 0:
        candles[period]["rsi"] = 100.0
    else:
        rs = avg_gain / avg_loss
        candles[period]["rsi"] = 100 - (100 / (1 + rs))

    for i in range(period + 1, len(candles)):
        avg_gain = (avg_gain * (period - 1) + gains[i - 1]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i - 1]) / period
        if avg_loss == 0:
            candles[i]["rsi"] = 100.0
        else:
            rs = avg_gain / avg_loss
            candles[i]["rsi"] = 100 - (100 / (1 + rs))

    return candles
