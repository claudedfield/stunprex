/**
 * Barrel export for the StunpreX drill diagram system.
 * Part of Style System v1 §6.6.
 */
export { DrillDiagram } from './DrillDiagram';
export type { DrillDiagramProps } from './DrillDiagram';

export { PitchSmallBackground, PITCH_SMALL_VIEWBOX } from './PitchSmall';
export { PitchHalfBackground, PITCH_HALF_VIEWBOX } from './PitchHalf';
export { PitchFullBackground, PITCH_FULL_VIEWBOX } from './PitchFull';

export { Cone }   from './Cone';
export { Player } from './Player';
export { Ball }   from './Ball';
export { Arrow }  from './Arrow';
export { Zone }   from './Zone';
export { Label }  from './Label';

export type {
  DiagramSpec,
  DrillElement,
  ConeElement,
  PlayerElement,
  BallElement,
  ArrowElement,
  ZoneElement,
  LabelElement,
  ConeColor,
  PlayerTeam,
  ArrowKind,
  ArrowStyle,
  PitchSize,
} from './types';
