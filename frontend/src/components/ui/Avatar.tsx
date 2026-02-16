interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-20 w-20 text-xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${sizeClasses[size]}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary-200 font-medium text-primary-700 dark:bg-primary-800 dark:text-primary-200 ${sizeClasses[size]}`}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
