import { Hono } from "hono";
import { projectsRouter } from "./projects";
import { drawingsRouter } from "./drawings";
import { componentsRouter } from "./components";
import { milestonesRouter } from "./milestones";
import { milestoneTemplatesRouter } from "./milestone-templates";
import { importJobsRouter } from "./import-jobs";
import { auditLogsRouter } from "./audit-logs";

export const pipetrakRouter = new Hono()
  .route("/projects", projectsRouter)
  .route("/drawings", drawingsRouter)
  .route("/components", componentsRouter)
  .route("/milestones", milestonesRouter)
  .route("/milestone-templates", milestoneTemplatesRouter)
  .route("/import-jobs", importJobsRouter)
  .route("/audit-logs", auditLogsRouter);