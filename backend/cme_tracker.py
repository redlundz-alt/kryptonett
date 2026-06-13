from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

import yfinance as yf

CET = ZoneInfo("Europe/Oslo")


def _now_cet():
    return datetime.now(CET)


def fetch_cme_friday_close():
    try:
        data = yf.Ticker("BTC=F").history(period="1mo")
        if data.empty:
            return None
        fridays = data[data.index.weekday == 4]
        if fridays.empty:
            return None
        return float(fridays.iloc[-1]["Close"])
    except Exception:
        return None


def fetch_cme_sunday_open():
    try:
        data = yf.Ticker("BTC=F").history(period="1mo")
        if data.empty:
            return None
        sundays = data[data.index.weekday == 6]
        if sundays.empty:
            return None
        return float(sundays.iloc[-1]["Open"])
    except Exception:
        return None


def get_current_week_start():
    now = _now_cet()
    today = now.date()
    if today.weekday() == 0 and time(0, 10) <= now.time() <= time(0, 59):
        return today - timedelta(days=7)
    return today - timedelta(days=today.weekday())


def should_fetch_friday_close():
    now = _now_cet()
    return now.weekday() == 4 and time(23, 10) <= now.time() <= time(23, 59)


def should_fetch_sunday_open():
    now = _now_cet()
    return now.weekday() in (6, 0) and time(0, 10) <= now.time() <= time(0, 59)


def check_gap_filled(current_price, gap):
    friday_close = gap.get("friday_close")
    direction = gap.get("direction")
    if friday_close is None or direction is None:
        return False
    if direction == "up":
        return current_price <= friday_close
    if direction == "down":
        return current_price >= friday_close
    return False
