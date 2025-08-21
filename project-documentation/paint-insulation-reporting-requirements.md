# Paint & Insulation Reporting Requirements Specification

## Overview

This document defines comprehensive reporting requirements for the Paint and Insulation tracking system in PipeTrak. The reporting system provides multi-scope progress visibility, subcontractor performance metrics, and turnover readiness analysis essential for project management and client communication.

**Key Objectives:**
- **Multi-Scope Visibility**: Clear reporting across Piping, Paint, and Insulation scopes
- **Executive Dashboards**: High-level progress summaries for project stakeholders
- **Operational Reports**: Detailed reports for field crews and subcontractor management
- **Client Communications**: Professional reports suitable for client presentations
- **Performance Analytics**: Data-driven insights for process improvement

## Report Categories

### 1. Executive Summary Reports

**High-level reports for project executives and clients:**

```typescript
interface ExecutiveSummaryReport {
  // Report metadata
  reportInfo: {
    projectName: string;
    jobNumber: string;
    reportDate: Date;
    reportPeriod: DateRange;
    generatedBy: string;
    reportVersion: string;
  };

  // Executive KPIs
  keyMetrics: {
    overallCompletion: {
      percentage: number;
      trend: 'up' | 'down' | 'stable';
      changeFromLastWeek: number;
    };
    
    scopeBreakdown: {
      piping: ScopeMetrics;
      paint: ScopeMetrics;
      insulation: ScopeMetrics;
    };
    
    turnoverReadiness: {
      componentsReady: number;
      totalComponents: number;
      percentage: number;
      projectedTurnoverDate: Date;
    };
  };

  // Progress visualization data
  progressCharts: {
    weeklyTrend: TimeSeriesData[];
    scopeComparison: ScopeComparisonData;
    milestoneProgress: MilestoneProgressData;
  };

  // Critical insights
  executiveInsights: {
    achievements: string[];
    concerns: string[];
    recommendations: string[];
    nextMilestones: MilestoneInfo[];
  };

  // Subcontractor status summary
  subcontractorSummary: {
    paintContractor: ContractorSummary;
    insulationContractor: ContractorSummary;
  };
}

interface ScopeMetrics {
  totalComponents: number;
  completedComponents: number;
  completionPercentage: number;
  componentsInProgress: number;
  componentsNotStarted: number;
  averageTimePerComponent: number; // hours
  estimatedCompletion: Date;
}

interface ContractorSummary {
  company: string;
  contactPerson: string;
  assignedComponents: number;
  completedComponents: number;
  completionRate: number;
  onSchedule: boolean;
  performanceRating: 'excellent' | 'good' | 'needs_improvement' | 'concerning';
  nextMilestones: string[];
}
```

### 2. Operational Progress Reports

**Detailed reports for day-to-day project management:**

```typescript
interface OperationalProgressReport {
  // Detailed scope progress
  scopeDetails: {
    piping: {
      milestoneBreakdown: MilestoneBreakdown[];
      areaProgress: AreaProgressData[];
      systemProgress: SystemProgressData[];
      criticalPath: ComponentInfo[];
    };
    
    paint: {
      specificationBreakdown: SpecificationBreakdown[];
      subcontractorProgress: SubcontractorProgressData[];
      qualityMetrics: QualityMetrics;
      pendingHandoffs: ComponentHandoff[];
    };
    
    insulation: {
      specificationBreakdown: SpecificationBreakdown[];
      subcontractorProgress: SubcontractorProgressData[];
      qualityMetrics: QualityMetrics;
      pendingHandoffs: ComponentHandoff[];
    };
  };

  // Work queue analysis
  workQueues: {
    paint: {
      readyForWork: ComponentInfo[];
      inProgress: ComponentInfo[];
      pendingMaterials: ComponentInfo[];
      qualityHolds: ComponentInfo[];
    };
    
    insulation: {
      readyForWork: ComponentInfo[];
      inProgress: ComponentInfo[];
      pendingMaterials: ComponentInfo[];
      qualityHolds: ComponentInfo[];
    };
  };

  // Performance metrics
  performance: {
    dailyProductivity: DailyProductivity[];
    weeklyTrends: WeeklyTrend[];
    efficiencyMetrics: EfficiencyMetrics;
    bottleneckAnalysis: BottleneckAnalysis;
  };

  // Issue tracking
  issues: {
    activeIssues: IssueInfo[];
    resolvedIssues: IssueInfo[];
    riskAssessment: RiskAssessment[];
    mitigationPlan: MitigationPlan[];
  };
}

interface MilestoneBreakdown {
  milestoneName: string;
  totalComponents: number;
  completedComponents: number;
  percentage: number;
  averageCompletionTime: number;
  bottlenecks: string[];
}

interface SpecificationBreakdown {
  specification: string;
  description: string;
  totalComponents: number;
  completedComponents: number;
  percentage: number;
  assignedSubcontractor: string;
  averageTimePerComponent: number;
}
```

