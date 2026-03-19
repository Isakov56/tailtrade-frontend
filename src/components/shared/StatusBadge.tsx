import { cn } from '@/utils/cn';
import { getStatusColor } from '@/utils/format';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();

  const label = t(`status.${status}`, status.replace(/_/g, ' '));

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getStatusColor(status),
        className
      )}
    >
      {label}
    </span>
  );
}
