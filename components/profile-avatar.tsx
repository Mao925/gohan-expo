import { cn } from '@/lib/utils';
import { resolveProfileImageUrl } from '@/lib/profile-image';

type ProfileAvatarProps = {
  imageUrl?: string | null;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

export function ProfileAvatar({
  imageUrl,
  name,
  className,
  size = 'md',
}: ProfileAvatarProps) {
  const url = resolveProfileImageUrl(imageUrl);
  const fallbackText = name?.[0] ?? '？';

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-[10px]'
      : size === 'lg'
      ? 'h-14 w-14 text-sm'
      : 'h-10 w-10 text-xs';

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500',
        sizeClass,
        className
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name ?? 'プロフィール画像'} className="h-full w-full object-cover" />
      ) : (
        <span>{fallbackText}</span>
      )}
    </div>
  );
}
