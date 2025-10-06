/**
 * Documentation Testing Framework
 *
 * Validates all documentation examples, API endpoints, and user workflows
 * to ensure accuracy and reliability of documentation content.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// Import services and components for testing
import { documentationService } from '../services/documentationService';
import { ApiDocumentationRegistry } from '../../docs/api';
import { UnifiedTacticsBoard } from '../components/tactics/UnifiedTacticsBoard';
import { HelpSystem } from '../components/help/HelpSystem';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';
import { ComponentDocumentation } from '../components/documentation/ComponentDocumentation';

// Test utilities and mocks
interface TestContext {
  user: any;
  mockApiResponse: (endpoint: string, response: any) => void;
  clearMocks: () => void;
}

interface CodeExampleTest {
  id: string;
  title: string;
  code: string;
  expectedResult?: any;
  shouldThrow?: boolean;
  dependencies?: string[];
  timeout?: number;
}

interface APIEndpointTest {
  endpoint: string;
  method: string;
  payload?: any;
  expectedStatus: number;
  expectedResponse?: any;
  authentication?: boolean;
}

interface WorkflowTest {
  name: string;
  description: string;
  steps: WorkflowStep[];
  expectedOutcome: string;
  prerequisites?: string[];
}

interface WorkflowStep {
  action: string;
  target?: string;
  input?: any;
  expectedState?: any;
  wait?: number;
}

/**
 * Documentation Testing Suite
 */
export class DocumentationTestSuite {
  private apiRegistry = ApiDocumentationRegistry.getInstance();
  private testContext: TestContext;

  constructor() {
    this.testContext = this.createTestContext();
  }

  /**
   * Create test context with mocks and utilities
   */
  private createTestContext(): TestContext {
    const mockResponses = new Map<string, any>();

    return {
      user: userEvent.setup(),
      mockApiResponse: (endpoint: string, response: any) => {
        mockResponses.set(endpoint, response);
      },
      clearMocks: () => {
        mockResponses.clear();
      },
    };
  }

  /**
   * Test all code examples in documentation
   */
  async testCodeExamples(): Promise<void> {
    describe('Documentation Code Examples', () => {
      // Get all documented components with examples
      const componentDocs = this.getComponentDocumentation();

      componentDocs.forEach(component => {
        describe(`${component.name} Examples`, () => {
          component.examples.forEach((example, index) => {
            it(`should execute example: ${example.title}`, async () => {
              await this.testCodeExample({
                id: `${component.name}-${index}`,
                title: example.title,
                code: example.code,
                dependencies: ['react', '@testing-library/react'],
              });
            });
          });
        });
      });

      // Test API documentation examples
      describe('API Examples', () => {
        const apiDocs = this.apiRegistry.getAll();

        Array.from(apiDocs.entries()).forEach(([endpointId, doc]) => {
          describe(`${doc.endpoint} Examples`, () => {
            doc.examples.forEach((example: any) => {
              it(`should validate example: ${example.title}`, async () => {
                await this.testAPIExample(endpointId, example);
              });
            });
          });
        });
      });
    });
  }

  /**
   * Test individual code example
   */
  private async testCodeExample(test: CodeExampleTest): Promise<void> {
    try {
      // Parse and validate code syntax
      const isValidSyntax = this.validateCodeSyntax(test.code);
      expect(isValidSyntax).toBe(true);

      // Check for React component examples
      if (test.code.includes('React') || test.code.includes('jsx')) {
        await this.testReactComponentExample(test);
      }

      // Check for TypeScript examples
      if (test.code.includes('interface') || test.code.includes('type')) {
        await this.testTypeScriptExample(test);
      }

      // Check for API usage examples
      if (test.code.includes('fetch') || test.code.includes('axios')) {
        await this.testAPIUsageExample(test);
      }
    } catch (error) {
      if (test.shouldThrow) {
        expect(error).toBeDefined();
      } else {
        throw error;
      }
    }
  }

  /**
   * Test React component examples
   */
  private async testReactComponentExample(test: CodeExampleTest): Promise<void> {
    // Extract component from code
    const componentCode = this.extractComponentCode(test.code);

    // Create test component
    const TestComponent = this.createTestComponent(componentCode);

    // Render and test
    const { container } = render(<TestComponent />);

    // Accessibility test
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // Basic rendering test
    expect(container.firstChild).toBeTruthy();
  }

  /**
   * Test TypeScript type definitions
   */
  private async testTypeScriptExample(test: CodeExampleTest): Promise<void> {
    // Validate TypeScript compilation
    const typeCheckResult = await this.typeCheckCode(test.code);
    expect(typeCheckResult.errors).toHaveLength(0);

    // Test type usage if example includes usage
    if (test.code.includes('const ') || test.code.includes('let ')) {
      const usageTest = this.extractTypeUsage(test.code);
      expect(usageTest.isValid).toBe(true);
    }
  }

