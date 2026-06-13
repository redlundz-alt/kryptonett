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


def add_ema_long(candles: list[dict]) -> list[dict]:
    add_ema(candles, 50)
    add_ema(candles, 200)
    return candles


def add_rsi_direction(candles: list[dict]) -> list[dict]:
    for i, candle in enumerate(candles):
        if candle.get("rsi") is None:
            candle["rsi_direction"] = None
        elif i == 0 or candles[i - 1].get("rsi") is None:
            candle["rsi_direction"] = "flat"
        elif candle["rsi"] > candles[i - 1]["rsi"]:
            candle["rsi_direction"] = "stiger"
        elif candle["rsi"] < candles[i - 1]["rsi"]:
            candle["rsi_direction"] = "faller"
        else:
            candle["rsi_direction"] = "flat"

    return candles


def _ema_values(values: list[float], period: int) -> list[float | None]:
    ema = [None] * len(values)
    if len(values) < period:
        return ema

    ema[period - 1] = sum(values[:period]) / period
    multiplier = 2 / (period + 1)
    for i in range(period, len(values)):
        ema[i] = values[i] * multiplier + ema[i - 1] * (1 - multiplier)
    return ema


def add_macd(candles: list[dict]) -> list[dict]:
    null_count = 33
    closes = [c["close"] for c in candles]
    ema12 = _ema_values(closes, 12)
    ema26 = _ema_values(closes, 26)

    macd_line = [
        ema12[i] - ema26[i] if ema12[i] is not None and ema26[i] is not None else None
        for i in range(len(candles))
    ]

    macd_signal_line = [None] * len(candles)
    macd_indices = [i for i, value in enumerate(macd_line) if value is not None]
    if len(macd_indices) >= 9:
        macd_values = [macd_line[i] for i in macd_indices]
        signal_ema = _ema_values(macd_values, 9)
        for idx, signal_value in zip(macd_indices, signal_ema):
            if signal_value is not None:
                macd_signal_line[idx] = signal_value

    for i, candle in enumerate(candles):
        candle["ema12"] = ema12[i]
        candle["ema26"] = ema26[i]
        if i < null_count:
            candle["macd"] = None
            candle["macd_signal"] = None
            candle["macd_histogram"] = None
        else:
            candle["macd"] = macd_line[i]
            candle["macd_signal"] = macd_signal_line[i]
            if macd_line[i] is not None and macd_signal_line[i] is not None:
                candle["macd_histogram"] = macd_line[i] - macd_signal_line[i]
            else:
                candle["macd_histogram"] = None

    return candles