### 3. Subcontractor Performance Reports

**Detailed performance analysis for subcontractor management:**

```typescript
interface SubcontractorPerformanceReport {
  // Contractor information
  contractorInfo: {
    companyName: string;
    contactPerson: string;
    scope: 'paint' | 'insulation';
    contractPeriod: DateRange;
    activeProjects: ProjectSummary[];
  };

  // Performance metrics
  performanceMetrics: {
    overall: {
      completionRate: number;
      onTimeDeliveryRate: number;
      qualityScore: number;
      safetyRecord: SafetyRecord;
      overallRating: PerformanceRating;
    };
    
    productivity: {
      componentsPerDay: number;
      averageTimePerComponent: number;
      utilizationRate: number;
      efficiencyTrend: TrendData[];
    };
    
    quality: {
      firstTimeRightRate: number;
      reworkRate: number;
      defectRate: number;
      customerSatisfaction: number;
      qualityTrend: TrendData[];
    };
    
    schedule: {
      onTimeCompletion: number;
      averageDelayDays: number;
      scheduleAdherence: number;
      scheduleReliability: TrendData[];
    };
  };

  // Comparative analysis
  benchmarking: {
    industryBenchmarks: BenchmarkData;
    projectComparison: ProjectComparisonData;
    bestPractices: BestPracticeData;
  };

  // Detailed work analysis
  workAnalysis: {
    bySpecification: SpecificationAnalysis[];
    byProject: ProjectAnalysis[];
    byTimeperiod: TimeperiodAnalysis[];
    crewPerformance: CrewPerformanceData[];
  };

  // Recommendations
  recommendations: {
    performanceImprovements: Recommendation[];
    trainingOpportunities: Recommendation[];
    processOptimizations: Recommendation[];
    contractAdjustments: Recommendation[];
  };
}

interface PerformanceRating {
  overall: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  productivity: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  quality: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  schedule: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
  communication: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'unsatisfactory';
}
```

### 4. Turnover Readiness Reports

**Specialized reports for project turnover management:**

```typescript
interface TurnoverReadinessReport {
  // Turnover status overview
  turnoverStatus: {
    overallReadiness: {
      percentage: number;
      componentsReady: number;
      totalComponents: number;
      projectedReadyDate: Date;
    };
    
    scopeReadiness: {
      piping: ScopeReadiness;
      paint: ScopeReadiness;
      insulation: ScopeReadiness;
    };
    
    systemReadiness: SystemReadiness[];
    areaReadiness: AreaReadiness[];
  };

  // Components pending completion
  pendingCompletion: {
    critical: ComponentPendingInfo[];
    high: ComponentPendingInfo[];
    medium: ComponentPendingInfo[];
    low: ComponentPendingInfo[];
  };

  // Turnover packages
  turnoverPackages: {
    ready: TurnoverPackage[];
    nearReady: TurnoverPackage[];
    inProgress: TurnoverPackage[];
    notStarted: TurnoverPackage[];
  };

  // Quality compliance
  qualityCompliance: {
    testPackages: TestPackageStatus[];
    inspectionStatus: InspectionStatus[];
    documentationStatus: DocumentationStatus[];
    punchListStatus: PunchListStatus[];
  };

  // Handoff coordination
  handoffCoordination: {
    upcomingHandoffs: HandoffSchedule[];
    pendingHandoffs: PendingHandoff[];
    completedHandoffs: CompletedHandoff[];
    handoffIssues: HandoffIssue[];
  };
}

interface ScopeReadiness {
  scope: 'piping' | 'paint' | 'insulation';
  readyComponents: number;
  totalComponents: number;
  percentage: number;
  blockingIssues: BlockingIssue[];
  estimatedCompletion: Date;
}

interface TurnoverPackage {
  packageId: string;
  name: string;
  components: ComponentSummary[];
  overallProgress: number;
  scopeProgress: {
    piping: number;
    paint: number;
    insulation: number;
  };
  readyForTurnover: boolean;
  turnoverId?: string;
  turnoverDate?: Date;
}
```

