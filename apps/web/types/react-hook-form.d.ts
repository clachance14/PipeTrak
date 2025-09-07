/**
 * Type augmentations for react-hook-form version compatibility
 */
declare module "react-hook-form" {
	export interface FieldValues {
		[key: string]: any;
	}

	export type FieldPath<_TFieldValues extends FieldValues> = string;

	export interface ControllerRenderProps<
		TFieldValues extends FieldValues = FieldValues,
		TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
	> {
		field: {
			value: any;
			onChange: (...event: any[]) => void;
			onBlur: () => void;
			name: TName;
			ref: React.Ref<any>;
		};
		fieldState: {
			invalid: boolean;
			isTouched: boolean;
			isDirty: boolean;
			error?: { message?: string };
		};
		formState: any;
	}

	export interface ControllerProps<
		TFieldValues extends FieldValues = FieldValues,
		TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
	> {
		name: TName;
		control?: any;
		defaultValue?: any;
		rules?: any;
		render: (
			props: ControllerRenderProps<TFieldValues, TName>,
		) => React.ReactElement;
	}

	// Explicitly declare the missing exports that TypeScript can't find
	export const Controller: React.ComponentType<any>;
	export const FormProvider: React.ComponentType<any>;
	export const useFormContext: () => any;
}
