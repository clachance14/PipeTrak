import { db as prisma } from "@repo/database";

// Component Type to Milestone Template Mapping
// Based on ROC Component Type Alignment Matrix
const COMPONENT_TYPE_TO_TEMPLATE: Record<string, string> = {
  // Full Milestone Set (7 milestones)
  'SPOOL': 'Full Milestone Set',
  'PIPING': 'Full Milestone Set',
  'PIPING_FOOTAGE': 'Full Milestone Set',
  
  // Reduced Milestone Set (5 milestones)
  'VALVE': 'Reduced Milestone Set',
  'FITTING': 'Reduced Milestone Set',
  'FLANGE': 'Reduced Milestone Set',
  'GASKET': 'Reduced Milestone Set',
  'SUPPORT': 'Reduced Milestone Set',
  'INSTRUMENT': 'Reduced Milestone Set',
  
  // Title-cased variations (common in Excel imports)
  'Valve': 'Reduced Milestone Set',
  'Fitting': 'Reduced Milestone Set',
  'Flange': 'Reduced Milestone Set',
  'Gasket': 'Reduced Milestone Set',
  'Support': 'Reduced Milestone Set',
  'Instrument': 'Reduced Milestone Set',
  'Spool': 'Full Milestone Set',
  'Piping': 'Full Milestone Set',
  
  // Field Weld Template (5 milestones with special naming)
  'FIELD_WELD': 'Field Weld',
  'WELD': 'Field Weld',
  'Field_Weld': 'Field Weld',
  'Weld': 'Field Weld',
  
  // Insulation Template (2 milestones)
  'INSULATION': 'Insulation',
  'Insulation': 'Insulation',
  
  // Paint Template (2 milestones)
  'PAINT': 'Paint',
  'Paint': 'Paint',
  
  // Standard Piping (legacy)
  'PIPING_STANDARD': 'Standard Piping'
};

// Fallback hierarchy for unknown types
const FALLBACK_TEMPLATE_HIERARCHY = [
  'Reduced Milestone Set',  // Most common for individual components
  'Full Milestone Set',     // For larger components
  'Default Component Template', // Last resort
];

export interface MilestoneTemplate {
  id: string;
  name: string;
  milestones: any[];
}

export class MilestoneTemplateMapper {
  private templateCache: Map<string, MilestoneTemplate> = new Map();
  private templatesByName: Map<string, MilestoneTemplate> = new Map();
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Load all milestone templates for the project
   */
  async loadTemplates(): Promise<void> {
    const templates = await prisma.milestoneTemplate.findMany({
      where: { projectId: this.projectId },
      select: {
        id: true,
        name: true,
        milestones: true
      }
    });

    this.templateCache.clear();
    this.templatesByName.clear();

    for (const template of templates) {
      // Ensure milestones is properly parsed
      let milestones: any[] = [];
      if (Array.isArray(template.milestones)) {
        milestones = template.milestones;
      } else if (typeof template.milestones === 'string') {
        try {
          const parsed = JSON.parse(template.milestones);
          milestones = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.warn(`Failed to parse milestones for template ${template.name}:`, error);
        }
      }

      const mappedTemplate: MilestoneTemplate = {
        id: template.id,
        name: template.name,
        milestones
      };

      this.templateCache.set(template.id, mappedTemplate);
      this.templatesByName.set(template.name, mappedTemplate);
    }

    console.log(`MilestoneTemplateMapper: Loaded ${this.templateCache.size} templates for project ${this.projectId}`);
  }

  /**
   * Get the appropriate milestone template for a component type
   */
  getTemplateForComponentType(componentType: string): MilestoneTemplate | null {
    // Handle empty or null component type
    if (!componentType || typeof componentType !== 'string') {
      console.warn(`MilestoneTemplateMapper: Invalid component type '${componentType}', using fallback`);
      return this.getFallbackTemplate();
    }

    // Trim the component type but preserve case for initial lookup
    const trimmedType = componentType.trim();
    
    // Log the component type we're trying to map for debugging
    console.log(`MilestoneTemplateMapper: Looking for template for component type: '${trimmedType}'`);
    
    // Try exact match first (preserves original casing like "Support", "Valve")
    let templateName = COMPONENT_TYPE_TO_TEMPLATE[trimmedType];
    if (templateName && this.templatesByName.has(templateName)) {
      const template = this.templatesByName.get(templateName)!;
      console.log(`MilestoneTemplateMapper: ✅ Exact matched ${componentType} → ${templateName} (${template.milestones.length} milestones)`);
      return template;
    }

    // Try uppercase normalization
    const normalizedType = trimmedType.toUpperCase();
    templateName = COMPONENT_TYPE_TO_TEMPLATE[normalizedType];
    if (templateName && this.templatesByName.has(templateName)) {
      const template = this.templatesByName.get(templateName)!;
      console.log(`MilestoneTemplateMapper: ✅ Uppercase matched ${componentType} → ${templateName} (${template.milestones.length} milestones)`);
      return template;
    } else if (templateName) {
      console.warn(`MilestoneTemplateMapper: Template '${templateName}' exists in mapping but not loaded for component type '${normalizedType}'`);
    }

    // Fuzzy matching for common variations
    const fuzzyMatch = this.findFuzzyMatch(normalizedType);
    if (fuzzyMatch && this.templatesByName.has(fuzzyMatch)) {
      const template = this.templatesByName.get(fuzzyMatch)!;
      console.log(`MilestoneTemplateMapper: ✅ Fuzzy matched ${componentType} → ${fuzzyMatch} (${template.milestones.length} milestones)`);
      return template;
    } else if (fuzzyMatch) {
      console.warn(`MilestoneTemplateMapper: Fuzzy match '${fuzzyMatch}' found but template not loaded for component type '${normalizedType}'`);
    }

    // Fallback to default template
    console.warn(`MilestoneTemplateMapper: ⚠️ No template mapping for component type '${componentType}' (normalized: '${normalizedType}'), using fallback`);
    return this.getFallbackTemplate();
  }

