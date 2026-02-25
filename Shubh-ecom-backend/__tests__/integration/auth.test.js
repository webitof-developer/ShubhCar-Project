const request = require('supertest');
const {
  setupIntegrationTests,
  clearDatabase,
  teardownIntegrationTests,
} = require('./setup');
const { createUser } = require('./helpers/factories');
const User = require('../../models/User.model');

let app;

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    const setup = await setupIntegrationTests();
    app = setup.app;
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'SecurePassword123!',
        phone: '9876543210',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'customer',
      });

      // Assert database side-effect
      const dbUser = await User.findOne({ email: 'john.doe@example.com' });
      expect(dbUser).toBeTruthy();
      expect(dbUser.firstName).toBe('John');
      expect(dbUser.passwordHash).not.toBe('SecurePassword123!'); // Should be hashed
    });

    it('should reject registration with duplicate email', async () => {
      const email = 'duplicate@example.com';
      await createUser({ email });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email,
          password: 'Password123!',
          phone: '9876543210',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/already exists/i);
    });

    it('should reject registration with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'weak',
          phone: '9876543210',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return JWT token on successful login', async () => {
      const email = 'login@example.com';
      const password = 'Password123!';
      
      // Create user with known password
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Login',
          lastName: 'Test',
          email,
          password,
          phone: '9876543210',
        });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: email, password })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT format
      expect(response.body.data.user.email).toBe(email);
    });

    it('should reject login with wrong password', async () => {
      const email = 'test@example.com';
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email,
          password: 'CorrectPassword123!',
          phone: '9876543210',
        });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid credentials/i);
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Protected Route Authentication', () => {
    let token;
    let user;

    beforeEach(async () => {
      // Register to get token (avoids login rate limiter in suite)
      const email = 'protected@example.com';
      const password = 'Password123!';

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Protected',
          lastName: 'Test',
          email,
          password,
          phone: '9876543210',
        })
        .expect(200);

      token =
        registerResponse.body?.data?.accessToken ||
        registerResponse.body?.data?.token;
      user = registerResponse.body?.data?.user;
    });

    it('should reject unauthenticated access to protected route', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/unauthorized|token/i);
    });

    it('should allow access with valid JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cartId');
    });

    it('should reject access with invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject access with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', token) // Missing "Bearer" prefix
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
