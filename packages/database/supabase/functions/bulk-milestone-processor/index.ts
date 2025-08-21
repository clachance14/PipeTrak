import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'
import { validateRequest } from '../_shared/validation.ts'
import { BulkMilestoneProcessorSchema } from './schemas.ts'

const BATCH_SIZE = 50
const MAX_CONCURRENT_BATCHES = 5

interface ProcessingResult {
  transactionId: string
  successful: number
  failed: number
  results: Array<{
    componentId: string
    milestoneName: string
    success: boolean
    error?: string
    milestone?: any
  }>
  processingTime: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting bulk milestone processing...')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Validate and parse request
    const { data: requestData, error: validationError, userId } = await validateRequest(
      req, 
      supabase, 
      BulkMilestoneProcessorSchema
    )
    
    if (validationError) {
      return new Response(
        JSON.stringify({ 
          error: 'VALIDATION_ERROR', 
          message: validationError 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { updates, options = {}, metadata } = requestData
    const startTime = Date.now()
    
    // Generate or use provided transaction ID
    const transactionId = metadata?.transactionId || `bulk_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
    
    console.log(`Processing ${updates.length} milestone updates for transaction ${transactionId}`)
    
    // Create bulk operation transaction record
    const { error: transactionError } = await supabase
      .from('BulkOperationTransaction')
      .insert({
        id: transactionId,
        projectId: requestData.projectId || 'unknown',
        userId,
        transactionType: 'bulk_milestone_update',
        operationCount: updates.length,
        status: 'in_progress',
        metadata: {
          batchSize: options.batchSize || BATCH_SIZE,
          atomic: options.atomic || false,
          notify: options.notify || true,
          ...metadata
        }
      })
    
    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError)
    }

    // Process updates using RPC function for optimal performance
    const { data: rpcResults, error: rpcError } = await supabase
      .rpc('batch_update_milestones', {
        updates: JSON.stringify(updates),
        user_id: userId,
        transaction_id: transactionId
      })
    
    if (rpcError) {
      console.error('RPC batch update failed:', rpcError)
      
      // Update transaction status
      await supabase
        .from('BulkOperationTransaction')
        .update({
          status: 'failed',
          completedAt: new Date().toISOString(),
          errors: [rpcError.message]
        })
        .eq('id', transactionId)
      
      return new Response(
        JSON.stringify({
          error: 'RPC_ERROR',
          message: 'Batch update failed',
          details: rpcError.message,
          transactionId
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Process RPC results
    const results = rpcResults.map((result: any) => ({
      componentId: result.component_id,
      milestoneName: result.milestone_name,
      success: result.success,
      error: result.error_message,
      milestone: result.success ? result.updated_milestone : undefined
    }))

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const processingTime = Date.now() - startTime

    // Update transaction record with results
    await supabase
      .from('BulkOperationTransaction')
      .update({
        status: failed > 0 ? 'completed' : 'completed',
        successCount: successful,
        failureCount: failed,
        completedAt: new Date().toISOString(),
        metadata: {
          ...(metadata || {}),
          processingTime,
          batchCount: Math.ceil(updates.length / (options.batchSize || BATCH_SIZE))
        },
        errors: results.filter(r => !r.success).map(r => r.error)
      })
      .eq('id', transactionId)

    // Collect affected components for completion recalculation
    const affectedComponents = [...new Set(results.filter(r => r.success).map(r => r.componentId))]
    
    if (affectedComponents.length > 0) {
      // Trigger completion recalculation
      const { error: updateError } = await supabase
        .rpc('update_components_completion', {
          component_ids: affectedComponents
        })
      
      if (updateError) {
        console.error('Failed to update component completion:', updateError)
      }
    }

    // Send real-time notifications if enabled
    if (options.notify && successful > 0) {
      // Get affected project IDs
      const { data: components } = await supabase
        .from('Component')
        .select('projectId')
        .in('id', affectedComponents)
      
      const projectIds = [...new Set(components?.map(c => c.projectId) || [])]
      
      for (const projectId of projectIds) {
        await supabase.channel(`project:${projectId}`)
          .send({
            type: 'broadcast',
            event: 'bulk_milestone_update',
            payload: {
              transactionId,
              updated: successful,
              userId,
              timestamp: new Date().toISOString(),
              processingTime
            }
          })
      }
    }

    // Refresh project summary if many components were affected
    if (affectedComponents.length > 10) {
      const projectIds = [...new Set(results.map(r => r.componentId))]
      for (const projectId of projectIds.slice(0, 5)) { // Limit to 5 projects
        await supabase.rpc('refresh_project_summary', { project_id_param: projectId })
      }
    }

    const response: ProcessingResult = {
      transactionId,
      successful,
      failed,
      results,
      processingTime
    }

    console.log(`Bulk processing completed: ${successful} successful, ${failed} failed, ${processingTime}ms`)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Bulk milestone processor error:', error)
    
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Bulk processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})