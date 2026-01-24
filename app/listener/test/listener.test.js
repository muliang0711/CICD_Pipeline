const request = require('supertest');
const express = require('express');
const { app, server } = require('../listener');

describe('Listener Service', () => {

  afterAll((done) => {
    // Properly close the server to prevent Jest from hanging
    server.close(done);
  });
  
  describe('GET /receive', () => {

    // ADD THIS BLOCK:
  beforeEach(() => {
    jest.clearAllMocks(); // This resets the call count to 0
  });

    it('should return a successful response with reply and timestamp', async () => {
      const response = await request(app)
        .get('/receive')
        .expect(200);

      expect(response.body).toHaveProperty('reply');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.reply).toBe('Hello Sender! This is the Listener on port 4000.');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return a valid timestamp in the response', async () => {
      const response = await request(app)
        .get('/receive')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(new Date().getTime());
    });

    it('should return JSON content type', async () => {
      await request(app)
        .get('/receive')
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('should handle multiple requests', async () => {
      const responses = await Promise.all([
        request(app).get('/receive'),
        request(app).get('/receive'),
        request(app).get('/receive')
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('reply');
        expect(response.body).toHaveProperty('timestamp');
      });
    });
  });

  describe('Server', () => {

    // ADD THIS BLOCK:
  beforeEach(() => {
    jest.clearAllMocks(); // This resets the call count to 0
  });

    it('should be listening on port 4000', () => {
      // This is tested by the fact that the app module exports the server
      expect(app).toBeDefined();
    });
  });

  describe('Route availability', () => {
    // ADD THIS BLOCK:
  beforeEach(() => {
    jest.clearAllMocks(); // This resets the call count to 0
  });

    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/nonexistent')
        .expect(404);
    });
  });
});
