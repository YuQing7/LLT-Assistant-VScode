/**
 * Type definitions for Python AST analysis
 *
 * These types mirror the Python dataclasses in ast_analyzer.py
 */

/**
 * Function parameter information
 */
export interface Parameter {
  name: string;
  type: string | null;
  default_value: string | null;
  kind: 'positional' | 'keyword' | 'var_positional' | 'var_keyword';
}

/**
 * Function signature information
 */
export interface FunctionSignature {
  name: string;
  parameters: Parameter[];
  return_type: string | null;
  is_async: boolean;
  is_method: boolean;
  decorators: string[];
}

/**
 * Conditional branch information
 */
export interface BranchInfo {
  type: 'if' | 'elif' | 'else' | 'match';
  condition: string;
  line_number: number;
}

/**
 * Exception handling information
 */
export interface ExceptionInfo {
  type: 'raise' | 'try-except';
  exception_class: string | null;
  line_number: number;
  context: string;
}

/**
 * Function/method call information
 */
export interface CallInfo {
  function_name: string;
  module: string | null;
  line_number: number;
  is_builtin: boolean;
}

/**
 * Function body analysis results
 */
export interface FunctionBodyAnalysis {
  branches: BranchInfo[];
  exceptions: ExceptionInfo[];
  external_calls: CallInfo[];
  complexity: number;
}

/**
 * Class context for methods
 */
export interface ClassContext {
  class_name: string;
  base_classes: string[];
  class_attributes: string[];
  other_methods: string[];
  is_dataclass: boolean;
}

/**
 * Import statement information
 */
export interface ImportInfo {
  module: string;
  imported_names: string[];
  alias: string | null;
  line_number: number;
}

/**
 * Inline comment information
 */
export interface Comment {
  text: string;
  line_number: number;
  is_block_comment: boolean;
}

/**
 * Documentation and comments
 */
export interface DocumentationInfo {
  docstring: string | null;
  inline_comments: Comment[];
}

/**
 * Complete function context for analysis
 */
export interface FunctionContext {
  signature: FunctionSignature;
  source_code: string;
  body_analysis: FunctionBodyAnalysis;
  class_context: ClassContext | null;
  imports: ImportInfo[];
  documentation: DocumentationInfo;
  file_path: string;
  module_path: string;
  line_range: [number, number];
}

/**
 * Error result from Python AST analyzer
 */
export interface AnalyzerError {
  error: string;
  type?: string;
}
