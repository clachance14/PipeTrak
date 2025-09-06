/**
 * Type declarations for cmdk 1.1.1
 * Temporary fix while cmdk types are resolved
 */
declare module 'cmdk' {
  import { FC, ReactNode, HTMLAttributes, ForwardRefExoticComponent, RefAttributes } from 'react';
  
  interface CommandProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    filter?: (value: string, search: string) => number;
    shouldFilter?: boolean;
    loop?: boolean;
  }
  
  interface CommandInputProps extends Omit<HTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
  }
  
  interface CommandListProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
  }
  
  interface CommandEmptyProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
  }
  
  interface CommandGroupProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    heading?: ReactNode;
  }
  
  interface CommandItemProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    value?: string;
    disabled?: boolean;
    onSelect?: (value: string) => void;
  }
  
  interface CommandSeparatorProps extends HTMLAttributes<HTMLDivElement> {}
  
  export interface CommandComponents {
    Input: ForwardRefExoticComponent<CommandInputProps & RefAttributes<HTMLInputElement>>;
    List: ForwardRefExoticComponent<CommandListProps & RefAttributes<HTMLDivElement>>;
    Empty: ForwardRefExoticComponent<CommandEmptyProps & RefAttributes<HTMLDivElement>>;
    Group: ForwardRefExoticComponent<CommandGroupProps & RefAttributes<HTMLDivElement>>;
    Item: ForwardRefExoticComponent<CommandItemProps & RefAttributes<HTMLDivElement>>;
    Separator: ForwardRefExoticComponent<CommandSeparatorProps & RefAttributes<HTMLDivElement>>;
  }
  
  declare const Command: ForwardRefExoticComponent<CommandProps & RefAttributes<HTMLDivElement>> & CommandComponents;
  
  export default Command;
  export { Command };
}