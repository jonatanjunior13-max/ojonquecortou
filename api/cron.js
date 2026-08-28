import indexnowHandler from './_crons/indexnow.js';
import remindersHandler from './_crons/reminders.js';
import automationsHandler from './_crons/automations.js';
import dailyDigestHandler from './_crons/daily-digest.js';
import blogHandler from './_crons/blog.js';

function createMockRes() {
  const result = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    send(data) { this.body = data; return this; },
    end() { return this; }
  };
  return result;
}

export default async function handler(req, res) {
  const task = req.query.task || 'all';
  console.log(`[Cron Runner] Executando tarefa cron: ${task}`);

  // Individual task execution
  if (task === 'indexnow') return indexnowHandler(req, res);
  if (task === 'reminders') return remindersHandler(req, res);
  if (task === 'automations') return automationsHandler(req, res);
  if (task === 'daily-digest') return dailyDigestHandler(req, res);
  if (task === 'blog') return blogHandler(req, res);

  // Master Daily Execution ('all' or 'daily')
  if (task === 'all' || task === 'daily') {
    const report = {
      startedAt: new Date().toISOString(),
      tasks: {}
    };

    // 1. Reminders (Lembretes de agendamentos D-1)
    try {
      const mockRes = createMockRes();
      await remindersHandler(req, mockRes);
      report.tasks.reminders = mockRes.body || { status: mockRes.statusCode };
    } catch (e) {
      report.tasks.reminders = { error: e.message };
    }

    // 2. Automations (Régua de Relacionamento & Aniversários)
    try {
      const mockRes = createMockRes();
      await automationsHandler(req, mockRes);
      report.tasks.automations = mockRes.body || { status: mockRes.statusCode };
    } catch (e) {
      report.tasks.automations = { error: e.message };
    }

    // 3. Daily Digest (Resumo diário admin)
    try {
      const mockRes = createMockRes();
      await dailyDigestHandler(req, mockRes);
      report.tasks.dailyDigest = mockRes.body || { status: mockRes.statusCode };
    } catch (e) {
      report.tasks.dailyDigest = { error: e.message };
    }

    // 4. Blog (Publicação automática se agendada)
    try {
      const mockRes = createMockRes();
      await blogHandler(req, mockRes);
      report.tasks.blog = mockRes.body || { status: mockRes.statusCode };
    } catch (e) {
      report.tasks.blog = { error: e.message };
    }

    // 5. IndexNow (Sincronização SEO)
    try {
      const mockRes = createMockRes();
      await indexnowHandler(req, mockRes);
      report.tasks.indexnow = mockRes.body || { status: mockRes.statusCode };
    } catch (e) {
      report.tasks.indexnow = { error: e.message };
    }

    report.finishedAt = new Date().toISOString();
    return res.status(200).json({
      success: true,
      message: 'Todas as tarefas diárias da régua e cron foram executadas com sucesso.',
      report
    });
  }

  return res.status(400).json({ error: `Tarefa desconhecida: ${task}` });
}
