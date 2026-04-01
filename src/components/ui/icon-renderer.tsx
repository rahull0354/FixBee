import * as LucideIcons from "lucide-react";

interface IconRendererProps {
  iconName: string | undefined | null;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Dynamically renders a Lucide icon by name
 * Usage: <IconRenderer iconName="Wrench" className="h-5 w-5" />
 */
export function IconRenderer({
  iconName,
  className = "h-5 w-5",
  fallback,
}: IconRendererProps) {
  if (!iconName) {
    return fallback ? <>{fallback}</> : null;
  }

  const IconComponent = (LucideIcons as any)[iconName];

  if (!IconComponent) {
    return fallback ? <>{fallback}</> : null;
  }

  return <IconComponent className={className} />;
}
