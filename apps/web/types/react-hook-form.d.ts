/**
 * Type augmentations for react-hook-form version compatibility
 */
declare module 'react-hook-form' {
  export interface FieldValues {
    [key: string]: any;
  }
  
  export type FieldPath<TFieldValues extends FieldValues> = keyof TFieldValues | string;
  
  export interface ControllerRenderProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
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
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
  > {
    name: TName;
    control?: any;
    defaultValue?: any;
    rules?: any;
    render: (props: ControllerRenderProps<TFieldValues, TName>) => React.ReactElement;
  }
  
  // Re-export all existing exports
  export * from 'react-hook-form';
}