import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

export const RealtimeSyncSchema = z.object({
  projectId: z.string(),
  clientState: z.array(z.object({
    componentId: z.string(),
    milestoneName: z.string(),
    isCompleted: z.boolean().optional(),
    percentageComplete: z.number().min(0).max(100).optional(),
    quantityComplete: z.number().min(0).optional(),
    timestamp: z.string(), // Client timestamp for conflict resolution
  })),
  lastSyncTimestamp: z.string().optional(),
  conflictResolution: z.enum(['latest_wins', 'server_wins', 'manual']).optional().default('latest_wins'),
})

export type RealtimeSyncRequest = z.infer<typeof RealtimeSyncSchema>