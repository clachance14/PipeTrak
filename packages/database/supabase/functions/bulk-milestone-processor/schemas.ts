import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

export const BulkMilestoneProcessorSchema = z.object({
  updates: z.array(z.object({
    componentId: z.string(),
    milestoneName: z.string(),
    isCompleted: z.boolean().optional(),
    percentageValue: z.number().min(0).max(100).optional(),
    quantityValue: z.number().min(0).optional(),
  })),
  options: z.object({
    validateOnly: z.boolean().optional().default(false),
    atomic: z.boolean().optional().default(true),
    notify: z.boolean().optional().default(true),
    batchSize: z.number().min(1).max(500).optional().default(50),
  }).optional().default({}),
  metadata: z.object({
    transactionId: z.string().optional(),
    reason: z.string().optional(),
    timestamp: z.string().optional(),
    projectId: z.string().optional(),
  }).optional(),
})

export type BulkMilestoneProcessorRequest = z.infer<typeof BulkMilestoneProcessorSchema>