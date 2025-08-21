-- Check what milestones exist and their completion status
SELECT 
    c.area,
    cm."milestoneName",
    COUNT(*) as total_count,
    COUNT(CASE WHEN cm."isCompleted" = true THEN 1 END) as completed_count,
    ROUND(100.0 * COUNT(CASE WHEN cm."isCompleted" = true THEN 1 END) / COUNT(*), 2) as completion_percent,
    AVG(cm."percentageValue") as avg_percentage_value
FROM "Component" c
JOIN "ComponentMilestone" cm ON c.id = cm."componentId"
WHERE c."projectId" = 'clzqkwy020002ulsxy4f3k5i8'
AND c.area IS NOT NULL
GROUP BY c.area, cm."milestoneName"
ORDER BY c.area, cm."milestoneName";

-- Check if we have the expected milestone names
SELECT DISTINCT "milestoneName" 
FROM "ComponentMilestone" cm
JOIN "Component" c ON c.id = cm."componentId"
WHERE c."projectId" = 'clzqkwy020002ulsxy4f3k5i8'
ORDER BY "milestoneName";