## Report Generation and Automation

### 1. Automated Report Scheduling

**Scheduled report generation and distribution:**

```typescript
export class ReportScheduler {
  
  // Schedule definitions
  private static schedules: ReportSchedule[] = [
    {
      reportType: 'executive-summary',
      frequency: 'weekly',
      dayOfWeek: 'monday',
      time: '08:00',
      recipients: ['project-managers', 'executives'],
      format: 'pdf',
      includeCharts: true
    },
    {
      reportType: 'operational-progress',
      frequency: 'daily',
      time: '06:00',
      recipients: ['foremen', 'superintendents'],
      format: 'excel',
      includeRawData: true
    },
    {
      reportType: 'subcontractor-performance',
      frequency: 'weekly',
      dayOfWeek: 'friday',
      time: '16:00',
      recipients: ['subcontractor-managers'],
      format: 'pdf',
      scopeFiltered: true
    },
    {
      reportType: 'turnover-readiness',
      frequency: 'bi-weekly',
      dayOfWeek: 'wednesday',
      time: '10:00',
      recipients: ['project-managers', 'clients'],
      format: 'pdf',
      executiveSummary: true
    }
  ];

  static async generateScheduledReports(): Promise<void> {
    const currentTime = new Date();
    
    for (const schedule of this.schedules) {
      if (this.shouldGenerateReport(schedule, currentTime)) {
        await this.generateAndDistribute(schedule);
      }
    }
  }

  private static async generateAndDistribute(
    schedule: ReportSchedule
  ): Promise<void> {
    
    // Get all active projects for this report type
    const projects = await this.getActiveProjects(schedule.reportType);
    
    for (const project of projects) {
      try {
        // Generate report
        const report = await this.generateReport(
          schedule.reportType,
          project.id,
          schedule.format
        );

        // Filter recipients based on project and scope
        const recipients = await this.getRecipientsForProject(
          project.id,
          schedule.recipients,
          schedule.scopeFiltered
        );

        // Distribute report
        await this.distributeReport(report, recipients, schedule);

        // Log successful generation
        await this.logReportGeneration(project.id, schedule, 'success');

      } catch (error) {
        // Log error and continue with next project
        await this.logReportGeneration(project.id, schedule, 'error', error.message);
      }
    }
  }

  static async generateReport(
    reportType: string,
    projectId: string,
    format: 'pdf' | 'excel' | 'json'
  ): Promise<GeneratedReport> {
    
    const generator = this.getReportGenerator(reportType);
    const data = await generator.gatherData(projectId);
    const formatted = await generator.formatReport(data, format);
    
    return {
      projectId,
      reportType,
      format,
      data: formatted,
      generatedAt: new Date(),
      size: formatted.length
    };
  }
}

interface ReportSchedule {
  reportType: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  dayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  time: string; // HH:MM format
  recipients: string[];
  format: 'pdf' | 'excel' | 'json';
  includeCharts?: boolean;
  includeRawData?: boolean;
  scopeFiltered?: boolean;
  executiveSummary?: boolean;
}
```

### 2. On-Demand Report Generation

**Interactive report generation with customization options:**

