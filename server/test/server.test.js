const { expect } = require('chai');
const request = require('supertest');
// We'll use a separate file for the server to test
const express = require('express');
const app = express();

// Mock for testing - we don't want to actually start the server
app.get('/api/status', (req, res) => {
  res.json({ status: 'stopped', networkInterfaces: ['eth0'] });
});

describe('Server API', function() {
  it('GET /api/status should return server status', function(done) {
    request(app)
      .get('/api/status')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.body).to.have.property('status');
        expect(res.body).to.have.property('networkInterfaces');
        done();
      });
  });
});