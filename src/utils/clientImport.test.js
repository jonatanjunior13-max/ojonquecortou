import { describe, it, expect } from 'vitest';
import { parseClientCSV } from './clientImport.js';

describe('parseClientCSV', () => {
  it('should return errors for missing nome or telefone', () => {
    // We create a mock file with CSV content
    const csvContent = `nome,telefone,email,ultimaVisita,aniversario\n,11999999999,test@example.com,,\nTest User,,test@example.com,,\nTest User,123,,,,,\n`;
    // We use a Blob to simulate a File, as jsdom supports it
    const file = new File([csvContent], "test.csv", { type: "text/csv" });

    return new Promise((resolve) => {
      parseClientCSV(file, (result) => {
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);

        // Line 2: missing nome
        expect(result.errors.some(e => e.includes('Linha 2: campo "nome" ausente'))).toBe(true);
        // Line 3: missing telefone
        expect(result.errors.some(e => e.includes('Linha 3: campo "telefone" ausente'))).toBe(true);
        // Line 4: short telefone
        expect(result.errors.some(e => e.includes('Linha 4: telefone "123" inválido'))).toBe(true);

        expect(result.clients.length).toBe(0);
        resolve();
      });
    });
  });

  it('should parse successfully when valid', () => {
    const csvContent = `nome,telefone,email,ultimaVisita,aniversario\nValid User,11988888888,valid@example.com,,\n`;
    const file = new File([csvContent], "valid.csv", { type: "text/csv" });

    return new Promise((resolve) => {
      parseClientCSV(file, (result) => {
        expect(result.errors.length).toBe(0);
        expect(result.clients.length).toBe(1);
        expect(result.clients[0].name).toBe('Valid User');
        expect(result.clients[0].phone).toBe('11988888888');
        resolve();
      });
    });
  });

  it('should handle completely empty file safely', () => {
    const file = new File([""], "empty.csv", { type: "text/csv" });

    return new Promise((resolve) => {
      parseClientCSV(file, (result) => {
        // Papaparse with skipEmptyLines returns empty data and no errors for a completely empty file
        expect(result.errors).toEqual([]);
        expect(result.clients).toEqual([]);
        resolve();
      });
    });
  });

  it('should handle missing columns (malformed CSV)', () => {
    // Only one column in header, but data has missing fields
    const csvContent = `algumacoisa\n123\n`;
    const file = new File([csvContent], "malformed.csv", { type: "text/csv" });

    return new Promise((resolve) => {
      parseClientCSV(file, (result) => {
        expect(result.errors.length).toBeGreaterThan(0);
        // Since `nome` and `telefone` are missing
        expect(result.errors.some(e => e.includes('Linha 2: campo "nome" ausente'))).toBe(true);
        resolve();
      });
    });
  });
});
