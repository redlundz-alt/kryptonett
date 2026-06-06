import requests


def fetch_candles() -> list[dict]:
    response = requests.get(
        "https://api.kraken.com/0/public/OHLC",
        params={
            "pair": "XBTUSD",
            "interval": 60,
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
