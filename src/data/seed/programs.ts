import type { Program, ProgramSession, Slot } from '../../domain/types'

// Fra SPEC.md seksjon 5.
type SlotOpts = { alt?: string[]; optional?: boolean }

function slot(exerciseId: string, sets: number, repMin: number, repMax: number, opts: SlotOpts = {}): Slot {
  return { exerciseId, sets, repMin, repMax, optional: opts.optional ?? false, alternatives: opts.alt ?? [] }
}

function session(id: string, name: string, slots: Slot[], bonus = false): ProgramSession {
  return { id, name, bonus, slots }
}

const lateral = (sets = 3, opts: SlotOpts = { alt: ['lateral_cable'] }) => slot('lateral_db', sets, 12, 20, opts)

export const BRO_SPLIT_ID = 'bro_split'
export const UPPER_LOWER_ID = 'upper_lower'

export const seedPrograms: Program[] = [
  {
    id: BRO_SPLIT_ID,
    name: 'Bro split',
    builtIn: true,
    sessions: [
      session('bryst_skuldre', 'Bryst og skuldre', [
        slot('chest_press', 3, 10, 15),
        slot('incline_press', 3, 10, 15),
        slot('flyes', 3, 10, 15),
        slot('shoulder_press', 3, 10, 15),
        lateral(),
      ]),
      session('rygg', 'Rygg', [
        slot('pulldown', 3, 10, 15),
        slot('seated_row', 3, 10, 15),
        slot('db_row', 3, 10, 15),
        slot('reverse_pec_deck', 3, 12, 20),
        lateral(),
      ]),
      session('bein', 'Bein', [
        slot('leg_press', 3, 10, 15),
        slot('leg_extension', 3, 10, 15),
        slot('leg_curl_seated', 3, 10, 15, { alt: ['leg_curl_lying'] }),
        slot('calf_raise_standing', 3, 12, 20),
      ]),
      session('armer', 'Armer', [
        slot('triceps_overhead_rope', 3, 10, 15),
        slot('cable_curl_bar', 3, 10, 15),
        slot('pushdown_rope', 3, 10, 15),
        slot('hammer_curl_rope', 3, 10, 15),
        lateral(),
      ]),
    ],
  },
  {
    id: UPPER_LOWER_ID,
    name: 'Overkropp/underkropp',
    builtIn: true,
    sessions: [
      session('overkropp_a', 'Overkropp A', [
        slot('chest_press', 3, 10, 15),
        slot('pulldown', 3, 10, 15),
        lateral(3, {}),
        slot('seated_row', 2, 10, 15),
        slot('hammer_curl_rope', 2, 10, 15),
      ]),
      session('bein', 'Bein', [
        slot('leg_press', 3, 10, 15),
        slot('leg_curl_seated', 3, 10, 15, { alt: ['leg_curl_lying'] }),
        slot('leg_extension', 3, 10, 15),
        lateral(3, { optional: true }),
      ]),
      session('overkropp_b', 'Overkropp B', [
        slot('incline_press', 3, 10, 15),
        slot('db_row', 3, 10, 15),
        slot('lateral_cable', 3, 12, 20, { alt: ['lateral_db'] }),
        slot('flyes', 2, 10, 15),
        slot('triceps_overhead_rope', 2, 10, 15),
      ]),
      session(
        'skuldre_armer',
        'Skuldre og armer',
        [
          lateral(4, {}),
          slot('incline_db_curl', 3, 10, 15),
          slot('triceps_overhead_db', 3, 10, 15),
          slot('reverse_pec_deck', 2, 12, 20),
          slot('hammer_curl_rope', 2, 10, 15),
        ],
        true,
      ),
    ],
  },
]
