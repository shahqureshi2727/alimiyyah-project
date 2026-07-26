export const projectId = 'demo-qasas-practice';

const authBaseUrl = `http://127.0.0.1:9099`;
const firestoreBaseUrl = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`;
const ownerHeaders = {
  Authorization: 'Bearer owner',
  'Content-Type': 'application/json',
};

function fieldValue(value) {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number' && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (value === null) return { nullValue: null };
  throw new Error(`Unsupported Firestore test value: ${value}`);
}

function fieldsFrom(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, fieldValue(value)]));
}

async function writeDocument(path, data) {
  const response = await fetch(`${firestoreBaseUrl}/${path}`, {
    method: 'PATCH',
    headers: ownerHeaders,
    body: JSON.stringify({ fields: fieldsFrom(data) }),
  });

  if (!response.ok) {
    throw new Error(`Could not seed ${path}: ${response.status} ${await response.text()}`);
  }
}

export async function documentExists(path) {
  const response = await fetch(`${firestoreBaseUrl}/${path}`, {
    headers: ownerHeaders,
  });

  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`Could not read ${path}: ${response.status} ${await response.text()}`);
  }
  return true;
}

export async function clearEmulators() {
  await Promise.all([
    fetch(`${authBaseUrl}/emulator/v1/projects/${projectId}/accounts`, {
      method: 'DELETE',
    }),
    fetch(`http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`, {
      method: 'DELETE',
    }),
  ]);
}

export async function seedUser({ username, password = 'password123', role = 'student' }) {
  const response = await fetch(
    `${authBaseUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `${username}@qasas.local`,
        password,
        returnSecureToken: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Could not seed auth user: ${response.status} ${await response.text()}`);
  }

  const user = await response.json();
  await writeDocument(`users/${user.localId}`, { username, role });
  return { uid: user.localId, username };
}

export async function seedQuizResult({
  id = 'seed-result',
  userId,
  username,
  mode = 'fiqh',
  bankSource = 'fiqh',
  score = 8,
  total = 10,
  durationSeconds = 120,
}) {
  await writeDocument(`quizResults/${id}`, {
    userId,
    username,
    mode,
    bankSource,
    score,
    total,
    durationSeconds,
    completedAt: new Date(),
  });
}
