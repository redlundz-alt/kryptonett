import requests

INTERVALS = {"15m": 15, "1h": 60, "4h": 240, "1d": 1440}


def fetch_candles(timeframe: str = "1h") -> list[dict]:
    response = requests.get(
        "https://api.kraken.com/0/public/OHLC",
        params={
            "pair": "XBTUSD",
            "interval": INTERVALS[timeframe],
        },
    )
    rows = response.json()["result"]["XXBTZUSD"]

    return [
        {
            "time": int(kline[0]),
            "open": float(kline[1]),
            "high": float(kline[2]),
            "low": float(kline[3]),
            "close": float(kline[4]),
        }
        for kline in rows
    ]