```typescript
export class OnDemandReportGenerator {
  
  static async generateCustomReport(
    reportConfig: CustomReportConfig
  ): Promise<GeneratedReport> {
    
    // Validate configuration
    const validationResult = await this.validateConfig(reportConfig);
    if (!validationResult.valid) {
      throw new Error(`Invalid report configuration: ${validationResult.errors.join(', ')}`);
    }

    // Gather data based on configuration
    const dataGatherer = this.createDataGatherer(reportConfig);
    const rawData = await dataGatherer.gatherData();

    // Apply filters and transformations
    const processedData = await this.processData(rawData, reportConfig);

    // Format according to requested output format
    const formatter = this.getFormatter(reportConfig.format);
    const formattedReport = await formatter.format(processedData, reportConfig);

    // Generate visualizations if requested
    if (reportConfig.includeCharts) {
      const charts = await this.generateCharts(processedData, reportConfig);
      formattedReport.charts = charts;
    }

    return {
      reportId: this.generateReportId(),
      config: reportConfig,
      data: formattedReport,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      downloadUrl: await this.storeReport(formattedReport)
    };
  }

  static async generateComparativeReport(
    projects: string[],
    dateRanges: DateRange[],
    metrics: string[]
  ): Promise<ComparativeReport> {
    
    const reportData = [];
    
    for (const projectId of projects) {
      for (const dateRange of dateRanges) {
        const projectData = await this.gatherProjectData(
          projectId,
          dateRange,
          metrics
        );
        
        reportData.push({
          projectId,
          dateRange,
          metrics: projectData
        });
      }
    }

    return {
      type: 'comparative',
      projects,
      dateRanges,
      metrics,
      data: reportData,
      analysis: await this.generateComparativeAnalysis(reportData),
      generatedAt: new Date()
    };
  }
}

interface CustomReportConfig {
  // Report scope
  projectIds: string[];
  dateRange?: DateRange;
  scopes: ('piping' | 'paint' | 'insulation')[];
  
  // Filters
  areas?: string[];
  systems?: string[];
  componentTypes?: string[];
  subcontractors?: string[];
  
  // Content options
  includeCharts: boolean;
  includeRawData: boolean;
  includeAnalysis: boolean;
  includePredictions: boolean;
  
  // Format options
  format: 'pdf' | 'excel' | 'powerpoint' | 'json';
  template?: string;
  branding?: BrandingOptions;
  
  // Delivery options
  recipients?: string[];
  deliveryMethod: 'download' | 'email' | 'api';
  
  // Customization
  title?: string;
  subtitle?: string;
  executiveSummary?: boolean;
  customSections?: CustomSection[];
}
```

## Report Templates and Formatting

### 1. PDF Report Templates

**Professional PDF templates for client-facing reports:**

