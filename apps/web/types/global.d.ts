// Global type declarations for packages without proper TypeScript support

// Extend Object constructor for ES2021 methods
declare interface ObjectConstructor {
	entries<T>(obj: { [s: string]: T } | ArrayLike<T>): [string, T][];
	entries(obj: Record<string, unknown>): [string, any][];
	fromEntries<T = any>(
		entries: Iterable<readonly [PropertyKey, T]>,
	): { [k: string]: T };
	fromEntries(entries: Iterable<readonly any[]>): any;
	hasOwn(object: object, property: PropertyKey): boolean;
}

// Command Dialog Props extension
declare module "cmdk" {
	export interface CommandDialogProps {
		children?: React.ReactNode;
	}
}

// Class variance authority
declare module "class-variance-authority" {
	export function cva(base?: string, options?: any): any;
	export type VariantProps<_T> = any;
}

// React Day Picker
declare module "react-day-picker" {
	export interface DayPickerProps {
		[key: string]: any;
	}
	export const DayPicker: React.ComponentType<DayPickerProps>;
}

// Next themes
declare module "next-themes" {
	export function useTheme(): {
		theme: string | undefined;
		setTheme: (theme: string) => void;
		themes: string[];
	};
	export interface ThemeProviderProps {
		children: React.ReactNode;
		[key: string]: any;
	}
	export const ThemeProvider: React.ComponentType<ThemeProviderProps>;
}

// Lucide React
declare module "lucide-react" {
	const LucideIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	export const ChevronDown: typeof LucideIcon;
	export const MoreVertical: typeof LucideIcon;
	export const Edit: typeof LucideIcon;
	export const Trash: typeof LucideIcon;
	export const PlusIcon: typeof LucideIcon;
	export const ArrowUp: typeof LucideIcon;
	export const ArrowDown: typeof LucideIcon;
	export const File: typeof LucideIcon;
	export const Folder: typeof LucideIcon;
	export const Check: typeof LucideIcon;
	export const X: typeof LucideIcon;
	export const Building2: typeof LucideIcon;
	export const Users: typeof LucideIcon;
	export const ArrowLeft: typeof LucideIcon;
	export const CreditCard: typeof LucideIcon;
	export const LockKeyhole: typeof LucideIcon;
	export const Settings: typeof LucideIcon;
	export const TriangleAlert: typeof LucideIcon;
	export const RefreshCw: typeof LucideIcon;
	export const Home: typeof LucideIcon;
	export const Bug: typeof LucideIcon;
	export const Shield: typeof LucideIcon;
	export const AlertTriangle: typeof LucideIcon;
	export const AlertCircle: typeof LucideIcon;
	export const FileText: typeof LucideIcon;
	export const Download: typeof LucideIcon;
	export const Upload: typeof LucideIcon;
	export const Save: typeof LucideIcon;
	export const CheckCircle22: typeof LucideIcon;
	export const FileSpreadsheet: typeof LucideIcon;
	export const MapPin: typeof LucideIcon;
	export const Calendar: typeof LucideIcon;
	export const BarChart3: typeof LucideIcon;
	export const Loader2: typeof LucideIcon;
	export const Mail: typeof LucideIcon;
	export const Cloud: typeof LucideIcon;
	export const Layers: typeof LucideIcon;
	export const WifiOff: typeof LucideIcon;
	export const Wand2: typeof LucideIcon;
	export const ArrowRight: typeof LucideIcon;
	export const HardHat: typeof LucideIcon;
	export const Clock: typeof LucideIcon;
	export const Key: typeof LucideIcon;
	export const Menu: typeof LucideIcon;
	export const Undo2: typeof LucideIcon;
	export const MoreHorizontal: typeof LucideIcon;
	export const Target: typeof LucideIcon;
	export const Plus: typeof LucideIcon;
	export const Package: typeof LucideIcon;
	export const Wrench: typeof LucideIcon;
}

// Sonner
declare module "sonner" {
	export interface ToastOptions {
		id?: string | number;
		duration?: number;
		position?: string;
		className?: string;
		style?: React.CSSProperties;
		[key: string]: any;
	}

	export const toast: {
		(message: string, options?: ToastOptions): void;
		success: (message: string, options?: ToastOptions) => void;
		error: (message: string, options?: ToastOptions) => void;
		info: (message: string, options?: ToastOptions) => void;
		warning: (message: string, options?: ToastOptions) => void;
		promise: <T>(
			promise: Promise<T> | (() => Promise<T>),
			options: {
				loading: string;
				success: string | ((data: T) => string);
				error: string | ((error: any) => string);
			},
		) => void;
	};

	export interface ToasterProps {
		position?: string;
		[key: string]: any;
	}

	export const Toaster: React.ComponentType<ToasterProps>;
}

// UFO
declare module "ufo" {
	export function withQuery(
		input: string,
		query: Record<string, any>,
	): string;
	export function parseURL(input: string): any;
	export function joinURL(...parts: string[]): string;
}

// Use hooks TS
declare module "usehooks-ts" {
	export function useDebounceValue<T>(
		value: T,
		delay: number,
		options?: { leading?: boolean; trailing?: boolean },
	): [T, (value: T) => void];

	export function useLocalStorage<T>(
		key: string,
		initialValue: T,
	): [T, (value: T) => void];
}

// Next Intl
declare module "next-intl" {
	export function useTranslations(
		namespace?: string,
	): (key: string, params?: any) => string;
	export function useLocale(): string;
	export const NextIntlClientProvider: React.ComponentType<{
		children: React.ReactNode;
		[key: string]: any;
	}>;
}

// React Hook Form
declare module "react-hook-form" {
	export interface UseFormReturn<TFieldValues = any> {
		control: any;
		handleSubmit: (
			onSubmit: (data: TFieldValues) => void,
		) => (e?: React.BaseSyntheticEvent) => void;
		formState: any;
		[key: string]: any;
	}

	export function useForm<TFieldValues = any>(
		options?: any,
	): UseFormReturn<TFieldValues>;
}

// NUQS
declare module "nuqs" {
	export const parseAsString: {
		withDefault: (defaultValue: string) => any;
	};
	export const parseAsInteger: {
		withDefault: (defaultValue: number) => any;
	};
	export function useQueryState(
		key: string,
		parser: any,
	): [any, (value: any) => void];
}
