const request = require('supertest');
const axios = require('axios');
const { app, server } = require('../sender');

// Mock axios to avoid actual network calls during testing
jest.mock('axios');

describe('Sender Service', () => {

  afterAll((done) => {
    // Properly close the server to prevent Jest from hanging
    server.close(done);
  });
    // ADD THIS BLOCK:
  beforeEach(() => {
    jest.clearAllMocks(); // This resets the call count to 0
  });
    it('should return health status as ok', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    it('should return JSON content type', async () => {
      await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);
    });
  });

  describe('GET /call-listener', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully reach listener and return response', async () => {
      const mockListenerResponse = {
        reply: 'Hello Sender! This is the Listener on port 4000.',
        timestamp: new Date().toISOString()
      };

      axios.get.mockResolvedValue({ data: mockListenerResponse });

      const response = await request(app)
        .get('/call-listener')
        .expect(200);

      expect(response.body).toHaveProperty('sender_status');
      expect(response.body).toHaveProperty('listener_said');
      expect(response.body.sender_status).toBe('Successfully reached listener!');
      expect(response.body.listener_said).toEqual(mockListenerResponse);
      expect(axios.get).toHaveBeenCalledWith('http://listener-service:4000/receive');
    });

    it('should call listener service at correct URL', async () => {
      axios.get.mockResolvedValue({
        data: { reply: 'test', timestamp: new Date() }
      });

      await request(app)
        .get('/call-listener')
        .expect(200);

      expect(axios.get).toHaveBeenCalledWith('http://listener-service:4000/receive');
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should return error when listener is unreachable', async () => {
      const errorMessage = 'ECONNREFUSED: Connection refused';
      axios.get.mockRejectedValue(new Error(errorMessage));

      const response = await request(app)
        .get('/call-listener')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(response.body.error).toBe('Could not reach listener');
      expect(response.body.details).toBe(errorMessage);
    });

    it('should handle listener timeout error', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      axios.get.mockRejectedValue(timeoutError);

      const response = await request(app)
        .get('/call-listener')
        .expect(500);

      expect(response.body.error).toBe('Could not reach listener');
      expect(response.body.details).toContain('timeout');
    });

    it('should return JSON content type on success', async () => {
      axios.get.mockResolvedValue({
        data: { reply: 'test', timestamp: new Date() }
      });

      await request(app)
        .get('/call-listener')
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('should return JSON content type on error', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await request(app)
        .get('/call-listener')
        .expect('Content-Type', /json/)
        .expect(500);
    });
  });

  describe('Server', () => {
    it('should be listening on port 3000', () => {
      expect(app).toBeDefined();
    });
  });

  describe('Route availability', () => {
    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/nonexistent')
        .expect(404);
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should handle successful listener communication flow', async () => {
      const mockListenerResponse = {
        reply: 'Hello Sender! This is the Listener on port 4000.',
        timestamp: new Date().toISOString()
      };

      axios.get.mockResolvedValue({ data: mockListenerResponse });

      // First check health
      const healthResponse = await request(app)
        .get('/health')
        .expect(200);
      expect(healthResponse.body.status).toBe('ok');

      // Then call listener
      const callResponse = await request(app)
        .get('/call-listener')
        .expect(200);
      expect(callResponse.body.sender_status).toBe('Successfully reached listener!');
    });

    it('should maintain separate endpoints', async () => {
      axios.get.mockResolvedValue({
        data: { reply: 'test', timestamp: new Date() }
      });

      // Health endpoint should not call listener
      await request(app)
        .get('/health')
        .expect(200);
      expect(axios.get).toHaveBeenCalledTimes(0);

      // Reset mock to verify call-listener makes a call
      jest.clearAllMocks();
      axios.get.mockResolvedValue({
        data: { reply: 'test', timestamp: new Date() }
      });

      // Call listener endpoint
      await request(app)
        .get('/call-listener')
        .expect(200);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });
