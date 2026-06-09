import bcrypt from 'bcrypt';
import { desc, eq } from 'drizzle-orm';
import { serviceClients, serviceClientSecrets } from '../schemas';
import type { SeedContext } from './seed-context';

const serviceClientDefinitions = [
  {
    clientIdEnv: 'SEED_PORTAL_BFF_CLIENT_ID',
    clientSecretEnv: 'SEED_PORTAL_BFF_CLIENT_SECRET',
    name: 'portal-bff',
    allowedScopes: ['auth:introspect', 'platform:read'],
  },
  {
    clientIdEnv: 'SEED_INTERNAL_JOBS_CLIENT_ID',
    clientSecretEnv: 'SEED_INTERNAL_JOBS_CLIENT_SECRET',
    name: 'internal-jobs',
    allowedScopes: [
      'auth:introspect',
      'outbox:dispatch',
      'outbox:read',
      'outbox:retry',
      'platform:jobs',
    ],
  },
  {
    clientIdEnv: 'SEED_WORKFORCE_SERVICE_CLIENT_ID',
    clientSecretEnv: 'SEED_WORKFORCE_SERVICE_CLIENT_SECRET',
    name: 'workforce-service',
    allowedScopes: ['auth:introspect', 'platform:read'],
  },
  {
    clientIdEnv: 'SEED_ACCESS_CONTROL_CLIENT_ID',
    clientSecretEnv: 'SEED_ACCESS_CONTROL_CLIENT_SECRET',
    name: 'access-control-service',
    allowedScopes: ['auth:introspect', 'platform:read'],
  },
] as const;

export async function seedServiceClients({ db }: SeedContext) {
  const results: Array<{
    clientId: string;
    action: 'created' | 'skipped_existing' | 'rotated_secret';
  }> = [];

  for (const definition of serviceClientDefinitions) {
    const clientId = process.env[definition.clientIdEnv];
    const clientSecret = process.env[definition.clientSecretEnv];

    if (!clientId || !clientSecret) {
      continue;
    }

    const [existingClient] = await db
      .select()
      .from(serviceClients)
      .where(eq(serviceClients.clientId, clientId))
      .limit(1);

    if (existingClient) {
      await db
        .update(serviceClients)
        .set({
          name: definition.name,
          allowedScopes: [...definition.allowedScopes],
        })
        .where(eq(serviceClients.id, existingClient.id));

      const existingSecrets = await db
        .select({
          id: serviceClientSecrets.id,
          secretHash: serviceClientSecrets.secretHash,
          version: serviceClientSecrets.version,
        })
        .from(serviceClientSecrets)
        .where(eq(serviceClientSecrets.serviceClientId, existingClient.id))
        .orderBy(desc(serviceClientSecrets.version))
        .limit(20);

      const [existingSecret] = existingSecrets;

      if (!existingSecret) {
        await db.insert(serviceClientSecrets).values({
          serviceClientId: existingClient.id,
          secretHash: await bcrypt.hash(clientSecret, 10),
          version: 1,
          isPrimary: true,
        });
      }

      const hasMatchingSecret = await Promise.all(
        existingSecrets.map((secret) =>
          bcrypt.compare(clientSecret, secret.secretHash),
        ),
      ).then((matches) => matches.some(Boolean));

      if (!hasMatchingSecret) {
        const now = new Date();

        await db
          .update(serviceClientSecrets)
          .set({
            isPrimary: false,
            validUntil: now,
            revokedAt: now,
          })
          .where(eq(serviceClientSecrets.serviceClientId, existingClient.id));

        await db.insert(serviceClientSecrets).values({
          serviceClientId: existingClient.id,
          secretHash: await bcrypt.hash(clientSecret, 10),
          version: existingSecret.version + 1,
          isPrimary: true,
        });

        results.push({
          clientId,
          action: 'rotated_secret',
        });
        continue;
      }

      results.push({
        clientId,
        action: 'skipped_existing',
      });
      continue;
    }

    const [createdClient] = await db
      .insert(serviceClients)
      .values({
        clientId,
        name: definition.name,
        allowedScopes: [...definition.allowedScopes],
        status: 'ACTIVE',
      })
      .returning();

    await db.insert(serviceClientSecrets).values({
      serviceClientId: createdClient.id,
      secretHash: await bcrypt.hash(clientSecret, 10),
      version: 1,
      isPrimary: true,
    });

    results.push({
      clientId: createdClient.clientId,
      action: 'created',
    });
  }

  return results;
}
