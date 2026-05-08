interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-[#F0EFEC] flex items-center justify-center mb-4 text-[#999]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#1A1A1A]">{title}</h3>
      {description && (
        <p className="text-sm text-[#6B6B6B] mt-1.5 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
