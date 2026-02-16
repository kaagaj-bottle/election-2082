import { Button } from '@/components/ui/Button';
import { useLang } from '@/contexts/language-context';

interface PaginationControlsProps {
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
}

export function PaginationControls({
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  isLoading,
}: PaginationControlsProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  if (!hasPrevious && !hasNext) return null;

  return (
    <div className="flex items-center justify-center gap-4 pt-6">
      <Button
        variant="secondary"
        onClick={onPrevious}
        disabled={!hasPrevious || isLoading}
        isLoading={isLoading && hasPrevious}
      >
        {isNe ? 'अघिल्लो' : 'Previous'}
      </Button>
      <Button
        variant="secondary"
        onClick={onNext}
        disabled={!hasNext || isLoading}
        isLoading={isLoading && hasNext}
      >
        {isNe ? 'अर्को' : 'Next'}
      </Button>
    </div>
  );
}