```typescript
export class PDFReportTemplate {
  
  static async generateExecutiveSummaryPDF(
    data: ExecutiveSummaryReport,
    options: PDFGenerationOptions
  ): Promise<Buffer> {
    
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Header with project branding
    await this.addHeader(doc, {
      projectName: data.reportInfo.projectName,
      jobNumber: data.reportInfo.jobNumber,
      reportDate: data.reportInfo.reportDate,
      logo: options.logo
    });

    // Executive summary section
    this.addSection(doc, 'Executive Summary', {
      fontSize: 16,
      marginTop: 20
    });

    // KPI dashboard
    await this.addKPIDashboard(doc, data.keyMetrics);

    // Progress charts
    if (options.includeCharts) {
      await this.addProgressCharts(doc, data.progressCharts);
    }

    // Scope breakdown table
    await this.addScopeBreakdownTable(doc, data.keyMetrics.scopeBreakdown);

    // Subcontractor status
    await this.addSubcontractorStatus(doc, data.subcontractorSummary);

    // Insights and recommendations
    this.addInsightsSection(doc, data.executiveInsights);

    // Footer with generation info
    this.addFooter(doc, {
      generatedBy: data.reportInfo.generatedBy,
      generatedAt: new Date(),
      pageNumbers: true
    });

    return doc;
  }

  private static async addKPIDashboard(
    doc: PDFDocument,
    metrics: any
  ): Promise<void> {
    
    // Create visual KPI cards
    const kpiCards = [
      {
        title: 'Overall Completion',
        value: `${metrics.overallCompletion.percentage}%`,
        trend: metrics.overallCompletion.trend,
        change: `${metrics.overallCompletion.changeFromLastWeek > 0 ? '+' : ''}${metrics.overallCompletion.changeFromLastWeek}%`
      },
      {
        title: 'Turnover Ready',
        value: `${metrics.turnoverReadiness.percentage}%`,
        subtitle: `${metrics.turnoverReadiness.componentsReady} of ${metrics.turnoverReadiness.totalComponents} components`
      }
    ];

    // Render KPI cards in a grid layout
    const cardWidth = 150;
    const cardHeight = 80;
    const spacing = 20;
    let x = 50;
    const y = doc.y + 20;

    for (const card of kpiCards) {
      // Draw card background
      doc.roundedRect(x, y, cardWidth, cardHeight, 5)
         .stroke('#E0E0E0')
         .fill('#F8F9FA');

      // Add card content
      doc.fillColor('#333333')
         .fontSize(10)
         .text(card.title, x + 10, y + 10, { width: cardWidth - 20 });

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(card.value, x + 10, y + 25);

      if (card.change) {
        const changeColor = card.trend === 'up' ? '#22C55E' : card.trend === 'down' ? '#EF4444' : '#6B7280';
        doc.fillColor(changeColor)
           .fontSize(8)
           .text(card.change, x + 10, y + 50);
      }

      if (card.subtitle) {
        doc.fillColor('#6B7280')
           .fontSize(8)
           .text(card.subtitle, x + 10, y + 60, { width: cardWidth - 20 });
      }

      x += cardWidth + spacing;
    }

    doc.y = y + cardHeight + 30;
  }

  private static async addProgressCharts(
    doc: PDFDocument,
    charts: any
  ): Promise<void> {
    
    // Generate chart images using Chart.js or similar
    const weeklyTrendChart = await this.generateWeeklyTrendChart(charts.weeklyTrend);
    const scopeComparisonChart = await this.generateScopeComparisonChart(charts.scopeComparison);

    // Add charts to PDF
    if (weeklyTrendChart) {
      doc.image(weeklyTrendChart, 50, doc.y, { width: 250 });
      doc.x = 320;
      doc.y -= 150; // Move back up to align second chart
    }

    if (scopeComparisonChart) {
      doc.image(scopeComparisonChart, 320, doc.y, { width: 250 });
    }

    doc.y += 170; // Move past charts
  }
}
```

### 2. Excel Report Templates

**Data-rich Excel templates for operational analysis:**

