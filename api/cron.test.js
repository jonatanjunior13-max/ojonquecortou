import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './cron.js';
import indexnowHandler from './_crons/indexnow.js';
import remindersHandler from './_crons/reminders.js';
import automationsHandler from './_crons/automations.js';
import dailyDigestHandler from './_crons/daily-digest.js';
import blogHandler from './_crons/blog.js';

// Mock the dependencies
vi.mock('./_crons/indexnow.js', () => ({ default: vi.fn() }));
vi.mock('./_crons/reminders.js', () => ({ default: vi.fn() }));
vi.mock('./_crons/automations.js', () => ({ default: vi.fn() }));
vi.mock('./_crons/daily-digest.js', () => ({ default: vi.fn() }));
vi.mock('./_crons/blog.js', () => ({ default: vi.fn() }));

describe('cron handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  const getAuthorizedReq = (task) => ({
    headers: {
      authorization: 'Bearer test-secret'
    },
    query: { task }
  });

  it('should return 401 when authorization header is missing', async () => {
    const req = { headers: {}, query: { task: 'indexnow' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 401 when authorization header is invalid', async () => {
    const req = { headers: { authorization: 'Bearer wrong-secret' }, query: { task: 'indexnow' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should call indexnowHandler when task is indexnow', async () => {
    const req = getAuthorizedReq('indexnow');
    const res = {};
    await handler(req, res);
    expect(indexnowHandler).toHaveBeenCalledWith(req, res);
  });

  it('should call remindersHandler when task is reminders', async () => {
    const req = getAuthorizedReq('reminders');
    const res = {};
    await handler(req, res);
    expect(remindersHandler).toHaveBeenCalledWith(req, res);
  });

  it('should call automationsHandler when task is automations', async () => {
    const req = getAuthorizedReq('automations');
    const res = {};
    await handler(req, res);
    expect(automationsHandler).toHaveBeenCalledWith(req, res);
  });

  it('should call dailyDigestHandler when task is daily-digest', async () => {
    const req = getAuthorizedReq('daily-digest');
    const res = {};
    await handler(req, res);
    expect(dailyDigestHandler).toHaveBeenCalledWith(req, res);
  });

  it('should call blogHandler when task is blog', async () => {
    const req = getAuthorizedReq('blog');
    const res = {};
    await handler(req, res);
    expect(blogHandler).toHaveBeenCalledWith(req, res);
  });

  it('should return 400 when task is missing or unknown', async () => {
    const req = getAuthorizedReq('unknown-task');
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unknown or missing task parameter: unknown-task' });
  });

  it('should return 400 when task is undefined', async () => {
    const req = getAuthorizedReq(undefined);
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unknown or missing task parameter: undefined' });
  });
});
