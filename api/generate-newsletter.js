import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(455).json({ error: 'Método não permitido' });
  }

  const { themeTitle, themeDescription, extraInstruction } = req.body;

  if (!themeTitle) {
    return res.status(400).json({ error: 'Título do tema é obrigatório' });
  }

  const apiKey = (process.env.GOOGLE_PLACES_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave de API do Gemini não configurada no servidor' });
  }

  const promptText = `Você é o Jon, cabeleireiro profissional especialista em cachos, crespos e visagismo no salão "O Jon Que Cortou" (@ojonquecortou) em Belo Horizonte (Caiçaras).
Você está escrevendo a edição mensal da sua newsletter pessoal "Leitura de Fio" baseando-se no tema: "${themeTitle}". Descrição do tema: "${themeDescription || ''}".

DIRETRIZ DE ORIGINALIDADE E COMPLETA VARIABILIDADE:
Evite a todo custo a repetição de estruturas ou parágrafos anteriores. Traga perspectivas físicas, geométricas ou anatômicas totalmente novas sobre o tema. Se você gerou um texto focado em encolhimento na última vez, mude o foco agora para porosidade, finalização, corte tridimensional ou comportamento do fio na umidade de Belo Horizonte. Varie a abertura e a conclusão. Conte pequenas histórias ou faça analogias com design de móveis, arquitetura ou escultura. Cada newsletter gerada deve parecer um ensaio escrito do zero, mantendo a autenticidade humana e técnica.

Siga rigorosamente as diretrizes abaixo:
1. SOE HUMANO, DIRETO E AUTÊNTICO: Escreva como uma pessoa real em uma conversa direta, com calor humano e informalidade brasileira. Use expressões informais brasileiras e gírias amigáveis com moderação (ex: "valeu demais", "tô por aqui", "TMJ", "abraço", "obrigado de coração").
2. EVITE CLICHÊS DE MARKETING E JARGÃO CORPORATIVO: Nunca use frases prontas ou robotizadas (como "ficou linda", "cachos perfeitos", "venha arrasar", "tratamento revolucionário"). Use analogias reais de arquitetura, geometria e física do cabelo (Método Leitura de Fio, saúde real do fio). NUNCA utilize o termo "corte a seco" ou "corte seco" no corpo do e-mail.
3. ESTRUTURA PERSUASIVA E TÉCNICA:
   - Explique o comportamento físico do cacho e sua curvatura (porosidade, distribuição de peso, caimento).
   - Relembre suavemente que o atendimento no Studio do Jon é individual e exclusivo, com horários disputados de quarta a sábado.
   - Traga a segurança lógica de que a curvatura natural do fio, quando respeitada geometricamente, traz praticidade e beleza real.
4. VARIABILIDADE MÁXIMA: Escreva um texto corrido fluido, mudando a ordem dos argumentos e a estrutura dos parágrafos em relação aos e-mails anteriores. O texto deve surpreender a leitora com uma abordagem fresca.

${extraInstruction ? `INSTRUÇÃO EXTRA/FOCO DO USUÁRIO (Incorpore isso de forma totalmente orgânica): "${extraInstruction}"\n` : ''}

Formato de saída:
Você deve retornar APENAS um JSON válido contendo exatamente dois campos: "subject" e "bodyHtml". Não inclua markdown, blocos de código markdown ou texto explicativo. Retorne APENAS o JSON puro.

O campo "subject" deve ser um assunto provocativo e curto (máximo 60 caracteres) sobre o tema.
O campo "bodyHtml" deve conter o corpo do e-mail em HTML (apenas o conteúdo interno, os parágrafos e citações, pois o cabeçalho/rodapé e o contêiner externo já estão definidos).
Use as seguintes tags no "bodyHtml":
- Parágrafos simples: <p style="font-family: 'Manrope', sans-serif; font-size: 15.5px; line-height: 1.68; color: #EFE5D2; margin: 0 0 18px; max-width: 56ch;">Seu texto aqui...</p>
- Uma citação destacada (blockquote) exatamente neste formato:
<div style="background: #141414; border-left: 3px solid #DCA354; border-radius: 0 4px 4px 0; padding: 20px 24px; margin: 28px 0;">
  <p style="font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; line-height: 1.3; color: #FFFFFF; margin: 0; font-weight: 400;">"Citação marcante do Jon aqui..."</p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #DCA354; margin: 12px 0 0;">— Jon</p>
</div>
- Um CTA com botão exatamente neste formato (com gatilho de urgência suave de agendamento):
<div style="margin-top: 8px; margin-bottom: 32px;">
  <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #DCA354; color: #0A0A0A; padding: 14px 24px; border-radius: 999px; font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; text-decoration: none;">Agendar minha leitura de fio →</a>
</div>`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Erro na API do Gemini', details: errText });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'Resposta vazia da API do Gemini' });
    }

    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Gemini generation error:', err);
    return res.status(500).json({ error: err.message });
  }
}