```typescript
export class ExcelReportTemplate {
  
  static async generateOperationalProgressExcel(
    data: OperationalProgressReport,
    options: ExcelGenerationOptions
  ): Promise<ExcelJS.Workbook> {
    
    const workbook = new ExcelJS.Workbook();
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    await this.createSummarySheet(summarySheet, data);

    // Scope detail sheets
    if (data.scopeDetails.piping) {
      const pipingSheet = workbook.addWorksheet('Piping Progress');
      await this.createPipingProgressSheet(pipingSheet, data.scopeDetails.piping);
    }

    if (data.scopeDetails.paint) {
      const paintSheet = workbook.addWorksheet('Paint Progress');
      await this.createPaintProgressSheet(paintSheet, data.scopeDetails.paint);
    }

    if (data.scopeDetails.insulation) {
      const insulationSheet = workbook.addWorksheet('Insulation Progress');
      await this.createInsulationProgressSheet(insulationSheet, data.scopeDetails.insulation);
    }

    // Work queue sheets
    const workQueueSheet = workbook.addWorksheet('Work Queues');
    await this.createWorkQueueSheet(workQueueSheet, data.workQueues);

    // Performance analysis sheet
    const performanceSheet = workbook.addWorksheet('Performance Analysis');
    await this.createPerformanceSheet(performanceSheet, data.performance);

    // Raw data sheet (if requested)
    if (options.includeRawData) {
      const rawDataSheet = workbook.addWorksheet('Raw Data');
      await this.createRawDataSheet(rawDataSheet, data);
    }

    return workbook;
  }

  private static async createSummarySheet(
    sheet: ExcelJS.Worksheet,
    data: OperationalProgressReport
  ): Promise<void> {
    
    // Header styling
    sheet.getCell('A1').value = 'PipeTrak Operational Progress Report';
    sheet.getCell('A1').font = { size: 16, bold: true };
    sheet.mergeCells('A1:H1');

    // Report metadata
    sheet.getCell('A3').value = 'Generated:';
    sheet.getCell('B3').value = new Date();
    sheet.getCell('B3').numFmt = 'mm/dd/yyyy hh:mm AM/PM';

    // Scope summary table
    const scopeSummaryStart = 5;
    const scopeHeaders = ['Scope', 'Total Components', 'Completed', '% Complete', 'In Progress', 'Not Started'];
    
    scopeHeaders.forEach((header, index) => {
      const cell = sheet.getCell(scopeSummaryStart, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };
    });

    // Add scope data
    const scopes = ['Piping', 'Paint', 'Insulation'];
    scopes.forEach((scope, rowIndex) => {
      const row = scopeSummaryStart + 1 + rowIndex;
      const scopeData = this.getScopeData(data, scope.toLowerCase());
      
      sheet.getCell(row, 1).value = scope;
      sheet.getCell(row, 2).value = scopeData.total;
      sheet.getCell(row, 3).value = scopeData.completed;
      sheet.getCell(row, 4).value = scopeData.percentage / 100;
      sheet.getCell(row, 4).numFmt = '0.0%';
      sheet.getCell(row, 5).value = scopeData.inProgress;
      sheet.getCell(row, 6).value = scopeData.notStarted;
    });

    // Auto-fit columns
    sheet.columns.forEach(column => {
      column.width = 15;
    });

    // Add charts (using Excel's built-in charting)
    await this.addExcelChart(sheet, {
      type: 'pie',
      title: 'Completion by Scope',
      dataRange: `A${scopeSummaryStart}:D${scopeSummaryStart + 3}`,
      position: { row: 12, column: 1 }
    });
  }

  private static async createPaintProgressSheet(
    sheet: ExcelJS.Worksheet,
    paintData: any
  ): Promise<void> {
    
    // Paint-specific headers
    const headers = [
      'Component ID',
      'Description',
      'Area',
      'System', 
      'Paint Spec',
      'Subcontractor',
      'Primer Complete',
      'Finish Coat Complete',
      '% Complete',
      'Assigned To',
      'Due Date',
      'Notes'
    ];

    // Add headers with styling
    headers.forEach((header, index) => {
      const cell = sheet.getCell(1, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF8C00' } }; // Orange for paint
    });

    // Add paint progress data
    paintData.components.forEach((component: any, rowIndex: number) => {
      const row = rowIndex + 2;
      
      sheet.getCell(row, 1).value = component.displayId;
      sheet.getCell(row, 2).value = component.description;
      sheet.getCell(row, 3).value = component.area;
      sheet.getCell(row, 4).value = component.system;
      sheet.getCell(row, 5).value = component.paintSpec;
      sheet.getCell(row, 6).value = component.subcontractor;
      sheet.getCell(row, 7).value = component.primerComplete ? 'Yes' : 'No';
      sheet.getCell(row, 8).value = component.finishCoatComplete ? 'Yes' : 'No';
      sheet.getCell(row, 9).value = component.completionPercent / 100;
      sheet.getCell(row, 9).numFmt = '0.0%';
      sheet.getCell(row, 10).value = component.assignedTo;
      sheet.getCell(row, 11).value = component.dueDate;
      sheet.getCell(row, 11).numFmt = 'mm/dd/yyyy';
      sheet.getCell(row, 12).value = component.notes;
    });

    // Apply conditional formatting for completion percentage
    sheet.addConditionalFormatting({
      ref: `I2:I${paintData.components.length + 1}`,
      rules: [
        {
          type: 'colorScale',
          cfvo: [
            { type: 'num', value: 0 },
            { type: 'num', value: 0.5 },
            { type: 'num', value: 1 }
          ],
          color: ['FFE74C3C', 'FFF39C12', 'FF27AE60']
        }
      ]
    });

    // Auto-fit columns
    sheet.columns.forEach(column => {
      column.width = 12;
    });
  }
}
```

### 3. PowerPoint Presentation Templates

**Executive presentation templates for stakeholder meetings:**