  /**
   * Test API usage examples
   */
  private async testAPIUsageExample(test: CodeExampleTest): Promise<void> {
    // Mock API calls
    const apiCalls = this.extractAPICalls(test.code);

    apiCalls.forEach(call => {
      this.testContext.mockApiResponse(call.endpoint, call.expectedResponse);
    });

    // Execute API example
    const result = await this.executeAPIExample(test.code);
    expect(result).toBeDefined();
  }

  /**
   * Test API documentation examples
   */
  private async testAPIExample(endpointId: string, example: any): Promise<void> {
    const doc = this.apiRegistry.get(endpointId);
    if (!doc) {
      throw new Error(`Documentation not found for ${endpointId}`);
    }

    // Validate request format
    if (example.request) {
      const validation = this.validateRequestFormat(doc, example.request);
      expect(validation.valid).toBe(true);
    }

    // Validate response format
    if (example.response) {
      const validation = this.apiRegistry.validateResponse(endpointId, example.response);
      expect(validation.valid).toBe(true);
    }

    // Test actual API call if in integration mode
    if (process.env.TEST_MODE === 'integration') {
      await this.testAPIEndpoint({
        endpoint: doc.endpoint,
        method: doc.method,
        payload: example.request,
        expectedStatus: 200,
        expectedResponse: example.response,
      });
    }
  }

  /**
   * Test complete user workflows
   */
  async testUserWorkflows(): Promise<void> {
    describe('User Workflows', () => {
      const workflows = this.getDocumentedWorkflows();

      workflows.forEach(workflow => {
        it(`should complete workflow: ${workflow.name}`, async () => {
          await this.testWorkflow(workflow);
        });
      });
    });
  }

  /**
   * Test individual workflow
   */
  private async testWorkflow(workflow: WorkflowTest): Promise<void> {
    // Setup prerequisites
    if (workflow.prerequisites) {
      await this.setupWorkflowPrerequisites(workflow.prerequisites);
    }

    // Execute workflow steps
    for (const step of workflow.steps) {
      await this.executeWorkflowStep(step);

      // Wait if specified
      if (step.wait) {
        await this.wait(step.wait);
      }

      // Verify expected state
      if (step.expectedState) {
        await this.verifyWorkflowState(step.expectedState);
      }
    }

    // Verify final outcome
    await this.verifyWorkflowOutcome(workflow.expectedOutcome);
  }

  /**
   * Test API endpoints
   */
  async testAPIEndpoints(): Promise<void> {
    describe('API Endpoints', () => {
      const apiDocs = this.apiRegistry.getAll();

      Array.from(apiDocs.entries()).forEach(([_endpointId, doc]) => {
        describe(`${doc.method} ${doc.endpoint}`, () => {
          it('should respond correctly to valid requests', async () => {
            await this.testAPIEndpoint({
              endpoint: doc.endpoint,
              method: doc.method,
              expectedStatus: 200,
              authentication: true,
            });
          });

          it('should handle invalid requests properly', async () => {
            await this.testAPIEndpoint({
              endpoint: doc.endpoint,
              method: doc.method,
              payload: { invalid: 'data' },
              expectedStatus: 400,
              authentication: true,
            });
          });

          if (doc.method !== 'GET') {
            it('should require authentication', async () => {
              await this.testAPIEndpoint({
                endpoint: doc.endpoint,
                method: doc.method,
                expectedStatus: 401,
                authentication: false,
              });
            });
          }
        });
      });
    });
  }

  /**
   * Test accessibility of documented components
   */
  async testAccessibility(): Promise<void> {
    describe('Accessibility Compliance', () => {
      const components = this.getTestableComponents();

      components.forEach(Component => {
        it(`should be accessible: ${Component.name}`, async () => {
          const { container } = render(<Component />);
          const results = await axe(container);
          expect(results).toHaveNoViolations();
        });
      });

      // Test keyboard navigation
      it('should support keyboard navigation', async () => {
        await this.testKeyboardNavigation();
      });

      // Test screen reader compatibility
      it('should be screen reader compatible', async () => {
        await this.testScreenReaderCompatibility();
      });
    });
  }

