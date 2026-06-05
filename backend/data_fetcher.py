import json
import urllib.parse
import urllib.request


def fetch_candles() -> list[dict]:
    params = urllib.parse.urlencode({
        "symbol": "BTCUSDT",
        "interval": "1h",
        "limit": 100,
    })
    url = f"https://api.binance.com/api/v3/klines?{params}"
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    )
    with urllib.request.urlopen(request) as response:
        data = json.loads(response.read())

    return [
        {
            "time": kline[0] // 1000,
            "open": float(kline[1]),
            "high": float(kline[2]),
            "low": float(kline[3]),
            "close": float(kline[4]),
            "volume": float(kline[5]),
        }
        for kline in data
    ]
