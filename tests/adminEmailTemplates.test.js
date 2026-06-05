import { describe, it, expect } from 'vitest';
import { ADMIN_HTML_TEMPLATES } from '../src/utils/emailTemplates.js';

describe('ADMIN_HTML_TEMPLATES', () => {
  it('should generate admin_solicitacao_recebida template with correct variables replaced', () => {
    // Now it's a function that takes data
    const templateFunction = ADMIN_HTML_TEMPLATES.admin_solicitacao_recebida;

    const testData = {
      data: '10/05/2026',
      horario: '14:00',
      nome: 'Maria Silva',
      email: 'maria@example.com',
      servico: 'Corte',
      telefone: '31999999999'
    };

    const html = templateFunction(testData);

    expect(html).toContain(testData.data);
    expect(html).toContain(testData.horario);
    expect(html).toContain(testData.nome);
    expect(html).toContain(testData.email);
    expect(html).toContain(testData.servico);
    expect(html).toContain(testData.telefone);

    // Check that we don't accidentally contain the strings "undefined"
    expect(html).not.toContain('undefined');
  });

  it('should generate admin_horario_confirmado template with correct variables replaced', () => {
    const templateFunction = ADMIN_HTML_TEMPLATES.admin_horario_confirmado;

    const testData = {
      data: '12/05/2026',
      horario: '10:00',
      nome: 'João Souza',
      servico: 'Coloração'
    };

    const html = templateFunction(testData);

    expect(html).toContain(testData.data);
    expect(html).toContain(testData.horario);
    expect(html).toContain(testData.nome);
    expect(html).toContain(testData.servico);

    // Check that we don't accidentally contain the strings "undefined"
    expect(html).not.toContain('undefined');
  });

  it('should handle undefined values gracefully without throwing or rendering undefined', () => {
    const templateFunction = ADMIN_HTML_TEMPLATES.admin_horario_confirmado;
    const html = templateFunction({});

    // It should just render empty strings where variables normally go, so checking length or similar
    expect(html.length).toBeGreaterThan(0);
    expect(html).not.toContain('undefined');
  });
});
