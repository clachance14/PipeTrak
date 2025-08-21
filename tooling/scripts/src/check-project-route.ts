import { db } from '@repo/database';

async function checkProjectRoute() {
  const idToCheck = 'uy354nt3i2qi8tsh4a8kz2tp';
  
  try {
    // Check if this is a project ID
    const project = await db.project.findUnique({
      where: { id: idToCheck }
    });
    
    if (project) {
      console.log('✓ Found project:', project.name);
      console.log('  Project ID:', project.id);
      console.log('  Organization ID:', project.organizationId);
      console.log('\n✅ Correct URL: http://localhost:3003/app/pipetrak/' + project.id + '/dashboard');
    } else {
      console.log('✗ No project found with ID:', idToCheck);
      
      // Check if it's an organization slug
      const org = await db.organization.findFirst({
        where: { 
          OR: [
            { id: idToCheck },
            { slug: idToCheck }
          ]
        }
      });
      
      if (org) {
        console.log('\n⚠️  This is an organization, not a project!');
        console.log('  Organization:', org.name);
        console.log('  Organization ID:', org.id);
        console.log('  Organization slug:', org.slug);
        
        // Get projects for this organization
        const projects = await db.project.findMany({
          where: { organizationId: org.id }
        });
        
        if (projects.length > 0) {
          console.log('\n📁 Projects in this organization:');
          projects.forEach(p => {
            console.log(`  - ${p.name} (ID: ${p.id})`);
            console.log(`    URL: http://localhost:3003/app/pipetrak/${p.id}/dashboard`);
          });
        } else {
          console.log('\n⚠️  No projects found in this organization');
          console.log('\nCreating a sample project...');
          
          const newProject = await db.project.create({
            data: {
              name: 'SDO Tank Farm Demo',
              description: 'Demo project for PipeTrak',
              organizationId: org.id,
              status: 'Active'
            }
          });
          
          console.log('✓ Created project:', newProject.name);
          console.log('  Project ID:', newProject.id);
          console.log('\n✅ Access dashboard at: http://localhost:3003/app/pipetrak/' + newProject.id + '/dashboard');
        }
      } else {
        console.log('✗ ID not found as project or organization');
        
        // List all projects
        const allProjects = await db.project.findMany({
          select: {
            id: true,
            name: true,
            organizationId: true
          }
        });
        
        if (allProjects.length > 0) {
          console.log('\n📁 Available projects:');
          allProjects.forEach(p => {
            console.log(`  - ${p.name}`);
            console.log(`    ID: ${p.id}`);
            console.log(`    URL: http://localhost:3003/app/pipetrak/${p.id}/dashboard`);
          });
        } else {
          console.log('\n⚠️  No projects exist in the database');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkProjectRoute();