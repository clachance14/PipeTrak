import { db as prisma } from "@repo/database";
import { getSession } from "@saas/auth/lib/server";
import { NextResponse } from "next/server";
import { CSVProcessor, ExcelProcessor, ColumnMapper, } from "@repo/api/src/lib/file-processing";
export async function POST(request) {
    try {
        // Check authentication
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        // Parse form data
        const formData = await request.formData();
        const file = formData.get("file");
        const projectId = formData.get("projectId");
        if (!file || !projectId) {
            return NextResponse.json({ error: "File and projectId are required" }, { status: 400 });
        }
        // Verify user has access to project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                organization: {
                    members: {
                        some: { userId },
                    },
                },
            },
        });
        if (!project) {
            return NextResponse.json({ error: "Project not found or access denied" }, { status: 403 });
        }
        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: "File size exceeds 50MB limit" }, { status: 400 });
        }
        // Validate file type
        const allowedTypes = [
            "text/csv",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: "Invalid file type. Only CSV and Excel files are allowed.",
            }, { status: 400 });
        }
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Parse file to get headers and metadata
        let parseResult;
        if (file.type === "text/csv") {
            const processor = new CSVProcessor();
            parseResult = await processor.parseCSV(buffer);
        }
        else {
            const processor = new ExcelProcessor();
            parseResult = await processor.parseExcel(buffer);
        }
        // Auto-map columns
        const mapper = new ColumnMapper();
        const suggestedMappings = mapper.autoMapColumns(parseResult.headers);
        // Store file temporarily (in production, use cloud storage)
        // For now, we'll encode as base64 and store in memory/database temporarily
        const fileData = {
            buffer: buffer.toString("base64"),
            mimetype: file.type,
            originalName: file.name,
            size: file.size,
            uploadedAt: new Date(),
            userId,
            projectId,
        };
        return NextResponse.json({
            uploadId: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileData, // In production, store this in Redis/temporary storage
            metadata: parseResult.metadata,
            headers: parseResult.headers,
            suggestedMappings,
            preview: parseResult.rows.slice(0, 5), // First 5 rows for preview
        });
    }
    catch (error) {
        console.error("File upload error:", error);
        return NextResponse.json({
            error: `Failed to process file: ${error.message}`,
        }, { status: 500 });
    }
}
