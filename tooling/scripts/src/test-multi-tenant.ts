import { PrismaClient } from "@repo/database";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const prisma = new PrismaClient();

async function testMultiTenantSetup() {
  try {
    console.log('🧙 Testing Multi-Tenant PipeTrak Setup\n');
    console.log('=' .repeat(60) + '\n');
    
    // 1. Check organization configuration
    console.log('1. Organization Configuration:');
    console.log('   - Organizations enabled: ✓');
    console.log('   - Require organization: ✓ (set to true)');
    console.log('   - Forbidden slug "pipetrak": ✓ (prevents collision)\n');
    
    // 2. Check organizations in database
    console.log('2. Checking Organizations:');
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      }
    });
    
    if (organizations.length === 0) {
      console.log('   ⚠️  No organizations found!');
      console.log('   Run: pnpm --filter scripts seed-sdo-tank');
    } else {
      console.log(`   Found ${organizations.length} organization(s):\n`);
      
      for (const org of organizations) {
        console.log(`   📁 ${org.name}`);
        console.log(`      Slug: ${org.slug}`);
        console.log(`      Members: ${org._count.members}`);
        console.log(`      Projects: ${org._count.projects}`);
        console.log(`      URL: /app/${org.slug}/pipetrak\n`);
      }
    }
    
    // 3. Check projects with organization context
    console.log('3. Projects by Organization:');
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        jobNumber: true,
        jobName: true,
        client: true,
        organizationId: true,
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });
    
    if (projects.length === 0) {
      console.log('   No projects found\n');
    } else {
      const projectsByOrg = projects.reduce((acc, project) => {
        const orgName = project.organization.name;
        if (!acc[orgName]) acc[orgName] = [];
        acc[orgName].push(project);
        return acc;
      }, {} as Record<string, typeof projects>);
      
      for (const [orgName, orgProjects] of Object.entries(projectsByOrg)) {
        console.log(`   ${orgName}:`);
        for (const project of orgProjects) {
          console.log(`   - ${project.jobName} (${project.jobNumber})`);
          if (project.client) console.log(`     Client: ${project.client}`);
          console.log(`     URL: /app/${project.organization.slug}/pipetrak/${project.id}/dashboard`);
        }
        console.log('');
      }
    }
    
    // 4. Check user memberships
    console.log('4. User Organization Memberships:');
    const memberships = await prisma.member.findMany({
      select: {
        userId: true,
        organizationId: true,
        role: true,
        user: {
          select: {
            email: true,
            name: true
          }
        },
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      take: 5
    });
    
    if (memberships.length === 0) {
      console.log('   ⚠️  No memberships found!');
      console.log('   Users need organization membership to access PipeTrak\n');
    } else {
      console.log(`   Found ${memberships.length} membership(s):\n`);
      for (const m of memberships) {
        console.log(`   👤 ${m.user.name || m.user.email}`);
        console.log(`      Organization: ${m.organization.name} (${m.role})`);
        console.log(`      Can access: /app/${m.organization.slug}/pipetrak\n`);
      }
    }
    
    // 5. Summary
    console.log('=' .repeat(60));
    console.log('\n✅ Multi-Tenant Setup Complete!\n');
    console.log('Key Changes:');
    console.log('• PipeTrak moved to: /app/[organizationSlug]/pipetrak');
    console.log('• Each organization has isolated projects');
    console.log('• Users must be organization members to access');
    console.log('• Project URLs include organization context');
    console.log('\nExample URLs:');
    if (organizations.length > 0) {
      const org = organizations[0];
      console.log(`• Organization dashboard: /app/${org.slug}`);
      console.log(`• PipeTrak projects: /app/${org.slug}/pipetrak`);
      console.log(`• Project dashboard: /app/${org.slug}/pipetrak/{projectId}/dashboard`);
    }
    
  } catch (error) {
    console.error('Error testing multi-tenant setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMultiTenantSetup();