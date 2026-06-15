// ─── Shared domain types ───────────────────────────────────────────────────

export interface Capability {
  id: string
  title: string
  description: string
  icon: string
  tags: string[]
  image?: string   // /images/capabilities/filename.jpg
}

export interface Stat {
  id: string
  number: string
  unit: string
  label: string
  descriptor: string
  isMono: boolean
}

export interface Client {
  id: string
  name: string
  logoPath: string
}

export interface Industry {
  id: string
  title: string
  description: string
  icon: string
}

export interface MachineSpec {
  label: string
  value: string
}

export interface Machine {
  id: string
  manufacturer: string
  model: string
  category: string
  specs: MachineSpec[]
  image?: string   // /images/machines/filename.jpg
}

export interface Product {
  id: string
  title: string
  category: string
  description: string
  imagePath: string
  tags: string[]
}
