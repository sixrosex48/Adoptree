import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Compass,
  Droplets,
  Flower2,
  Heart,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sprout,
  TreeDeciduous,
  UploadCloud,
  X,
} from 'lucide-react';
import TreeArt from './TreeArt';
import MapGraphic from './MapGraphic';
import AuthModal from './AuthModal';
import DashboardPage from './DashboardPage';
import {
  fetchMockApiTrees,
  fetchMockApiSelections,
  createMockApiSelection,
  deleteMockApiSelection,
  updateMockApiSelection,
  MAX_USER_SELECTIONS,
  MAX_USER_SELECTIONS_MESSAGE,
  ApiTree,
  ApiSelection,
} from './api/mockapi';
import { getCurrentUser, signOutUser, type DemoUser } from './lib/localAuth';
import type { Catalog, Tree } from './types';

type View = 'home' | 'tree' | 'operations' | 'dashboard';
const STORAGE_KEY = 'adoptree-preview-tree';

function speciesIcon(icon: string, size = 32) {
  if (icon === 'flower') return <Flower2 size={size} strokeWidth={1.5} />;
  if (icon === 'leaves') return <Leaf size={size} strokeWidth={1.5} />;
  return <TreeDeciduous size={size} strokeWidth={1.5} />;
}

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button className="logo" onClick={onClick} aria-label="Ir al inicio">
      <span className="logo-mark">
        <Sprout size={22} strokeWidth={2.3} />
      </span>
      <span>
        Adop<span className="logo-accent">Tree</span>
        <span className="logo-period">.</span>
      </span>
    </button>
  );
}

function AdoptionSelectionModal({
  tree,
  onClose,
  onConfirm,
}: {
  tree: ApiTree;
  onClose: () => void;
  onConfirm: (treeName: string, zone: string) => Promise<void>;
}) {
  const [treeName, setTreeName] = useState(tree.name);
  const [zone, setZone] = useState('Norte');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onConfirm(treeName.trim(), zone);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la adopción.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="adoption-modal" role="dialog" aria-modal="true" aria-labelledby="selection-title">
        <div className="modal-top">
          <span className="modal-step">NUEVA ADOPCIÓN</span>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={21} />
          </button>
        </div>
        <div className="modal-heading">
          <span className="mini-icon"><Leaf size={20} /></span>
          <h2 id="selection-title">Conoce a tu árbol</h2>
          <p>{tree.species}</p>
        </div>
        <div className="adoption-tree-summary">
          <img src={tree.image} alt={tree.species} />
          <div>
            <strong>{tree.name} · {tree.species}</strong>
            <p>{tree.description}</p>
          </div>
        </div>
        <form className="auth-form adoption-selection-form" onSubmit={submit}>
          <label className="field-label" htmlFor="adoption-tree-name">Nombre de tu árbol</label>
          <input
            id="adoption-tree-name"
            className="text-input"
            required
            minLength={2}
            maxLength={32}
            value={treeName}
            onChange={(event) => setTreeName(event.target.value)}
          />
          <label className="field-label" htmlFor="adoption-zone">Zona de plantación</label>
          <select id="adoption-zone" className="text-input" value={zone} onChange={(event) => setZone(event.target.value)}>
            <option>Norte</option>
            <option>Oriente</option>
            <option>Sur</option>
          </select>
          {error && <div className="auth-alert error" role="alert">{error}</div>}
          <button className="button button-dark" type="submit" disabled={busy || treeName.trim().length < 2}>
            {busy ? 'Guardando...' : 'Confirmar adopción'} <ArrowUpRight size={17} />
          </button>
        </form>
      </section>
    </div>
  );
}

function Status({ status }: { status: Tree['status'] }) {
  return (
    <span className={`status status-${status.toLowerCase().replaceAll(' ', '-').replace('ó', 'o')}`}>
      <i />
      {status}
    </span>
  );
}

