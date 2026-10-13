/// <reference types="vite/client" />

const mockApiBaseUrl = (import.meta.env.VITE_MOCKAPI_BASE_URL || 'https://6ace6182f338359cf1c37610.mockapi.io/adoptree-api')
  .replace(/\/+$/, '');

export const MOCKAPI_CONFIG = {
  BASE_URL: mockApiBaseUrl,
  TREES_URL: `${mockApiBaseUrl}/tree`,
  SELECTIONS_URL: `${mockApiBaseUrl}/selections`,
};

export const MAX_USER_SELECTIONS = 5;
export const MAX_USER_SELECTIONS_MESSAGE =
  'Ya tienes cinco árboles en tu panel. Gestiona tus árboles actuales antes de adoptar otro';

export type ApiTree = {
  id: string;
  name: string;
  species: string;
  zone: string;
  zoneId: 'norte' | 'oriente' | 'sur';
  image: string;
  description: string;
  rawId?: string;
};

export type ApiSelection = {
  id: string;
  userId: string;
  treeId: string;
  treeName: string;
  zone: string;
  createdAt: string;
  species?: string;
  description?: string;
  image?: string;
  status: 'Árbol no plantado' | 'En proceso';
};

export type CreateSelectionInput = {
  userId: string;
  treeId: string;
  treeName: string;
  zone: string;
  species: string;
  description: string;
  image: string;
};

type SelectionRecord = Omit<ApiSelection, 'id' | 'status'> & {
  id?: string | number;
  status?: string;
};

function normalizeSelection(item: SelectionRecord): ApiSelection {
  return {
    id: String(item.id || ''),
    userId: String(item.userId || ''),
    treeId: String(item.treeId || ''),
    treeName: String(item.treeName || 'Árbol sin nombre'),
    zone: String(item.zone || 'Bucaramanga'),
    createdAt: String(item.createdAt || new Date().toISOString()),
    species: item.species ? String(item.species) : undefined,
    description: item.description ? String(item.description) : undefined,
    image: item.image ? resolveTreeImage(String(item.species || ''), String(item.image)) : undefined,
    status: item.status === 'En proceso' ? 'En proceso' : 'Árbol no plantado',
  };
}

const SPECIES_IMAGE_MAP: Record<string, string> = {
  'guayacán amarillo': '/images/guayacan-amarillo.jpg',
  'guayacan amarillo': '/images/guayacan-amarillo.jpg',
  'guayacán': '/images/guayacan-amarillo.jpg',
  'guayacan': '/images/guayacan-amarillo.jpg',
  'cedro': '/images/cedro.jpg',
  'ocobo rosado': '/images/ocobo-rosado.jpg',
  'ocobo': '/images/ocobo-rosado.jpg',
};

export function normalizeZone(zoneRaw: string): { name: string; id: 'norte' | 'oriente' | 'sur' } {
  const z = (zoneRaw || '').trim().toLowerCase();
  if (z.includes('north') || z.includes('norte')) {
    return { name: 'Norte', id: 'norte' };
  }
  if (z.includes('east') || z.includes('orient')) {
    return { name: 'Oriente', id: 'oriente' };
  }
  return { name: 'Sur', id: 'sur' };
}

export function resolveTreeImage(species: string, currentImage?: string): string {
  if (currentImage && currentImage.trim().length > 0 && !currentImage.includes('example.com')) {
    return currentImage.trim();
  }
  const key = (species || '').trim().toLowerCase();
  for (const [mapKey, img] of Object.entries(SPECIES_IMAGE_MAP)) {
    if (key.includes(mapKey)) return img;
  }
  return '/images/planting-seedling.jpg';
}

/**
 * Obtener todos los árboles disponibles desde MockAPI
 */
