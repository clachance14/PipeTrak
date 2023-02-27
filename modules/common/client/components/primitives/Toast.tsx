import { normalizeProps, useActor, useMachine } from '@zag-js/react';
import * as toast from '@zag-js/toast';
import { cva } from 'class-variance-authority';
import { createContext, PropsWithChildren, useContext } from 'react';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo, FiLoader, FiX } from 'react-icons/fi';

export const toastTypeClasses = cva('toastTitle', {
  variants: {
    type: {
      success: ['text-emerald-500'],
      info: ['text-blue-500'],
      warning: ['text-amber-500'],
      error: ['text-rose-500'],
      loading: ['text-blue-500'],
      custom: ['bg-zinc-700'],
    },
  },
});

const toastTypeIcon = {
  success: FiCheckCircle,
  info: FiInfo,
  warning: FiAlertCircle,
  error: FiAlertTriangle,
  loading: FiLoader,
};

function Toast({ actor }: { actor: toast.Service }) {
  const [state, send] = useActor(actor);
  const api = toast.connect(state, send, normalizeProps);
  const { type } = api;

  const ToastIcon = api.type in toastTypeIcon ? toastTypeIcon[api.type as keyof typeof toastTypeIcon] : null;

  return (
    <div
      {...api.rootProps}
      className={`relative w-full max-w-sm rounded-xl border bg-white p-4 py-4 pr-10 shadow-xl dark:border-zinc-700 dark:bg-zinc-900`}
    >
      <div className="flex items-center gap-3">
        {ToastIcon ? (
          <ToastIcon
            className={`${toastTypeClasses({
              type,
              className: `text-2xl ${type === 'loading' ? 'animate-spin' : ''}`,
            })}`}
          />
        ) : null}

        <div>
          <h3 {...api.titleProps} className={`${toastTypeClasses({ type, className: 'text-base font-bold' })}`}>
            {api.title}
          </h3>
          <p className="text-sm leading-tight opacity-50" {...api.descriptionProps}>
            {api.description}
          </p>
        </div>
      </div>

      <button onClick={api.dismiss} className="absolute right-3 top-3 p-1 hover:opacity-70">
        <FiX />
        <span className="sr-only">Cancel</span>
      </button>
    </div>
  );
}

type ToastContextType = ReturnType<(typeof toast)['group']['connect']> | null;

const ToastContext = createContext<ToastContextType>(null);

export function ToastProvider({ children }: PropsWithChildren<{}>) {
  const [state, send] = useMachine(toast.group.machine({ id: '1', offsets: '1rem' }));

  const api = toast.group.connect(state, send, normalizeProps);

  return (
    <ToastContext.Provider value={api}>
      {Object.entries(api.toastsByPlacement).map(([placement, toasts]) => (
        <div
          className="pointer-events-none"
          key={placement}
          {...api.getGroupProps({ placement: placement as toast.Placement })}
        >
          {toasts.map((toast) => (
            <Toast key={toast.id} actor={toast} />
          ))}
        </div>
      ))}

      {children}
    </ToastContext.Provider>
  );
}

export const useToast = (): Exclude<ToastContextType, null> => useContext(ToastContext)!;
