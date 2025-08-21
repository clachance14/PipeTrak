# Milestone System Test Suite

This directory contains comprehensive test coverage for the PipeTrak Milestone Update System, ensuring reliability, performance, and accessibility across all system components.

## Test Architecture

The test suite is organized into four main testing contexts as specified in the requirements:

### 1. Unit Tests (Vitest)
- **Location**: `__tests__/` directories alongside source files
- **Purpose**: Test individual components, utilities, and business logic
- **Coverage**: Components, hooks, state management, utilities

### 2. Integration Tests (Vitest + MSW)
- **Location**: `__tests__/milestone-api.integration.test.ts`
- **Purpose**: Test API endpoints and database operations
- **Coverage**: API contracts, data persistence, error handling

### 3. End-to-End Tests (Playwright)
- **Location**: `/tests/milestone-workflows.spec.ts`
- **Purpose**: Test complete user workflows
- **Coverage**: User journeys, browser compatibility, real-world scenarios

### 4. Performance Tests (Vitest)
- **Location**: `__tests__/milestone-performance.test.ts`
- **Purpose**: Ensure system performance under load
- **Coverage**: Large datasets, bulk operations, memory management

## Test Data Management

### Fixtures and Factories
- **Location**: `__fixtures__/milestones.ts`
- **Purpose**: Generate consistent, realistic test data
- **Features**: 
  - Factory functions for all milestone types
  - Large dataset generation for performance testing
  - Realistic workflow scenarios

### MSW Handlers
- **Location**: `__mocks__/milestone-handlers.ts`
- **Purpose**: Mock API responses for consistent testing
- **Features**:
  - Complete API endpoint coverage
  - Error scenario simulation
  - Performance testing modes
  - Offline/online state simulation

## Test Categories

### Workflow Type Testing

#### Discrete Milestones (Checkbox completion)
- ✅ Checkbox interaction and state management
- ✅ Optimistic updates and rollback
- ✅ Keyboard navigation and accessibility
- ✅ Loading and error states

#### Percentage Milestones (Slider/input tracking)
- ✅ Slider and input synchronization
- ✅ Value validation (0-100%)
- ✅ Progressive completion tracking
- ✅ Visual progress indicators

#### Quantity Milestones (Numeric completion)
- ✅ Quantity input validation
- ✅ Total quantity comparison
- ✅ Progress bar implementation
- ✅ Unit conversion support

### Bulk Operations Testing
- ✅ Multiple component selection
- ✅ Preview functionality before execution
- ✅ Transaction processing and rollback
- ✅ Progress tracking and cancellation
- ✅ Partial failure handling
- ✅ Performance with large datasets

### Real-time Features Testing
- ✅ Optimistic updates with conflict resolution
- ✅ WebSocket synchronization
- ✅ Multi-user collaboration scenarios
- ✅ Presence tracking and indicators

### Mobile Interface Testing
- ✅ Touch target size validation (52px minimum)
- ✅ Bottom sheet behavior
- ✅ Swipe gesture support
- ✅ Responsive breakpoints
- ✅ Offline mode functionality

### Accessibility Testing
- ✅ WCAG AA compliance
- ✅ Screen reader compatibility
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Color contrast and high contrast mode
- ✅ Reduced motion support

### Performance Testing
- ✅ Large dataset handling (1000+ components)
- ✅ Bulk operation performance benchmarks
- ✅ Virtual scrolling efficiency
- ✅ Memory leak detection
- ✅ Network latency handling

### Database Testing (pgTAP)
- ✅ Row Level Security (RLS) policy validation
- ✅ Database function testing
- ✅ Trigger validation
- ✅ Data integrity constraints
- ✅ Performance optimization verification

## Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm test

# Run specific test file
pnpm test milestone-components

# Run with coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

### Integration Tests
```bash
# Run integration tests
pnpm test milestone-api.integration.test.ts

# Run with specific test database
DATABASE_URL=test_db_url pnpm test
```

### End-to-End Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm playwright test milestone-workflows.spec.ts

# Run in headed mode for debugging
pnpm playwright test --headed

# Generate test report
pnpm playwright show-report
```

### Performance Tests
```bash
# Run performance benchmarks
pnpm test milestone-performance.test.ts

# Run with performance profiling
NODE_OPTIONS="--prof" pnpm test milestone-performance.test.ts
```

### Database Tests
```bash
# Run pgTAP tests (requires PostgreSQL with pgTAP extension)
psql -d test_database -f packages/database/supabase/tests/milestone-rls-policies.sql
psql -d test_database -f packages/database/supabase/tests/milestone-functions.sql
```

### Accessibility Tests
```bash
# Run accessibility tests
pnpm test milestone-accessibility.test.tsx

# Run with axe-core integration
JEST_ACCESSIBILITY=true pnpm test
```

## Test Data Setup

### Database Seeding
```bash
# Set up test database
pnpm db:test:setup

