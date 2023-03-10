import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

export const hint = cva('hint', {
  variants: {
    status: {
      success: ['bg-emerald-500', 'bg-opacity-10', 'border-emerald-500'],
      info: ['bg-blue-500', 'bg-opacity-10', 'border-blue-500'],
      warning: ['bg-amber-500', 'bg-opacity-10', 'border-amber-500'],
      error: ['bg-rose-500', 'bg-opacity-10', 'border-rose-500'],
    },
  },
  compoundVariants: [
    {
      className: ['px-5', 'py-4', 'w-full', 'rounded-xl'],
    },
  ],
  defaultVariants: {
    status: 'info',
  },
});

export const hintIcon = cva('hintIcon', {
  variants: {
    status: {
      success: ['text-emerald-600 dark:text-emerald-300'],
      info: ['text-blue-600 dark:text-blue-300'],
      warning: ['text-amber-600 dark:text-amber-300'],
      error: ['text-rose-600 dark:text-rose-300'],
    },
  },
  compoundVariants: [
    {
      className: ['flex-shrink-0', 'flex', 'items-center', 'justify-center', 'text-3xl', 'leading-tight'],
    },
  ],
  defaultVariants: {
    status: 'info',
  },
});

export const hintTitle = cva('hintTitle', {
  variants: {
    status: {
      success: ['text-emerald-600 dark:text-emerald-300'],
      info: ['text-blue-600 dark:text-blue-300'],
      warning: ['text-amber-600 dark:text-amber-300'],
      error: ['text-rose-600 dark:text-rose-300'],
    },
  },
  compoundVariants: [
    {
      className: ['font-bold', 'text-base'],
    },
  ],
  defaultVariants: {
    status: 'info',
  },
});

export const hintMessage = cva('hintMessage', {
  variants: {
    status: {
      success: ['text-emerald-900 text-opacity-50 dark:text-emerald-100 dark:text-opacity-50'],
      info: ['text-blue-900 text-opacity-50 dark:text-blue-100 dark:text-opacity-50'],
      warning: ['text-amber-900 text-opacity-50 dark:text-amber-100 dark:text-opacity-50'],
      error: ['text-rose-900 text-opacity-50 dark:text-rose-100 dark:text-opacity-50'],
    },
  },
  compoundVariants: [
    {
      className: ['text-sm', 'leading-tight'],
    },
  ],
  defaultVariants: {
    status: 'info',
  },
});

export type HintProps = React.HtmlHTMLAttributes<HTMLDivElement> &
  VariantProps<typeof hint> & {
    title?: React.ReactNode;
    message: React.ReactNode;
    icon?: React.ReactNode;
  };

// eslint-disable-next-line react/display-name
const Hint = ({ className, status, title, message, icon, ...props }: HintProps) => (
  <div className={hint({ status, className })} {...props}>
    <div className="flex items-center gap-4">
      <div className={hintIcon({ status })}>{icon}</div>
      <div>
        {title && <strong className={hintTitle({ status })}>{title}</strong>}
        <p className={hintMessage({ status })}>{message}</p>
      </div>
    </div>
  </div>
);

export default Hint;
