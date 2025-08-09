# Product Requirements Document (PRD)

**Industrial Construction Pipe Tracking App – MVP**
**Version:** 1.0
**Date:** August 7th 2025
**Product Owner:** Cory LaChance
**Target Launch:** \~2 months

---

## Executive Summary

The Industrial Construction Pipe Tracking App is a web-based application designed to replace Excel-based tracking systems for managing piping component installation in chemical plants and refineries.

The MVP focuses on two user roles:

* **Foremen** update installation progress in the field via mobile/tablet devices.
* **Project Managers** analyze progress through Excel-like reporting interfaces.

The system will track up to **1,000 components** across **100 drawings**, with all components using milestone-based workflows. The `workflow_type` field determines how milestones are updated (checkbox, percent entry, or quantity entry).

All table interfaces will maintain **Excel-like functionality** for familiarity and adoption in the construction environment.

Manhour tracking will be part of the eventual system but is **out of scope for the MVP**.

---

## Problem Statement

Industrial construction projects currently rely on Excel spreadsheets with pivot tables to track installation status. This creates:

* **Data Integrity Issues:** Multiple spreadsheets cause version control problems and inconsistencies.
* **Lack of Real-time Visibility:** PMs cannot see live field progress.
* **Inefficient Field Updates:** Foremen record on paper or offline, then re-enter into Excel.
* **Reporting Delays:** Pivot table reports are time-consuming and error-prone.
* **No Audit Trail:** No automatic record of who made what change and when.

---

## User Roles & Personas

### 1. Foreman (Field User)

* **Device:** Mobile/tablet
* **Location:** Field
* **Skill Level:** Familiar with Excel, basic mobile app use
* **Need:** Quick updates in the field
* **Frequency:** Multiple updates/day

### 2. Project Manager (Office User)

* **Device:** Desktop/laptop
* **Location:** Site office or remote
* **Skill Level:** Advanced Excel user
* **Need:** Real-time progress visibility, reporting
* **Frequency:** Daily/weekly review

---

## Data Model & Workflow Types

All components use **milestone-based tracking** with Rules of Credit (ROC). The `workflow_type` column specifies the input style:

### `workflow_type` Values

1. **milestone\_discrete** – Yes/No milestone completion (checkboxes)
2. **milestone\_partial** – Percent entry for in-progress milestones
3. **milestone\_quantity** – Quantity entry (e.g., feet installed) with system conversion to %

### Workflow Definitions

**Milestone – Discrete (`milestone_discrete`)**

* Checkbox for each milestone
* Percent = sum of ROC weights for completed milestones
* Use: spools, supports, valves, gaskets, field welds, instruments

**Milestone – Partial (`milestone_partial`)**

* Percent entered for milestones that can be partially done
* Percent = (entered % × milestone weight) + full weights for completed milestones
* Use: threaded pipe

**Milestone – Quantity (`milestone_quantity`)**

* Quantity entered for milestone/component
* Percent = (quantity ÷ total) × milestone weight
* Use: piping by footage, insulation, paint

### Component Type to Workflow Mapping

| Component Type      | Workflow Type       | Milestone Set         | Notes                     |
| ------------------- | ------------------- | --------------------- | ------------------------- |
| spool               | milestone\_discrete | Full                  | Per component             |
| piping (by footage) | milestone\_quantity | Full                  | Drawing-level             |
| support             | milestone\_discrete | Reduced               | Per component             |
| valve               | milestone\_discrete | Reduced               | Per component             |
| gasket              | milestone\_discrete | Reduced               | Per component             |
| threaded\_pipe      | milestone\_partial  | Reduced + Fabrication | Partial % entry           |
| field\_weld         | milestone\_discrete | Reduced               | Fit-up ready as "Receive" |
| insulation          | milestone\_quantity | Two-step              | Insulation & metal out    |
| instrument          | milestone\_discrete | Reduced               | Per component             |
| paint               | milestone\_quantity | Two-step              | Primer & finish coat      |

