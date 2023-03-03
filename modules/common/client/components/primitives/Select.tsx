import { normalizeProps, Portal, useMachine } from '@zag-js/react';
import * as select from '@zag-js/select';
import { cva, VariantProps } from 'class-variance-authority';
import { useEffect, useId } from 'react';
import { FiChevronDown } from 'react-icons/fi';

export const selectClasses = cva('select', {
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
        'border',
        'border-zinc-300',
        'w-full',
        'text-left',
        'bg-transparent',
        'outline-none',
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

export type SelectProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof selectClasses> & {
    options: { label: string; value: string }[];
    value?: string | string[];
    onChange?: (value: string | string[] | undefined) => void;
    placeholder?: string;
  };

export function Select({ size, status, className, value, onChange, placeholder, options }: SelectProps) {
  const [state, send] = useMachine(
    select.machine({
      id: useId(),
      onChange: (option) => onChange?.(option?.value ?? undefined),
    })
  );

  const api = select.connect(state, send, normalizeProps);

  useEffect(() => {
    if (value !== api.selectedOption?.value) {
      const selectedOption = options.find((option) => option.value === value);
      if (selectedOption) api.setSelectedOption(selectedOption);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button {...api.triggerProps} className={`${selectClasses({ size, status, className })}`}>
        <div className="flex items-center justify-between">
          <span className="block">{api.selectedOption?.label ?? placeholder ?? 'Select an option'}</span>
          <FiChevronDown />
        </div>
      </button>

      <Portal>
        <div {...api.positionerProps} className="relative z-50 ">
          <ul
            {...api.contentProps}
            style={{ width: 'var(--reference-width)' }}
            className="rounded-lg border border-zinc-200 bg-white p-1 text-sm text-zinc-600 shadow-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          >
            {options.map(({ label, value }) => (
              <li
                className="flex cursor-pointer items-center justify-start gap-3 rounded-md px-4 py-1.5 not-italic text-zinc-700 data-[focus]:bg-zinc-100 data-[checked]:font-bold data-[checked]:text-zinc-900 dark:text-zinc-300 dark:data-[focus]:bg-zinc-800 dark:data-[checked]:text-white"
                key={value}
                {...api.getOptionProps({ label, value })}
              >
                <span>{label}</span>
                {value === api.selectedOption?.value && '✓'}
              </li>
            ))}
          </ul>
        </div>
      </Portal>
    </>
  );
}
