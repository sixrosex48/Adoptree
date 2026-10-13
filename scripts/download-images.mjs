import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const destDir = path.resolve(__dirname, '../apps/web/public/images');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const images = [
  {
    filename: 'guayacan-amarillo.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Araguaney_%28Tabebuia_chrysanta%29.jpg/1280px-Araguaney_%28Tabebuia_chrysanta%29.jpg',
    species: 'Guayacán amarillo (Handroanthus chrysanthus)',
    author: 'Juan Manuel Llanos De Sousa',
    license: 'CC BY-SA 3.0',
    source: 'Wikimedia Commons'
  },
  {
    filename: 'cedro.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/All%C3%A9s_des_Cedrela_odorata_%C3%A0_Ambohitsilaozana.jpg/1280px-All%C3%A9s_des_Cedrela_odorata_%C3%A0_Ambohitsilaozana.jpg',
    species: 'Cedro (Cedrela odorata)',
    author: 'Anissah586',
    license: 'CC BY-SA 4.0',
    source: 'Wikimedia Commons'
  },
  {
    filename: 'ocobo-rosado.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Guayac%C3%A1n_rosado_%28Tabebuia_rosea%29_%2814550606247%29.jpg/1280px-Guayac%C3%A1n_rosado_%28Tabebuia_rosea%29_%2814550606247%29.jpg',
    species: 'Ocobo rosado (Tabebuia rosea)',
    author: 'Alejandro Bayer Tamayo (Armenia, Colombia)',
    license: 'CC BY-SA 2.0',
    source: 'Wikimedia Commons'
  },
  {
    filename: 'planting-seedling.jpg',
    url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80',
    species: 'Brote y siembra de árbol / Reforestación',
    author: 'Gabriel Jimenez',
    license: 'Unsplash License (Free to use, commercial and non-commercial)',
    source: 'Unsplash'
  },
  {
    filename: 'sapling-monitoring.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Palaquium_ravii_sapling_planted_in_Candura_restoration_site.jpg/1280px-Palaquium_ravii_sapling_planted_in_Candura_restoration_site.jpg',
    species: 'Árbol joven en seguimiento de restauración ecológica',
    author: 'T. R. Shankar Raman',
    license: 'CC BY-SA 4.0',
    source: 'Wikimedia Commons'
  },
  {
    filename: 'nature-canopy.jpg',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
    species: 'Dosel y bosque verde / Corredor ecológico',
    author: 'Sebastian Unrau',
    license: 'Unsplash License (Free to use, commercial and non-commercial)',
    source: 'Unsplash'
  },
  {
    filename: 'bucaramanga-flora.jpg',
    url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Parque_Caracol%C3%AD_Bucaramanga_Sder_enr_2022.jpg/1280px-Parque_Caracol%C3%AD_Bucaramanga_Sder_enr_2022.jpg',
    species: 'Corredor verde urbano en Bucaramanga, Santander',
    author: 'EEIM',
    license: 'CC BY-SA 4.0',
    source: 'Wikimedia Commons'
  }
];

async function download() {
  console.log(`Descargando ${images.length} imágenes en ${destDir}...`);
  const manifest = [];

  for (const item of images) {
    const targetPath = path.join(destDir, item.filename);
    console.log(`Descargando ${item.filename} desde ${item.source}...`);
    const res = await fetch(item.url, {
      headers: {
        'User-Agent': 'AdoptreeApp/1.0 (Nature Conservation Educational Project)'
      }
    });

    if (!res.ok) {
      throw new Error(`Error ${res.status} al descargar ${item.filename}`);
    }

    const fileStream = fs.createWriteStream(targetPath);
    await pipeline(res.body, fileStream);
    const stat = fs.statSync(targetPath);
    console.log(`✓ ${item.filename} guardado con éxito (${Math.round(stat.size / 1024)} KB)`);

    manifest.push({
      file: `/images/${item.filename}`,
      title: item.species,
      author: item.author,
      license: item.license,
      source: item.source,
      sizeBytes: stat.size
    });
  }

  // Guardar archivo de atribución de licencias
  const licensesFile = path.resolve(__dirname, '../apps/web/public/images/ATTRIBUTION.md');
  const markdown = `# Atribución de imágenes y licencias - AdopTree

Todas las imágenes utilizadas en este proyecto son fotografías reales de alta calidad y respetan estrictamente las licencias abiertas y derechos de autor:

${manifest.map(m => `### ${m.title}
- **Archivo:** \`${m.file}\`
- **Autor / Fotógrafo:** ${m.author}
- **Licencia:** ${m.license}
- **Fuente:** ${m.source}
`).join('\n')}

> Nota: Las imágenes existentes previas (\`sapling.webp\`) se conservan en el proyecto.
`;

  fs.writeFileSync(licensesFile, markdown, 'utf8');
  console.log(`✓ Licencias y atribuciones guardadas en ${licensesFile}`);
}

download().catch((err) => {
  console.error('Fallo en la descarga:', err);
  process.exit(1);
});

