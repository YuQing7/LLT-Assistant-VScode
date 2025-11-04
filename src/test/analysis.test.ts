/**
 * Unit tests for Python AST Analysis Engine
 */

import * as assert from 'assert';
import * as path from 'path';
import {
  PythonASTAnalyzer,
  buildStage1PromptInput,
  shouldAutoConfirm,
  generateComplexitySummary,
  FunctionContext
} from '../analysis';

suite('Python AST Analysis Engine Test Suite', () => {
  let analyzer: PythonASTAnalyzer;

  setup(() => {
    analyzer = new PythonASTAnalyzer();
  });

  suite('Test Case 1: Simple Function', () => {
    const testFilePath = path.join(__dirname, '..', '..', 'test_fixtures', 'test_case_1_simple.py');

    test('Should parse simple add function', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'add');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Verify function signature
      assert.strictEqual(context.signature.name, 'add');
      assert.strictEqual(context.signature.parameters.length, 2);
      assert.strictEqual(context.signature.parameters[0].name, 'a');
      assert.strictEqual(context.signature.parameters[0].type, 'int');
      assert.strictEqual(context.signature.parameters[1].name, 'b');
      assert.strictEqual(context.signature.parameters[1].type, 'int');
      assert.strictEqual(context.signature.return_type, 'int');
      assert.strictEqual(context.signature.is_async, false);
      assert.strictEqual(context.signature.is_method, false);
    });

    test('Should detect no branches or exceptions', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'add');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Verify body analysis
      assert.strictEqual(context.body_analysis.branches.length, 0);
      assert.strictEqual(context.body_analysis.exceptions.length, 0);
      assert.strictEqual(context.body_analysis.complexity, 1);
    });

    test('Should trigger auto-confirmation', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'add');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Verify auto-confirmation logic
      assert.strictEqual(shouldAutoConfirm(context), true);
    });

    test('Should extract docstring', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'add');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Verify documentation
      assert.strictEqual(context.documentation.docstring, 'Add two numbers');
    });
  });

  suite('Test Case 2: Function with Branches and Exceptions', () => {
    const testFilePath = path.join(__dirname, '..', '..', 'test_fixtures', 'test_case_2_branches.py');

    test('Should parse divide function', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'divide');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Verify function signature
      assert.strictEqual(context.signature.name, 'divide');
      assert.strictEqual(context.signature.parameters.length, 2);
      assert.strictEqual(context.signature.return_type, 'float');
    });

    test('Should detect branch and exception', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'divide');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Verify branches
      assert.strictEqual(context.body_analysis.branches.length, 1);
      assert.strictEqual(context.body_analysis.branches[0].type, 'if');
      assert.ok(context.body_analysis.branches[0].condition.includes('b == 0'));

      // Verify exceptions
      assert.strictEqual(context.body_analysis.exceptions.length, 1);
      assert.strictEqual(context.body_analysis.exceptions[0].type, 'raise');
      assert.strictEqual(context.body_analysis.exceptions[0].exception_class, 'ValueError');

      // Verify complexity
      assert.strictEqual(context.body_analysis.complexity, 2);
    });

    test('Should not trigger auto-confirmation', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'divide');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Has exception, should not auto-confirm
      assert.strictEqual(shouldAutoConfirm(context), false);
    });
  });

  suite('Test Case 3: Class Method', () => {
    const testFilePath = path.join(__dirname, '..', '..', 'test_fixtures', 'test_case_3_class.py');

    test('Should parse Calculator.calculate method', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'calculate');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Verify function signature
      assert.strictEqual(context.signature.name, 'calculate');
      assert.strictEqual(context.signature.is_method, true);

      // Should have 3 parameters after removing 'self'
      assert.strictEqual(context.signature.parameters.length, 3);
      assert.strictEqual(context.signature.parameters[0].name, 'operation');
      assert.strictEqual(context.signature.parameters[1].name, 'a');
      assert.strictEqual(context.signature.parameters[2].name, 'b');
    });

    test('Should identify class context', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'calculate');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Verify class context
      assert.notStrictEqual(context.class_context, null);
      if (!context.class_context) {return;}

      assert.strictEqual(context.class_context.class_name, 'Calculator');
      assert.ok(context.class_context.class_attributes.includes('history'));
      assert.ok(context.class_context.other_methods.includes('__init__'));
      assert.strictEqual(context.class_context.is_dataclass, false);
    });

    test('Should detect external calls', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'calculate');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Verify external calls
      assert.ok(context.body_analysis.external_calls.length >= 2);

      const callNames = context.body_analysis.external_calls.map(c => c.function_name);
      assert.ok(callNames.includes('eval'));
      assert.ok(callNames.includes('append'));
    });

    test('Should detect branch and exception', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'calculate');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;

      // Verify branches
      assert.strictEqual(context.body_analysis.branches.length, 1);

      // Verify exceptions
      assert.strictEqual(context.body_analysis.exceptions.length, 1);
      assert.strictEqual(context.body_analysis.exceptions[0].exception_class, 'ValueError');
    });
  });

  suite('Context Builder Tests', () => {
    const testFilePath = path.join(__dirname, '..', '..', 'test_fixtures', 'test_case_2_branches.py');

    test('Should build Stage 1 prompt input', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'divide');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;
      const userDescription = 'Test division with zero handling';

      const promptInput = buildStage1PromptInput(context, userDescription);

      // Verify prompt contains key sections
      assert.ok(promptInput.includes('## Function Code:'));
      assert.ok(promptInput.includes('## Function Context:'));
      assert.ok(promptInput.includes('## Code Analysis:'));
      assert.ok(promptInput.includes('## User\'s Description:'));

      // Verify content
      assert.ok(promptInput.includes('divide'));
      assert.ok(promptInput.includes('Test division with zero handling'));
      assert.ok(promptInput.includes('ValueError'));
    });

    test('Should generate complexity summary', async () => {
      const result = await analyzer.buildFunctionContext(testFilePath, 'divide');

      assert.strictEqual(result.success, true);
      if (!result.success) {return;}

      const context = result.data;
      const summary = generateComplexitySummary(context);

      assert.ok(summary.length > 0);
      assert.ok(summary.includes('complexity'));
    });
  });

  suite('Error Handling Tests', () => {
    test('Should handle non-existent function', async () => {
      const testFilePath = path.join(__dirname, '..', '..', 'test_fixtures', 'test_case_1_simple.py');
      const result = await analyzer.buildFunctionContext(testFilePath, 'nonexistent');

      assert.strictEqual(result.success, false);
      if (result.success) {return;}

      assert.ok(result.error.includes('not found'));
    });

    test('Should handle non-existent file', async () => {
      const testFilePath = path.join(__dirname, '..', '..', 'test_fixtures', 'nonexistent.py');
      const result = await analyzer.buildFunctionContext(testFilePath, 'add');

      assert.strictEqual(result.success, false);
    });
  });

  suite('Python Availability Test', () => {
    test('Should check Python availability', async () => {
      const isAvailable = await analyzer.checkPythonAvailability();
      assert.strictEqual(isAvailable, true, 'Python 3 should be available for tests to run');
    });
  });
});
