"""Decision utilities for recommending training actions based on risk.

This module implements a simple, research-oriented decision rule that maps
per-user risk scores into remediation actions: no action, a short
micro-training, or a mandatory training assignment.

Design rationale and thresholds
------------------------------
- The numeric thresholds (0.3 and 0.6) are intentionally simple and
  interpretable. They are suitable for early-stage research where the goal
  is to prioritise users for lightweight intervention before escalating to
  formal training.
- From a security awareness perspective these bands reflect increasing
  evidence of deviation from baseline behaviour: low risk (do nothing),
  moderate risk (targeted micro-intervention to correct specific behaviours),
  and high risk (mandatory, broader awareness refresh that may include policy
  or technical controls).

This module is defensive: it validates inputs and raises clear
ValueError messages when required columns are missing or malformed. It does
not attempt to reach external services or schedule training — it only
produces an annotated DataFrame suitable for further orchestration.
"""

from __future__ import annotations

from typing import Tuple

import pandas as pd
import numpy as np


_REQUIRED_COLUMNS = ["user", "risk_score"]

# Placeholder URLs (do not embed real content here; these are stand-ins)
_MICRO_TRAINING_URL = "https://example.com/micro-training-placeholder"
_MANDATORY_TRAINING_URL = "https://example.com/mandatory-training-placeholder"


def decide_training_actions(df: pd.DataFrame) -> pd.DataFrame:
    """Annotate a DataFrame of users with training recommendations.

    Parameters
    - df: pandas DataFrame with at least the columns ``user`` and
      ``risk_score``. The ``user`` column may be string-like; ``risk_score``
      must be numeric (0..1 expected but not strictly enforced here).

    Returns
    - A copy of ``df`` with three additional columns appended:
        - ``training_action``: one of the string literals ``NONE``, ``MICRO``,
          or ``MANDATORY``.
        - ``micro_training_url``: placeholder URL when ``training_action`` is
          ``MICRO``, otherwise an empty string.
        - ``mandatory_training_url``: placeholder URL when ``training_action``
          is ``MANDATORY``, otherwise an empty string.

    Thresholds and security theory mapping
    -------------------------------------
    - ``risk_score < 0.3`` -> ``NONE``
      (low estimated risk; monitor but no immediate behavioural intervention)
    - ``0.3 <= risk_score < 0.6`` -> ``MICRO``
      (moderate risk; short, targeted micro-training can correct common
       behavioural drift with low friction)
    - ``risk_score >= 0.6`` -> ``MANDATORY``
      (high risk; comprehensive mandatory training is recommended)

    The thresholds reflect a pragmatic, explainable triage rather than an
    optimised classifier boundary. They make decisions transparent and easy
    to justify during research evaluations.

    Raises
    - ValueError: if required columns are missing or ``risk_score`` cannot
      be interpreted as numeric.
    """

    # Validate required columns
    missing = [c for c in _REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(
            "training_decision: input DataFrame is missing required column(s): "
            f"{missing}. Expected columns: {_REQUIRED_COLUMNS}"
        )

    out = df.copy()

    # Coerce risk_score to numeric and validate
    out["risk_score"] = pd.to_numeric(out["risk_score"], errors="coerce")
    if out["risk_score"].isna().any():
        n_bad = int(out["risk_score"].isna().sum())
        raise ValueError(
            f"training_decision: 'risk_score' contains {n_bad} non-numeric or missing value(s)"
        )

    # Apply thresholds using vectorised operations for clarity and speed
    cond_none = out["risk_score"] < 0.3
    cond_micro = (out["risk_score"] >= 0.3) & (out["risk_score"] < 0.6)
    cond_mandatory = out["risk_score"] >= 0.6

    action = np.full(out.shape[0], "NONE", dtype=object)
    action[cond_micro.values] = "MICRO"
    action[cond_mandatory.values] = "MANDATORY"

    out["training_action"] = action

    # Populate placeholder URLs only for relevant actions; keep empty string otherwise
    out["micro_training_url"] = ""
    out.loc[cond_micro, "micro_training_url"] = _MICRO_TRAINING_URL

    out["mandatory_training_url"] = ""
    out.loc[cond_mandatory, "mandatory_training_url"] = _MANDATORY_TRAINING_URL

    # Return annotated DataFrame in a deterministic column order (appenditions at end)
    return out


def example_thresholds() -> Tuple[float, float]:
    """Return the (low, high) decision thresholds.

    Exposed for tests or documentation; keeps the thresholds centralised.
    """

    return 0.3, 0.6
