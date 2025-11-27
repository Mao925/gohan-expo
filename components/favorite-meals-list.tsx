import { cn } from '@/lib/utils';

type Props = {
  meals: string[] | null | undefined;
  className?: string;
  placeholder?: string;
  // 自分の favoriteMeals（未指定なら従来通りの表示）
  highlightMeals?: string[];
  variant?: 'pill' | 'plain';
};

export function FavoriteMealsList({ meals, className, placeholder = '好きなご飯: 未設定', highlightMeals, variant = 'pill' }: Props) {
  if (!meals || meals.length === 0) {
    return <p className={cn('text-sm text-slate-500', className)}>{placeholder}</p>;
  }

  const highlightSet = new Set(highlightMeals ?? []);

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {meals.map((meal) => {
        const isHighlight = highlightSet.has(meal);
        return (
          <span
            key={meal}
            className={cn(
              variant === 'pill' ? 'rounded-full border px-3 py-1 text-xs font-semibold transition' : 'text-sm',
              isHighlight
                ? variant === 'pill'
                  ? 'border-orange-300 bg-orange-100 text-orange-800'
                  : 'text-orange-700'
                : variant === 'pill'
                  ? 'border-orange-100 bg-orange-50 text-slate-700'
                  : 'text-slate-600'
            )}
          >
            {meal}
          </span>
        );
      })}
    </div>
  );
}
