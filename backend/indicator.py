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
