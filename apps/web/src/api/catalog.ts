import type { Catalog, Tree } from '../types';

export const catalog: Catalog = {
  species: [
    {
      id: 'guayacan',
      name: 'Guayacán amarillo',
      scientificName: 'Handroanthus chrysanthus',
      description: 'Flores amarillas que iluminan el paisaje y ofrecen refugio a polinizadores.',
      icon: 'flower',
      tags: ['Floración', 'Polinizadores'],
      height: 'Hasta 20 m',
      benefit: 'Favorece polinizadores',
      image: '/images/guayacan-amarillo.jpg',
    },
    {
      id: 'cedro',
      name: 'Cedro',
      scientificName: 'Cedrela odorata',
      description: 'Un árbol de gran porte que aporta sombra y estructura a los corredores verdes.',
      icon: 'tree',
      tags: ['Sombra', 'Bosque'],
      height: 'Hasta 30 m',
      benefit: 'Aporta sombra',
      image: '/images/cedro.jpg',
    },
    {
      id: 'ocobo',
      name: 'Ocobo rosado',
      scientificName: 'Tabebuia rosea',
      description: 'Su floración rosada da color a los espacios verdes y atrae vida silvestre.',
      icon: 'leaves',
      tags: ['Floración', 'Fauna'],
      height: 'Hasta 25 m',
      benefit: 'Conecta hábitats',
      image: '/images/ocobo-rosado.jpg',
    },
  ],
  zones: [
    {
      id: 'norte',
      name: 'Norte',
      region: 'Comuna 1 y 2 · Río de Oro, Bucaramanga',
      description: 'Corredor ecológico y ronda del Río de Oro en el norte de Bucaramanga. Zona de referencia aproximada para restauración forestal.',
      coordinates: [7.158, -73.132],
      mapPosition: [42, 20],
    },
    {
      id: 'oriente',
      name: 'Oriente',
      region: 'Cerros Orientales · Morrorrico, Bucaramanga',
      description: 'Ladera de protección y reserva de los Cerros Orientales. Cobertura vegetal clave para regulación hídrica.',
      coordinates: [7.1265, -73.098],
      mapPosition: [76, 46],
    },
    {
      id: 'sur',
      name: 'Sur',
      region: 'Comuna 10 · Quebrada La Iglesia, Bucaramanga',
      description: 'Corredor verde de ladera sur y cuenca de la Quebrada La Iglesia, conectando con el Parque Las Cigarras.',
      coordinates: [7.086, -73.118],
      mapPosition: [50, 80],
    },
  ],
};

export const initialTrees: Tree[] = [
  {
    id: 'AD-1024',
    name: 'Luna',
    speciesId: 'guayacan',
    zoneId: 'oriente',
    plantedAt: '2025-04-22',
    status: 'En seguimiento',
    timeline: [
      { month: 'Abr 2025', title: 'Una nueva historia comienza', description: 'El árbol fue sembrado y registrado en su zona.', image: '/images/planting-seedling.jpg' },
      { month: 'Oct 2025', title: 'Primer seguimiento', description: 'Una imagen y una nota permiten conocer cómo avanza su crecimiento.', image: '/images/sapling-monitoring.jpg' },
      { month: 'Abr 2026', title: 'Un año creciendo', description: 'La próxima actualización muestra el desarrollo del árbol y su entorno.', image: '/images/guayacan-amarillo.jpg' },
    ],
  },
  {
    id: 'AD-1025',
    name: 'Raíz',
    speciesId: 'cedro',
    zoneId: 'norte',
    plantedAt: '2025-09-18',
    status: 'Sembrado',
    timeline: [
      { month: 'Sep 2025', title: 'Siembra en zona norte', description: 'El cedro inició su proceso de arraigo en el corredor verde.', image: '/images/planting-seedling.jpg' },
      { month: 'Mar 2026', title: 'Seguimiento semestral', description: 'Nuevos brotes y desarrollo saludable de la estructura del árbol.', image: '/images/sapling-monitoring.jpg' },
    ],
  },
  {
    id: 'AD-1026',
    name: 'Aurora',
    speciesId: 'ocobo',
    zoneId: 'sur',
    plantedAt: '2026-02-12',
    status: 'En preparación',
    timeline: [
      { month: 'Feb 2026', title: 'Preparación de terreno', description: 'Selección de plántula de ocobo rosado y adecuación en Parque La Flora.', image: '/images/sapling.webp' },
    ],
  },
];
