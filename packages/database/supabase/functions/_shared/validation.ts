import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Schema definitions for bulk report generation
export const BulkReportGenerationSchema = z.object({
  projectId: z.string(),
  reportTypes: z.array(z.enum([
    'progress_summary', 'component_details', 'test_readiness', 
    'trend_analysis', 'audit_trail'
  ])),
  outputFormat: z.enum(['json', 'excel', 'pdf']).default('excel'),
  deliveryMethod: z.enum(['download', 'email']).default('download'),
  options: z.object({
    combineReports: z.boolean().default(true),
    includeCharts: z.boolean().default(true),
    emailRecipients: z.array(z.string().email()).optional(),
    filters: z.record(z.any()).optional(),
  }).optional().default({}),
});

export async function validateRequest<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: boolean; data?: T; error?: any; userId?: string }> {
  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return {
        success: false,
        error: 'Authorization header missing'
      }
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = schema.safeParse(body)
    
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors
      }
    }

    // For Edge Functions, we'll extract userId from JWT or headers
    // This is a simplified approach - in production you'd properly decode the JWT
    const token = authHeader.replace('Bearer ', '')
    
    return {
      success: true,
      data: validationResult.data,
      userId: 'system' // Placeholder for system operations
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function verifyOrganizationAccess(
  supabase: any,
  userId: string,
  organizationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('Member')
    .select('id')
    .eq('userId', userId)
    .eq('organizationId', organizationId)
    .single()
  
  return !error && data !== null
}