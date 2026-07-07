import { describe, it, expect, vi } from 'vitest';
import { parseClientCSV } from './clientImport.js';
import Papa from 'papaparse';

vi.mock('papaparse', () => {
  return {
    default: {
      parse: vi.fn()
    }
  };
});

describe('parseClientCSV', () => {
  it('handles error from Papa.parse', () => {
    Papa.parse.mockImplementationOnce((file, options) => {
      options.error(new Error('Test error parsing'));
    });

    const file = new File([''], 'test.csv', { type: 'text/csv' });
    let result = null;

    parseClientCSV(file, (res) => {
      result = res;
    });

    expect(result).not.toBeNull();
    expect(result.clients).toEqual([]);
    expect(result.errors).toEqual(['Erro ao ler o arquivo: Test error parsing']);
  });

  it('handles successful parsing with valid data', () => {
    Papa.parse.mockImplementationOnce((file, options) => {
      // simulate the transformHeader function
      const transformedData = [
        {
          nome: 'João Silva',
          telefone: '11999999999',
          email: 'joao@example.com',
          ultimavisita: '2023-01-01',
          aniversario: '1990-05-10'
        }
      ];
      options.complete({ data: transformedData });
    });

    const file = new File([''], 'test.csv', { type: 'text/csv' });
    let result = null;

    parseClientCSV(file, (res) => {
      result = res;
    });

    expect(result).not.toBeNull();
    expect(result.errors).toEqual([]);
    expect(result.clients).toHaveLength(1);
    expect(result.clients[0]).toMatchObject({
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@example.com',
      lastVisit: '2023-01-01',
      birthdate: '1990-05-10',
      source: 'csv_import'
    });
  });

  it('returns errors for missing required fields', () => {
    Papa.parse.mockImplementationOnce((file, options) => {
      options.complete({
        data: [
          { nome: '', telefone: '11999999999' },
          { nome: 'Maria', telefone: '' },
          { nome: 'Pedro', telefone: '123' }
        ]
      });
    });

    const file = new File([''], 'test.csv', { type: 'text/csv' });
    let result = null;

    parseClientCSV(file, (res) => {
      result = res;
    });

    expect(result).not.toBeNull();
    expect(result.clients).toHaveLength(0);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]).toContain('Linha 2: campo "nome" ausente');
    expect(result.errors[1]).toContain('Linha 3: campo "telefone" ausente');
    expect(result.errors[2]).toContain('Linha 4: telefone "123" inválido');
  });

  it('parses dates in dd/mm/yyyy format', () => {
    Papa.parse.mockImplementationOnce((file, options) => {
      options.complete({
        data: [
          {
            nome: 'Carlos',
            telefone: '11988888888',
            ultimavisita: '31/12/2022',
            aniversario: '15/08/1985'
          }
        ]
      });
    });

    const file = new File([''], 'test.csv', { type: 'text/csv' });
    let result = null;

    parseClientCSV(file, (res) => {
      result = res;
    });

    expect(result.clients[0].lastVisit).toBe('2022-12-31');
    expect(result.clients[0].birthdate).toBe('1985-08-15');
  });
});
