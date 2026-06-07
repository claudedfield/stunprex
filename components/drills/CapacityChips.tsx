// CapacityChips — renders primary (filled) and secondary (outlined) capacity chips.
interface Props {
  primary: string[];
  secondary: string[];
}

export function CapacityChips({ primary, secondary }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {primary.map((cap) => (
        <span
          key={cap}
          className="inline-flex items-center rounded bg-deepblue/10 px-2 py-0.5 text-xs font-semibold text-deepblue font-ui"
        >
          {cap}
        </span>
      ))}
      {secondary.map((cap) => (
        <span
          key={cap}
          className="inline-flex items-center rounded border border-deepblue/25 px-2 py-0.5 text-xs font-semibold text-deepblue/70 font-ui"
        >
          {cap}
        </span>
      ))}
    </div>
  );
}
