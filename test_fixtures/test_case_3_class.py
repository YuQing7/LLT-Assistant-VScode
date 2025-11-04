"""
Test Case 3: Class method with multiple branches and external calls
Expected:
- Identified as class method
- Class name: Calculator
- Class attributes: history
- Other methods: __init__
- 1 branch + 1 exception
- External calls: eval, append
"""


class Calculator:
    """A simple calculator with history tracking"""

    def __init__(self):
        """Initialize calculator with empty history"""
        self.history = []

    def calculate(self, operation: str, a: int, b: int) -> int:
        """
        Perform a calculation and store result in history

        Args:
            operation: One of '+', '-', '*', '/'
            a: First operand
            b: Second operand

        Returns:
            Result of the calculation

        Raises:
            ValueError: If operation is not valid
        """
        if operation not in ['+', '-', '*', '/']:
            raise ValueError("Invalid operation")

        result = eval(f"{a} {operation} {b}")
        self.history.append(result)
        return result