# Seed with milestone test data
pnpm db:test:seed

# Clean up test data
pnpm db:test:cleanup
```

### Test User Creation
The test suite includes utilities for creating authenticated test users and organizations:

```typescript
import { createTestUser, setupTestProject } from './helpers/test-setup';

const testUser = await createTestUser();
await setupTestProject(testProject, testUser);
```

## CI/CD Integration

### Test Pipeline
1. **Parallel Execution**: Unit, integration, and E2E tests run in parallel lanes
2. **Contract Validation**: API schema validation gates prevent deployment of breaking changes
3. **Performance Regression**: Automated performance benchmarks with ±10% baseline tolerance
4. **Accessibility Gate**: Automated accessibility checks must pass before deployment

### Artifact Generation
- HTML test reports with detailed failure information
- Playwright videos for E2E test failures
- Performance benchmark reports
- Coverage reports with branch/line coverage

### Flake Control
- 2x retries for E2E tests with network dependencies
- Automatic issue creation for frequently failing tests
- Test stability metrics tracking

## Test Configuration

### Environment Variables
```bash
# Test database connection
TEST_DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/pipetrak_test

# API endpoints for integration tests
TEST_API_BASE_URL=http://localhost:3000/api

# Performance test thresholds
PERF_TIMEOUT_MS=5000
PERF_MEMORY_LIMIT_MB=512

# Accessibility test level
A11Y_LEVEL=AA
```

### Test Timeouts
- Unit tests: 5 seconds
- Integration tests: 30 seconds  
- E2E tests: 60 seconds
- Performance tests: 120 seconds

## Coverage Requirements

### Minimum Coverage Thresholds
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Critical Path Coverage
- Milestone update workflows: 95%
- Bulk operations: 90%
- Error handling: 85%
- Accessibility features: 95%

## Test Maintenance

### Adding New Tests
1. Follow the existing test structure and naming conventions
2. Use provided fixtures and factories for test data
3. Include both happy path and error scenarios
4. Add accessibility tests for new UI components
5. Update MSW handlers for new API endpoints

### Updating Test Data
1. Modify fixtures in `__fixtures__/milestones.ts`
2. Update MSW handlers in `__mocks__/milestone-handlers.ts`
3. Regenerate large datasets for performance tests
4. Update database seed scripts

### Performance Baselines
Performance test baselines are tracked in version control and updated quarterly or when significant performance improvements are made.

Current baselines:
- Single milestone update: <300ms P95
- Bulk update (50 items): <2s P95
- Component table render: <1.5s P95
- Mobile touch response: <50ms P95

## Debugging Tests

### Common Issues

#### Flaky E2E Tests
- Check for race conditions with async operations
- Ensure proper waiting for network requests
- Verify test data cleanup between runs

#### Performance Test Failures
- Monitor system resources during test execution
- Check for memory leaks in long-running tests
- Verify network conditions are stable

#### Accessibility Test Failures
- Use axe-core browser extension for manual verification
- Check color contrast ratios with accessibility tools
- Test with actual screen readers when possible

### Debug Commands
```bash
# Debug specific test with detailed output
pnpm test --verbose milestone-components.test.tsx

# Debug E2E test with browser inspector
pnpm playwright test --debug milestone-workflows.spec.ts

# Profile performance tests
NODE_OPTIONS="--inspect" pnpm test milestone-performance.test.ts
```

## Security Considerations

### Test Data Security
- No production data is used in tests
- All test credentials are non-functional outside test environment
- Database is reset between test runs
- Sensitive test data is excluded from version control

### RLS Policy Testing
- Comprehensive testing of Row Level Security policies
- Verification that users can only access their organization's data
- Testing of edge cases and privilege escalation attempts
- Validation of audit logging for milestone operations

## Contributing

When contributing to the milestone test suite:

1. **Follow the test pyramid**: More unit tests, fewer E2E tests
2. **Test behavior, not implementation**: Focus on user-facing functionality
3. **Include negative test cases**: Test error conditions and edge cases
4. **Maintain test performance**: Keep test execution time reasonable
5. **Document complex test scenarios**: Add comments for non-obvious test logic

### Code Review Checklist
- [ ] Tests cover all new functionality
- [ ] Accessibility tests included for UI changes
- [ ] Performance impact considered
- [ ] Test data cleanup implemented
- [ ] Error scenarios tested
- [ ] Documentation updated

## Metrics and Monitoring

### Test Metrics Tracked
- Test execution time trends
- Test failure rates by category
- Coverage percentage over time
- Performance benchmark trends
- Accessibility compliance scores

### Alerts
- Test failure rate >5% triggers investigation
- Performance regression >10% blocks deployment
- Coverage drop >2% requires explanation
- Accessibility violations block merge

This comprehensive test suite ensures the PipeTrak Milestone Update System maintains high quality, performance, and accessibility standards while supporting reliable field operations.