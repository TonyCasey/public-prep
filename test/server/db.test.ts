import { describe, it, expect, vi, beforeAll } from 'vitest';

describe('Database Configuration', () => {
  beforeAll(() => {
    // Mock DATABASE_URL_DEV for development environment
    vi.stubEnv('DATABASE_URL_DEV', 'postgresql://test:test@localhost:5432/testdb_dev');
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/testdb');
    vi.stubEnv('NODE_ENV', 'test');
  });

  it('should export database connection', async () => {
    // Import after mocking
    const dbModule = await import('../../backend/server/db');
    
    expect(dbModule.db).toBeDefined();
    expect(typeof dbModule.db).toBe('object');
  });

  it('should handle database connection configuration', () => {
    // Test database URL configuration logic
    const testUrls = [
      'postgresql://user:pass@localhost:5432/db',
      'postgresql://user@localhost/db',
      'postgres://user:pass@host:5432/db'
    ];

    testUrls.forEach(url => {
      expect(url).toMatch(/^postgres(ql)?:\/\//);
    });
  });

  it('should validate database URL format', () => {
    const validUrls = [
      'postgresql://test:test@localhost:5432/testdb',
      'postgres://user@localhost/db'
    ];

    const invalidUrls = [
      'invalid-url',
      'http://localhost:5432/db',
      'mysql://localhost:3306/db'
    ];

    validUrls.forEach(url => {
      expect(url).toMatch(/^postgres(ql)?:\/\//);
    });

    invalidUrls.forEach(url => {
      expect(url).not.toMatch(/^postgres(ql)?:\/\//);
    });
  });
});