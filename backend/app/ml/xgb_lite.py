"""Dependency-free inference for the exported XGBoost model (trees.json).

Same trees, same arithmetic as the pickled XGBClassifier — implemented with
only the standard library (+ numpy arrays as input) so serverless runtimes
can serve the real model without the xgboost/scipy/scikit-learn stack.

Format: booster.get_dump(dump_format='json') with binary:logistic objective.
"""

import json
import math
import os
from typing import Any, Dict, List, Optional, Sequence

TREES_PATH = os.path.join(os.path.dirname(__file__), "trees.json")

_bundle: Optional[Dict[str, Any]] = None


def _load_bundle() -> Optional[Dict[str, Any]]:
    global _bundle
    if _bundle is None and os.path.exists(TREES_PATH):
        try:
            with open(TREES_PATH, "r", encoding="utf-8") as f:
                _bundle = json.load(f)
        except Exception:
            _bundle = None
    return _bundle


def is_available() -> bool:
    return _load_bundle() is not None


def _feature_index(name: str, feature_names: List[str]) -> int:
    if name in feature_names:
        return feature_names.index(name)
    if name.startswith("f") and name[1:].isdigit():
        return int(name[1:])
    raise KeyError(f"unknown feature {name!r}")


def _eval_tree(node: Dict[str, Any], row: Sequence[float], feature_names: List[str]) -> float:
    while True:
        if "leaf" in node:
            return float(node["leaf"])
        idx = _feature_index(str(node["split"]), feature_names)
        try:
            value = float(row[idx])
        except (IndexError, TypeError, ValueError):
            value = float("nan")
        if isinstance(value, float) and math.isnan(value):
            go_yes = int(node.get("missing", node["yes"])) == int(node["yes"])
        else:
            go_yes = value < float(node["split_condition"])
        children = {int(c["nodeid"]): c for c in node.get("children", [])}
        node = children[int(node["yes"]) if go_yes else int(node["no"])]


def predict_proba_row(features: Sequence[float], feature_names: Optional[List[str]] = None) -> float:
    """Positive-class probability for one feature row. Raises if unavailable."""
    bundle = _load_bundle()
    if bundle is None:
        raise RuntimeError("trees.json is not available")
    names = feature_names or bundle.get("feature_names") or []
    margin = 0.0
    for tree in bundle["trees"]:
        margin += _eval_tree(tree, features, names)
    base = float(bundle.get("base_score", 0.5))
    if 0.0 < base < 1.0:
        margin += math.log(base / (1.0 - base))
    else:
        margin += float(base)
    return 1.0 / (1.0 + math.exp(-margin))
