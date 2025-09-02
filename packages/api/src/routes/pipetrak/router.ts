import { Hono } from "hono";
import { projectsRouter } from "./projects";
import { drawingsRouter } from "./drawings";
import { componentsRouter } from "./components";
import { milestonesRouter } from "./milestones";
import { milestoneTemplatesRouter } from "./milestone-templates";
import { importJobsRouter } from "./import-jobs";
import { exportsRouter } from "./exports";
import { reportsRouter } from "./reports";
import { auditLogsRouter } from "./audit-logs";
import { realtimeRouter } from "./realtime";
import { weldersRouter } from "./welders";
import { fieldWeldsRouter } from "./field-welds";

export const pipetrakRouter = new Hono()
	.route("/projects", projectsRouter)
	.route("/drawings", drawingsRouter)
	.route("/components", componentsRouter)
	.route("/milestones", milestonesRouter)
	.route("/milestone-templates", milestoneTemplatesRouter)
	.route("/import", importJobsRouter)
	.route("/export", exportsRouter)
	.route("/reports", reportsRouter)
	.route("/audit-logs", auditLogsRouter)
	.route("/realtime", realtimeRouter)
	.route("/welders", weldersRouter)
	.route("/field-welds", fieldWeldsRouter);
