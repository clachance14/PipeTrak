
import { randomUUID } from 'crypto';

// Database connection helper
const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

interface TestUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
}

interface TestProject {
  id: string;
  name: string;
  organizationId: string;
}

interface TestComponent {
  id: string;
  componentId: string;
  type: string;
  workflowType: 'MILESTONE_DISCRETE' | 'MILESTONE_PERCENTAGE' | 'MILESTONE_QUANTITY';
  status: string;
  completionPercent: number;
}

// SQL query helper
async function executeSQL(query: string, params: any[] = []) {
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    
    const result = await client.query(query, params);
    await client.end();
    
    return result;
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

// Create test user with organization
export async function createTestUser(): Promise<TestUser> {
  const userId = randomUUID();
  const organizationId = randomUUID();
  const email = `test-${userId.slice(0, 8)}@pipetrak.test`;
  const name = `Test User ${userId.slice(0, 8)}`;

  // Create organization
  await executeSQL(`
    INSERT INTO "Organization" (id, name, slug, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, NOW(), NOW())
  `, [organizationId, `Test Org ${userId.slice(0, 8)}`, `test-org-${userId.slice(0, 8)}`]);

  // Create user
  await executeSQL(`
    INSERT INTO "User" (id, email, name, "emailVerified", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, NOW(), NOW(), NOW())
  `, [userId, email, name]);

  // Create membership
  await executeSQL(`
    INSERT INTO "Member" (id, role, "userId", "organizationId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, NOW(), NOW())
  `, [randomUUID(), 'owner', userId, organizationId]);

  return {
    id: userId,
    email,
    name,
    organizationId
  };
}

// Set up test project with components
export async function setupTestProject(project: TestProject, user: TestUser): Promise<void> {
  // Create project
  await executeSQL(`
    INSERT INTO "Project" (id, name, description, "organizationId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, NOW(), NOW())
  `, [project.id, project.name, `Test project for ${user.name}`, user.organizationId]);

  // Create milestone template
  const milestoneTemplateId = randomUUID();
  await executeSQL(`
    INSERT INTO "MilestoneTemplate" (id, name, description, milestones, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, NOW(), NOW())
  `, [
    milestoneTemplateId, 
    'Standard Template', 
    'Standard milestone template',
    JSON.stringify([
      { name: 'Design Review', order: 1, weight: 1 },
      { name: 'Material Procurement', order: 2, weight: 1 },
      { name: 'Installation', order: 3, weight: 1 },
      { name: 'Quality Check', order: 4, weight: 1 },
      { name: 'Completion', order: 5, weight: 1 }
    ])
  ]);

  // Create test components with different workflow types  
  interface TestComponentWithProject extends TestComponent {
    projectId: string;
  }
  
  const components: TestComponentWithProject[] = [
    {
      id: 'comp-discrete-1',
      componentId: 'VALVE-001',
      type: 'Ball Valve',
      workflowType: 'MILESTONE_DISCRETE',
      status: 'NOT_STARTED',
      completionPercent: 0,
      projectId: project.id
    },
    {
      id: 'comp-percentage-1',
      componentId: 'PIPE-001', 
      type: 'Steel Pipe',
      workflowType: 'MILESTONE_PERCENTAGE',
      status: 'NOT_STARTED',
      completionPercent: 0,
      projectId: project.id
    },
    {
      id: 'comp-quantity-1',
      componentId: 'BOLT-001',
      type: 'Hex Bolt',
      workflowType: 'MILESTONE_QUANTITY',
      status: 'NOT_STARTED',
      completionPercent: 0,
      projectId: project.id
    }
  ];

  for (const component of components) {
    // Create component
    await executeSQL(`
      INSERT INTO "Component" (
        id, "componentId", type, description, status, "completionPercent",
        "workflowType", "projectId", "milestoneTemplateId", 
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    `, [
      component.id,
      component.componentId,
      component.type,
      `Test ${component.type}`,
      'NOT_STARTED',
      0,
      component.workflowType,
      component.projectId,
      milestoneTemplateId
    ]);

    // Create milestones for each component
    const milestones = [
      'Design Review',
      'Material Procurement', 
      'Installation',
      'Quality Check',
      'Completion'
    ];

    for (let i = 0; i < milestones.length; i++) {
      const milestoneId = randomUUID();
      
      await executeSQL(`
        INSERT INTO "ComponentMilestone" (
          id, "componentId", "milestoneName", "milestoneOrder",
          "isCompleted", "percentageComplete", "quantityComplete", 
          "quantityTotal", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        milestoneId,
        component.id,
        milestones[i],
        i + 1,
        false,
        component.workflowType === 'MILESTONE_PERCENTAGE' ? 0 : null,
        component.workflowType === 'MILESTONE_QUANTITY' ? 0 : null,
        component.workflowType === 'MILESTONE_QUANTITY' ? 10 : null
      ]);
    }
  }

  // Create drawing for context
  const drawingId = randomUUID();
  await executeSQL(`
    INSERT INTO "Drawing" (id, number, title, "projectId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, NOW(), NOW())
  `, [drawingId, 'DWG-001', 'Test Drawing', project.id]);

  // Associate components with drawing
  for (const component of components) {
    await executeSQL(`
      UPDATE "Component" SET "drawingId" = $1 WHERE id = $2
    `, [drawingId, component.id]);
  }
}

// Create large dataset for performance testing
export async function setupLargeDataset(projectId: string, componentCount = 1000): Promise<void> {
  const milestoneTemplateId = randomUUID();
  
  // Create milestone template
  await executeSQL(`
    INSERT INTO "MilestoneTemplate" (id, name, description, milestones, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, NOW(), NOW())
  `, [
    milestoneTemplateId,
    'Performance Template',
    'Template for performance testing',
    JSON.stringify([
      { name: 'Design Review', order: 1, weight: 1 },
      { name: 'Installation', order: 2, weight: 1 },
      { name: 'Testing', order: 3, weight: 1 }
    ])
  ]);

  // Create components in batches for better performance
  const batchSize = 100;
  const workflowTypes = ['MILESTONE_DISCRETE', 'MILESTONE_PERCENTAGE', 'MILESTONE_QUANTITY'];
  
  for (let batch = 0; batch < Math.ceil(componentCount / batchSize); batch++) {
    const startIndex = batch * batchSize;
    const endIndex = Math.min(startIndex + batchSize, componentCount);
    
    const componentInserts: string[] = [];
    const milestoneInserts: string[] = [];
    
    for (let i = startIndex; i < endIndex; i++) {
      const componentId = randomUUID();
      const workflowType = workflowTypes[i % workflowTypes.length];
      
      componentInserts.push(`(
        '${componentId}',
        'COMP-${String(i).padStart(6, '0')}',
        'Test Component',
        'Performance test component ${i}',
        'NOT_STARTED',
        0,
        '${workflowType}',
        '${projectId}',
        '${milestoneTemplateId}',
        NOW(),
        NOW()
      )`);
      
      // Create milestones for each component
      const milestoneNames = ['Design Review', 'Installation', 'Testing'];
      milestoneNames.forEach((name, index) => {
        milestoneInserts.push(`(
          '${randomUUID()}',
          '${componentId}',
          '${name}',
          ${index + 1},
          false,
          ${workflowType === 'MILESTONE_PERCENTAGE' ? 0 : 'NULL'},
          ${workflowType === 'MILESTONE_QUANTITY' ? 0 : 'NULL'},
          ${workflowType === 'MILESTONE_QUANTITY' ? 10 : 'NULL'},
          NOW(),
          NOW()
        )`);
      });
    }
    
    // Batch insert components
    if (componentInserts.length > 0) {
      await executeSQL(`
        INSERT INTO "Component" (
          id, "componentId", type, description, status, "completionPercent",
          "workflowType", "projectId", "milestoneTemplateId", 
          "createdAt", "updatedAt"
        ) VALUES ${componentInserts.join(', ')}
      `);
    }
    
    // Batch insert milestones
    if (milestoneInserts.length > 0) {
      await executeSQL(`
        INSERT INTO "ComponentMilestone" (
          id, "componentId", "milestoneName", "milestoneOrder",
          "isCompleted", "percentageComplete", "quantityComplete",
          "quantityTotal", "createdAt", "updatedAt"
        ) VALUES ${milestoneInserts.join(', ')}
      `);
    }
  }

  console.log(`Created ${componentCount} components for performance testing`);
}

// Clean up test project
export async function cleanupTestProject(projectId: string): Promise<void> {
  try {
    // Delete in order due to foreign key constraints
    await executeSQL('DELETE FROM "ComponentMilestone" WHERE "componentId" IN (SELECT id FROM "Component" WHERE "projectId" = $1)', [projectId]);
    await executeSQL('DELETE FROM "Component" WHERE "projectId" = $1', [projectId]);
    await executeSQL('DELETE FROM "Drawing" WHERE "projectId" = $1', [projectId]);
    await executeSQL('DELETE FROM "AuditLog" WHERE "projectId" = $1', [projectId]);
    await executeSQL('DELETE FROM "Project" WHERE id = $1', [projectId]);
  } catch (error) {
    console.error('Error cleaning up test project:', error);
    // Don't throw - cleanup is best effort
  }
}

// Clean up test user and organization
export async function cleanupTestUser(user: TestUser): Promise<void> {
  try {
    await executeSQL('DELETE FROM "Member" WHERE "userId" = $1', [user.id]);
    await executeSQL('DELETE FROM "User" WHERE id = $1', [user.id]);
    await executeSQL('DELETE FROM "Organization" WHERE id = $1', [user.organizationId]);
  } catch (error) {
    console.error('Error cleaning up test user:', error);
  }
}

// Seed milestone data for testing
export async function seedMilestoneTestData(): Promise<void> {
  // Create test organizations and projects that can be reused
  const orgId = 'test-org-milestones-seed';
  const projectId = 'test-project-milestones-seed';
  
  try {
    // Check if already exists
    const existingOrg = await executeSQL('SELECT id FROM "Organization" WHERE id = $1', [orgId]);
    if (existingOrg.rows.length > 0) {
      return; // Already seeded
    }

    // Create organization
    await executeSQL(`
      INSERT INTO "Organization" (id, name, slug, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), NOW())
    `, [orgId, 'Test Milestone Org', 'test-milestone-org']);

    // Create project for large dataset testing
    await executeSQL(`
      INSERT INTO "Project" (id, name, description, "organizationId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [projectId, 'Large Dataset Project', 'Project for performance testing', orgId]);

    // Set up large dataset
    await setupLargeDataset(projectId, 2000);
    
    console.log('Milestone test data seeded successfully');
  } catch (error) {
    console.error('Error seeding milestone test data:', error);
    throw error;
  }
}

// Authentication helper for tests
export async function createAuthenticatedSession(user: TestUser): Promise<string> {
  // This would integrate with your auth system to create a valid session
  // For testing purposes, we'll create a mock session token
  const sessionToken = `test-session-${user.id}`;
  
  // In a real implementation, this would create an actual session in your auth system
  // For now, return a test token that the test setup can use
  return sessionToken;
}

// Wait for database operations to complete
export async function waitForDbSync(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Utility to generate test data
export function generateTestComponentId(index: number): string {
  return `TEST-COMP-${String(index).padStart(6, '0')}`;
}

interface TestMilestone {
  id: string;
  componentId: string;
  milestoneName: string;
  milestoneOrder: number;
  isCompleted: boolean;
  percentageComplete: number | null;
  quantityComplete: number | null;
  quantityTotal: number | null;
}

export function generateTestMilestoneData(componentCount: number) {
  const components: TestComponent[] = [];
  const milestones: TestMilestone[] = [];
  
  const workflowTypes: Array<'MILESTONE_DISCRETE' | 'MILESTONE_PERCENTAGE' | 'MILESTONE_QUANTITY'> = 
    ['MILESTONE_DISCRETE', 'MILESTONE_PERCENTAGE', 'MILESTONE_QUANTITY'];
  
  for (let i = 0; i < componentCount; i++) {
    const componentId = randomUUID();
    const workflowType = workflowTypes[i % workflowTypes.length];
    
    components.push({
      id: componentId,
      componentId: generateTestComponentId(i),
      type: `Test Component Type ${i % 10}`,
      workflowType,
      status: 'NOT_STARTED',
      completionPercent: 0
    });
    
    // Generate milestones for each component
    const milestoneNames = ['Design Review', 'Procurement', 'Installation', 'Testing', 'Completion'];
    milestoneNames.forEach((name, index) => {
      milestones.push({
        id: randomUUID(),
        componentId,
        milestoneName: name,
        milestoneOrder: index + 1,
        isCompleted: Math.random() > 0.8, // 20% chance of being completed
        percentageComplete: workflowType === 'MILESTONE_PERCENTAGE' ? Math.floor(Math.random() * 100) : null,
        quantityComplete: workflowType === 'MILESTONE_QUANTITY' ? Math.floor(Math.random() * 10) : null,
        quantityTotal: workflowType === 'MILESTONE_QUANTITY' ? 10 : null
      });
    });
  }
  
  return { components, milestones };
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await executeSQL('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Export all utilities
export {
  executeSQL,
  type TestUser,
  type TestProject,
  type TestComponent
};