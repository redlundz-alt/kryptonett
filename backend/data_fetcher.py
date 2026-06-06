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

    print("Fetching fresh data from CoinGecko")
    response = requests.get(
        "https://api.coingecko.com/api/v3/coins/bitcoin/ohlc",
        params={
            "vs_currency": "usd",
            "days": 7,
        },
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    )
    data = response.json()

    if not isinstance(data, list):
        raise ValueError(f"CoinGecko returned unexpected response: {data}")

    candles = [
        {
            "time": int(kline[0]) // 1000,
            "open": float(kline[1]),
            "high": float(kline[2]),
            "low": float(kline[3]),
            "close": float(kline[4]),
        }
        for kline in data
    ]

    _cache["data"] = candles
    _cache["last_fetch"] = now
    return candles
