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

  // Missing icons identified from TypeScript errors
  export const Smartphone: Icon;
  export const Monitor: Icon;
  export const ChevronUp: Icon;
  export const Wifi: Icon;
  export const CloudOff: Icon;
  export const Activity: Icon;
  export const Triangle: Icon;
  export const HelpCircle: Icon;
  export const TrendingUp: Icon;
  export const Box: Icon;
  export const Printer: Icon;
  export const History: Icon;
  export const List: Icon;
  export const Grid3x3: Icon;
  export const LayoutGrid: Icon;
  export const ArrowUpDown: Icon;
  export const Sparkles: Icon;
  export const FileDown: Icon;
  export const Info: Icon;
  export const Table: Icon;
  export const UserPlus: Icon;
  export const Columns: Icon;
  export const EyeOff: Icon;
  export const FlameKindling: Icon;
  export const XCircle: Icon;
  export const ChevronsUpDown: Icon;
  
  // Additional missing icons from error messages
  export const Trash2: Icon;
  export const Plus: Icon;
  export const Download: Icon;
  export const Upload: Icon;
  export const RefreshCw: Icon;
  export const AlertTriangle: Icon;
  export const Loader2: Icon;
  export const FileSpreadsheet: Icon;
  export const TrendingDown: Icon;
  export const Calendar: Icon;
  export const Settings: Icon;
  export const MoreHorizontal: Icon;
  export const Trash: Icon;
  export const PencilIcon: Icon;
  export const CheckCircle: Icon;
  export const ShieldCheck: Icon;
  export const ShieldX: Icon;
  export const Shield: Icon;
  export const Building: Icon;
  export const Home: Icon;
  export const CreditCard: Icon;
  export const UserCog2Icon: Icon;
  export const UserCogIcon: Icon;
  export const Book: Icon;
  export const HardDrive: Icon;
  export const LogOut: Icon;
  export const Moon: Icon;
  export const Sun: Icon;
  export const Cookie: Icon;
  export const Languages: Icon;
  export const UserCheck: Icon;
  export const UserX: Icon;
  export const Table2: Icon;
  export const FileImage: Icon;
  export const PieChart: Icon;
  export const LineChart: Icon;
  
  // Missing icons from TypeScript error messages (41 errors)
  export const Sheet: Icon;
  export const Award: Icon;
  export const FileX: Icon;
  export const FileCheck: Icon;
  export const Repeat1Icon: Icon;
  export const SquareUserRoundIcon: Icon;
  export const EllipsisIcon: Icon;
  export const SendIcon: Icon;
  export const AlertTriangleIcon: Icon;
  export const MailboxIcon: Icon;
  export const KeyIcon: Icon;
  export const MailCheck: Icon;
  export const MailX: Icon;
  export const PlusCircleIcon: Icon;
  export const BadgeCheck: Icon;
  export const BadgePercentIcon: Icon;
  export const PhoneIcon: Icon;
  export const StarIcon: Icon;
  export const ComputerIcon: Icon;
  export const CheckIcon: Icon;
  export const LinkIcon: Icon;
  export const TabletSmartphoneIcon: Icon;
  export const BotMessageSquareIcon: Icon;
  export const Factory: Icon;
  
  // Re-export any other existing icons from the original module
  // This ensures we don't break icons that are already working
  export * from 'lucide-react/dist/index';
}