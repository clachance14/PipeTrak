/**
 * Component ID Generator for server-side use
 * Generates unique component IDs based on type
 */

// Common component type prefixes
export const COMPONENT_TYPE_PREFIXES: Record<string, string> = {
  // Piping Components
  'pipe': 'PIPE',
  'spool': 'SPOOL',
  'piping_footage': 'PIPING',
  'threaded_pipe': 'THREAD',
  'fitting': 'FITTING',
  'elbow': 'ELBOW',
  'tee': 'TEE',
  'reducer': 'REDUCER',
  'coupling': 'COUPLING',
  
  // Valves
  'valve': 'VALVE',
  'gate_valve': 'GATE',
  'ball_valve': 'BALL',
  'check_valve': 'CHECK',
  'control_valve': 'CTRL',
  'butterfly_valve': 'BFLY',
  'globe_valve': 'GLOBE',
  'relief_valve': 'RELIEF',
  
  // Flanges & Gaskets
  'flange': 'FLANGE',
  'blind_flange': 'BLIND',
  'gasket': 'GASKET',
  'spectacle_blind': 'SPECBLIND',
  
  // Equipment
  'pump': 'PUMP',
  'compressor': 'COMP',
  'heat_exchanger': 'HX',
  'vessel': 'VESSEL',
  'tank': 'TANK',
  'tower': 'TOWER',
  'drum': 'DRUM',
  
  // Instruments
  'instrument': 'INST',
  'transmitter': 'TX',
  'gauge': 'GAUGE',
  'indicator': 'IND',
  'controller': 'CTRL',
  'switch': 'SWITCH',
  
  // Supports & Structural
  'support': 'SUPPORT',
  'hanger': 'HANGER',
  'anchor': 'ANCHOR',
  'guide': 'GUIDE',
  'spring': 'SPRING',
  
  // Specialty Items
  'strainer': 'STRAINER',
  'filter': 'FILTER',
  'trap': 'TRAP',
  'expansion_joint': 'EXPJNT',
  'rupture_disc': 'RD',
  'orifice': 'ORIFICE',
  
  // Generic
  'component': 'COMP',
  'other': 'MISC'
};

// Type detection patterns
const TYPE_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  // Valves
  { pattern: /gate\s*valve/i, type: 'gate_valve' },
  { pattern: /ball\s*valve/i, type: 'ball_valve' },
  { pattern: /check\s*valve/i, type: 'check_valve' },
  { pattern: /control\s*valve/i, type: 'control_valve' },
  { pattern: /butterfly\s*valve/i, type: 'butterfly_valve' },
  { pattern: /globe\s*valve/i, type: 'globe_valve' },
  { pattern: /relief\s*valve|safety\s*valve|psv|prv/i, type: 'relief_valve' },
  { pattern: /valve/i, type: 'valve' },
  
  // Piping
  { pattern: /pipe\s*spool|spool/i, type: 'spool' },
  { pattern: /pipe/i, type: 'pipe' },
  { pattern: /elbow|ell/i, type: 'fitting' },
  { pattern: /tee/i, type: 'fitting' },
  { pattern: /reducer/i, type: 'fitting' },
  { pattern: /coupling/i, type: 'fitting' },
  { pattern: /fitting/i, type: 'fitting' },
  { pattern: /union/i, type: 'fitting' },
  { pattern: /cap/i, type: 'fitting' },
  { pattern: /plug/i, type: 'fitting' },
  { pattern: /nipple/i, type: 'fitting' },
  { pattern: /bushing/i, type: 'fitting' },
  
  // Flanges & Gaskets
  { pattern: /blind\s*flange|blind/i, type: 'flange' },
  { pattern: /weld\s*neck|wn\s*flange|wnf/i, type: 'flange' },
  { pattern: /slip\s*on|so\s*flange|sof/i, type: 'flange' },
  { pattern: /socket\s*weld|sw\s*flange/i, type: 'flange' },
  { pattern: /lap\s*joint|lj\s*flange/i, type: 'flange' },
  { pattern: /threaded\s*flange|thd\s*flange/i, type: 'flange' },
  { pattern: /flange|rf|rtj|ff/i, type: 'flange' },
  { pattern: /gasket|spiral\s*wound/i, type: 'gasket' },
  { pattern: /spectacle\s*blind|spec\s*blind/i, type: 'spectacle_blind' },
  
  // Equipment
  { pattern: /pump/i, type: 'pump' },
  { pattern: /compressor/i, type: 'compressor' },
  { pattern: /heat\s*exchanger|hx/i, type: 'heat_exchanger' },
  { pattern: /vessel/i, type: 'vessel' },
  { pattern: /tank/i, type: 'tank' },
  { pattern: /tower|column/i, type: 'tower' },
  { pattern: /drum/i, type: 'drum' },
  
  // Instruments
  { pattern: /transmitter|tx/i, type: 'transmitter' },
  { pattern: /gauge|pg|tg|lg/i, type: 'gauge' },
  { pattern: /indicator|ind/i, type: 'indicator' },
  { pattern: /controller/i, type: 'controller' },
  { pattern: /switch/i, type: 'switch' },
  { pattern: /instrument/i, type: 'instrument' },
  
  // Supports
  { pattern: /support/i, type: 'support' },
  { pattern: /hanger/i, type: 'hanger' },
  { pattern: /anchor/i, type: 'anchor' },
  { pattern: /guide/i, type: 'guide' },
  { pattern: /spring/i, type: 'spring' },
  
  // Specialty
  { pattern: /strainer/i, type: 'strainer' },
  { pattern: /filter/i, type: 'filter' },
  { pattern: /trap|steam\s*trap/i, type: 'trap' },
  { pattern: /expansion\s*joint|exp\s*joint/i, type: 'expansion_joint' },
  { pattern: /rupture\s*disc|rd/i, type: 'rupture_disc' },
  { pattern: /orifice/i, type: 'orifice' },
];

