---
trigger: always_on
---

# Python Development Standards

## 1. Quality & Complexity Constraints
* **Cyclomatic Complexity:** Max threshold per function is 20. If complexity > 15, immediate refactoring is required.
* **Maintainability Index:** Maintain an index between 65 and 85.
* **Technical Debt:** Limit duplicated code to 3% - 10%.
* **Code Smells:** Zero Critical/Major smells; Minor smells must not exceed 30 per 1,000 lines.

## 2. Testing Mandates
* **Framework:** Use `pytest` for all test suites.
* **Test-Code Coupling:** Every function in `src/` must have a corresponding test in `tests/` All the helper files or function that are not our core functionality which we are creating temprorly not test case not needed.
* **Coverage:** Aim for 100% statement coverage for all new logic.
* **Parametrization:** Utilize `@pytest.mark.parametrize` for functions with multiple logic paths.
* **Isolation:** Use `unittest.mock` to isolate functions from external dependencies (DBs, APIs).

## 3. Documentation Standards
* **Docstrings:** All public functions, classes, and methods must include docstrings.
* **Style:** Adhere to Google-style docstrings.
* **Components:** Ensure docstrings include a brief summary, and sections for `Args:`, `Returns:`, and `Raises:` where applicable.

## 4. Tooling & Verification
* **Complexity Check:** Run `radon cc` and `radon mi` on all modified files.
* **Static Analysis:** Code must pass 'Sonar Way' quality gate.
* **PEP 8 Compliance:** All code must adhere to PEP 8 style guides.
* **Self-Correction:** If `pytest` or `radon` checks fail, the agent is authorized to auto-refactor the code to meet the thresholds before proceeding.

## 5. Implementation Template
```python
# --- src/feature.py ---
def perform_calculation(data: float) -> float:
    """Calculates result with input validation.

    Args:
        data: The input numeric value to process.

    Returns:
        The calculated result as a float.

    Raises:
        ValueError: If the input data is negative.
    """
    if data < 0:
        raise ValueError("Input cannot be negative")
    return data * 1.5

# --- tests/test_feature.py ---
import pytest
from src.feature import perform_calculation

def test_perform_calculation_valid():
    assert perform_calculation(10.0) == 15.0

def test_perform_calculation_negative():
    with pytest.raises(ValueError):
        perform_calculation(-1.0)
```