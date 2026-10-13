import { useState, useEffect } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, ShieldCheck } from 'lucide-react';
import {
  registerWithEmail,
  signInWithEmail,
  formatAuthError,
  type DemoUser,
} from './lib/localAuth';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: DemoUser) => void;
  initialMode?: 'login' | 'register';
};

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setEmail('');
    setPassword('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setBusy(true);

    try {
      if (mode === 'register') {
        const user = await registerWithEmail(email, password);
        setEmail('');
        setPassword('');
        onSuccess(user);
        onClose();
      } else {
        const user = await signInWithEmail(email, password);
        setEmail('');
        setPassword('');
        onSuccess(user);
        onClose();
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="modal-top">
          <span className="modal-step">
            {mode === 'login' ? 'INICIO DE SESIÓN' : 'NUEVA CUENTA'}
          </span>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={21} />
          </button>
        </div>

        <div className="auth-header">
          <h2 id="auth-title">
            {mode === 'login' ? 'Bienvenido a ' : 'Únete a '}
            <em>Adoptree.</em>
          </h2>
          <p>
            {mode === 'login'
              ? 'Accede a tu panel personal para consultar y gestionar tus árboles.'
              : 'Regístrate para guardar tus selecciones y acompañar el crecimiento de tu árbol.'}
          </p>
        </div>

        {/* Pestañas de Login / Registro */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            <LogIn size={16} /> Iniciar sesión
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            <UserPlus size={16} /> Registrarse
          </button>
        </div>

        {error && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-email">Correo electrónico</label>
            <div className="input-with-icon">
              <Mail size={17} />
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Contraseña</label>
            <div className="input-with-icon">
              <Lock size={17} />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="button button-dark auth-submit-btn"
            disabled={busy}
          >
            {busy ? (
              'Procesando...'
            ) : mode === 'login' ? (
              <>
                <LogIn size={17} /> Iniciar sesión
              </>
            ) : (
              <>
                <UserPlus size={17} /> Crear cuenta
              </>
            )}
          </button>
        </form>

        <p className="auth-footer-note">
          <ShieldCheck size={14} /> Cuenta local de esta demo.
        </p>
      </div>
    </div>
  );
}
