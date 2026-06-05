import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Platform Core (e2e)', () => {
  let app: INestApplication<App>;

  const adminEmail = 'admin@laborax.local';
  const adminPassword = 'Admin12345';

  beforeAll(async () => {
    process.env.OUTBOX_PUBLISHER_ENABLED = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toMatchObject({
      service: 'core-service',
      status: 'ok',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('detecta refresh token reuse y revoca la sesion activa', async () => {
    const loginResponse = await loginAsAdmin();
    const initialRefreshToken = loginResponse.body.refreshToken as string;

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: initialRefreshToken })
      .expect(201);

    const rotatedRefreshToken = refreshResponse.body.refreshToken as string;
    expect(rotatedRefreshToken).toBeTruthy();
    expect(rotatedRefreshToken).not.toBe(initialRefreshToken);
    const initialPayload = JSON.parse(
      Buffer.from(initialRefreshToken.split('.')[1], 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
    const rotatedPayload = JSON.parse(
      Buffer.from(rotatedRefreshToken.split('.')[1], 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
    expect(rotatedPayload.tokenId).toBeTruthy();
    expect(initialPayload.tokenId).toBeTruthy();
    expect(rotatedPayload.tokenId).not.toBe(initialPayload.tokenId);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: initialRefreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: rotatedRefreshToken })
      .expect(401);
  });

  it('logout-all revoca las sesiones activas del usuario', async () => {
    const sessionOne = await loginAsAdmin();
    const sessionTwo = await loginAsAdmin();

    await request(app.getHttpServer())
      .post('/auth/logout-all')
      .set('Authorization', `Bearer ${sessionOne.body.accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: sessionTwo.body.refreshToken })
      .expect(401);
  });

  it('rota secretos M2M con ventana de gracia y mantiene ambos secretos validos temporalmente', async () => {
    const adminSession = await loginAsAdmin();
    const adminAccessToken = adminSession.body.accessToken as string;
    const initialSecret = `test-secret-${Date.now()}-1234567890`;
    const clientId = `test-client-${Date.now()}`;

    const createResponse = await request(app.getHttpServer())
      .post('/service-clients')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        clientId,
        name: `Test Client ${Date.now()}`,
        clientSecret: initialSecret,
        allowedScopes: ['auth:introspect'],
        status: 'ACTIVE',
      })
      .expect(201);

    const serviceClientId = createResponse.body.id as string;
    expect(serviceClientId).toBeTruthy();

    await request(app.getHttpServer())
      .post('/auth/internal/introspect')
      .set('x-client-id', clientId)
      .set('x-client-secret', initialSecret)
      .send({ token: adminAccessToken })
      .expect(201);

    const rotateResponse = await request(app.getHttpServer())
      .post(`/service-clients/${serviceClientId}/rotate-secret`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(201);

    const rotatedSecret = rotateResponse.body.clientSecret as string;
    expect(rotatedSecret).toBeTruthy();
    expect(rotatedSecret).not.toBe(initialSecret);
    expect(rotateResponse.body.previousSecretValidUntil).toBeTruthy();

    await request(app.getHttpServer())
      .post('/auth/internal/introspect')
      .set('x-client-id', clientId)
      .set('x-client-secret', initialSecret)
      .send({ token: adminAccessToken })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/internal/introspect')
      .set('x-client-id', clientId)
      .set('x-client-secret', rotatedSecret)
      .send({ token: adminAccessToken })
      .expect(201);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  function loginAsAdmin() {
    return request(app.getHttpServer()).post('/auth/login').send({
      email: adminEmail,
      password: adminPassword,
    });
  }
});
