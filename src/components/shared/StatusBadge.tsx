import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

type Status = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled' | 'active' | 'inactive';

interface StatusBadgeProps {
  status: Status | string;
  className?: string;
}

const statusConfig: Record<Status, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'secondary' },
  assigned: { label: 'Assigned', variant: 'outline' },
  'in-progress': { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  active: { label: 'Active', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'secondary' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/_/g, '-') as Status;
  const config = statusConfig[normalizedStatus] || { label: status, variant: 'outline' as const };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