  /**
   * Find fuzzy matches for component types
   */
  private findFuzzyMatch(componentType: string): string | null {
    // Check for partial matches in component type
    if (componentType.includes('WELD') || componentType.includes('FW')) {
      return 'Field Weld';
    }
    if (componentType.includes('SPOOL')) {
      return 'Full Milestone Set';
    }
    if (componentType.includes('PIPE') || componentType.includes('PIPING')) {
      return 'Full Milestone Set';
    }
    if (componentType.includes('VALVE')) {
      return 'Reduced Milestone Set';
    }
    if (componentType.includes('GASKET')) {
      return 'Reduced Milestone Set';
    }
    if (componentType.includes('SUPPORT')) {
      return 'Reduced Milestone Set';
    }
    if (componentType.includes('FITTING')) {
      return 'Reduced Milestone Set';
    }
    if (componentType.includes('FLANGE')) {
      return 'Reduced Milestone Set';
    }
    if (componentType.includes('INSTRUMENT')) {
      return 'Reduced Milestone Set';
    }
    if (componentType.includes('INSUL')) {
      return 'Insulation';
    }
    if (componentType.includes('PAINT')) {
      return 'Paint';
    }

    return null;
  }

  /**
   * Get fallback template using hierarchy - always returns a template, never null
   */
  private getFallbackTemplate(): MilestoneTemplate | null {
    for (const templateName of FALLBACK_TEMPLATE_HIERARCHY) {
      if (this.templatesByName.has(templateName)) {
        const template = this.templatesByName.get(templateName)!;
        console.log(`MilestoneTemplateMapper: Using fallback template ${templateName} (${template.milestones.length} milestones)`);
        return template;
      }
    }

    // If no fallback templates exist, return any available template
    const availableTemplates = Array.from(this.templateCache.values());
    if (availableTemplates.length > 0) {
      const fallbackTemplate = availableTemplates[0];
      console.warn(`MilestoneTemplateMapper: No standard fallback templates found, using ${fallbackTemplate.name} as fallback`);
      return fallbackTemplate;
    }

    console.error('MilestoneTemplateMapper: No templates available at all - this should not happen');
    return null;
  }

  /**
   * Get template by ID (cached)
   */
  getTemplateById(templateId: string): MilestoneTemplate | null {
    return this.templateCache.get(templateId) || null;
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): MilestoneTemplate[] {
    return Array.from(this.templateCache.values());
  }

  /**
   * Get template statistics
   */
  getStats(): { totalTemplates: number; templateNames: string[] } {
    return {
      totalTemplates: this.templateCache.size,
      templateNames: Array.from(this.templatesByName.keys())
    };
  }

  /**
   * Create a default template if none exist - always returns a valid template
   */
  async ensureDefaultTemplate(): Promise<MilestoneTemplate> {
    // First check if we already have a "Default Component Template"
    const existingDefault = this.templatesByName.get("Default Component Template");
    if (existingDefault) {
      console.log('MilestoneTemplateMapper: Using existing Default Component Template');
      return existingDefault;
    }

    // Check if we have any templates
    if (this.templateCache.size === 0) {
      console.log('MilestoneTemplateMapper: No templates found, creating default template');
      
      try {
        const defaultTemplate = await prisma.milestoneTemplate.create({
          data: {
            projectId: this.projectId,
            name: "Default Component Template",
            description: "Auto-created template for component imports",
            milestones: [
              {
                name: "Receive",
                order: 1,
                weight: 20,
                description: "Component received on site"
              },
              {
                name: "Install",
                order: 2,
                weight: 60,
                description: "Component installed in position"
              },
              {
                name: "Test",
                order: 3,
                weight: 20,
                description: "Component tested and commissioned"
              }
            ]
          }
        });

        const mappedTemplate: MilestoneTemplate = {
          id: defaultTemplate.id,
          name: defaultTemplate.name,
          milestones: defaultTemplate.milestones as any[]
        };

        this.templateCache.set(defaultTemplate.id, mappedTemplate);
        this.templatesByName.set(defaultTemplate.name, mappedTemplate);

        console.log(`MilestoneTemplateMapper: ✅ Created default template with ${mappedTemplate.milestones.length} milestones`);
        return mappedTemplate;
      } catch (error) {
        console.error('MilestoneTemplateMapper: Failed to create default template:', error);
        // This is a critical failure, but we'll try to return any existing template
      }
    }

    // Return any existing template as fallback
    const fallbackTemplate = Array.from(this.templateCache.values())[0];
    if (fallbackTemplate) {
      console.warn(`MilestoneTemplateMapper: Using ${fallbackTemplate.name} as default template`);
      return fallbackTemplate;
    }

    // This should never happen but provides a last resort
    throw new Error('No milestone templates available and unable to create default template');
  }
}

/**
 * Utility function to get the appropriate template for a component
 */
export async function getTemplateForComponent(
  projectId: string,
  componentType: string,
  mapper?: MilestoneTemplateMapper
): Promise<MilestoneTemplate | null> {
  if (!mapper) {
    mapper = new MilestoneTemplateMapper(projectId);
    await mapper.loadTemplates();
  }

  return mapper.getTemplateForComponentType(componentType);
}