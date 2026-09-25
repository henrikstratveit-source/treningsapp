import type { Exercise, ExerciseType, Muscle } from '../../domain/types'

// Fra SPEC.md seksjon 4.
function ex(
  id: string,
  name: string,
  type: ExerciseType,
  step: number,
  rest: number,
  muscles: [Muscle, 1 | 0.5][],
): Exercise {
  return { id, name, type, step, rest, muscles: muscles.map(([muscle, share]) => ({ muscle, share })) }
}

export const seedExercises: Exercise[] = [
  ex('chest_press', 'Chest press maskin', 'flerledd', 5, 120, [['bryst', 1], ['fremre skulder', 0.5], ['triceps', 0.5]]),
  ex('incline_press', 'Incline press maskin', 'flerledd', 5, 120, [['bryst', 1], ['fremre skulder', 0.5], ['triceps', 0.5]]),
  ex('flyes', 'Flyes maskin (pec deck)', 'isolasjon', 5, 75, [['bryst', 1]]),
  ex('shoulder_press', 'Skulderpress maskin, sittende', 'flerledd', 5, 120, [['fremre skulder', 1], ['sideskulder', 0.5], ['triceps', 0.5]]),
  ex('lateral_db', 'Sidehev med manualer', 'isolasjon', 2, 75, [['sideskulder', 1]]),
  ex('lateral_cable', 'Sidehev i kabel', 'isolasjon', 2.5, 75, [['sideskulder', 1]]),
  ex('pulldown', 'Nedtrekk med stang', 'flerledd', 5, 120, [['rygg', 1], ['biceps', 0.5]]),
  ex('seated_row', 'Sittende roing', 'flerledd', 5, 120, [['rygg', 1], ['biceps', 0.5], ['bakre skulder', 0.5]]),
  ex('db_row', 'Enarms manualroing', 'flerledd', 2, 90, [['rygg', 1], ['biceps', 0.5]]),
  ex('reverse_pec_deck', 'Omvendt pec deck', 'isolasjon', 5, 75, [['bakre skulder', 1]]),
  ex('leg_press', 'Leggpress', 'flerledd', 5, 120, [['framside lår', 1], ['sete', 0.5]]),
  ex('leg_extension', 'Beinspark', 'isolasjon', 5, 75, [['framside lår', 1]]),
  ex('leg_curl_seated', 'Sittende lårcurl', 'isolasjon', 5, 75, [['baklår', 1]]),
  ex('leg_curl_lying', 'Liggende lårcurl', 'isolasjon', 5, 75, [['baklår', 1]]),
  ex('calf_raise_standing', 'Stående tåhev', 'isolasjon', 5, 75, [['legger', 1]]),
  ex('triceps_overhead_rope', 'Triceps over hodet med tau', 'isolasjon', 2.5, 75, [['triceps', 1]]),
  ex('triceps_overhead_db', 'Triceps over hodet med manual', 'isolasjon', 2, 75, [['triceps', 1]]),
  ex('pushdown_rope', 'Triceps pushdown med tau', 'isolasjon', 2.5, 75, [['triceps', 1]]),
  ex('cable_curl_bar', 'Bicepscurl i kabel med stang', 'isolasjon', 2.5, 75, [['biceps', 1]]),
  ex('hammer_curl_rope', 'Hammercurl med tau', 'isolasjon', 2.5, 75, [['biceps', 1]]),
  ex('incline_db_curl', 'Skråbenk-curl med manualer', 'isolasjon', 2, 75, [['biceps', 1]]),
]
