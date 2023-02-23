import { cva, type VariantProps } from 'class-variance-authority';
import React, { forwardRef } from 'react';

export const input = cva('input', {
  variants: {
    size: {
      small: ['text-sm', 'py-1.5', 'px-3', 'rounded-lg'],
      medium: ['text-base', 'py-3', 'px-4', 'rounded-xl'],
      large: ['text-lg', 'py-4', 'px-8', 'rounded-2xl'],
    },
    status: {
      default: [
        'border-zinc-300',
        'focus:ring-zinc-400',
        'focus:border-zinc-400',
        'focus:ring-zinc-400',
        'focus:border-zinc-400',
        'dark:border-zinc-700',
        'dark:focus:ring-zinc-600',
        'dark:focus:border-zinc-600',
      ],
      error: ['border-rose-600', 'focus:ring-rose-600', 'focus:border-rose-600'],
      success: ['border-green-600', 'focus:ring-green-600', 'focus:border-green-600'],
    },
  },
  compoundVariants: [
    {
      className: [
        'border-zinc-300',
        'w-full',
        'bg-transparent',
        // focus
        'focus:ring-1',
        // dark mode
        ,
      ],
    },
  ],
  defaultVariants: {
    size: 'medium',
    status: 'default',
  },
});

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof input> & {
    htmlSize?: HTMLInputElement['size'];
  };

// eslint-disable-next-line react/display-name
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, status, htmlSize, ...props }, ref) => (
    <input className={input({ size, status, className })} size={htmlSize} ref={ref} {...props} />
  )
);
