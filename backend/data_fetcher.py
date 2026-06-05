import requests
import time

_cache = {
    "data": None,
    "last_fetch": 0,
}
CACHE_TTL = 300  # 5 minutter

def fetch_candles() -> list[dict]:
    now = time.time()
    if _cache["data"] and now - _cache["last_fetch"] < CACHE_TTL:
        print("Returning cached data")
        return _cache["data"]

    print("Fetching fresh data from Binance")
    response = requests.get(
        "https://api.binance.com/api/v3/klines",
        params={
            "symbol": "BTCUSDT",
            "interval": "1h",
            "limit": 100,
        },
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    )
    data = response.json()

    if not isinstance(data, list):
        raise ValueError(f"Binance returned unexpected response: {data}")

    candles = [
        {
            "time": int(kline[0]) // 1000,
            "open": float(kline[1]),
            "high": float(kline[2]),
            "low": float(kline[3]),
            "close": float(kline[4]),
            "volume": float(kline[5]),
        }
        for kline in data
    ]

    _cache["data"] = candles
    _cache["last_fetch"] = now
    return candles