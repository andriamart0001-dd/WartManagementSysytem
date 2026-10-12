const request = require('supertest');
const app = require('../src/index');

describe('Health Check API', () => {
  it('should return a 200 OK status and a success message', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('Hospital Ward Management API is running');
  });
});
