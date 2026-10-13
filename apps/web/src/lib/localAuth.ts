export type DemoUser = {
  id: string;
  email: string;
};

type StoredAccount = DemoUser & {
  salt: string;
  passwordHash: string;
};

const ACCOUNTS_KEY = 'adoptree-demo-accounts';
const SESSION_KEY = 'adoptree-demo-session';
const PASSWORD_HASH_ITERATIONS = 310_000;

function readAccounts(): StoredAccount[] {
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  if (!stored) return [];

  const accounts: unknown = JSON.parse(stored);
  if (!Array.isArray(accounts)) {
    throw new Error('No fue posible acceder a las cuentas guardadas.');
  }

  return accounts as StoredAccount[];
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function hashPassword(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: Uint8Array.from(salt).buffer, iterations: PASSWORD_HASH_ITERATIONS },
    key,
    256
  );
  return new Uint8Array(bits);
}

function legacyUserId(email: string): string {
  const bytes = new TextEncoder().encode(email);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `usr_${btoa(binary).replace(/=/g, '').slice(0, 16)}`;
}

export async function registerWithEmail(emailInput: string, password: string): Promise<DemoUser> {
  const email = emailInput.trim().toLowerCase();
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === email)) {
    throw new Error('Ya existe una cuenta con este correo electrónico.');
  }

  const id = legacyUserId(email);
  if (accounts.some((account) => account.id === id)) {
    throw new Error('No se pudo crear la cuenta. Verifica el correo e inténtalo de nuevo.');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await hashPassword(password, salt);
  const user = { id, email };
  const account: StoredAccount = {
    ...user,
    salt: toBase64(salt),
    passwordHash: toBase64(passwordHash),
  };

  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  localStorage.setItem(SESSION_KEY, user.id);
  return user;
}

export async function signInWithEmail(emailInput: string, password: string): Promise<DemoUser> {
  const email = emailInput.trim().toLowerCase();
  const account = readAccounts().find((item) => item.email === email);
  if (!account) throw new Error('Correo o contraseña incorrectos.');

  const candidate = await hashPassword(password, fromBase64(account.salt));
  const expected = fromBase64(account.passwordHash);
  const matches =
    candidate.length === expected.length &&
    candidate.reduce((difference, byte, index) => difference | (byte ^ expected[index]), 0) === 0;

  if (!matches) throw new Error('Correo o contraseña incorrectos.');

  const user: DemoUser = { id: account.id, email: account.email };
  localStorage.setItem(SESSION_KEY, user.id);
  return user;
}

export function getCurrentUser(): DemoUser | null {
  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return null;

  const account = readAccounts().find((item) => item.id === userId);
  if (!account) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  return { id: account.id, email: account.email };
}

export function signOutUser(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function formatAuthError(error: unknown): string {
  if (error instanceof Error && error.message === 'Ya existe una cuenta con este correo electrónico.') {
    return error.message;
  }
  if (error instanceof Error && error.message === 'Correo o contraseña incorrectos.') {
    return error.message;
  }
  if (error instanceof Error && error.message === 'No fue posible acceder a las cuentas guardadas.') {
    return error.message;
  }
  return 'No fue posible completar la solicitud. Inténtalo de nuevo.';
}
