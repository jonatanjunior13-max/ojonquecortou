import Papa from 'papaparse';

/**
 * parseClientCSV
 * Parses a CSV File object into an array of client objects ready for persistence.
 *
 * Expected CSV columns (order-insensitive, case-insensitive after trimming):
 *   nome*, telefone*, email, ultimaVisita (yyyy-mm-dd), aniversario (yyyy-mm-dd)
 *
 * All other profile fields (curvatura, porosidade, etc.) will be set to '' / null.
 *
 * @param {File} file          - The CSV File selected by the user.
 * @param {Function} onResult  - Callback({ clients, errors }) called when done.
 */
export function parseClientCSV(file, onResult) {
  Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      transformHeader: (h) => {
        return h.trim().toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
          .replace(/[^a-z0-9]/g, ""); // Remove espaços, hífens e caracteres especiais
      },
      complete: (results) => {
        const clients = [];
        const errors = [];

        results.data.forEach((row, index) => {
          const lineNum = index + 2; // +2 because header is line 1

          // Normalise keys (handle BOM prefix on first column)
          const nome = (row['nome'] || row['\ufeffnome'] || '').trim();
          const telefone = (row['telefone'] || '').trim().replace(/\D/g, '');
          const email = (row['email'] || '').trim();
          const ultimaVisitaRaw = (row['ultimavisita'] || row['ultima_visita'] || row['ultimavisita'] || '').trim();
          const aniversarioRaw = (row['aniversario'] || '').trim();

          // Required field validation
          if (!nome) {
            errors.push(`Linha ${lineNum}: campo "nome" ausente.`);
            return;
          }
          if (!telefone) {
            errors.push(`Linha ${lineNum}: campo "telefone" ausente.`);
            return;
          }
          if (telefone.length < 10) {
            errors.push(`Linha ${lineNum}: telefone "${telefone}" inválido (mínimo 10 dígitos com DDD).`);
            return;
          }

          // Date parsing helper — suporta ISO (yyyy-mm-dd) e formato brasileiro (dd/mm/yyyy)
          const parseDate = (raw) => {
            if (!raw) return null;
            let normalized = raw.trim();
            // Converte dd/mm/yyyy → yyyy-mm-dd
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
              const [d, m, y] = normalized.split('/');
              normalized = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
            const date = new Date(normalized + 'T00:00:00');
            return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
          };

          clients.push({
            name: nome,
            phone: telefone,
            email: email || 'Não informado',
            lastVisit: parseDate(ultimaVisitaRaw),
            birthdate: parseDate(aniversarioRaw),
            // Profile fields left blank intentionally
            sexo: 'Não informado',
            curvatura: '',
            porosidade: '',
            elasticidade: '',
            quimicas: '',
            produtosRecomendados: '',
            observacoes: '',
            createdAt: new Date().toISOString(),
            source: 'csv_import',
          });
        });

        onResult({ clients, errors });
      },
      error: (err) => {
        onResult({ clients: [], errors: [`Erro ao ler o arquivo: ${err.message}`] });
      },
    });
}