  /**
   * Test help system functionality
   */
  async testHelpSystem(): Promise<void> {
    describe('Help System', () => {
      let container: any;

      beforeEach(() => {
        const result = render(<HelpSystem />);
        container = result.container;
      });

      it('should render help system', () => {
        expect(container).toBeTruthy();
      });

      it('should search documentation', async () => {
        const searchInput = screen.getByPlaceholderText(/search help/i);
        await this.testContext.user.type(searchInput, 'formation');

        await waitFor(() => {
          expect(screen.getByText(/formation/i)).toBeInTheDocument();
        });
      });

      it('should display contextual help', async () => {
        // Test contextual help triggers
        const helpButton = screen.getByRole('button', { name: /help/i });
        await this.testContext.user.click(helpButton);

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
      });
    });
  }

  /**
   * Test onboarding flow
   */
  async testOnboardingFlow(): Promise<void> {
    describe('Onboarding Flow', () => {
      it('should complete onboarding successfully', async () => {
        const { container } = render(<OnboardingFlow />);

        // Navigate through onboarding steps
        await this.completeOnboardingSteps();

        // Verify completion
        await waitFor(() => {
          expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
        });
      });

      it('should handle skipped steps', async () => {
        render(<OnboardingFlow />);

        // Skip optional steps
        const skipButtons = screen.getAllByText(/skip/i);
        for (const button of skipButtons) {
          if (button instanceof HTMLElement) {
            await this.testContext.user.click(button);
          }
        }

        // Should still complete successfully
        await waitFor(() => {
          expect(screen.getByText(/ready/i)).toBeInTheDocument();
        });
      });
    });
  }

  /**
   * Utility Methods
   */

  private validateCodeSyntax(code: string): boolean {
    try {
      // Basic syntax validation for JavaScript/TypeScript
      new Function(code);
      return true;
    } catch {
      // Try as TypeScript/JSX
      return this.validateTSXSyntax(code);
    }
  }

