import { describe, it, expect, vi, beforeEach } from 'vitest';
import Papa from 'papaparse';
import { parseClientCSV } from './clientImport';

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

describe('parseClientCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse valid client data correctly', () => {
    const mockFile = new File([''], 'test.csv');
    const mockResults = {
      data: [
        {
          nome: 'John Doe',
          telefone: '11999999999',
          email: 'john@example.com',
          ultimavisita: '15/05/2023',
          aniversario: '1990-01-01',
        },
      ],
    };

    Papa.parse.mockImplementation((file, options) => {
      options.complete(mockResults);
    });

    const onResult = vi.fn();
    parseClientCSV(mockFile, onResult);

    expect(onResult).toHaveBeenCalledTimes(1);
    const { clients, errors } = onResult.mock.calls[0][0];

    expect(errors).toHaveLength(0);
    expect(clients).toHaveLength(1);
    expect(clients[0]).toMatchObject({
      name: 'John Doe',
      phone: '11999999999',
      email: 'john@example.com',
      lastVisit: '2023-05-15',
      birthdate: '1990-01-01',
      sexo: 'Não informado',
      curvatura: '',
      porosidade: '',
      elasticidade: '',
      quimicas: '',
      produtosRecomendados: '',
      observacoes: '',
      source: 'csv_import',
    });
    expect(clients[0].createdAt).toBeDefined();
  });

  it('should accumulate errors for missing nome', () => {
    const mockFile = new File([''], 'test.csv');
    const mockResults = {
      data: [
        {
          nome: '',
          telefone: '11999999999',
          email: 'john@example.com',
        },
      ],
    };

    Papa.parse.mockImplementation((file, options) => {
      options.complete(mockResults);
    });

    const onResult = vi.fn();
    parseClientCSV(mockFile, onResult);

    const { clients, errors } = onResult.mock.calls[0][0];
    expect(clients).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe('Linha 2: campo "nome" ausente.');
  });

  it('should accumulate errors for missing telefone', () => {
    const mockFile = new File([''], 'test.csv');
    const mockResults = {
      data: [
        {
          nome: 'John Doe',
          telefone: '',
          email: 'john@example.com',
        },
      ],
    };

    Papa.parse.mockImplementation((file, options) => {
      options.complete(mockResults);
    });

    const onResult = vi.fn();
    parseClientCSV(mockFile, onResult);

    const { clients, errors } = onResult.mock.calls[0][0];
    expect(clients).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe('Linha 2: campo "telefone" ausente.');
  });

  it('should accumulate errors for invalid telefone length', () => {
    const mockFile = new File([''], 'test.csv');
    const mockResults = {
      data: [
        {
          nome: 'John Doe',
          telefone: '123456789', // 9 digits
          email: 'john@example.com',
        },
      ],
    };

    Papa.parse.mockImplementation((file, options) => {
      options.complete(mockResults);
    });

    const onResult = vi.fn();
    parseClientCSV(mockFile, onResult);

    const { clients, errors } = onResult.mock.calls[0][0];
    expect(clients).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe('Linha 2: telefone "123456789" inválido (mínimo 10 dígitos com DDD).');
  });

  it('should handle parser errors', () => {
    const mockFile = new File([''], 'test.csv');
    const mockError = new Error('Parse failure');

    Papa.parse.mockImplementation((file, options) => {
      options.error(mockError);
    });

    const onResult = vi.fn();
    parseClientCSV(mockFile, onResult);

    const { clients, errors } = onResult.mock.calls[0][0];
    expect(clients).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe('Erro ao ler o arquivo: Parse failure');
  });

  it('should format header using transformHeader', () => {
    // This is trickier to test since Papa.parse is mocked and its internal implementation handles transformHeader.
    // However, we can assert that parseClientCSV passes the expected transformHeader function
    // and verify what that function does.

    const mockFile = new File([''], 'test.csv');
    Papa.parse.mockImplementation(() => {});

    const onResult = vi.fn();
    parseClientCSV(mockFile, onResult);

    const passedOptions = Papa.parse.mock.calls[0][1];
    expect(passedOptions.transformHeader).toBeDefined();

    const transformHeader = passedOptions.transformHeader;

    expect(transformHeader(' Nome ')).toBe('nome');
    expect(transformHeader('Telefone_!')).toBe('telefone');
    expect(transformHeader('Última Visita')).toBe('ultimavisita');
  });
});
