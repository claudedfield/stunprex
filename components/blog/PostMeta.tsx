// PostMeta — date, reading time, audience-layer chip
import type { AudienceLayer } from '@/lib/types/post';

interface Props {
  date: string;
  readingTime: number;
  audienceLayer: AudienceLayer;
  audienceLayerSecondary?: AudienceLayer;
}

const AUDIENCE_COLOUR: Record<AudienceLayer, string> = {
  Player:  'bg-orange/10 text-orange-700 border-orange/30',
  Parent:  'bg-deepblue/10 text-deepblue-700 border-deepblue/30',
  Coach:   'bg-brown/10 text-brown-400 border-brown/20',
  Halo:    'bg-mint border-deepblue/20 text-brown/70',
};

export function PostMeta({ date, readingTime, audienceLayer, audienceLayerSecondary }: Props) {
  const formatted = new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-brown/60 font-ui">
      <time dateTime={date} className="tabular-nums">
        {formatted}
      </time>
      <span aria-hidden className="text-brown/20">·</span>
      <span>{readingTime} min read</span>
      <span aria-hidden className="text-brown/20">·</span>
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${AUDIENCE_COLOUR[audienceLayer]}`}
      >
        {audienceLayer}
      </span>
      {audienceLayerSecondary && (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide opacity-70 ${AUDIENCE_COLOUR[audienceLayerSecondary]}`}
        >
          {audienceLayerSecondary}
        </span>
      )}
    </div>
  );
}
