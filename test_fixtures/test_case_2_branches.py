"""
Test Case 2: Function with branches and exception handling
Expected: 1 branch (b == 0), 1 exception (ValueError), complexity = 2
"""


def divide(a: float, b: float) -> float:
    """Divide two numbers with error handling"""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b
