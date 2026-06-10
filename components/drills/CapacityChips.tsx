// CapacityChips — renders primary (filled) and secondary (outlined) capacity chips.
// Uses canonical Chip component — Style System §5.3.
import { Chip } from '@/components/Chip';

interface Props {
  primary: string[];
  secondary: string[];
}

export function CapacityChips({ primary, secondary }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {primary.map((cap) => (
        <Chip key={cap} active>
          {cap}
        </Chip>
      ))}
      {secondary.map((cap) => (
        <Chip key={cap}>
          {cap}
        </Chip>
      ))}
    </div>
  );
}
