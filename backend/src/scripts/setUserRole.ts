import { ENV } from '../shared/config/env.js';
import { adminAuth } from '../shared/config/firebaseAdmin.js';
import { closePgPool, getPgPool } from '../shared/database/postgres.js';
import { runMigrations } from '../shared/database/migrate.js';
import { UserRole } from '../modules/auth/domain/entities/User.js';
import { userRepository } from '../modules/auth/infrastructure/repositories/userRepository.factory.js';

function parseArgs(argv: string[]): { email?: string; role?: UserRole } {
  const result: { email?: string; role?: UserRole } = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--email' && argv[i + 1]) {
      result.email = argv[++i];
    } else if (arg === '--role' && argv[i + 1]) {
      const val = argv[++i];
      if (val === 'admin' || val === 'customer') {
        result.role = val;
      }
    }
  }
  return result;
}

async function main() {
  const { email, role } = parseArgs(process.argv.slice(2));
  if (!email || !role) {
    console.error('Uso: npm run set-role -- --email usuario@dominio.com --role <admin|customer>');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`Modo de persistencia: ${ENV.PERSISTENCE_MODE}`);

  if (ENV.PERSISTENCE_MODE === 'postgres') {
    await runMigrations(getPgPool());
  } else {
    console.warn('Advertencia: PERSISTENCE_MODE="memory"; el cambio en memoria local no persistirá tras cerrar el script.');
  }

  let uid: string | null = null;
  let displayName = normalizedEmail.split('@')[0];
  let firebaseUpdated = false;

  if (ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
    const fbUser = await adminAuth.getUserByEmail(normalizedEmail);
    uid = fbUser.uid;
    displayName = fbUser.displayName || displayName;
    await adminAuth.setCustomUserClaims(uid, { role });
    firebaseUpdated = true;
  }

  const existing = (uid ? await userRepository.findById(uid) : null) || (await userRepository.findByEmail(normalizedEmail));
  let dbUpdated = false;
  let resolvedUid = existing?.uid || uid;

  if (existing) {
    const updated = await userRepository.updateRole(existing.uid, role);
    dbUpdated = Boolean(updated);
  } else if (uid) {
    await userRepository.save({
      uid,
      email: normalizedEmail,
      fullName: displayName,
      role,
      provider: 'password',
      createdAt: new Date().toISOString(),
    });
    dbUpdated = true;
  } else {
    throw new Error(`No se encontró el usuario ${normalizedEmail} ni en PostgreSQL ni en Firebase Admin.`);
  }

  console.log(`Rol actualizado: ${normalizedEmail} (uid: ${resolvedUid}) -> ${role}`);
  console.log(`  - Firebase Custom Claims: ${firebaseUpdated ? 'actualizado' : 'omitido (sin credenciales Admin SDK)'}`);
  console.log(`  - Repositorio (${ENV.PERSISTENCE_MODE}): ${dbUpdated ? 'actualizado' : 'no actualizado'}`);
  await closePgPool();
}

main().catch(async (err) => {
  console.error('Error al actualizar rol:', err);
  await closePgPool();
  process.exit(1);
});
