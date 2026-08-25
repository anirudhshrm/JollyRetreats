const request = require('supertest');
const express = require('express');

// Simple test app
const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

describe('Server Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should handle 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown');
    
    expect(response.status).toBe(404);
  });
});
