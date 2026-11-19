import React from 'react';

interface KeycapProps {
  label: string;
  size?: 'sm' | 'md' | 'xl';
  variant?: 'default' | 'active';
  className?: string;
}

export const Keycap: React.FC<KeycapProps> = ({
  label,
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'min-w-[28px] h-[28px] px-1.5 text-xs rounded border border-b-2',
    md: 'min-w-[40px] h-[40px] px-2.5 text-base rounded-md border border-b-[3px]',
    xl: 'min-w-[96px] h-[96px] px-5 text-5xl rounded-xl border border-b-4',
  }[size];

  const variantClasses = {
    default:
      'bg-[#1E222A] text-[#F3F4F6] border-[#303642] border-b-[#111318]',
    active:
      'bg-[#F9FAFB] text-[#111827] border-[#D1D5DB] border-b-[#9CA3AF]',
  }[variant];

  return (
    <kbd
      className={`inline-flex items-center justify-center font-mono font-bold select-none leading-none tracking-tight ${sizeClasses} ${variantClasses} ${className}`}
    >
      {label}
    </kbd>
  );
};
