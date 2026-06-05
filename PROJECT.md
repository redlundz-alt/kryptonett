# kryptonett.no — Master Project Document

> Dette dokumentet er autoriteten for hele prosjektet.
> Cursor skal alltid lese dette før den foreslår noe.
> Ingen nye funksjoner legges til uten at dette dokumentet oppdateres først.

---

## Hva er dette prosjektet?

Et live BTC/USDT trading dashboard på kryptonett.no.
Siden viser et candlestick-chart med tekniske indikatorer, og en signalboks som
forteller brukeren hva som må skje for at en strategi skal være gyldig.

Målet er et enkelt, fungerende produkt som faktisk går live — ikke et perfekt produkt.

---

## Regler for utvikling (VIKTIG)

1. **Bygg én ting av gangen.** Cursor skal aldri foreslå mer enn det som er bedt om.
2. **Spør før du legger til.** Hvis Cursor foreslår en ny funksjon som ikke står i dette dokumentet, skal den avvises.
3. **V1 må være live før V2 starter.** Ingen V2-funksjoner påbegynnes før V1 kjører stabilt.
4. **Hold koden enkel.** Foretrekk alltid den enkleste løsningen som fungerer.
5. **Ikke optimaliser tidlig.** Rett feil, ikke perfeksjoner kode.

---

## Teknisk stack

| Del | Teknologi | Begrunnelse |
|---|---|---|
| Frontend | React (Vite) | Live oppdateringer, enkel komponentstruktur |
| Chart | Lightweight Charts (TradingView) | Gratis, profesjonelt, laget for krypto |
| Backend | Python 3.13 + Flask | Enkelt REST API, kjent teknologi |
| Data | Binance public API | Gratis, ingen autentisering nødvendig |
| Hosting frontend | Vercel | Gratis tier, enkel deploy fra GitHub |
| Hosting backend | Render | Gratis tier, støtter Python/Flask |
| Domene | kryptonett.no | Allerede eid |

---

## Mappestruktur

```
C:\kryptonett\
│
├── PROJECT.md                  ← dette dokumentet
│
├── backend\
│   ├── app.py                  ← Flask app, API endpoints
│   ├── data_fetcher.py         ← henter OHLCV-data fra Binance
│   ├── indicator.py            ← beregner tekniske indikatorer (EMA osv)
│   ├── strategy_runner.py      ← laster og kjører strategier
│   ├── requirements.txt
│   └── strategies\
│       └── ema_crossover.py    ← første strategi (V1)
│
├── frontend\
│   ├── src\
│   │   ├── App.jsx
│   │   ├── components\
│   │   │   ├── Chart.jsx       ← Lightweight Charts candlestick
│   │   │   └── SignalBox.jsx   ← viser signal og betingelse
│   │   └── hooks\
│   │       └── useMarketData.js ← fetcher data fra backend hvert 5. min
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
```

---

## API-endepunkter (backend)

### GET /api/candles
Returnerer siste 100 BTC/USDT 1H candles med EMA-verdier.

```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "candles": [
    {
      "time": 1717200000,
      "open": 67100.0,
      "high": 67450.0,
      "low": 66980.0,
      "close": 67320.0,
      "volume": 1234.5,
      "ema9": 67210.0,
      "ema21": 67050.0
    }
  ]
}
```

### GET /api/signal
Returnerer gjeldende signal fra aktiv strategi.

```json
{
  "strategy": "ema_crossover",
  "signal": "LONG",
  "condition": "Neste 1H candle må close over 67.450 for at signalet er gyldig",
  "current_price": 67320.0,
  "ema9": 67210.0,
  "ema21": 67050.0,
  "timestamp": 1717200000
}
```

---

## Strategi-format (VIKTIG)

Hver strategi er en egen Python-fil i `backend/strategies/`.
Alle strategier må følge dette grensesnittet — ingenting mer, ingenting mindre:

```python
# backend/strategies/ema_crossover.py

def analyse(candles: list[dict]) -> dict:
    """
    candles: liste med dict, hver med nøklene:
             time, open, high, low, close, volume, ema9, ema21

    Returnerer alltid:
    {
        "signal":    "LONG" | "SHORT" | "NEUTRAL",
        "condition": str   (lesbar tekst til signalboksen)
    }
    """
    last = candles[-1]
    prev = candles[-2]

    ema9_crossed_above = prev["ema9"] < prev["ema21"] and last["ema9"] > last["ema21"]
    ema9_crossed_below = prev["ema9"] > prev["ema21"] and last["ema9"] < last["ema21"]

    if ema9_crossed_above:
        return {
            "signal": "LONG",
            "condition": f"EMA 9 har krysset over EMA 21 — neste candle må close over {round(last['close'], 0)} for bekreftelse"
        }
    elif ema9_crossed_below:
        return {
            "signal": "SHORT",
            "condition": f"EMA 9 har krysset under EMA 21 — neste candle må close under {round(last['close'], 0)} for bekreftelse"
        }
    else:
        diff = round(last["ema9"] - last["ema21"], 0)
        direction = "over" if diff > 0 else "under"
        return {
            "signal": "NEUTRAL",
            "condition": f"EMA 9 er {abs(diff)} {direction} EMA 21 — ingen crossover ennå"
        }
```

**Regel:** Nye strategier legges til ved å opprette en ny fil i `strategies/`.
Strategy_runner.py laster alle filer i mappen automatisk.
Ingen endringer i annen kode er nødvendig.

---

## V1 — ferdig når dette er oppfylt

- [ ] `/api/candles` returnerer ekte data fra Binance
- [ ] `/api/signal` returnerer signal fra ema_crossover.py
- [ ] React-appen viser candlestick-chart med EMA 9 og EMA 21 som linjer
- [ ] Signalboks viser signal (LONG / SHORT / NEUTRAL) og condition-teksten
- [ ] Siden oppdaterer seg automatisk hvert 5. minutt
- [ ] Frontend er live på kryptonett.no via Vercel
- [ ] Backend er live på Render

**V1 har ingen:** brukerkontoer, flere coins, flere timeframes, tracking, database.

---

## V2 — planlagt, ikke påbegynt

- Signal-historikk: lagre alle signaler med tidspunkt
- Tracking: ble signalet riktig? Registrer utfall automatisk
- Statistikk: treffsikkerhet i % per strategi
- Mulighet for å velge timeframe i UI

---

## Bygge-rekkefølge (følg denne)

1. `data_fetcher.py` — hent og returner rådata fra Binance
2. `indicator.py` — beregn EMA 9 og EMA 21
3. `ema_crossover.py` — første strategi
4. `strategy_runner.py` — laster og kjører strategier
5. `app.py` — Flask API med `/api/candles` og `/api/signal`
6. Test backend lokalt med curl eller browser
7. `Chart.jsx` — candlestick chart med EMA-linjer
8. `SignalBox.jsx` — signalboks
9. `useMarketData.js` — polling hvert 5. minutt
10. `App.jsx` — sett det sammen
11. Test frontend lokalt mot lokal backend
12. Deploy backend til Render
13. Deploy frontend til Vercel
14. Koble kryptonett.no til Vercel

---

## Cursor-instruksjoner

Når du jobber i Cursor, bruk alltid denne malen for prompts:

```
Jeg jobber på kryptonett-prosjektet. Se PROJECT.md for kontekst.

Jeg vil nå bygge: [filnavn]
Dette er steg [X] av bygge-rekkefølgen.

Krav:
- [konkret krav 1]
- [konkret krav 2]

Ikke legg til noe som ikke står i kravene.
Ikke foreslå forbedringer eller ekstra funksjoner nå.
```

---

## Miljøvariabler

```
# backend/.env (lag denne selv, commit aldri til git)
FLASK_ENV=development
PORT=5000

# Ingen API-nøkler nødvendig for Binance public endpoints
```

---

## Nyttige kommandoer

```bash
# Start backend lokalt
cd C:\kryptonett\backend
pip install -r requirements.txt
python app.py

# Start frontend lokalt
cd C:\kryptonett\frontend
npm install
npm run dev

# Frontend kjører på: http://localhost:5173
# Backend kjører på:  http://localhost:5000
```