export async function fetchMockApiTrees(): Promise<ApiTree[]> {
  try {
    const response = await fetch(MOCKAPI_CONFIG.TREES_URL);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudo cargar el catálogo de árboles desde MockAPI.`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('La respuesta de MockAPI para árboles no es un arreglo válido.');
    }

    return data.map((item: any, index: number) => {
      const realId = item.id ? String(item.id) : `tree-${(item.name || index).toLowerCase().replace(/\s+/g, '-')}`;
      const zoneInfo = normalizeZone(item.zone);
      const image = resolveTreeImage(item.species, item.image);

      return {
        id: realId,
        rawId: item.id ? String(item.id) : undefined,
        name: item.name || `Árbol ${index + 1}`,
        species: item.species || 'Especie nativa',
        zone: zoneInfo.name,
        zoneId: zoneInfo.id,
        image,
        description: item.description || 'Árbol nativo en proceso de seguimiento para el corredor verde de Bucaramanga.',
      };
    });
  } catch (error) {
    console.error('Error al conectar con MockAPI (trees):', error);
    throw error;
  }
}

/**
 * Obtener todas las selecciones desde MockAPI
 */
export async function fetchMockApiSelections(): Promise<ApiSelection[]> {
  try {
    const response = await fetch(MOCKAPI_CONFIG.SELECTIONS_URL);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudieron cargar las selecciones desde MockAPI.`);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map((item: SelectionRecord) => normalizeSelection(item));
  } catch (error) {
    console.error('Error al conectar con MockAPI (selections):', error);
    throw error;
  }
}

/**
 * Obtener las selecciones de un usuario específico desde MockAPI
 */
export async function fetchUserSelections(userId: string): Promise<ApiSelection[]> {
  if (!userId) return [];
  try {
    // MockAPI soporta filtrado por query params
    const url = `${MOCKAPI_CONFIG.SELECTIONS_URL}?userId=${encodeURIComponent(userId)}`;
    const response = await fetch(url);
    if (!response.ok) {
      // Fallback a filtrar en memoria si el endpoint con query falla
      const all = await fetchMockApiSelections();
      return all.filter((s) => s.userId === userId);
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }
    // Filtrado estricto adicional en memoria para aislar la privacidad del usuario
    return data
      .filter((s: any) => String(s.userId) === userId)
      .map((item: SelectionRecord) => normalizeSelection(item));
  } catch (error) {
    console.error('Error al obtener selecciones de usuario:', error);
    throw error;
  }
}

/**
 * Crear una nueva selección en MockAPI evitando duplicados para el mismo usuario y árbol
 */
export async function createMockApiSelection(input: CreateSelectionInput): Promise<ApiSelection> {
  const { userId, treeId, treeName, zone, species, description, image } = input;
  if (!userId || !treeId) {
    throw new Error('Se requiere el ID del usuario y el ID del árbol para crear una selección.');
  }

  // 1. Evitar registros duplicados: verificar si el usuario ya seleccionó este árbol
  const existing = await fetchUserSelections(userId);
  const alreadySelected = existing.some((s) => s.treeId === treeId);
  if (alreadySelected) {
    throw new Error(`Ya tienes una selección registrada para el árbol "${treeName}".`);
  }
  if (existing.length >= MAX_USER_SELECTIONS) {
    throw new Error(MAX_USER_SELECTIONS_MESSAGE);
  }

  // 2. Realizar POST en MockAPI
  const payload = {
    userId,
    treeId,
    treeName: treeName.trim(),
    zone: zone.trim(),
    species,
    description,
    image,
    status: 'Árbol no plantado' as const,
    createdAt: new Date().toISOString(),
  };

  const response = await fetch(MOCKAPI_CONFIG.SELECTIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: No se pudo guardar la selección en MockAPI.`);
  }

  const created = await response.json();
  return normalizeSelection(created as SelectionRecord);
}

export async function updateMockApiSelection(
  selection: ApiSelection,
  updates: Partial<Pick<ApiSelection, 'status'>>
): Promise<ApiSelection> {
  if (!selection.id) {
    throw new Error('No se pudo actualizar el árbol.');
  }

  try {
    const response = await fetch(`${MOCKAPI_CONFIG.SELECTIONS_URL}/${encodeURIComponent(selection.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...selection, ...updates }),
    });
    if (!response.ok) {
      throw new Error(`No se pudo guardar el cambio de estado (error ${response.status}).`);
    }

    return normalizeSelection((await response.json()) as SelectionRecord);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo guardar el cambio de estado. Comprueba tu conexión e inténtalo de nuevo.');
    }
    throw error;
  }
}

/**
 * Eliminar una selección de MockAPI por su ID real
 */
export async function deleteMockApiSelection(selectionId: string): Promise<boolean> {
  if (!selectionId) {
    throw new Error('Se requiere el ID de la selección para eliminarla.');
  }

  const url = `${MOCKAPI_CONFIG.SELECTIONS_URL}/${encodeURIComponent(selectionId)}`;
  const response = await fetch(url, { method: 'DELETE' });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Error ${response.status}: No se pudo eliminar la selección en MockAPI.`);
  }

  return true;
}
