import { cn } from '@/lib/utils';

type Props = {
  meals: string[] | null | undefined;
  className?: string;
  placeholder?: string;
};

export function FavoriteMealsList({ meals, className, placeholder = '好きなご飯: 未設定' }: Props) {
  if (!meals || meals.length === 0) {
    return <p className={cn('text-sm text-slate-500', className)}>{placeholder}</p>;
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {meals.map((meal) => (
        <span
          key={meal}
          className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-semibold text-slate-700"
        >
          {meal}
        </span>
      ))}
    </div>
  );
}
