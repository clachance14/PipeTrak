import { Icon } from '@ui/components';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

export const button = cva(
  [
    'font-semibold',
    'border-2',
    'hover:no-underline',
    // alignment inside button
    'flex',
    'items-center',
    'gap-2',
    'justify-center',
    // transition
    'transition-all',
    'duration-150',
    'ease-in-out',
    // focus ring
    'focus:ring-0',
    'outline-none',
    // make sure content doesn't wrap
    'whitespace-nowrap',
    // disabled styles
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:pointer-events-none',
    // style svg icons inside a button
    '[&>svg:not(.animate-spin)]:scale-110',
    // '[&>svg:not(.animate-spin)]:w-[1em]',
    // '[&>svg:not(.animate-spin)]:h-[1em]',
  ],
  {
    variants: {
      intent: {
        primary: [
          'bg-black',
          'text-white',
          'border-transparent',
          'focus:ring-transparent',
          // hover
          'hover:bg-black',
          'hover:bg-opacity-90',
          // dark mode
          'dark:bg-white',
          'dark:text-black',
          'dark:hover:bg-white',
          'dark:hover:bg-opacity-90',
          'dark:focus:bg-opacity-80',
        ],
        'primary-outline': [
          'bg-transparent',
          'text-black',
          'border-zinc-100',
          // hover
          'hover:bg-zinc-100',
          // focus
          'focus:bg-zinc-200',
          'focus:border-zinc-200',
          // dark mode
          'dark:text-white',
          'dark:border-zinc-800',
          'dark:hover:bg-zinc-800',
          'dark:focus:bg-zinc-700',
          'dark:focus:border-zinc-700',
        ],
        'primary-ghost': [
          'bg-black',
          'bg-opacity-5',
          'text-black',
          'border-transparent',
          // hover
          'hover:bg-opacity-10',
          // focus
          'focus:bg-opacity-20',
          // dark mode
          'dark:bg-white',
          'dark:text-white',
          'dark:bg-opacity-5',
          'dark:hover:bg-opacity-10',
          'dark:focus:bg-opacity-20',
        ],
        secondary: ['bg-white', 'text-zinc-800', 'border-zinc-400', 'hover:bg-zinc-100'],
        github: ['bg-zinc-900', 'text-white', 'border-transparent', 'hover:bg-zinc-800'],
        discord: ['bg-[#7289DA]', 'text-white', 'border-transparent', 'hover:bg-[#5E74C0]'],
        google: ['bg-[#4285F4]', 'text-white', 'border-transparent', 'hover:bg-[#357AE8]'],
        apple: ['bg-black', 'text-white', 'border-transparent', 'hover:bg-[#1E1E1E]', 'ring-black'],
        twitter: ['bg-[#1DA1F2]', 'text-white', 'border-transparent', 'hover:bg-[#1A94E0]'],
      },
      size: {
        xsmall: ['text-xs', 'py-1', 'px-2', 'rounded-lg', 'h-8'],
        small: ['text-sm', 'py-2', 'px-4', 'rounded-lg', 'h-10'],
        medium: ['text-base', 'py-3', 'px-6', 'rounded-xl', 'h-12'],
        large: ['text-lg', 'py-4', 'px-8', 'rounded-2xl', 'h-14'],
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'medium',
    },
  }
);

interface ButtonProps<T extends React.ElementType> extends VariantProps<typeof button> {
  isLoading?: boolean;
  isDisabled?: boolean;
  as?: T;
}

export function Button<T extends React.ElementType = 'button'>({
  className,
  children,
  intent,
  size,
  isLoading,
  isDisabled,
  as,
  ...props
}: ButtonProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonProps<T>>) {
  const Component = as ?? 'button';
  return (
    <Component
      className={button({ intent, size, className })}
      disabled={isLoading || isDisabled || props.disabled || false}
      {...props}
    >
      {isLoading ? <Icon.spinner className="h-4 w-4 animate-spin" /> : children}
    </Component>
  );
}
