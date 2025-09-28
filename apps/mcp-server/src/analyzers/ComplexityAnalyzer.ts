import { parse } from '@typescript-eslint/parser'

interface ComplexityResult {
  cyclomatic: number
  cognitive: number
  branches: number
  conditions: number
  functions: number
  classes: number
  lines: number
  details: {
    functions: Array<{
      name: string
      complexity: number
      line: number
    }>
    classes: Array<{
      name: string
      methods: number
      complexity: number
    }>
  }
}

export class ComplexityAnalyzer {
  /**
   * Analyze code complexity
   */
  async analyze(content: string): Promise<ComplexityResult> {
    try {
      const ast = parse(content, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      })

      const result: ComplexityResult = {
        cyclomatic: 1,
        cognitive: 0,
        branches: 0,
        conditions: 0,
        functions: 0,
        classes: 0,
        lines: content.split('\n').length,
        details: {
          functions: [],
          classes: [],
        },
      }

      this.traverseAST(ast, result)

      // Calculate final cyclomatic complexity
      result.cyclomatic = result.branches + result.conditions - result.functions + 1

      return result
    } catch (error) {
      console.error('Failed to analyze complexity:', error)

      // Return basic metrics if parsing fails
      return {
        cyclomatic: 0,
        cognitive: 0,
        branches: 0,
        conditions: 0,
        functions: 0,
        classes: 0,
        lines: content.split('\n').length,
        details: {
          functions: [],
          classes: [],
        },
      }
    }
  }

  /**
   * Traverse AST and calculate complexity
   */
  private traverseAST(node: any, result: ComplexityResult, depth: number = 0): void {
    if (!node) return

    // Count control flow nodes
    switch (node.type) {
      case 'IfStatement':
      case 'ConditionalExpression':
        result.branches++
        result.cognitive += depth
        break

      case 'SwitchStatement':
        result.branches++
        result.cognitive += depth
        break

      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
        result.conditions++
        result.cognitive += depth + 1
        break

      case 'LogicalExpression':
        if (node.operator === '&&' || node.operator === '||') {
          result.conditions++
        }
        break

      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        result.functions++
        const functionName = node.id?.name || '<anonymous>'
        const functionComplexity = this.calculateFunctionComplexity(node)

        result.details.functions.push({
          name: functionName,
          complexity: functionComplexity,
          line: node.loc?.start?.line || 0,
        })
        break

      case 'ClassDeclaration':
      case 'ClassExpression':
        result.classes++
        const className = node.id?.name || '<anonymous>'
        const methods = this.countClassMethods(node)

        result.details.classes.push({
          name: className,
          methods,
          complexity: this.calculateClassComplexity(node),
        })
        break

      case 'TryStatement':
        result.branches++
        result.cognitive += depth
        break

      case 'CatchClause':
        result.branches++
        break

      case 'ThrowStatement':
        result.cognitive += 1
        break
    }

    // Recursively traverse child nodes
    for (const key in node) {
      if (key === 'parent' || key === 'loc' || key === 'range') continue

      const child = node[key]
      if (Array.isArray(child)) {
        child.forEach(c => this.traverseAST(c, result, depth + 1))
      } else if (child && typeof child === 'object') {
        this.traverseAST(child, result, depth + 1)
      }
    }
  }

  /**
   * Calculate complexity for a single function
   */
  private calculateFunctionComplexity(node: any): number {
    const tempResult: ComplexityResult = {
      cyclomatic: 1,
      cognitive: 0,
      branches: 0,
      conditions: 0,
      functions: 0,
      classes: 0,
      lines: 0,
      details: { functions: [], classes: [] },
    }

    this.traverseAST(node.body, tempResult)

    return tempResult.branches + tempResult.conditions + 1
  }

  /**
   * Calculate complexity for a class
   */
  private calculateClassComplexity(node: any): number {
    const tempResult: ComplexityResult = {
      cyclomatic: 1,
      cognitive: 0,
      branches: 0,
      conditions: 0,
      functions: 0,
      classes: 0,
      lines: 0,
      details: { functions: [], classes: [] },
    }

    this.traverseAST(node.body, tempResult)

    return tempResult.branches + tempResult.conditions + tempResult.functions + 1
  }

  /**
   * Count methods in a class
   */
  private countClassMethods(node: any): number {
    let count = 0

    if (node.body && node.body.body) {
      node.body.body.forEach((member: any) => {
        if (member.type === 'MethodDefinition') {
          count++
        }
      })
    }

    return count
  }

  /**
   * Calculate cognitive complexity (simplified version)
   */
  calculateCognitiveComplexity(content: string): number {
    let cognitive = 0
    const lines = content.split('\n')
    let nestingLevel = 0

    for (const line of lines) {
      // Count nesting
      const openBraces = (line.match(/{/g) || []).length
      const closeBraces = (line.match(/}/g) || []).length
      nestingLevel += openBraces - closeBraces

      // Add cognitive weight for control structures
      if (/\b(if|else if|switch|for|while|do|catch)\b/.test(line)) {
        cognitive += 1 + nestingLevel
      }

      // Add weight for logical operators
      if (/&&|\|\|/.test(line)) {
        cognitive += 1
      }

      // Add weight for recursive calls (simplified)
      if (/\breturn\s+\w+\(/.test(line)) {
        cognitive += 1
      }
    }

    return cognitive
  }
}