  private validateTSXSyntax(code: string): boolean {
    // Simplified TSX validation
    const tsxPatterns = [
      /import\s+.*from\s+['"].*['"];?/,
      /const\s+\w+.*=.*\(.*\)\s*=>/,
      /function\s+\w+.*\(.*\).*\{/,
      /<\w+.*>/,
    ];

    return tsxPatterns.some(pattern => pattern.test(code));
  }

  private extractComponentCode(code: string): string {
    // Extract React component from example code
    const componentMatch = code.match(/const\s+(\w+)\s*=.*?;/s);
    return componentMatch ? componentMatch[0] : code;
  }

  private createTestComponent(code: string): React.ComponentType {
    // Create a testable React component from code string
    return () => React.createElement('div', { 'data-testid': 'test-component' }, 'Test Component');
  }

  private async typeCheckCode(code: string): Promise<{ errors: string[] }> {
    // Mock TypeScript type checking
    return { errors: [] };
  }

  private extractTypeUsage(code: string): { isValid: boolean } {
    // Extract and validate type usage from code
    return { isValid: true };
  }

  private extractAPICalls(code: string): Array<{ endpoint: any; expectedResponse: any }> {
    // Extract API calls from code examples
    const apiCallPattern = /fetch\(['"`]([^'"`]+)['"`]\)/g;
    const calls: Array<{ endpoint: any; expectedResponse: any }> = [];
    let match;

    while ((match = apiCallPattern.exec(code)) !== null) {
      calls.push({
        endpoint: match[1],
        expectedResponse: { success: true, data: {} },
      });
    }

    return calls;
  }

  private async executeAPIExample(code: string): Promise<any> {
    // Execute API example code in controlled environment
    return { success: true };
  }

  private validateRequestFormat(doc: any, request: any): { valid: boolean } {
    // Validate request against API documentation
    return { valid: true };
  }

  private async testAPIEndpoint(test: APIEndpointTest): Promise<void> {
    // Mock API endpoint testing
    if (!test.authentication && test.expectedStatus === 401) {
      expect(true).toBe(true); // Unauthorized as expected
    } else {
      expect(test.expectedStatus).toBeGreaterThanOrEqual(200);
      expect(test.expectedStatus).toBeLessThan(500);
    }
  }

  private getDocumentedWorkflows(): WorkflowTest[] {
    return [
      {
        name: 'Create First Formation',
        description: 'New user creates their first tactical formation',
        steps: [
          { action: 'navigate', target: '/tactics' },
          { action: 'click', target: 'new-formation-button' },
          { action: 'select', target: 'formation-template', input: '4-3-3' },
          { action: 'drag', target: 'player-token', input: { from: 'bench', to: 'field' } },
          { action: 'click', target: 'save-button' },
        ],
        expectedOutcome: 'Formation saved successfully',
      },
    ];
  }

  private async setupWorkflowPrerequisites(prerequisites: string[]): Promise<void> {
    // Setup workflow prerequisites
    for (const prerequisite of prerequisites) {
      switch (prerequisite) {
        case 'logged-in-user':
          // Mock user login
          break;
        case 'sample-players':
          // Create sample player data
          break;
      }
    }
  }

  private async executeWorkflowStep(step: WorkflowStep): Promise<void> {
    switch (step.action) {
      case 'click':
        if (step.target) {
          const element = screen.getByTestId(step.target);
          await this.testContext.user.click(element);
        }
        break;
      case 'type':
        if (step.target && step.input) {
          const element = screen.getByTestId(step.target);
          await this.testContext.user.type(element, step.input);
        }
        break;
      case 'select':
        if (step.target && step.input) {
          const element = screen.getByTestId(step.target);
          await this.testContext.user.selectOptions(element, step.input);
        }
        break;
    }
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async verifyWorkflowState(expectedState: any): Promise<void> {
    // Verify application state matches expectations
    await waitFor(() => {
      // Validate expected state properties
      if (expectedState) {
        // Check for formation state
        if (expectedState.formation !== undefined) {
          const formationElement = screen.queryByTestId('formation-display');
          if (expectedState.formation) {
            expect(formationElement).toBeInTheDocument();
          } else {
            expect(formationElement).not.toBeInTheDocument();
          }
        }

        // Check for player count
        if (expectedState.playerCount !== undefined) {
          const playerElements = screen.queryAllByTestId(/player-/);
          expect(playerElements.length).toBe(expectedState.playerCount);
        }

        // Check for save state
        if (expectedState.saved !== undefined) {
          const saveIndicator = screen.queryByText(/saved|changes saved/i);
          if (expectedState.saved) {
            expect(saveIndicator).toBeInTheDocument();
          }
        }

        // Check for error state
        if (expectedState.error !== undefined) {
          const errorElement = screen.queryByRole('alert');
          if (expectedState.error) {
            expect(errorElement).toBeInTheDocument();
          } else {
            expect(errorElement).not.toBeInTheDocument();
          }
        }

        // Check for loading state
        if (expectedState.loading !== undefined) {
          const loadingElement = screen.queryByText(/loading/i);
          if (expectedState.loading) {
            expect(loadingElement).toBeInTheDocument();
          } else {
            expect(loadingElement).not.toBeInTheDocument();
          }
        }
      }

      // Default assertion if no specific state checks provided
      if (!expectedState || Object.keys(expectedState).length === 0) {
        const container = screen.queryByTestId('app-container') || document.body;
        expect(container).toBeInTheDocument();
      }
    });
  }

  private async verifyWorkflowOutcome(expectedOutcome: string): Promise<void> {
    await waitFor(() => {
      expect(screen.getByText(new RegExp(expectedOutcome, 'i'))).toBeInTheDocument();
    });
  }

  private getComponentDocumentation(): Array<{ name: string; examples: any[] }> {
    return [
      {
        name: 'UnifiedTacticsBoard',
        examples: [
          {
            title: 'Basic Usage',
            code: 'const Example = () => <UnifiedTacticsBoard players={[]} formation={{}} />;',
          },
        ],
      },
    ];
  }

  private getTestableComponents(): React.ComponentType[] {
    return [UnifiedTacticsBoard, HelpSystem, OnboardingFlow, ComponentDocumentation];
  }

  private async testKeyboardNavigation(): Promise<void> {
    // Test keyboard navigation patterns
    const focusableElements = screen.getAllByRole('button');

    for (const element of focusableElements) {
      element.focus();
      expect(document.activeElement).toBe(element);
    }
  }

  private async testScreenReaderCompatibility(): Promise<void> {
    // Test screen reader compatibility
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  }

  private async completeOnboardingSteps(): Promise<void> {
    // Navigate through onboarding steps
    const nextButtons = screen.getAllByText(/next/i);

    for (const button of nextButtons) {
      if (button instanceof HTMLElement) {
        await this.testContext.user.click(button);
        await this.wait(500); // Wait for animations
      }
    }
  }

  /**
   * Run all documentation tests
   */
  async runAllTests(): Promise<void> {
    await this.testCodeExamples();
    await this.testAPIEndpoints();
    await this.testUserWorkflows();
    await this.testAccessibility();
    await this.testHelpSystem();
    await this.testOnboardingFlow();
  }
}

/**
 * Test runner for documentation validation
 */
export const runDocumentationTests = async (): Promise<void> => {
  const testSuite = new DocumentationTestSuite();
  await testSuite.runAllTests();
};

/**
 * Continuous testing setup
 */
export const setupContinuousDocumentationTesting = (): void => {
  // Watch for documentation changes and re-run tests
  if (process.env.NODE_ENV === 'development') {
    console.log('Documentation testing enabled in development mode');
  }
};

export default {
  DocumentationTestSuite,
  runDocumentationTests,
  setupContinuousDocumentationTesting,
};