/**
 * Detect component type from description or type field
 */
export function detectComponentType(description?: string, typeField?: string): string {
  const searchText = `${typeField || ''} ${description || ''}`.toLowerCase();
  
  for (const { pattern, type } of TYPE_PATTERNS) {
    if (pattern.test(searchText)) {
      return type;
    }
  }
  
  return 'component'; // Default fallback
}

/**
 * Generate component ID based on type
 */
export function generateComponentId(
  type: string,
  sequenceNumber: number,
  options?: {
    prefix?: string;
    digits?: number;
    separator?: string;
  }
): string {
  const {
    prefix,
    digits = 4,
    separator = '-'
  } = options || {};
  
  // Get the type prefix
  const typePrefix = prefix || COMPONENT_TYPE_PREFIXES[type] || 'COMP';
  
  // Pad the sequence number with zeros
  const paddedNumber = sequenceNumber.toString().padStart(digits, '0');
  
  // Generate the ID
  return `${typePrefix}${separator}${paddedNumber}`;
}

/**
 * Generate multiple component IDs for batch operations
 */
export function generateBatchComponentIds(
  components: Array<{
    type?: string;
    description?: string;
    componentId?: string; // Existing ID if any
  }>,
  startSequence: number = 1,
  options?: {
    projectPrefix?: string;
    autoDetectType?: boolean;
  }
): Array<{ originalIndex: number; componentId: string; generated: boolean }> {
  const { projectPrefix, autoDetectType = true } = options || {};
  const results: Array<{ originalIndex: number; componentId: string; generated: boolean }> = [];
  
  // Track sequences per type
  const typeSequences: Record<string, number> = {};
  
  components.forEach((component, index) => {
    // If component already has an ID, use it
    if (component.componentId && component.componentId.trim()) {
      results.push({
        originalIndex: index,
        componentId: component.componentId,
        generated: false
      });
      return;
    }
    
    // Detect or use provided type
    let type = component.type || 'component';
    if (autoDetectType) {
      type = detectComponentType(component.description, component.type);
    }
    
    // Get the next sequence number for this type
    if (!typeSequences[type]) {
      typeSequences[type] = startSequence;
    }
    const sequenceNumber = typeSequences[type]++;
    
    // Generate the ID
    const componentId = generateComponentId(type, sequenceNumber, {
      prefix: projectPrefix ? `${projectPrefix}-${COMPONENT_TYPE_PREFIXES[type]}` : undefined
    });
    
    results.push({
      originalIndex: index,
      componentId,
      generated: true
    });
  });
  
  return results;
}