function AdoptionModal({
  catalog,
  initialSpeciesId,
  user,
  mockTrees,
  currentUserSelectionCount,
  onClose,
  onCreated,
  onMockApiUpdated,
}: {
  catalog: Catalog;
  initialSpeciesId: string;
  user: DemoUser | null;
  mockTrees: ApiTree[];
  currentUserSelectionCount: number;
  onClose: () => void;
  onCreated: (tree: Tree) => void;
  onMockApiUpdated?: () => Promise<void>;
}) {
  const [speciesId, setSpeciesId] = useState(initialSpeciesId || catalog.species[0]?.id || '');
  const [zoneId, setZoneId] = useState(catalog.zones[0]?.id || '');
  const [name, setName] = useState('Mi árbol');
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const zone = catalog.zones.find((item) => item.id === zoneId);
  const chosenSpecies = catalog.species.find((item) => item.id === speciesId);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function finish() {
    setBusy(true);
    setError('');
    try {
      if (user && currentUserSelectionCount >= MAX_USER_SELECTIONS) {
        throw new Error(MAX_USER_SELECTIONS_MESSAGE);
      }
      const response = await fetch('/api/adoptions/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speciesId, zoneId, name: name.trim() }),
      });
      if (!response.ok) throw new Error('No pudimos crear el recorrido. Inténtalo de nuevo.');
      const tree = (await response.json()) as Tree;

      if (user) {
        const matchedMock = mockTrees.find((t) =>
          t.species.toLowerCase().includes(chosenSpecies?.name.toLowerCase() || '')
        ) || mockTrees[0];

        await createMockApiSelection({
          userId: user.id,
          treeId: matchedMock?.id || speciesId,
          treeName: name.trim() || chosenSpecies?.name || 'Mi árbol',
          zone: zone?.name || 'Bucaramanga',
          species: matchedMock?.species || chosenSpecies?.name || 'Especie nativa',
          description: matchedMock?.description || chosenSpecies?.description || '',
          image: matchedMock?.image || chosenSpecies?.image || '',
        });
        await onMockApiUpdated?.();
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
      onCreated(tree);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ocurrió un error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="adoption-modal" role="dialog" aria-modal="true" aria-labelledby="adoption-title">
        <div className="modal-top">
          <span className="modal-step">PASO {step} DE 3</span>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={21} />
          </button>
        </div>
        <div className="step-meter">
          <span style={{ width: `${(step / 3) * 100}%` }} />
        </div>
        {step === 1 && (
          <>
            <div className="modal-heading">
              <span className="mini-icon">
                <Leaf size={20} />
              </span>
              <h2 id="adoption-title">Elige tu árbol</h2>
              <p>Cada especie tiene una historia por contar. ¿Cuál quieres acompañar?</p>
            </div>
            <div className="modal-options">
              {catalog.species.map((item) => (
                <button
                  key={item.id}
                  className={`select-row ${speciesId === item.id ? 'selected' : ''}`}
                  onClick={() => setSpeciesId(item.id)}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="select-thumb" />
                  ) : (
                    <span className="select-icon">{speciesIcon(item.icon, 25)}</span>
                  )}
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.scientificName}</small>
                  </span>
                  <span className="radio-dot" />
                </button>
              ))}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div className="modal-heading">
              <span className="mini-icon">
                <MapPin size={20} />
              </span>
              <h2 id="adoption-title">Elige una zona</h2>
              <p>Explora ubicaciones de referencia en Bucaramanga y sus alrededores.</p>
            </div>
            <div className="modal-map">
              <MapGraphic zones={catalog.zones} selected={zoneId} onSelect={setZoneId} />
            </div>
            <div className="zone-chips">
              {catalog.zones.map((item) => (
                <button
                  key={item.id}
                  className={zoneId === item.id ? 'active' : ''}
                  onClick={() => setZoneId(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <p className="modal-caption">
              <MapPin size={14} /> {zone?.description}
            </p>
          </>
        )}
        {step === 3 && (
          <>
            <div className="modal-heading">
              <span className="mini-icon">
                <Heart size={20} />
              </span>
              <h2 id="adoption-title">Ponle un nombre</h2>
              <p>Un pequeño detalle para hacer esta historia tuya.</p>
            </div>
            <label className="field-label" htmlFor="tree-name">
              Nombre de tu árbol
            </label>
            <input
              id="tree-name"
              className="text-input"
              maxLength={32}
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Luna"
            />
            <div className="summary-card">
              {chosenSpecies?.image && (
                <img src={chosenSpecies.image} alt={chosenSpecies.name} className="summary-thumb" />
              )}
              <div className="summary-details">
                <div>
                  <span>Árbol</span>
                  <strong>{chosenSpecies?.name}</strong>
                </div>
                <div>
                  <span>Zona</span>
                  <strong>{zone?.name}</strong>
                </div>
                <div>
                  <span>Aporte propuesto</span>
                  <strong>USD $5</strong>
                </div>
              </div>
            </div>
            <p className="payment-note">
              <ShieldCheck size={18} /> Este recorrido no realiza cobros ni registra una siembra.
            </p>
          </>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button className="text-button" onClick={() => (step === 1 ? onClose() : setStep(step - 1))}>
            <ArrowLeft size={16} /> {step === 1 ? 'Cancelar' : 'Volver'}
          </button>
          <button
            className="button button-dark"
            disabled={busy || (step === 3 && name.trim().length < 2)}
            onClick={() => (step === 3 ? finish() : setStep(step + 1))}
          >
            {busy ? 'Preparando...' : step === 3 ? 'Crear mi recorrido' : 'Continuar'} <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}

function TreePage({ tree, catalog, onBack }: { tree: Tree; catalog: Catalog; onBack: () => void }) {
  const chosenSpecies = catalog.species.find((item) => item.id === tree.speciesId);
  const zone = catalog.zones.find((item) => item.id === tree.zoneId);
  const isPreview = tree.charged === false;
  const heroImage = chosenSpecies?.image || '/images/sapling.webp';
  const timeline = tree.timeline.length
    ? tree.timeline
    : [
        {
          month: 'Hoy',
          title: 'El primer paso',
          description: 'Ya elegiste una especie y una zona para imaginar cómo crecería esta historia.',
          image: '/images/planting-seedling.jpg',
        },
        {
          month: 'Próximamente',
          title: 'Preparación y siembra',
          description: 'En una adopción activa, aquí aparecerían la fecha, la ubicación confirmada y la primera imagen.',
          image: '/images/sapling-monitoring.jpg',
        },
        {
          month: 'Cada 6 meses',
          title: 'Noticias de tu árbol',
          description: 'Una nueva fotografía y una nota de seguimiento contarían cómo va creciendo.',
          image: heroImage,
        },
      ];
  return (
    <main className="inner-page tree-page">
      <div className="container">
        <button className="back-link" onClick={onBack}>
          <ArrowLeft size={17} /> Volver al inicio
        </button>
        <div className="page-heading">
          <div>
            <h1>
              Conoce a <em>{tree.name}.</em>
            </h1>
            <p>Consulta su ubicación y revisa las actualizaciones.</p>
          </div>
          <Status status={tree.status} />
        </div>
        <div className="tree-layout">
          <div className="tree-main">
            <div className="tree-hero-card">
              <img src={heroImage} alt={`Fotografía representativa de ${chosenSpecies?.name || 'árbol'}`} />
              <div className="tree-photo-caption">
                <span>ESPECIE</span>
                <strong>{chosenSpecies?.name}</strong>
              </div>
            </div>
            <section className="timeline-section">
              <div className="section-heading compact">
                <div>
                  <h2>Cada etapa cuenta.</h2>
                </div>
                <span className="timeline-frequency">
                  <CalendarDays size={16} /> Seguimiento semestral
                </span>
              </div>
              <div className="timeline">
                {timeline.map((event) => (
                  <div className="timeline-item" key={`${event.month}-${event.title}`}>
                    <span className="timeline-dot" />
                    <span className="timeline-month">{event.month}</span>
                    <div>
                      <h3>{event.title}</h3>
                      <p>{event.description}</p>
                      {event.image && <img src={event.image} alt={event.title} loading="lazy" />}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <aside className="tree-sidebar">
            <div className="sidebar-card">
              <span className="sidebar-label">FICHA DEL ÁRBOL</span>
              <div className="sidebar-row">
                <span>Especie</span>
                <strong>{chosenSpecies?.name}</strong>
              </div>
              <div className="sidebar-row">
                <span>Ubicación</span>
                <strong>{zone?.name}</strong>
              </div>
              <div className="sidebar-row">
                <span>Identificador</span>
                <strong>{tree.id}</strong>
              </div>
              <div className="sidebar-row">
                <span>Estado</span>
                <Status status={tree.status} />
              </div>
            </div>
            <div className="sidebar-map">
              <MapGraphic zones={catalog.zones} selected={tree.zoneId} interactive={false} />
              <div className="sidebar-map-info">
                <MapPin size={17} />
                <div>
                  <strong>{zone?.name}</strong>
                  <small>Coordenadas de referencia: {zone?.coordinates.join(', ')}</small>
                </div>
              </div>
            </div>
            <div className="sidebar-note">
              <Leaf size={20} />
              <p>
                {isPreview
                  ? 'Esta vista muestra cómo sería el seguimiento de una adopción. No se ha registrado una siembra.'
                  : 'Las imágenes y ubicaciones de esta historia son de referencia y respetan el entorno natural.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function OperationsPage({ trees, catalog, onTree }: { trees: Tree[]; catalog: Catalog; onTree: (tree: Tree) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [selected, setSelected] = useState<Tree | null>(trees[0] || null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const selectedSpecies = selected ? catalog.species.find((item) => item.id === selected.speciesId) : null;
  const filtered = useMemo(
    () =>
      trees.filter(
        (tree) =>
          (filter === 'Todos' || tree.status === filter) &&
          `${tree.id} ${tree.name} ${tree.speciesName || catalog.species.find((species) => species.id === tree.speciesId)?.name || ''}`
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [trees, filter, query, catalog]
  );
  function onPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
    setSaved(false);
  }
  return (
    <main className="inner-page operations-page">
      <div className="container">
        <div className="operations-head">
          <div>
            <h1>
              Árboles en <em>seguimiento.</em>
            </h1>
            <p>Consulta la especie, la zona y el estado de cada árbol.</p>
          </div>
          <div className="operations-head-icon">
            <TreeDeciduous size={34} strokeWidth={1.5} />
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <span>ÁRBOLES REGISTRADOS</span>
            <strong>{trees.length.toString().padStart(2, '0')}</strong>
            <small>En el recorrido</small>
          </div>
          <div className="stat-card">
            <span>EN SEGUIMIENTO</span>
            <strong>
              {trees.filter((tree) => tree.status === 'En seguimiento' || tree.status === 'En proceso').length.toString().padStart(2, '0')}
            </strong>
            <small>Con historia activa</small>
          </div>
          <div className="stat-card">
            <span>ZONAS EXPLORADAS</span>
            <strong>{catalog.zones.length.toString().padStart(2, '0')}</strong>
            <small>Bucaramanga y área</small>
          </div>
        </div>
        <div className="operations-grid">
          <section className="operations-table-card">
            <div className="table-top">
              <div>
                <h2>Registro de árboles</h2>
                <p>Explora los estados y abre una ficha.</p>
              </div>
              <span className="record-count">{filtered.length} registros</span>
            </div>
            <div className="table-tools">
              <label className="search-box">
                <Search size={18} />
                <input
                  aria-label="Buscar árbol"
                  placeholder="Buscar por nombre o ID"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label className="filter-box">
                <select
                  aria-label="Filtrar por estado"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option>Todos</option>
                  <option>En preparación</option>
                  <option>Sembrado</option>
                  <option>En seguimiento</option>
                  <option>Árbol no plantado</option>
                  <option>En proceso</option>
                </select>
                <ChevronDown size={16} />
              </label>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ÁRBOL</th>
                    <th>ESPECIE</th>
                    <th>ZONA</th>
                    <th>ESTADO</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tree) => (
                    <tr
                      key={tree.id}
                      className={selected?.id === tree.id ? 'selected' : ''}
                      tabIndex={0}
                      aria-label={`Abrir ficha de ${tree.name}`}
                      onClick={() => {
                        setSelected(tree);
                        setPhoto(null);
                        setSaved(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelected(tree);
                          setPhoto(null);
                          setSaved(false);
                        }
                      }}
                    >
                      <td>
                        <strong>{tree.name}</strong>
                        <small>{tree.id}</small>
                      </td>
                      <td>{tree.speciesName || catalog.species.find((item) => item.id === tree.speciesId)?.name}</td>
                      <td>{catalog.zones.find((item) => item.id === tree.zoneId)?.name}</td>
                      <td>
                        <Status status={tree.status} />
                      </td>
                      <td>
                        <ArrowUpRight size={17} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="empty-results">No hay árboles que coincidan con la búsqueda.</div>
              )}
            </div>
          </section>
          <aside className="operation-detail">
            <div className="detail-top">
              <span className="sidebar-label">FICHA SELECCIONADA</span>
              <TreeDeciduous size={21} />
            </div>
            {selected ? (
              <>
                {selectedSpecies?.image && (
                  <div className="detail-species-banner">
                    <img src={selectedSpecies.image} alt={selectedSpecies.name} />
                    <span className="detail-species-badge">{selectedSpecies.name}</span>
                  </div>
                )}
                <h2>{selected.name}</h2>
                <p className="detail-id">
                  {selected.id} · {selected.speciesName || selectedSpecies?.name}
                </p>
                <Status status={selected.status} />
                <div className="detail-divider" />
                <div className="detail-data">
                  <span>Zona de referencia</span>
                  <strong>{catalog.zones.find((item) => item.id === selected.zoneId)?.name}</strong>
                </div>
                <div className="detail-data">
                  <span>Próxima actualización</span>
                  <strong>Cada 6 meses</strong>
                </div>
                <button className="detail-link" onClick={() => onTree(selected)}>
                  Ver historia <ArrowRight size={17} />
                </button>
                <div className="detail-divider" />
                <h3>Preparar actualización</h3>
                <p className="detail-help">Visualiza el flujo de carga de una foto y una nota de seguimiento.</p>
                <label className="upload-area">
                  <input type="file" accept="image/*" onChange={onPhoto} />
                  <UploadCloud size={23} />
                  <strong>{photo ? 'Cambiar imagen' : 'Seleccionar imagen'}</strong>
                  <small>JPG o PNG</small>
                </label>
                {photo && <img className="upload-preview" src={photo} alt="Vista previa de la imagen seleccionada" />}
                <label className="field-label" htmlFor="update-note">
                  Nota de seguimiento
                </label>
                <textarea
                  id="update-note"
                  placeholder="Escribe qué ha cambiado desde la última visita..."
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value);
                    setSaved(false);
                  }}
                />
                <button
                  className="button button-dark detail-save"
                  disabled={!photo || !note.trim()}
                  onClick={() => setSaved(true)}
                >
                  Previsualizar actualización <ArrowRight size={16} />
                </button>
                {saved && (
                  <p className="save-message">
                    <CircleCheck size={17} /> Vista previa lista. Esta información permanece en este navegador.
                  </p>
                )}
              </>
            ) : (
              <p>Selecciona un árbol para ver su ficha.</p>
            )}
          </aside>
        </div>
        <p className="operations-footnote">
          Las fichas, fechas e imágenes ilustran el flujo de trabajo. Este panel no publica cambios.
        </p>
      </div>
    </main>
  );
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [view, setView] = useState<View>('home');
  const [activeTree, setActiveTree] = useState<Tree | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [pendingAdoption, setPendingAdoption] = useState<ApiTree | null>(null);
  const [adoptionNotice, setAdoptionNotice] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [authActionError, setAuthActionError] = useState<string | null>(null);

  const [user, setUser] = useState<DemoUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Estados de MockAPI
  const [mockTrees, setMockTrees] = useState<ApiTree[]>([]);
  const [allSelections, setAllSelections] = useState<ApiSelection[]>([]);
  const [loadingMockApi, setLoadingMockApi] = useState(true);
  const [mockApiError, setMockApiError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setUser(getCurrentUser());
    } catch (reason) {
      console.error('No se pudo recuperar la sesión local:', reason);
      setAuthActionError('No fue posible recuperar la sesión. Inténtalo de nuevo.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Cargar catálogo interno
  useEffect(() => {
    Promise.all([fetch('/api/catalog'), fetch('/api/trees')])
      .then(async ([catalogResponse, treesResponse]) => {
        if (!catalogResponse.ok || !treesResponse.ok)
          throw new Error('No pudimos cargar la información. Recarga la página.');
        setCatalog((await catalogResponse.json()) as Catalog);
        const records = (await treesResponse.json()) as Tree[];
        setTrees(records);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setActiveTree(JSON.parse(saved) as Tree);
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'No pudimos cargar la información.'));
  }, []);

  // Cargar datos de MockAPI (árboles y selecciones)
  const loadMockApiData = useCallback(async () => {
    setLoadingMockApi(true);
    setMockApiError(null);
    try {
      const [fetchedTrees, fetchedSelections] = await Promise.all([
        fetchMockApiTrees().catch((err) => {
          console.error('Error al cargar árboles de MockAPI:', err);
          setMockApiError('No fue posible cargar las especies.');
          return [] as ApiTree[];
        }),
        fetchMockApiSelections().catch((err) => {
          console.error('Error al cargar selecciones de MockAPI:', err);
          return [] as ApiSelection[];
        }),
      ]);
      setMockTrees(fetchedTrees);
      setAllSelections(fetchedSelections);
    } catch (err) {
      setMockApiError(err instanceof Error ? err.message : 'Error al conectar con MockAPI');
    } finally {
      setLoadingMockApi(false);
    }
  }, []);

  useEffect(() => {
    loadMockApiData();
  }, [loadMockApiData]);

  // Selecciones exclusivas del usuario actual
  const userSelections = useMemo(() => {
    if (!user) return [];
    return allSelections.filter((sel) => sel.userId === user.id);
  }, [allSelections, user]);

  const referenceSpecies = useMemo(() => {
    const bySpecies = new Map<string, ApiTree>();
    for (const tree of mockTrees) {
      const key = tree.species.trim().toLocaleLowerCase();
      if (!bySpecies.has(key)) bySpecies.set(key, tree);
    }
    return [...bySpecies.values()];
  }, [mockTrees]);

  const operationTrees = useMemo(() => {
    if (!catalog) return trees;
    const monitoredSelections = allSelections
      .filter((selection) => selection.status === 'En proceso')
      .map((selection): Tree => ({
        id: `SEL-${selection.id}`,
        name: selection.treeName,
        speciesId: catalog.species.find(
          (item) => item.name.localeCompare(selection.species || '', 'es', { sensitivity: 'base' }) === 0
        )?.id || '',
        speciesName: selection.species || 'Especie nativa',
        zoneId: catalog.zones.find(
          (item) => item.name.localeCompare(selection.zone, 'es', { sensitivity: 'base' }) === 0
        )?.id || 'sur',
        plantedAt: selection.createdAt,
        status: 'En proceso',
        timeline: [],
      }));
    const byId = new Map<string, Tree>();
    for (const tree of [...trees, ...monitoredSelections]) byId.set(tree.id, tree);
    return [...byId.values()];
  }, [trees, allSelections, catalog]);

  function navigate(next: View, tree?: Tree) {
    if (tree) setActiveTree(tree);
    setView(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function goTo(id: string) {
    setView('home');
    setMenuOpen(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 20);
  }

  function created(tree: Tree) {
    setActiveTree(tree);
    setTrees((current) => [tree, ...current.filter((item) => item.id !== tree.id)]);
    setModal(null);
    if (user) {
      navigate('dashboard');
    } else {
      navigate('tree', tree);
    }
  }

  async function handleSignOut() {
    setAuthActionError(null);
    try {
      await signOutUser();
      setUser(null);
      setAllSelections([]);
      setPendingAdoption(null);
      setAuthModalOpen(false);
      setView('home');
    } catch (reason) {
      console.error('No se pudo cerrar la sesión:', reason);
      setAuthActionError('No se pudo cerrar la sesión. Inténtalo de nuevo.');
    }
  }

  async function handleDeleteSelection(id: string) {
    await deleteMockApiSelection(id);
    setAllSelections((prev) => prev.filter((s) => s.id !== id));
  }

  function handleBeginAdoption(tree: ApiTree) {
    setAdoptionNotice(null);
    if (user) {
      if (userSelections.some((selection) => selection.treeId === tree.id)) {
        setAdoptionNotice(`Ya tienes una selección registrada para el árbol "${tree.name}".`);
        return;
      }
      if (userSelections.length >= MAX_USER_SELECTIONS) {
        setAdoptionNotice(MAX_USER_SELECTIONS_MESSAGE);
        return;
      }
    }
    setPendingAdoption(tree);
    if (!user) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
    }
  }

  async function confirmAdoption(treeName: string, zone: string) {
    if (!user || !pendingAdoption) {
      throw new Error('Inicia sesión para guardar tu adopción.');
    }
    const selection = await createMockApiSelection({
      userId: user.id,
      treeId: pendingAdoption.id,
      treeName,
      zone,
      species: pendingAdoption.species,
      description: pendingAdoption.description,
      image: pendingAdoption.image,
    });
    setAllSelections((previous) => [selection, ...previous.filter((item) => item.id !== selection.id)]);
    setPendingAdoption(null);
    navigate('dashboard');
  }

  async function handleUpdateSelectionStatus(selectionId: string, status: ApiSelection['status']) {
    const previousSelection = allSelections.find((item) => item.id === selectionId);
    if (!previousSelection || previousSelection.userId !== user?.id) {
      throw new Error('No se pudo encontrar este árbol en tu panel.');
    }
    setAllSelections((previous) =>
      previous.map((item) => item.id === selectionId ? { ...item, status } : item)
    );
    try {
      const updated = await updateMockApiSelection(previousSelection, { status });
      setAllSelections((previous) =>
        previous.map((item) => item.id === selectionId ? updated : item)
      );
    } catch (reason) {
      if (previousSelection) {
        setAllSelections((previous) =>
          previous.map((item) => item.id === selectionId ? previousSelection : item)
        );
      }
      throw reason;
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="container nav-wrap">
          <Logo onClick={() => navigate('home')} />
          <nav className={menuOpen ? 'open' : ''} aria-label="Navegación principal">
            {user ? (
              <button className={view === 'dashboard' ? 'active-nav' : ''} onClick={() => navigate('dashboard')}>
                Mi panel
              </button>
            ) : !authLoading && (
              <>
                <button
                  className="auth-reg-btn"
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                >
                  Registro
                </button>
                <button
                  className="auth-login-btn"
                  onClick={() => {
                    setAuthModalMode('login');
                    setAuthModalOpen(true);
                  }}
                >
                  Inicio de sesión
                </button>
              </>
            )}
            <button className="button button-dark header-cta" onClick={() => setModal('')}>
              Explorar adopción <ArrowUpRight size={16} />
            </button>
          </nav>
          <div className="header-actions">
            {user && (
              <div className="header-user-menu">
                <button
                  className="user-profile-button"
                  onClick={() => navigate('dashboard')}
                  title={`Conectado como ${user.email}`}
                >
                  <span className="user-avatar">{user.email?.charAt(0).toUpperCase() || 'U'}</span>
                  <span className="user-email-label">{user.email?.split('@')[0]}</span>
                </button>
                <button className="signout-button" onClick={handleSignOut} title="Cerrar sesión">
                  <LogOut size={16} />
                </button>
              </div>
            )}
            <button
              className="menu-button"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </header>

      {authActionError && (
        <div className="container auth-alert error auth-action-alert" role="alert">
          <span>{authActionError}</span>
        </div>
      )}

      {error ? (
        <main className="error-page">
          <Leaf size={36} />
          <h1>Algo salió mal</h1>
          <p>{error}</p>
          <button className="button button-dark" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </main>
      ) : !catalog ? (
        <main className="loading-page">
          <span className="loading-leaf">
            <Sprout size={30} />
          </span>
          <p>Preparando el bosque...</p>
        </main>
      ) : (
        <>
          {view === 'home' && (
            <main>
              <section className="hero">
                <div className="container hero-grid">
                  <div className="hero-content">
                    <h1>
                      Conoce cómo
                      <br />
                      crecería <em>tu árbol.</em>
                    </h1>
                    <p>
                      Explora especies, escoge una zona de Bucaramanga y mira cómo se mostrarían las novedades de tu
                      árbol.
                    </p>
                    <div className="hero-actions">
                      <button className="button button-dark button-large" onClick={() => setModal('')}>
                        Explorar adopción <ArrowUpRight size={20} />
                      </button>
                      <button className="button button-quiet" onClick={() => goTo('como-funciona')}>
                        Descubre cómo funciona <ArrowDown size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="hero-visual">
                    <div className="hero-ring ring-a" />
                    <div className="hero-ring ring-b" />
                    <div className="hero-circle">
                      <span className="hero-sun" />
                      <svg viewBox="0 0 500 500" role="img" aria-label="Ilustración de un árbol verde">
                        <ellipse cx="250" cy="449" rx="164" ry="27" fill="#c8d8aa" opacity=".6" />
                        <path d="M70 447 Q250 427 430 447 L430 500 L70 500Z" fill="#ca9a74" />
                        <path
                          d="M235 455 C241 380 239 309 230 260 L270 260 C261 316 259 390 266 455Z"
                          fill="#8d5c38"
                        />
                        <path
                          d="M247 345 Q184 293 168 242 M254 333 Q315 284 327 235"
                          stroke="#8d5c38"
                          strokeWidth="16"
                          fill="none"
                          strokeLinecap="round"
                        />
                        <circle cx="169" cy="247" r="72" fill="#6f9d53" />
                        <circle cx="313" cy="243" r="78" fill="#5f914b" />
                        <circle cx="241" cy="171" r="86" fill="#8eb66b" />
                        <circle cx="216" cy="269" r="66" fill="#8db76d" />
                        <circle cx="305" cy="305" r="52" fill="#76a75c" />
                        <circle cx="347" cy="196" r="38" fill="#81ad61" />
                        <circle cx="136" cy="274" r="40" fill="#8bb469" />
                        <path
                          d="M199 168 Q214 156 229 158 M293 218 Q310 205 326 208"
                          stroke="#b0d18d"
                          strokeWidth="4"
                          fill="none"
                          opacity=".65"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </section>
              <TreeArt />
              <section className="how-section section-pad" id="como-funciona">
                <div className="container">
                  <div className="section-heading">
                    <div>
                      <h2>Cómo funcionaría</h2>
                    </div>
                    <p>Elige una especie, una zona y un nombre. Después podrás consultar la ficha del árbol.</p>
                  </div>
                  <div className="steps-grid">
                    <div className="step-card">
                      <span className="step-num">01</span>
                      <div className="step-icon">
                        <Leaf size={29} strokeWidth={1.5} />
                      </div>
                      <h3>Elige una especie</h3>
                      <p>Compara especies por su tamaño, floración y aporte al entorno.</p>
                      <span className="step-line" />
                    </div>
                    <div className="step-card">
                      <span className="step-num">02</span>
                      <div className="step-icon">
                        <MapPin size={29} strokeWidth={1.5} />
                      </div>
                      <h3>Explora una zona</h3>
                      <p>Revisa las zonas de referencia disponibles en Bucaramanga.</p>
                      <span className="step-line" />
                    </div>
                    <div className="step-card">
                      <span className="step-num">03</span>
                      <div className="step-icon">
                        <Droplets size={29} strokeWidth={1.5} />
                      </div>
                      <h3>Acompaña su crecimiento</h3>
                      <p>Consulta la ubicación, las fotos y las notas de seguimiento cada seis meses.</p>
                      <span className="step-line" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="species-section section-pad" id="especies">
                <div className="container">
                  <div className="section-heading">
                    <div>
                      <h2>Especies de referencia</h2>
                    </div>
                    <p>Consulta las especies disponibles para adopción y seguimiento.</p>
                  </div>
                  {adoptionNotice && (
                    <div className="auth-alert error" role="alert">{adoptionNotice}</div>
                  )}
                  {mockApiError && (
                    <div className="empty-results" role="alert" style={{ color: '#b24444' }}>
                      No fue posible cargar las especies. Inténtalo de nuevo.
                    </div>
                  )}
                  {loadingMockApi ? (
                    <div className="empty-results">Cargando especies...</div>
                  ) : referenceSpecies.length === 0 ? (
                    <div className="empty-results">No hay especies disponibles actualmente.</div>
                  ) : (
                    <div className="species-grid">
                      {referenceSpecies.map((tree, index) => (
                        <article className={`species-card species-${index}`} key={tree.id}>
                          <div className="species-art">
                            <img src={tree.image} alt={tree.species} className="species-image" loading="lazy" />
                            <span className="species-art-number">{String(index + 1).padStart(2, '0')}</span>
                            <span className="species-icon-pill" title={tree.species}>
                              {speciesIcon('tree', 16)}
                            </span>
                          </div>
                          <div className="species-body">
                            <span className="species-taxonomy">{tree.name}</span>
                            <h3>{tree.species}</h3>
                            <p>{tree.description}</p>
                            <div className="species-tags">
                              <span>Zona {tree.zone}</span>
                              <span>Disponible</span>
                            </div>
                            <button onClick={() => handleBeginAdoption(tree)}>
                              Elegir este árbol <ArrowUpRight size={17} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
              <section className="zone-section section-pad" id="zonas">
                <div className="container zone-grid">
                  <div className="zone-copy">
                    <h2>
                      Zonas en
                      <br />
                      <em>Bucaramanga.</em>
                    </h2>
                    <p>
                      Tres sectores estratégicos con coordenadas y radios aproximados de ~1 km para corredores verdes.
                    </p>
                    <div className="zone-feature">
                      <span>
                        <MapPin size={20} />
                      </span>
                      <div>
                        <strong>Ubicaciones georreferenciadas</strong>
                        <small>Norte (Río de Oro), Oriente (Cerros) y Sur (Quebrada La Iglesia).</small>
                      </div>
                    </div>
                    <div className="zone-feature">
                      <span>
                        <Heart size={20} />
                      </span>
                      <div>
                        <strong>Visitas coordinadas</strong>
                        <small>El proyecto contempla visitas coordinadas en sectores autorizados.</small>
                      </div>
                    </div>
                    <div className="zone-flora-banner">
                      <img
                        src="/images/bucaramanga-flora.jpg"
                        alt="Parque Caracolí y corredor verde en Bucaramanga"
                        className="zone-flora-img"
                      />
                      <div className="zone-flora-text">
                        <strong>Corredores verdes urbanos</strong>
                        <small>Bucaramanga · Santander</small>
                      </div>
                    </div>
                    <button className="button button-dark" onClick={() => setModal('')}>
                      Explorar zonas <ArrowUpRight size={17} />
                    </button>
                  </div>
                  <div className="zone-map-card">
                    <div className="zone-map-top">
                      <span>
                        <span className="live-dot" /> BUCARAMANGA, SANTANDER
                      </span>
                      <Compass size={18} />
                    </div>
                    <MapGraphic zones={catalog.zones} />
                    <div className="zone-map-bottom">
                      <strong>Explora dónde podría crecer</strong>
                      <span>
                        {catalog.zones.length} zonas de referencia <ArrowUpRight size={15} />
                      </span>
                    </div>
                  </div>
                </div>
              </section>
              <section className="follow-section section-pad">
                <div className="container follow-grid">
                  <div className="follow-image">
                    <img
                      src="/images/planting-seedling.jpg"
                      alt="Plántula de árbol en manos y suelo fértil; fotografía de reforestación"
                    />
                    <div className="follow-badge">
                      <span>SEGUIMIENTO REAL</span>
                      <strong>Fotografías en cada etapa</strong>
                    </div>
                  </div>
                  <div className="follow-copy">
                    <h2>
                      Sigue el crecimiento
                      <br />
                      <em>de tu árbol.</em>
                    </h2>
                    <p>
                      Cada árbol cuenta con una ficha con su ubicación, fotografías reales y una nota nueva cada seis
                      meses.
                    </p>
                    <div className="follow-list">
                      <div>
                        <span>
                          <MapPin size={20} />
                        </span>
                        <strong>Ubicación en el mapa</strong>
                        <small>Un punto para volver a encontrarlo.</small>
                      </div>
                      <div>
                        <span>
                          <CalendarDays size={20} />
                        </span>
                        <strong>Actualizaciones semestrales</strong>
                        <small>Fotos y notas para contar cada avance.</small>
                      </div>
                      <div>
                        <span>
                          <Heart size={20} />
                        </span>
                        <strong>Historial de actualizaciones</strong>
                        <small>Todas las fotos y notas anteriores en un solo lugar.</small>
                      </div>
                    </div>
                    <button className="link-button" onClick={() => navigate('tree', trees[0])}>
                      Ver cómo sería el seguimiento <ArrowUpRight size={18} />
                    </button>
                  </div>
                </div>
              </section>
            </main>
          )}
          {view === 'tree' && <TreePage tree={activeTree || trees[0]} catalog={catalog} onBack={() => navigate('home')} />}
          {view === 'operations' && (
            <OperationsPage trees={operationTrees} catalog={catalog} onTree={(tree) => navigate('tree', tree)} />
          )}
          {view === 'dashboard' && (
            <DashboardPage
              user={user}
              userSelections={userSelections}
              mockTrees={mockTrees}
              loading={loadingMockApi}
              onRefresh={loadMockApiData}
              onDeleteSelection={handleDeleteSelection}
              onUpdateSelectionStatus={handleUpdateSelectionStatus}
              onOpenCatalog={() => goTo('especies')}
            />
          )}
        </>
      )}

      <footer className="footer">
        <div className="container footer-main">
          <div>
            <Logo onClick={() => navigate('home')} />
          </div>
          <div className="footer-links">
            <button onClick={() => goTo('como-funciona')}>Cómo funciona</button>
            <button onClick={() => goTo('especies')}>Especies</button>
            <button onClick={() => goTo('zonas')}>Zonas</button>
            {user && <button onClick={() => navigate('dashboard')}>Mi panel</button>}
            <button onClick={() => navigate('operations')}>Panel operativo</button>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 AdopTree · Bucaramanga, Colombia</span>
          <span>
            Hecho para imaginar un futuro más verde <Leaf size={14} />
          </span>
        </div>
      </footer>

      {modal !== null && catalog && (
        <AdoptionModal
          catalog={catalog}
          initialSpeciesId={modal}
          user={user}
          mockTrees={mockTrees}
          currentUserSelectionCount={userSelections.length}
          onClose={() => setModal(null)}
          onCreated={created}
          onMockApiUpdated={loadMockApiData}
        />
      )}

      {pendingAdoption && user && (
        <AdoptionSelectionModal
          tree={pendingAdoption}
          onClose={() => setPendingAdoption(null)}
          onConfirm={confirmAdoption}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={(authUser: DemoUser) => {
          setUser(authUser);
          setAuthModalOpen(false);
          void loadMockApiData();
        }}
      />
    </>
  );
}