---

## Rules of Credit – MVP Defaults

**Full Milestone Set (spools & piping-footage)**

* Receive – 5%
* Erect – 30%
* Connect – 30%
* Support – 15%
* Punch – 5%
* Test – 10%
* Restore – 5%

**Reduced Milestone Set (supports, valves, gaskets, instruments, field weld)**

* Receive – 10%
* Install/Connect – 60%
* Punch – 10%
* Test – 15%
* Restore – 5%

**Threaded Pipe**

* Fabricate – 25%
* Erect – 25%
* Connect – 30%
* Punch – 5%
* Test – 10%
* Restore – 5%

**Insulation**

* Insulate – 60%
* Metal Out – 40%

**Paint**

* Primer – 40%
* Finish Coat – 60%

---

## Component Attributes (MVP)

* componentId (required)
* workflow\_type (required)
* type (e.g., Spool, Valve, etc.)
* spec
* size, material, pressure rating
* area, system, test package
* test pressure
* test required (e.g., "In Service Test")
* description
* milestones (with completion state, date, user)
* drawing reference
* total length (if applicable)
* installation date/time (auto)
* installer name (auto)

**Future (post-MVP):** Earned hours, remaining hours, installed earned, installed budget.

---

## Foreman Features

1. Drawing navigation *(Uses Table UX Standard)*
2. Component update by workflow\_type
3. Auto-capture user & timestamp
4. Mobile-friendly layout

## Project Manager Features

1. Dashboard: project %, breakdowns, recent updates
2. Reporting tables *(Uses Table UX Standard)* — group/summarize by System, Area, Test Package
3. Audit log with before/after, export

---

## System Features

### Data Import & Editing

* Initial one-time Excel import from IFC drawings
* Post-import component management is allowed:

  * Add new components
  * Edit existing component details (e.g., spec, description, workflow type)
  * Populate or edit metadata fields such as Area, System, and Test Package
* Missing/extra components found in the field trigger RFI (workflow outside MVP scope)
* Must map `TYPE` to `workflow_type` automatically
* Must capture and store spec, test pressure, test required, description

### Authentication & Security

* MVP: Authenticated users only, no anonymous access
* All authenticated users can view all data
* Role-based UI control only (Foreman vs PM)
* Future: RLS by role/project

### Calculation Rules

* Completion % = sum of earned milestone weights
* Quantity-based milestones = (quantity ÷ total) × milestone weight
* No over-credit beyond highest completed milestone

---

## Table UX Standard

Applies to all table views (drawings, components, audit log, import preview):

* Multi-column sort/filter
* Freeze headers, sticky first column optional
* Column resize/show/hide/reorder (persist per user)
* Keyboard navigation, inline edit, copy/paste from Excel
* Export CSV/XLSX with filters/sorts/visible columns
* Touch targets ≥44×44px on mobile
* Load <2s, save <500ms, export <10s

---

## Technical Specifications

* **Boilerplate:** All code follows [Supastarter](https://supastarter.dev/) conventions for structure, DB, API, auth
* **Stack:** Supastarter (Next.js + Supabase)
* **UI:** React/Next.js (Supastarter default)
* **Auth:** Supastarter built-in

---

## Performance Requirements

* 3–4 concurrent foremen in MVP (scalable later)
* Mobile-responsive design

## Browser Support

* Mobile: iOS Safari, Chrome Android
* Desktop: Chrome, Firefox, Safari, Edge

---

## Success Metrics

**Primary:** Migration from Excel, daily foreman usage, PM reporting usage
**Secondary:** Fewer data discrepancies, time saved, full audit trail

---

## Out of Scope – MVP

* Offline capability
* Photo attachments
* Manhour tracking and calculations
* Schedule integration
* Complex RLS
* Integrations
* Native mobile app
* Notifications
* Custom fields