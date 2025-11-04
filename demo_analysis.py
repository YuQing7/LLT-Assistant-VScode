#!/usr/bin/env python3
"""
Demonstration script for Python AST Analysis Engine

This script demonstrates the analysis capabilities on all three test cases.
"""

import sys
import os

# Add python directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python'))

from ast_analyzer import PythonASTAnalyzer
import json


def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80 + "\n")


def analyze_and_display(file_path, function_name, description):
    """Analyze a function and display key results"""
    print(f"File: {file_path}")
    print(f"Function: {function_name}")
    print(f"Description: {description}\n")

    try:
        analyzer = PythonASTAnalyzer(file_path)
        context = analyzer.build_function_context(function_name)

        if not context:
            print(f"ERROR: Function '{function_name}' not found!")
            return

        # Display signature
        print("📝 SIGNATURE:")
        sig = context.signature
        params = ', '.join([
            f"{p['name']}: {p['type'] or 'Any'}"
            + (f" = {p['default_value']}" if p['default_value'] else "")
            for p in sig['parameters']
        ])
        print(f"  def {sig['name']}({params}) -> {sig['return_type'] or 'None'}")

        if sig['decorators']:
            print(f"  Decorators: {', '.join(sig['decorators'])}")

        if sig['is_method']:
            print("  Type: Class method")
        if sig['is_async']:
            print("  Type: Async function")

        # Display documentation
        if context.documentation['docstring']:
            print(f"\n📖 DOCSTRING:")
            print(f"  {context.documentation['docstring']}")

        # Display body analysis
        print(f"\n🔍 CODE ANALYSIS:")
        analysis = context.body_analysis
        print(f"  Cyclomatic Complexity: {analysis['complexity']}")
        print(f"  Branches: {len(analysis['branches'])}")

        if analysis['branches']:
            for branch in analysis['branches']:
                print(f"    - {branch['type']}: {branch['condition']} (line {branch['line_number']})")

        print(f"  Exceptions: {len(analysis['exceptions'])}")
        if analysis['exceptions']:
            for exc in analysis['exceptions']:
                exc_class = exc['exception_class'] or 'unknown'
                print(f"    - {exc['type']}: {exc_class} (line {exc['line_number']})")

        print(f"  External Calls: {len(analysis['external_calls'])}")
        if analysis['external_calls']:
            # Group by function name
            call_counts = {}
            for call in analysis['external_calls']:
                name = call['function_name']
                call_counts[name] = call_counts.get(name, 0) + 1

            for name, count in sorted(call_counts.items()):
                builtin = next((c['is_builtin'] for c in analysis['external_calls'] if c['function_name'] == name), False)
                builtin_tag = " [builtin]" if builtin else ""
                print(f"    - {name}{builtin_tag} ({count}x)")

        # Display class context
        if context.class_context:
            print(f"\n🏛️  CLASS CONTEXT:")
            cls_ctx = context.class_context
            print(f"  Class: {cls_ctx['class_name']}")

            if cls_ctx['base_classes']:
                print(f"  Base classes: {', '.join(cls_ctx['base_classes'])}")

            if cls_ctx['class_attributes']:
                print(f"  Attributes: {', '.join(cls_ctx['class_attributes'])}")

            if cls_ctx['other_methods']:
                print(f"  Other methods: {', '.join(cls_ctx['other_methods'])}")

            if cls_ctx['is_dataclass']:
                print("  Type: Dataclass")

        # Display source code
        print(f"\n💻 SOURCE CODE:")
        for i, line in enumerate(context.source_code.split('\n'), 1):
            print(f"  {i:2d} | {line}")

        # Auto-confirmation check
        print(f"\n✓ RECOMMENDATIONS:")
        if analysis['complexity'] == 1 and len(analysis['exceptions']) == 0 and len(context.source_code.split('\n')) < 10:
            print("  ✅ Simple function - auto-confirmation recommended")
        else:
            print("  ⚠️  Complex function - user confirmation recommended")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Run demonstration on all test cases"""
    print("\n" + "=" * 80)
    print("  PYTHON AST ANALYSIS ENGINE - DEMONSTRATION")
    print("=" * 80)

    test_cases = [
        (
            "test_fixtures/test_case_1_simple.py",
            "add",
            "Test Case 1: Simple function with no branches"
        ),
        (
            "test_fixtures/test_case_2_branches.py",
            "divide",
            "Test Case 2: Function with branches and exceptions"
        ),
        (
            "test_fixtures/test_case_3_class.py",
            "calculate",
            "Test Case 3: Class method with complex logic"
        ),
    ]

    for file_path, function_name, description in test_cases:
        print_section(description)
        analyze_and_display(file_path, function_name, description)

    print("\n" + "=" * 80)
    print("  DEMONSTRATION COMPLETE")
    print("=" * 80 + "\n")


if __name__ == '__main__':
    main()
