I need you to perform a comprehensive "fresh eyes" code review of all the code I just wrote and any existing code that was modified. Please examine everything with extreme attention to detail, looking for:

## 🔍 Critical Issues to Check

### 1. **Syntax & Logic Errors**
- Syntax errors, typos, or malformed code
- Logic errors that could cause runtime failures
- Off-by-one errors in loops or array access
- Incorrect boolean logic or comparison operators
- Missing return statements or unreachable code

### 2. **Type Safety & TypeScript Issues**
- Type mismatches or `any` types that should be specific
- Missing or incorrect interface definitions
- Incorrect generic usage
- Union type handling issues
- Null/undefined safety concerns

### 3. **Integration & Compatibility Problems**
- Breaking changes that affect other parts of the codebase
- API contract violations (function signatures, return types)
- Import/export mismatches
- Version compatibility issues with dependencies
- Environment-specific code that might fail in different contexts

### 4. **Performance & Resource Issues**
- Memory leaks (uncleaned event listeners, subscriptions)
- Infinite loops or recursive calls without base cases
- N+1 queries or inefficient database operations
- Large object creation in render loops
- Missing dependency arrays in React hooks
- Unnecessary re-renders or computations

### 5. **Security Vulnerabilities**
- SQL injection possibilities
- XSS vulnerabilities
- Insecure API endpoints or data exposure
- Missing input validation or sanitization
- Hardcoded secrets or sensitive data
- CORS configuration issues

### 6. **Code Quality & Maintainability**
- Inconsistent naming conventions
- Functions that are too long or complex
- Missing error handling for async operations
- Code duplication that should be abstracted
- Missing or misleading comments
- Dead code or unused imports

### 7. **Testing & Documentation Gaps**
- Missing test cases for new functionality
- Broken existing tests due to changes
- Missing JSDoc or inline documentation
- Outdated README or setup instructions

## 📋 Review Format

For each issue found, provide:

1. **File and line number** (if applicable)
2. **Issue category** (from above list)
3. **Severity level**: 🔴 Critical | 🟡 Important | 🔵 Minor
4. **Current code snippet** (problematic code)
5. **Explanation** of why it's an issue
6. **Suggested fix** with corrected code
7. **Impact assessment** on other parts of the codebase

## ✅ Summary Report

After the detailed review, provide:
- **Total issues found** by severity
- **Most critical issues** that need immediate attention
- **Quick wins** that are easy to fix
- **Architectural concerns** that might need broader discussion
- **Overall code quality assessment** (1-10 scale with reasoning)

## 🎯 Focus Areas

Pay special attention to:
- Any code that interacts with external APIs or databases
- Authentication and authorization logic
- Data validation and sanitization
- Error handling and edge cases
- Performance-critical sections
- Recently modified files that might have introduced regressions

Please be thorough but practical - focus on issues that could actually cause problems rather than purely stylistic preferences unless they significantly impact readability or maintainability.