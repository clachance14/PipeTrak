export class ComponentTypeMapper {
    constructor() {
        // Flexible mapping configuration - easily extendable
        this.TYPE_MAPPINGS = {
            // === VALVES - Many variations ===
            VALVE: "VALVE",
            VLV: "VALVE",
            "GATE VALVE": "VALVE",
            "GATE VLV": "VALVE",
            "GLOBE VALVE": "VALVE",
            "CHECK VALVE": "VALVE",
            "CHECK VLV": "VALVE",
            "BALL VALVE": "VALVE",
            "BUTTERFLY VALVE": "VALVE",
            "NEEDLE VALVE": "VALVE",
            "RELIEF VALVE": "VALVE",
            "CONTROL VALVE": "VALVE",
            "3-WAY VALVE": "VALVE",
            GATE: "VALVE", // Sometimes just "Gate"
            GLOBE: "VALVE",
            CHECK: "VALVE",
            BALL: "VALVE",
            // === SUPPORTS - Various types ===
            SUPPORT: "SUPPORT",
            SUPP: "SUPPORT",
            "PIPE SUPPORT": "SUPPORT",
            HANGER: "SUPPORT",
            "SPRING HANGER": "SUPPORT",
            GUIDE: "SUPPORT",
            ANCHOR: "SUPPORT",
            SHOE: "SUPPORT",
            CLAMP: "SUPPORT",
            "U-BOLT": "SUPPORT",
            TRUNNION: "SUPPORT",
            RESTRAINT: "SUPPORT",
            SLIDE: "SUPPORT",
            STOP: "SUPPORT",
            // === GASKETS - Different styles ===
            GASKET: "GASKET",
            GSKT: "GASKET",
            GMG: "GASKET",
            "SPIRAL WOUND": "GASKET",
            "RING GASKET": "GASKET",
            RTJ: "GASKET",
            "RF GASKET": "GASKET",
            FACING: "GASKET",
            // === FITTINGS - Many types ===
            FITTING: "FITTING",
            ELBOW: "FITTING",
            ELL: "FITTING",
            "90 ELBOW": "FITTING",
            "45 ELBOW": "FITTING",
            TEE: "FITTING",
            "REDUCING TEE": "FITTING",
            REDUCER: "FITTING",
            COUPLING: "FITTING",
            UNION: "FITTING",
            CAP: "FITTING",
            PLUG: "FITTING",
            NIPPLE: "FITTING",
            CROSS: "FITTING",
            WELDOLET: "FITTING",
            THREADOLET: "FITTING",
            SOCKOLET: "FITTING",
            OLET: "FITTING",
            // === FLANGES - Different types ===
            FLANGE: "FLANGE",
            FLG: "FLANGE",
            "BLIND FLANGE": "FLANGE",
            BLIND: "FLANGE",
            "WELD NECK": "FLANGE",
            "WN FLANGE": "FLANGE",
            "SLIP ON": "FLANGE",
            "SO FLANGE": "FLANGE",
            "LAP JOINT": "FLANGE",
            "ORIFICE FLANGE": "FLANGE",
            "SPECTACLE BLIND": "FLANGE",
            // === INSTRUMENTS ===
            INSTRUMENT: "INSTRUMENT",
            INST: "INSTRUMENT",
            PSV: "INSTRUMENT",
            PRV: "INSTRUMENT",
            GAUGE: "INSTRUMENT",
            PI: "INSTRUMENT", // Pressure Indicator
            TI: "INSTRUMENT", // Temperature Indicator
            FI: "INSTRUMENT", // Flow Indicator
            LI: "INSTRUMENT", // Level Indicator
            TRANSMITTER: "INSTRUMENT",
            SWITCH: "INSTRUMENT",
            INDICATOR: "INSTRUMENT",
            // === PIPES/SPOOLS ===
            PIPE: "PIPE",
            PIPING: "PIPE",
            SPOOL: "SPOOL",
            "PIPE SPOOL": "SPOOL",
            "FABRICATED SPOOL": "SPOOL",
            "FAB SPOOL": "SPOOL",
            // === FIELD WELDS ===
            "FIELD WELD": "FIELD_WELD",
            FW: "FIELD_WELD",
            WELD: "FIELD_WELD",
            "BUTT WELD": "FIELD_WELD",
            "SOCKET WELD": "FIELD_WELD",
        };
    }
    // Fuzzy matching for types not in the exact map
    mapType(excelType) {
        if (!excelType || typeof excelType !== "string") {
            return "MISC";
        }
        const normalized = excelType.toUpperCase().trim();
        // 1. Exact match
        if (this.TYPE_MAPPINGS[normalized]) {
            console.log(`Exact match: "${excelType}" → ${this.TYPE_MAPPINGS[normalized]}`);
            return this.TYPE_MAPPINGS[normalized];
        }
        // 2. Partial match - check if input contains key patterns
        for (const [pattern, dbType] of Object.entries(this.TYPE_MAPPINGS)) {
            if (normalized.includes(pattern) || pattern.includes(normalized)) {
                console.log(`Fuzzy matched: "${excelType}" → ${dbType} (via "${pattern}")`);
                return dbType;
            }
        }
        // 3. Keyword matching for common variations
        if (this.containsKeyword(normalized, ["VALVE", "VLV"])) {
            return "VALVE";
        }
        if (this.containsKeyword(normalized, ["SUPPORT", "HANG", "CLAMP"])) {
            return "SUPPORT";
        }
        if (this.containsKeyword(normalized, ["GASKET", "GSKT", "SEAL"])) {
            return "GASKET";
        }
        if (this.containsKeyword(normalized, ["FLANGE", "FLG", "BLIND"])) {
            return "FLANGE";
        }
        if (this.containsKeyword(normalized, [
            "ELBOW",
            "TEE",
            "FITTING",
            "REDUCER",
        ])) {
            return "FITTING";
        }
        if (this.containsKeyword(normalized, [
            "INSTRUMENT",
            "GAUGE",
            "PSV",
            "TRANSMITTER",
        ])) {
            return "INSTRUMENT";
        }
        if (this.containsKeyword(normalized, ["PIPE", "SPOOL"])) {
            // Distinguish between pipe and spool
            return normalized.includes("SPOOL") ? "SPOOL" : "PIPE";
        }
        if (this.containsKeyword(normalized, ["WELD"])) {
            return "FIELD_WELD";
        }
        // 4. Default to MISC with warning
        console.warn(`Unknown type: "${excelType}" → MISC`);
        return "MISC";
    }
    containsKeyword(text, keywords) {
        return keywords.some((keyword) => text.includes(keyword));
    }
    // Get mapping statistics for preview
    getMappingStats(excelTypes) {
        const stats = {
            total: excelTypes.length,
            mapped: new Map(),
            unknown: [],
        };
        for (const type of excelTypes) {
            const mapped = this.mapType(type);
            stats.mapped.set(mapped, (stats.mapped.get(mapped) || 0) + 1);
            if (mapped === "MISC") {
                stats.unknown.push(type);
            }
        }
        return stats;
    }
    // Get user-friendly type counts for preview
    getTypeCounts(excelTypes) {
        const stats = this.getMappingStats(excelTypes);
        return {
            valve: stats.mapped.get("VALVE") || 0,
            support: stats.mapped.get("SUPPORT") || 0,
            gasket: stats.mapped.get("GASKET") || 0,
            flange: stats.mapped.get("FLANGE") || 0,
            fitting: stats.mapped.get("FITTING") || 0,
            instrument: stats.mapped.get("INSTRUMENT") || 0,
            pipe: stats.mapped.get("PIPE") || 0,
            spool: stats.mapped.get("SPOOL") || 0,
            fieldWeld: stats.mapped.get("FIELD_WELD") || 0,
            misc: stats.mapped.get("MISC") || 0,
        };
    }
}
export class ProjectAwareTypeMapper extends ComponentTypeMapper {
    constructor(projectMappings) {
        super();
        this.projectMappings = projectMappings;
    }
    mapType(excelType) {
        // Check project-specific mappings first
        if (this.projectMappings?.customMappings) {
            const normalized = excelType.toUpperCase().trim();
            if (this.projectMappings.customMappings[normalized]) {
                console.log(`Project-specific mapping: "${excelType}" → ${this.projectMappings.customMappings[normalized]}`);
                return this.projectMappings.customMappings[normalized];
            }
        }
        // Fall back to default mappings
        return super.mapType(excelType);
    }
}
