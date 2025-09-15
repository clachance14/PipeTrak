import { Hono } from "hono";
import { auditLogsRouter } from "./audit-logs";
import { componentsRouter } from "./components";
import { drawingsRouter } from "./drawings";
import { exportsRouter } from "./exports";
import { fieldWeldsRouter } from "./field-welds";
import { importJobsRouter } from "./import-jobs";
import { milestoneTemplatesRouter } from "./milestone-templates";
import { milestonesRouter } from "./milestones";
import { projectsRouter } from "./projects";
import { qcMetricsRouter } from "./qc-metrics";
import { realtimeRouter } from "./realtime";
import { reportsRouter } from "./reports";
import { weldersRouter } from "./welders";

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
	.route("/field-welds", fieldWeldsRouter)
	.route("/qc-metrics", qcMetricsRouter);
