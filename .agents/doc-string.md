# Rule: Python Documentation Standard

## Docstrings
- **Standard**: Google Style.
- **Requirement**: Required for all public methods and classes.
- **Content**: Must specify Args, Returns, and complex logic explanations.

## Self-Documentation
- **Task End**: Agent must update `README.md` if new environment variables or dependencies are added. Agent must update `DB_README.md` if any changes in the database schema or tables are made.
- **Complexity Documentation**: If a function's Cyclomatic Complexity is >10, the docstring must explain the necessity of the complexity.

## Code Example
```python
def get_mla_activity(mla_id: int) -> dict:
    """
    Fetches activity logs for a specific MLA.
    
    Args:
        mla_id (int): The unique identifier for the MLA.
        
    Returns:
        dict: A dictionary containing activity counts and dates.
        
    Raises:
        ValueError: If the mla_id does not exist in the database.
    """
    # Logic goes here...