/**
 * Context builder for Stage 1 Agent
 *
 * Formats function context into prompts for LLM analysis
 */

import {
  FunctionContext,
  Parameter,
  BranchInfo,
  ExceptionInfo,
  CallInfo
} from './types';

/**
 * Build Stage 1 prompt input from function context
 *
 * Converts structured FunctionContext into a formatted string
 * suitable for LLM analysis
 *
 * @param context - Function context from AST analysis
 * @param userDescription - User's natural language description
 * @returns Formatted prompt string
 */
export function buildStage1PromptInput(
  context: FunctionContext,
  userDescription: string
): string {
  const parts: string[] = [];

  // Function Code Section
  parts.push('## Function Code:');
  parts.push('```python');
  parts.push(context.source_code);
  parts.push('```');
  parts.push('');

  // Function Context Section
  parts.push('## Function Context:');
  parts.push(`- Function name: ${context.signature.name}`);
  parts.push(`- Parameters: ${formatParameters(context.signature.parameters)}`);
  parts.push(`- Return type: ${context.signature.return_type || 'None'}`);

  if (context.documentation.docstring) {
    parts.push(`- Docstring: ${context.documentation.docstring}`);
  }

  parts.push(`- Module path: ${context.module_path}`);

  if (context.signature.is_async) {
    parts.push('- Async function: Yes');
  }

  if (context.signature.decorators.length > 0) {
    parts.push(`- Decorators: ${context.signature.decorators.join(', ')}`);
  }

  parts.push('');

  // Code Analysis Section
  parts.push('## Code Analysis:');
  parts.push(`- Branches: ${formatBranches(context.body_analysis.branches)}`);
  parts.push(`- Exceptions: ${formatExceptions(context.body_analysis.exceptions)}`);
  parts.push(`- External calls: ${formatCalls(context.body_analysis.external_calls)}`);
  parts.push(`- Cyclomatic complexity: ${context.body_analysis.complexity}`);
  parts.push('');

  // Class Context Section (if applicable)
  if (context.class_context) {
    parts.push('## Class Context:');
    parts.push(`- Class: ${context.class_context.class_name}`);

    if (context.class_context.base_classes.length > 0) {
      parts.push(`- Base classes: ${context.class_context.base_classes.join(', ')}`);
    }

    if (context.class_context.other_methods.length > 0) {
      parts.push(`- Other methods: ${context.class_context.other_methods.join(', ')}`);
    }

    if (context.class_context.class_attributes.length > 0) {
      parts.push(`- Attributes: ${context.class_context.class_attributes.join(', ')}`);
    }

    if (context.class_context.is_dataclass) {
      parts.push('- Type: Dataclass');
    }

    parts.push('');
  }

  // Imports Section (if relevant)
  if (context.imports.length > 0) {
    const relevantImports = filterRelevantImports(context);
    if (relevantImports.length > 0) {
      parts.push('## Relevant Imports:');
      relevantImports.forEach(imp => {
        if (imp.imported_names[0] === '*') {
          parts.push(`- import ${imp.module}${imp.alias ? ` as ${imp.alias}` : ''}`);
        } else {
          parts.push(`- from ${imp.module} import ${imp.imported_names.join(', ')}`);
        }
      });
      parts.push('');
    }
  }

  // User's Description Section
  parts.push('## User\'s Description:');
  parts.push(`"${userDescription}"`);

  return parts.join('\n');
}

/**
 * Format function parameters for display
 */
function formatParameters(parameters: Parameter[]): string {
  if (parameters.length === 0) {
    return 'none';
  }

  return parameters
    .map(p => {
      let paramStr = p.name;

      if (p.type) {
        paramStr += `: ${p.type}`;
      }

      if (p.default_value) {
        paramStr += ` = ${p.default_value}`;
      }

      // Add kind indicator for special parameters
      if (p.kind === 'var_positional') {
        paramStr = `*${paramStr}`;
      } else if (p.kind === 'var_keyword') {
        paramStr = `**${paramStr}`;
      }

      return paramStr;
    })
    .join(', ');
}

