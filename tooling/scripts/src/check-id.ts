import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkProject() {
  const idToCheck = 'uy354nt3i2qi8tsh4a8kz2tp';
  
  // Check if this is a project ID
  const { data: project, error: projectError } = await supabase
    .from('Project')
    .select('*')
    .eq('id', idToCheck)
    .single();
    
  if (project) {
    console.log('Found project:', project);
  } else {
    console.log('No project found with this ID');
    
    // Check if it's an organization ID
    const { data: org, error: orgError } = await supabase
      .from('organization')
      .select('*')
      .eq('id', idToCheck)
      .single();
      
    if (org) {
      console.log('This is an organization ID:', org);
      
      // Get projects for this organization
      const { data: projects } = await supabase
        .from('Project')
        .select('*')
        .eq('organizationId', idToCheck);
        
      console.log('Projects in this organization:', projects);
      
      if (projects && projects.length > 0) {
        console.log('\nFirst project ID:', projects[0].id);
        console.log('Access dashboard at: http://localhost:3003/app/pipetrak/' + projects[0].id + '/dashboard');
      } else {
        // Create a sample project
        console.log('\nNo projects found, creating a sample project...');
        const { data: newProject, error: createError } = await supabase
          .from('Project')
          .insert({
            name: 'SDO Tank Farm',
            description: 'Sample project for testing',
            organizationId: idToCheck,
            status: 'Active'
          })
          .select()
          .single();
          
        if (newProject) {
          console.log('Created project:', newProject);
          console.log('Access dashboard at: http://localhost:3003/app/pipetrak/' + newProject.id + '/dashboard');
        } else {
          console.log('Error creating project:', createError);
        }
      }
    } else {
      console.log('ID not found as project or organization');
    }
  }
  
  process.exit(0);
}

checkProject();