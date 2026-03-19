import { useToastStore } from '@/stores/toastStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-5',
            toast.variant === 'destructive'
              ? 'border-destructive/50 bg-destructive text-destructive-foreground'
              : toast.variant === 'success'
              ? 'border-green-200 bg-green-50 text-green-900'
              : 'border-border bg-card text-card-foreground'
          )}
        >
          {toast.variant === 'success' && <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />}
          {toast.variant === 'destructive' && <AlertCircle className="h-5 w-5 shrink-0" />}
          {(!toast.variant || toast.variant === 'default') && <Info className="h-5 w-5 shrink-0 text-primary" />}
          <div className="flex-1">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description && (
              <p className="mt-1 text-sm opacity-90">{toast.description}</p>
            )}
          </div>
          <button onClick={() => removeToast(toast.id)} className="shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