```typescript
export class PowerPointReportTemplate {
  
  static async generateExecutivePresentationPPTX(
    data: ExecutiveSummaryReport,
    options: PPTXGenerationOptions
  ): Promise<Buffer> {
    
    const pptx = new PptxGenJS();
    
    // Set presentation properties
    pptx.layout = 'LAYOUT_16x9';
    pptx.theme = options.theme || 'default';

    // Title slide
    const titleSlide = pptx.addSlide();
    await this.createTitleSlide(titleSlide, data.reportInfo);

    // Executive summary slide
    const summarySlide = pptx.addSlide();
    await this.createExecutiveSummarySlide(summarySlide, data.keyMetrics);

    // Scope progress slides
    const scopeSlide = pptx.addSlide();
    await this.createScopeProgressSlide(scopeSlide, data.keyMetrics.scopeBreakdown);

    // Turnover readiness slide
    const turnoverSlide = pptx.addSlide();
    await this.createTurnoverReadinessSlide(turnoverSlide, data.keyMetrics.turnoverReadiness);

    // Subcontractor performance slide
    const contractorSlide = pptx.addSlide();
    await this.createSubcontractorSlide(contractorSlide, data.subcontractorSummary);

    // Insights and recommendations slide
    const insightsSlide = pptx.addSlide();
    await this.createInsightsSlide(insightsSlide, data.executiveInsights);

    // Next steps slide
    const nextStepsSlide = pptx.addSlide();
    await this.createNextStepsSlide(nextStepsSlide, data.executiveInsights.nextMilestones);

    return pptx.stream();
  }

  private static async createExecutiveSummarySlide(
    slide: any,
    metrics: any
  ): Promise<void> {
    
    // Slide title
    slide.addText('Project Progress Summary', {
      x: 0.5,
      y: 0.5,
      w: 8.5,
      h: 0.7,
      fontSize: 24,
      bold: true,
      color: '363636'
    });

    // Overall completion gauge chart
    slide.addChart(pptx.ChartType.doughnut, [
      {
        name: 'Complete',
        labels: ['Complete', 'Remaining'],
        values: [metrics.overallCompletion.percentage, 100 - metrics.overallCompletion.percentage]
      }
    ], {
      x: 1,
      y: 2,
      w: 3,
      h: 3,
      title: 'Overall Completion',
      showLegend: false,
      showValue: true
    });

    // Scope breakdown chart
    slide.addChart(pptx.ChartType.bar, [
      {
        name: 'Progress',
        labels: ['Piping', 'Paint', 'Insulation'],
        values: [
          metrics.scopeBreakdown.piping.completionPercentage,
          metrics.scopeBreakdown.paint.completionPercentage,
          metrics.scopeBreakdown.insulation.completionPercentage
        ]
      }
    ], {
      x: 5,
      y: 2,
      w: 3.5,
      h: 3,
      title: 'Progress by Scope',
      showLegend: false,
      barDir: 'col'
    });

    // Key metrics table
    const metricsData = [
      ['Metric', 'Current', 'Target', 'Status'],
      ['Overall Completion', `${metrics.overallCompletion.percentage}%`, '100%', '🟡'],
      ['Turnover Ready', `${metrics.turnoverReadiness.percentage}%`, '100%', '🟡'],
      ['On Schedule', '85%', '90%', '🔴']
    ];

    slide.addTable(metricsData, {
      x: 1,
      y: 5.5,
      w: 7.5,
      h: 2,
      fontSize: 12,
      color: '363636',
      fill: { color: 'F7F8FC' },
      border: { pt: 1, color: 'DFDFDF' }
    });
  }
}
```

## Report Distribution and Access

### 1. Automated Distribution

**Email distribution with role-based access:**

