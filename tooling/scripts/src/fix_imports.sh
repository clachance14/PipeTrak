#!/bin/bash
for file in cleanup-duplicate-components.ts add-unique-constraint.ts fix-component-completion-percentages.ts; do
    if [ -f "$file" ]; then
        sed -i 's/import { PrismaClient } from "@repo\/database";/import { db as prisma } from "@repo\/database";/' "$file"
        sed -i '/^const prisma = new PrismaClient();/d' "$file"
        echo "Fixed $file"
    fi
done
