/**
 * clientLogos.ts — Logo data for the 3-row infinite slider.
 * All files live in /public/logos/
 * Filenames match exactly what was placed in the folder.
 */

export interface ClientLogo {
  id:   string
  name: string
  file: string
}

export const clientLogos: ClientLogo[] = [
  { id: 'windworld',   name: 'Wind World',              file: 'Wind-World.png'              },
  { id: 'portescap',  name: 'Portescap',               file: 'Portescap.png'               },
  { id: 'lucy',       name: 'Lucy Electric',           file: 'Lucy-electric.png'           },
  { id: 'hitachi',    name: 'Hitachi',                 file: 'Hitachi.png'                 },
  { id: 'emerson',    name: 'Emerson',                 file: 'Emerson.png'                 },
  { id: 'schneider',  name: 'Schneider Electric',      file: 'Schneider-electric.png'      },
  { id: 'asb',        name: 'ASB',                     file: 'ASB.png'                     },
  { id: 'suzlon',     name: 'Suzlon',                  file: 'Suzlon.png'                  },
  { id: 'adani',      name: 'Adani',                   file: 'adani.png'                   },
  { id: 'ge',         name: 'GE',                      file: 'ge-electric.png'             },
  { id: 'thermo',     name: 'Thermo Fisher Scientific',file: 'Thermofisher-Scientific.png' },
]

// Row 1 — all logos, left to right
export const row1Logos = clientLogos

// Row 2 — reversed order for visual variety, scrolls opposite direction
export const row2Logos = [...clientLogos].reverse()

// Row 3 — offset start for staggered feel
export const row3Logos = [
  ...clientLogos.slice(4),
  ...clientLogos.slice(0, 4),
]
