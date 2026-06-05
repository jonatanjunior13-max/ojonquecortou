import { describe, it, expect } from 'vitest';
import { EMAIL_CSS, HTML_TEMPLATES, ADMIN_HTML_TEMPLATES } from '../emailTemplates';

describe('emailTemplates', () => {
  describe('EMAIL_CSS', () => {
    it('should be a string containing necessary font imports', () => {
      expect(typeof EMAIL_CSS).toBe('string');
      expect(EMAIL_CSS).toContain('@import url');
      expect(EMAIL_CSS).toContain('fonts.googleapis.com');
    });
  });

  describe('HTML_TEMPLATES', () => {
    const expectedTemplates = [
      'd1', 'd7', 'd21', 'd35', 'd60', 'd90',
      'aniversario', 'launch_e1', 'launch_e2', 'launch_e3'
    ];

    it('should have all the expected templates', () => {
      expectedTemplates.forEach(templateKey => {
        expect(HTML_TEMPLATES).toHaveProperty(templateKey);
        expect(typeof HTML_TEMPLATES[templateKey]).toBe('string');
      });
    });

    it('should correctly render the confirmacao_solicitacao function template', () => {
      const mockData = {
        nome: 'Jane Doe',
        servico: 'Corte',
        data: '15/10/2023'
      };

      const resultHTML = HTML_TEMPLATES.confirmacao_solicitacao(mockData);

      expect(typeof resultHTML).toBe('string');
      expect(resultHTML).toContain(mockData.nome);
      expect(resultHTML).toContain(mockData.servico);
      expect(resultHTML).toContain(mockData.data);
      expect(resultHTML).toMatchSnapshot('pure-function-like-render-confirmacao_solicitacao');
    });

    it('should match snapshots for all templates to prevent unexpected regressions', () => {
      expectedTemplates.forEach(templateKey => {
        expect(HTML_TEMPLATES[templateKey]).toMatchSnapshot(templateKey);
      });
    });

    it('should contain expected placeholders like {nome} in client templates', () => {
      const templatesWithNome = ['d1', 'd7', 'd21', 'd35', 'd60', 'd90', 'aniversario', 'launch_e1', 'launch_e2', 'launch_e3'];
      templatesWithNome.forEach(templateKey => {
        expect(HTML_TEMPLATES[templateKey]).toContain('{nome}');
      });
    });
  });

  describe('ADMIN_HTML_TEMPLATES', () => {
    const expectedAdminTemplates = [
      'admin_solicitacao_recebida',
      'admin_horario_confirmado'
    ];

    it('should have all the expected admin templates', () => {
      expectedAdminTemplates.forEach(templateKey => {
        expect(ADMIN_HTML_TEMPLATES).toHaveProperty(templateKey);
        expect(typeof ADMIN_HTML_TEMPLATES[templateKey]).toBe('string');
      });
    });

    it('should match snapshots for admin templates', () => {
      expectedAdminTemplates.forEach(templateKey => {
        expect(ADMIN_HTML_TEMPLATES[templateKey]).toMatchSnapshot(templateKey);
      });
    });

    it('should act as pure functions when replaced with actual data', () => {
      const mockData = {
        nome: 'John Doe',
        data: '10/10/2023',
        servico: 'Corte Especial'
      };

      expectedAdminTemplates.forEach(templateKey => {
        const resultHTML = ADMIN_HTML_TEMPLATES[templateKey]
          .replace(/\[Nome do Cliente\]/g, mockData.nome)
          .replace(/\[Data\]/g, mockData.data)
          .replace(/\[Serviço\]/g, mockData.servico);

        expect(resultHTML).not.toContain('[Nome do Cliente]');
        expect(resultHTML).not.toContain('[Data]');
        expect(resultHTML).not.toContain('[Serviço]');
        expect(resultHTML).toContain(mockData.nome);
        expect(resultHTML).toContain(mockData.data);
        expect(resultHTML).toContain(mockData.servico);
        expect(resultHTML).toMatchSnapshot(`pure-function-like-render-${templateKey}`);
      });
    });
  });
});
