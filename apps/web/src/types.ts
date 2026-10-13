export type Species = { id: string; name: string; scientificName: string; description: string; icon: string; tags: string[]; height: string; benefit: string; image?: string };
export type Zone = { id: string; name: string; region: string; description: string; coordinates: [number, number]; mapPosition: [number, number] };
export type TimelineEvent = { month: string; title: string; description: string; image?: string };
export type Tree = { id: string; name: string; speciesId: string; speciesName?: string; zoneId: string; plantedAt: string | null; status: 'En preparación' | 'Sembrado' | 'En seguimiento' | 'Árbol no plantado' | 'En proceso'; timeline: TimelineEvent[]; amountUsd?: number; charged?: boolean };
export type Catalog = { species: Species[]; zones: Zone[] };
