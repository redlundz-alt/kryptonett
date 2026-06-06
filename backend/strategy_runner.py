import importlib.util
from pathlib import Path


def run_strategies(candles: list[dict]) -> list[dict]:
    strategies_dir = Path(__file__).parent / "strategies"
    results = []

    for path in sorted(strategies_dir.glob("*.py")):
        try:
            spec = importlib.util.spec_from_file_location(path.stem, path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            result = module.analyse(candles)
            results.append({
                "strategy": path.stem,
                **result,
            })
        except Exception:
            continue

    return results