/**
 * Format branch information for display
 */
function formatBranches(branches: BranchInfo[]): string {
  if (branches.length === 0) {
    return 'none';
  }

  const branchDescriptions = branches.map(b => {
    return `${b.type}(${b.condition}) at line ${b.line_number}`;
  });

  return `${branches.length} branch(es) - ${branchDescriptions.join('; ')}`;
}

/**
 * Format exception information for display
 */
function formatExceptions(exceptions: ExceptionInfo[]): string {
  if (exceptions.length === 0) {
    return 'none';
  }

  const exceptionDescriptions = exceptions.map(e => {
    const excClass = e.exception_class || 'unknown';
    return `${e.type}(${excClass}) at line ${e.line_number}`;
  });

  return `${exceptions.length} exception(s) - ${exceptionDescriptions.join('; ')}`;
}

/**
 * Format function call information for display
 */
function formatCalls(calls: CallInfo[]): string {
  if (calls.length === 0) {
    return 'none';
  }

  // Group calls by function name to avoid repetition
  const callCounts = new Map<string, number>();

  calls.forEach(call => {
    const key = call.module ? `${call.module}.${call.function_name}` : call.function_name;
    callCounts.set(key, (callCounts.get(key) || 0) + 1);
  });

  const callDescriptions = Array.from(callCounts.entries())
    .map(([name, count]) => count > 1 ? `${name} (${count}x)` : name)
    .slice(0, 10); // Limit to first 10 to avoid overwhelming the prompt

  if (callCounts.size > 10) {
    callDescriptions.push(`... and ${callCounts.size - 10} more`);
  }

  return callDescriptions.join(', ');
}

/**
 * Filter imports to only show those likely relevant to testing
 */
function filterRelevantImports(context: FunctionContext) {
  // Show typing imports and non-standard library imports
  const stdLibModules = new Set([
    'os', 'sys', 'time', 'datetime', 'json', 'csv', 're',
    'math', 'random', 'collections', 'itertools', 'functools'
  ]);

  return context.imports.filter(imp => {
    // Always show typing imports
    if (imp.module === 'typing' || imp.module.startsWith('typing.')) {
      return true;
    }

    // Show non-standard library imports
    if (!stdLibModules.has(imp.module.split('.')[0])) {
      return true;
    }

    return false;
  }).slice(0, 5); // Limit to 5 most relevant
}

/**
 * Determine if auto-confirmation should be used based on function complexity
 *
 * @param context - Function context
 * @returns true if function is simple enough for auto-confirmation
 */
export function shouldAutoConfirm(context: FunctionContext): boolean {
  const { body_analysis, source_code } = context;

  // Count lines of actual code (excluding empty lines and docstring)
  const codeLines = source_code
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 &&
             !trimmed.startsWith('#') &&
             !trimmed.startsWith('"""') &&
             !trimmed.startsWith("'''");
    }).length;

  // Simple function criteria:
  // - Less than 10 lines of code
  // - No branches (complexity = 1)
  // - No exception handling
  if (codeLines < 10 &&
      body_analysis.complexity === 1 &&
      body_analysis.exceptions.length === 0) {
    return true;
  }

  return false;
}

/**
 * Generate a summary of function complexity for user display
 *
 * @param context - Function context
 * @returns Human-readable complexity summary
 */
export function generateComplexitySummary(context: FunctionContext): string {
  const { body_analysis } = context;

  const parts: string[] = [];

  if (body_analysis.complexity > 10) {
    parts.push('High complexity');
  } else if (body_analysis.complexity > 5) {
    parts.push('Moderate complexity');
  } else {
    parts.push('Low complexity');
  }

  if (body_analysis.branches.length > 0) {
    parts.push(`${body_analysis.branches.length} branch(es)`);
  }

  if (body_analysis.exceptions.length > 0) {
    parts.push(`${body_analysis.exceptions.length} exception(s)`);
  }

  if (body_analysis.external_calls.length > 5) {
    parts.push('Multiple external calls');
  }

  return parts.join(', ');
}
