import importlib.util
from pathlib import Path


def run_strategies(candles: list[dict], states: dict) -> list[dict]:
    strategies_dir = Path(__file__).parent / "strategies"
    results = []

    for path in sorted(strategies_dir.glob("*.py")):
        try:
            strategy = path.stem
            state = states.setdefault(
                strategy,
                {"retning": None, "crossover_bekreftet": False},
            )
            spec = importlib.util.spec_from_file_location(strategy, path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            result = module.analyse(candles, state)
            results.append({
                "strategy": strategy,
                **result,
            })
        except Exception:
            continue

    return results
