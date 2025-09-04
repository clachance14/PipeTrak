/**
 * Global TypeScript declaration override for lucide-react
 * 
 * This file fixes broken TypeScript declarations in lucide-react v0.542.0
 * where icons exist at runtime but TypeScript can't find them.
 * 
 * All icons are declared with the standard Icon type to ensure proper typing.
 */

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export type Icon = FC<SVGProps<SVGSVGElement>>;
  
  // Core icons that were failing in the build
  export const Minus: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const ChevronsLeft: Icon;
  export const ChevronsRight: Icon;
  export const Pin: Icon;
  export const Copy: Icon;
  export const Search: Icon;
  export const Filter: Icon;
  export const Lock: Icon;
  export const User: Icon;
  export const Circle: Icon;
  export const Zap: Icon;
  export const CircleX: Icon;
  export const ExternalLink: Icon;
  export const RotateCcw: Icon;
  export const Flame: Icon;
  export const Eye: Icon;
  export const Play: Icon;
  export const CheckSquare: Icon;
  
  // Common icons that are working but declaring for completeness
  export const MapPin: Icon;
  export const Package: Icon;
  export const Check: Icon;
  export const AlertCircle: Icon;
  export const Clock: Icon;
  export const Edit: Icon;
  export const Save: Icon;
  export const X: Icon;
  export const Users: Icon;
  export const File: Icon;
  
  // Re-export any other existing icons from the original module
  // This ensures we don't break icons that are already working
  export * from 'lucide-react/dist/index';
}