import requests

def fetch_candles() -> list[dict]:
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
    print("Binance status:", response.status_code)
    print("Binance response:", data)

    if not isinstance(data, list):
        raise ValueError(f"Binance returned unexpected response: {data}")

    return [
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