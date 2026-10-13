import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Leaf,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import type { ApiSelection, ApiTree } from './api/mockapi';
import type { DemoUser } from './lib/localAuth';

type DashboardPageProps = {
  user: DemoUser | null;
  userSelections: ApiSelection[];
  mockTrees: ApiTree[];
  loading: boolean;
  onRefresh: () => void;
  onDeleteSelection: (id: string) => Promise<void>;
  onOpenCatalog: () => void;
  onUpdateSelectionStatus: (id: string, status: ApiSelection['status']) => Promise<void>;
};

export default function DashboardPage({
  user,
  userSelections,
  mockTrees,
  loading,
  onRefresh,
  onDeleteSelection,
  onOpenCatalog,
  onUpdateSelectionStatus,
}: DashboardPageProps) {
  const [selected, setSelected] = useState<ApiSelection | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!user) return null;

  function formatDate(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  async function handleDelete(selection: ApiSelection) {
    if (!window.confirm(`¿Eliminar la adopción de "${selection.treeName}" de tu panel?`)) return;

    setDeletingId(selection.id);
    setActionError(null);
    try {
      await onDeleteSelection(selection.id);
      if (selected?.id === selection.id) setSelected(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo eliminar la adopción.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePlant(selection: ApiSelection) {
    setUpdatingId(selection.id);
    setActionError(null);
    try {
      await onUpdateSelectionStatus(selection.id, 'En proceso');
      setSelected((current) => current?.id === selection.id ? { ...current, status: 'En proceso' } : current);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se pudo actualizar el estado.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="inner-page dashboard-page">
      <div className="container">
        <div className="dashboard-head">
          <div>
            <h1>
              Mi <em>panel.</em>
            </h1>
            <p>Consulta y gestiona tus adopciones.</p>
          </div>
          <div className="dashboard-actions-head">
            <button
              type="button"
              className="button button-quiet"
              onClick={onRefresh}
              disabled={loading}
              title="Actualizar"
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              Actualizar
            </button>
            <button type="button" className="button button-dark" onClick={onOpenCatalog}>
              <Plus size={16} /> Explorar especies
            </button>
          </div>
        </div>

        <div className="user-profile-strip">
          <div className="user-badge-info">
            <span className="user-avatar-dot" />
            <div>
              <strong>{user.email || 'Usuario Adoptree'}</strong>
              <small>{userSelections.length} adopciones</small>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={18} />
            <span>{actionError}</span>
          </div>
        )}

        {loading && userSelections.length === 0 ? (
          <div className="dashboard-loading">
            <RefreshCw size={24} className="spin" />
            <p>Cargando tus adopciones...</p>
          </div>
        ) : userSelections.length === 0 ? (
          <div className="dashboard-empty-card">
            <Leaf size={40} />
            <h2>Aún no tienes árboles en tu panel</h2>
            <p>Explora las especies y elige un árbol para comenzar.</p>
            <button type="button" className="button button-dark" onClick={onOpenCatalog}>
              <Plus size={16} /> Explorar especies
            </button>
          </div>
        ) : (
          <div className="my-trees-grid">
            {userSelections.map((selection) => {
              const matchedTree = mockTrees.find((tree) => tree.id === selection.treeId);
              const image = selection.image || matchedTree?.image || '/images/planting-seedling.jpg';
              const species = selection.species || matchedTree?.species || 'Especie nativa';
              const description = selection.description || matchedTree?.description || 'Sin descripción disponible.';

              return (
                <article key={selection.id} className="selection-card">
                  <div className="selection-card-art">
                    <img src={image} alt={selection.treeName} />
                    <span className="selection-zone-pill">
                      <MapPin size={12} /> {selection.zone}
                    </span>
                  </div>
                  <div className="selection-card-body">
                    <div className="selection-top-meta">
                      <span className="selection-id-badge">ID: {selection.id}</span>
                      <span className="selection-date">
                        <Calendar size={13} /> {formatDate(selection.createdAt)}
                      </span>
                    </div>
                    <h3>{selection.treeName}</h3>
                    <p className="selection-species-name">{species}</p>
                    <p className="selection-description">{description}</p>
                    <div className="selection-status-row">
                      <span className={`status status-${selection.status.toLowerCase().replaceAll(' ', '-')}`}>
                        <i /> {selection.status === 'En proceso' ? 'Árbol en proceso de plantar' : selection.status}
                      </span>
                    </div>
                    <div className="selection-card-actions">
                      <button
                        type="button"
                        className="button button-light btn-small"
                        onClick={() => setSelected(selection)}
                      >
                        Ver ficha <ArrowRight size={14} />
                      </button>
                      {selection.status !== 'En proceso' && (
                        <button
                          type="button"
                          className="button button-dark btn-small"
                          disabled={updatingId === selection.id}
                          onClick={() => void handlePlant(selection)}
                        >
                          {updatingId === selection.id ? 'Actualizando...' : 'Deseo plantar este árbol'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="button-delete-selection"
                        disabled={deletingId === selection.id}
                        onClick={() => void handleDelete(selection)}
                        title="Eliminar adopción"
                      >
                        <Trash2 size={15} />
                        {deletingId === selection.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}>
          <section className="selection-detail-modal" role="dialog" aria-modal="true" aria-labelledby="selection-detail-title">
            <div className="modal-top">
              <span className="modal-step">FICHA DEL ÁRBOL</span>
              <button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar ficha">
                <X size={21} />
              </button>
            </div>
            <img
              className="selection-detail-image"
              src={selected.image || mockTrees.find((tree) => tree.id === selected.treeId)?.image || '/images/planting-seedling.jpg'}
              alt={selected.species || selected.treeName}
            />
            <h2 id="selection-detail-title">{selected.treeName}</h2>
            <p className="selection-species-name">
              {selected.species || mockTrees.find((tree) => tree.id === selected.treeId)?.species || 'Especie nativa'}
            </p>
            <p className="selection-detail-description">
              {selected.description || mockTrees.find((tree) => tree.id === selected.treeId)?.description || 'Sin descripción disponible.'}
            </p>
            <div className="selection-detail-data">
              <div><span>ID de adopción</span><strong>{selected.id}</strong></div>
              <div><span>ID del árbol</span><strong>{selected.treeId}</strong></div>
              <div><span>Fecha</span><strong>{formatDate(selected.createdAt)}</strong></div>
              <div><span>Zona de plantación</span><strong>{selected.zone}</strong></div>
              <div>
                <span>Estado</span>
                <strong>{selected.status === 'En proceso' ? 'Árbol en proceso de plantar' : selected.status}</strong>
              </div>
            </div>
            {selected.status !== 'En proceso' && (
              <button
                type="button"
                className="button button-dark selection-detail-plant"
                disabled={updatingId === selected.id}
                onClick={() => void handlePlant(selected)}
              >
                {updatingId === selected.id ? 'Actualizando...' : 'Deseo plantar este árbol'}
              </button>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