```typescript
export class ReportDistribution {
  
  static async distributeReport(
    report: GeneratedReport,
    distributionConfig: DistributionConfig
  ): Promise<DistributionResult> {
    
    const distributionResults = [];
    
    for (const recipient of distributionConfig.recipients) {
      try {
        const recipientInfo = await this.getRecipientInfo(recipient);
        
        // Apply scope filtering if needed
        const filteredReport = this.applyRecipientFiltering(report, recipientInfo);
        
        // Send via configured method
        switch (distributionConfig.method) {
          case 'email':
            await this.sendEmailReport(filteredReport, recipientInfo);
            break;
            
          case 'portal':
            await this.uploadToPortal(filteredReport, recipientInfo);
            break;
            
          case 'api':
            await this.sendToAPI(filteredReport, recipientInfo);
            break;
        }
        
        distributionResults.push({
          recipient: recipient,
          status: 'success',
          deliveredAt: new Date()
        });
        
      } catch (error) {
        distributionResults.push({
          recipient: recipient,
          status: 'failed',
          error: error.message,
          attemptedAt: new Date()
        });
      }
    }
    
    return {
      report: report,
      results: distributionResults,
      totalRecipients: distributionConfig.recipients.length,
      successfulDeliveries: distributionResults.filter(r => r.status === 'success').length,
      failedDeliveries: distributionResults.filter(r => r.status === 'failed').length
    };
  }

  private static async sendEmailReport(
    report: GeneratedReport,
    recipient: RecipientInfo
  ): Promise<void> {
    
    await sendMail({
      to: recipient.email,
      template: 'report-delivery',
      context: {
        recipientName: recipient.name,
        reportType: report.reportType,
        projectName: report.projectName,
        reportDate: report.generatedAt,
        downloadUrl: report.downloadUrl,
        reportSummary: this.generateReportSummary(report)
      },
      attachments: report.format === 'pdf' ? [
        {
          filename: `${report.reportType}-${report.projectName}-${format(report.generatedAt, 'yyyy-MM-dd')}.pdf`,
          content: report.data
        }
      ] : undefined
    });
  }
}

interface DistributionConfig {
  recipients: string[]; // User IDs or email addresses
  method: 'email' | 'portal' | 'api';
  scopeFiltering: boolean;
  includeAttachment: boolean;
  customMessage?: string;
  deliveryTime?: Date; // For scheduled delivery
}
```

### 2. Report Portal Integration

**Web-based report access portal:**

```typescript
export class ReportPortal {
  
  static async getAvailableReports(
    userId: string,
    organizationId: string,
    filters: ReportFilters
  ): Promise<ReportSummary[]> {
    
    const userRole = await getUserSubcontractorRole(userId, organizationId);
    
    const reports = await prisma.generatedReport.findMany({
      where: {
        organizationId,
        // Scope-based filtering
        OR: [
          { scope: null }, // General reports
          { scope: userRole.scope }, // Scope-specific reports
          { scope: 'all', accessLevel: 'public' } // Public all-scope reports
        ],
        // Date filtering
        ...(filters.dateRange && {
          generatedAt: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end
          }
        }),
        // Project filtering
        ...(filters.projectIds && {
          projectId: { in: filters.projectIds }
        }),
        // Report type filtering
        ...(filters.reportTypes && {
          reportType: { in: filters.reportTypes }
        })
      },
      orderBy: [
        { generatedAt: 'desc' },
        { reportType: 'asc' }
      ]
    });

    return reports.map(report => ({
      id: report.id,
      reportType: report.reportType,
      projectName: report.projectName,
      generatedAt: report.generatedAt,
      format: report.format,
      size: report.size,
      downloadUrl: this.generateSecureDownloadUrl(report.id, userId),
      previewUrl: this.generatePreviewUrl(report.id, userId),
      canDownload: this.canUserDownloadReport(report, userRole),
      canShare: this.canUserShareReport(report, userRole)
    }));
  }

  static async downloadReport(
    reportId: string,
    userId: string,
    format?: 'pdf' | 'excel' | 'json'
  ): Promise<ReportDownload> {
    
    // Verify access
    const hasAccess = await this.verifyReportAccess(reportId, userId);
    if (!hasAccess) {
      throw new Error('Access denied to report');
    }

    const report = await prisma.generatedReport.findUnique({
      where: { id: reportId },
      include: { project: true }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Convert format if requested and different from stored format
    let reportData = report.data;
    if (format && format !== report.format) {
      reportData = await this.convertReportFormat(report.data, report.format, format);
    }

    // Log download activity
    await this.logReportAccess(reportId, userId, 'download');

    return {
      data: reportData,
      filename: this.generateFilename(report, format || report.format),
      contentType: this.getContentType(format || report.format),
      size: reportData.length
    };
  }
}
```

---

*Document Version: 1.0*  
*Author: Reporting Architect*  
*Date: 2025-08-14*  
*Status: Implementation Ready*  
*Focus: Multi-scope reporting with automated distribution and role-based access*