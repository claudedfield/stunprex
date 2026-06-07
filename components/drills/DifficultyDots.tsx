// DifficultyDots — renders filled/unfilled dots for baseline → elite difficulty.
interface Props {
  baseline: number;
  elite: number;
  max?: number;
}

export function DifficultyDots({ baseline, elite, max = 5 }: Props) {
  return (
    <span className="inline-flex items-center gap-0.5 font-ui text-xs text-brown/60" aria-label={`Difficulty: ${baseline} to ${elite} out of ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={
            i < baseline
              ? 'inline-block w-2 h-2 rounded-full bg-orange'
              : i < elite
              ? 'inline-block w-2 h-2 rounded-full bg-orange/40'
              : 'inline-block w-2 h-2 rounded-full bg-brown/15'
          }
        />
      ))}
      <span className="ml-1 text-brown/50">
        {baseline}→{elite}
      </span>
    </span>
  );
}
