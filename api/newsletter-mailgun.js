import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where, updateDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

let app, db, auth;
try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.error('Firebase init error:', e);
}

// Check which mail API keys and configs are configured
const MAILGUN_API_KEY = (process.env.MAILGUN_API_KEY || '').trim();
const RESEND_API_KEY = (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_') ? process.env.RESEND_API_KEY : '').trim();
const MAILERSEND_API_KEY = (process.env.MAILERSEND_API_KEY || (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_') ? process.env.RESEND_API_KEY : '') || '').trim();

const smtpHost = (process.env.SMTP_HOST || '').trim();
const smtpPort = (process.env.SMTP_PORT || '587').trim();
const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || '').trim();
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpFrom = (process.env.SMTP_FROM || 'contato@ojonquecortou.com.br').trim();
const hasSmtpConfig = Boolean(smtpHost && smtpUser && smtpPass);

const MAILGUN_DOMAIN = 'mg.ojonquecortou.com.br';
const FROM_EMAIL = smtpFrom || '"O Jon Que Cortou" <contato@ojonquecortou.com.br>';
const UNSUBSCRIBE_BASE = 'https://ojonquecortou.com.br/api/unsubscribe?email=';

// Wrap newsletter HTML in a full email document
function wrapNewsletterHtml(subject, body) {
  const bodyWithoutHeader = body.replace(/<table[^>]*>[\s\S]*?<\/table>/i, '');
  const previewText = bodyWithoutHeader
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #EFE5D2; -webkit-font-smoothing: antialiased; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1310;">
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #EFE5D2; opacity: 0;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EFE5D2" style="background-color: #EFE5D2;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAF5E8" style="max-width: 620px; background-color: #FAF5E8; border-radius: 8px; overflow: hidden; border: 1px solid rgba(26,19,16,0.1); box-shadow: 0 4px 20px rgba(26,19,16,0.08);">
          <tr><td align="left">${body}</td></tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #EFE5D2; border-top: 1px solid rgba(26,19,16,0.1); text-align: center; font-family: 'Manrope', sans-serif;">
              <div style="font-size: 12px; color: #6B5A4B; line-height: 1.6; margin-bottom: 15px;">
                Rua Francisco Ovídio, 184 · Caiçaras<br>Belo Horizonte · MG<br>Quarta a Sábado · 9h às 19h
              </div>
              <div style="margin-bottom: 15px; font-size: 11px; line-height: 1.6; color: #6B5A4B; background: rgba(0,0,0,0.012); padding: 12px 14px; border-radius: 6px; border: 1px solid rgba(26,19,16,0.08); text-align: left; display: inline-block; max-width: 440px; font-family: 'Manrope', sans-serif;">
                <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #C97B49; font-weight: 600; display: block; margin-bottom: 4px;">Preferências de Leitura</span>
                Os algoritmos costumam limitar o alcance das publicações. Se você deseja que os ensaios de visagismo e novidades do Studio cheguem até você no Chrome ou na busca, você pode indicar sua preferência de conteúdo <a href="https://google.com/preferences/source?q=https://www.ojonquecortou.com.br" target="_blank" style="color: #C97B49 !important; text-decoration: underline; font-weight: 600;">adicionando nosso site às suas fontes</a>. É rápido, simples e assegura que continuaremos nos comunicando.
              </div>
              <div style="font-size: 11px; color: #9A8A7A; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; text-transform: uppercase;">
                © ${new Date().getFullYear()} Studio do Jon
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Send a single email via MailerSend REST API
async function sendMailerSend(to, toName, subject, html) {
  const res = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: {
        email: 'contato@ojonquecortou.com.br',
        name: 'O Jon Que Cortou'
      },
      to: [
        {
          email: to,
          name: toName || ''
        }
      ],
      subject,
      html
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`MailerSend ${res.status}: ${errText}`);
  }

  const messageId = res.headers.get('X-Message-Id') || 'mailersend-ok';
  return messageId;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  // Authenticate to Firebase if admin credentials are provided in env and not signed in
  if (auth && !auth.currentUser) {
    const adminEmail = (process.env.CRON_FIREBASE_EMAIL || '').trim();
    const adminPassword = (process.env.CRON_FIREBASE_PASSWORD || '').trim();
    if (adminEmail && adminPassword) {
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('Autenticado com sucesso no Firebase para o endpoint de Newsletter.');
      } catch (authErr) {
        console.error('Falha na autenticação do Firebase para o endpoint de Newsletter:', authErr.message);
      }
    }
  }

  // 1. GET Action: Check Bounces list
  if (req.method === 'GET') {
    const adminToken = req.headers['x-admin-token'] || req.query.token;
    if (!adminToken || adminToken !== 'studio-jon-admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

  // 1. GET Action: Check Bounces list
  if (req.method === 'GET') {
    const adminToken = req.headers['x-admin-token'] || req.query.token;
    if (!adminToken || adminToken !== 'studio-jon-admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      let bounces = [];

      if (MAILERSEND_API_KEY) {
        // Fetch from MailerSend Bounces Suppressions list
        const resMS = await fetch('https://api.mailersend.com/v1/suppressions/bounces', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${MAILERSEND_API_KEY}` }
        });
        if (resMS.ok) {
          const msData = await resMS.json();
          (msData.data || []).forEach(s => {
            bounces.push({
              address: s.email,
              error: s.reason || 'Bounced',
              created_at: s.created_at
            });
          });
        }
      }

      const snapshot = await getDocs(collection(db, 'client_profiles'));
      const clients = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.email) {
          clients.push({
            id: docSnap.id,
            name: data.name,
            email: data.email.trim().toLowerCase(),
            newsletter: data.newsletter
          });
        }
      });

      const matchedBounces = [];
      bounces.forEach(bounce => {
        const bounceEmail = bounce.address.trim().toLowerCase();
        const matchedClients = clients.filter(c => c.email === bounceEmail);
        
        if (matchedClients.length > 0) {
          matchedClients.forEach(c => {
            matchedBounces.push({
              name: c.name,
              email: c.email,
              phone: c.id,
              newsletterStatus: c.newsletter === false ? 'Desativado' : 'Ativo',
              error: bounce.error,
              createdAt: bounce.created_at
            });
          });
        } else {
          matchedBounces.push({
            name: 'Sem cliente ativa vinculada',
            email: bounceEmail,
            phone: null,
            newsletterStatus: 'N/A',
            error: bounce.error,
            createdAt: bounce.created_at
          });
        }
      });

      return res.status(200).json({
        success: true,
        totalBounces: bounces.length,
        matchedBouncesCount: matchedBounces.length,
        items: matchedBounces
      });

    } catch (err) {
      return res.status(500).json({ error: 'Falha no processamento de bounces', details: err.message });
    }
  }

  // 1.5 Webhook Receiver from Mailgun
  if (req.method === 'POST' && (req.query.action === 'webhook' || req.body?.signature)) {
    const signatureData = req.body.signature;
    const eventData = req.body['event-data'];

    if (!signatureData || !eventData) {
      return res.status(400).json({ error: 'Payload incompleto.' });
    }

    const { timestamp, token, signature } = signatureData;
    const signingKey = process.env.MAILGUN_SIGNING_KEY || MAILGUN_API_KEY;

    if (signingKey) {
      const encodedToken = crypto.createHmac('sha256', signingKey).update(timestamp.toString() + token).digest('hex');
      if (encodedToken !== signature) {
        return res.status(401).json({ error: 'Unauthorized: Assinatura inválida.' });
      }
    }

    const event = eventData.event;
    const recipient = eventData.recipient;
    const reason = eventData['delivery-status']?.description || eventData.reason || event;

    if ((event === 'failed' && eventData.severity === 'permanent') || event === 'complained') {
      if (recipient && db) {
        try {
          const q = query(collection(db, 'client_profiles'), where('email', '==', recipient.trim().toLowerCase()));
          const snapshot = await getDocs(q);
          const updates = [];
          snapshot.forEach((document) => {
            const clientRef = doc(db, 'client_profiles', document.id);
            updates.push(updateDoc(clientRef, {
              email: 'Não informado',
              unsubscribed: true,
              emailInvalid: true,
              lastBounceReason: `${event}: ${reason}`,
              lastBounceAt: new Date().toISOString()
            }));
          });
          await Promise.all(updates);
        } catch (err) {
          console.error(`Erro ao tratar e-mail inválido (${recipient}):`, err);
        }
      }
    }
    return res.status(200).json({ success: true, message: `Evento ${event} processado.` });
  }

  // 2. POST Action: Send Newsletter to all, Test or Generate
  if (req.method === 'POST') {
    const adminToken = req.headers['x-admin-token'];
    if (!adminToken || adminToken !== 'studio-jon-admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Intercept carousel generation action
    if (req.query.action === 'generate-carousel') {
      const { themeTitle, coverProfile } = req.body;
      if (!themeTitle) {
        return res.status(400).json({ error: 'Título do tema é obrigatório' });
      }

      const apiKey = (process.env.GOOGLE_PLACES_API_KEY || process.env.GEMINI_API_KEY || '').trim();
      if (!apiKey) {
        return res.status(500).json({ error: 'Chave de API do Gemini não configurada no servidor' });
      }

      const promptText = `Você é o Jon (@ojonquecortou), cabeleireiro profissional especialista em cachos, crespos e visagismo no salão "O Jon Que Cortou" em Belo Horizonte (Caiçaras).
Você vai criar um Carrossel para o Instagram (9 slides formato 4:5) completo e de altíssimo nível técnico sobre o tema: "${themeTitle}".
Perfil da modelo/cliente da capa: "${coverProfile || 'Mulher brasileira com cabelos cacheados ou crespos'}".

DIRETRIZES FUNDAMENTAIS DO JON:
1. Tom de voz: Altamente técnico, lógico, focado em física, biologia e geometria do cabelo em seu estado seco (Método Leitura de Fio). Fale com calor humano, sem clichês de marketing. NUNCA use a expressão "corte a seco" (use "Método Leitura de Fio" ou "leitura no estado seco natural").
2. Estrutura dos 9 Slides:
   - Slide 1 (cover): Capa com headline forte em 2 linhas uppercase e 1 subtítulo lowercase.
   - Slide 2 (second_cover): Segunda capa / quebra de padrão ou provocação direta com seta "→".
   - Slide 3 (content): Ponto 01 com tag "01 · [TÍTULO CURTO]", headline marcante e explicação física do problema.
   - Slide 4 (content): Ponto 02 com tag "02 · [TÍTULO CURTO]", headline marcante e explicação.
   - Slide 5 (content): Ponto 03 com tag "03 · [TÍTULO CURTO]", headline marcante e explicação.
   - Slide 6 (content): Ponto 04 com tag "04 · [TÍTULO CURTO]", headline marcante e solução prática.
   - Slide 7 (content): Ponto 05 com tag "05 · [TÍTULO CURTO]", headline marcante e leitura personalizada do fio.
   - Slide 8 (fecho): Síntese impactante / frase marcante do Jon.
   - Slide 9 (cta): Pergunta para a audiência nos comentários + incentivo para compartilhar ou salvar.
3. Legenda Completa: Uma legenda profunda e persuasiva para o Instagram, com abertura que prende a atenção, desenvolvimento técnico do problema e da solução, assinatura do Studio do Jon (Belo Horizonte - Caiçaras) e hashtags relevantes (#cachos #cachosbrasil #cacheadas #visagismo).
4. Pesquisa Técnica: Objeto com "mechanism" (física/química do fio), "literalQuotes" (3 frases reais que clientes falam sobre esse problema), "gap" (o erro que o mercado comete) e "unverified" (o que não deve ser afirmado sem teste de mecha).

Retorne APENAS um JSON válido puro (sem markdown ou texto extra) com a seguinte estrutura:
{
  "id": "carrossel-custom-${Date.now()}",
  "date": "Tema Personalizado",
  "isSearchRanked": false,
  "searchRank": "Tema Personalizado",
  "objective": "Salvamento + Compartilhamento",
  "title": "${themeTitle}",
  "theme": "${themeTitle}",
  "coverProfile": "${coverProfile || 'Mulher brasileira com curvatura natural'}",
  "coverLine1": "LINHA 1 DA CAPA EM CAIXA ALTA",
  "coverLine2": "LINHA 2 DA CAPA EM CAIXA ALTA",
  "coverLine3": "subtítulo explicativo em minúsculas",
  "coverImage": "/blog-leitura-fio-capa.webp",
  "slides": [
    { "type": "cover", "tag": null, "headline": "LINHA 1\\nLINHA 2", "body": "subtítulo" },
    { "type": "second_cover", "tag": null, "headline": "...", "body": "... →" },
    { "type": "content", "tag": "01 · TÍTULO", "headline": "...", "body": "..." },
    { "type": "content", "tag": "02 · TÍTULO", "headline": "...", "body": "..." },
    { "type": "content", "tag": "03 · TÍTULO", "headline": "...", "body": "..." },
    { "type": "content", "tag": "04 · TÍTULO", "headline": "...", "body": "..." },
    { "type": "content", "tag": "05 · TÍTULO", "headline": "...", "body": "..." },
    { "type": "fecho", "tag": null, "headline": "...", "body": "..." },
    { "type": "cta", "tag": null, "headline": "...", "body": "...", "action": "Salva para consultar depois." }
  ],
  "caption": "Texto da legenda...",
  "altText": "Descrição da capa...",
  "researchSummary": {
    "mechanism": "...",
    "literalQuotes": ["...", "...", "..."],
    "gap": "...",
    "unverified": "..."
  }
}`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: { responseMimeType: "application/json" }
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
        console.error('Carousel generation error:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    // Intercept newsletter generation action
    if (req.query.action === 'generate') {
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
Evite a todo custo a repetição de estruturas ou parágrafos anteriores. Traga perspectivas físicas, geométricas ou anatômicas totalmente novas sobre o tema. Se você gerou um texto focado em encolhimento na última vez, mude o foco agora para porosidade, finalização, corte tridimensional ou comportamento do fio na umidade de Belo Horizonte. Varie a abertura e a conclusão. Conte pequenas histórias ou faça analogias com design de móveis, arquitetura ou sculpture. Cada newsletter gerada deve parecer um ensaio escrito do zero, mantendo a autenticidade humana e técnica.

Siga rigorosamente as diretrizes abaixo:
1. SOE HUMANO, DIRETO E AUTÊNTICO: Escreva como uma pessoa real em uma conversa direta, com calor humano e informalidade brasileira. Use expressões informais brasileiras e gírias amigáveis com moderação (ex: "valeu demais", "tô por aqui", "TMJ", "abraço", "obrigado de coração").
2. EVITE CLICHÊS DE MARKETING E JARGÃO CORPORATIVO: Nunca use frases prontas ou robotizadas (como "ficou linda", "cachos perfeitos", "venha arrasar", "tratamento revolucionário"). Use analogias reais de arquitetura, geometria e física do cabelo (Método Leitura de Fio, saúde real do fio). NUNCA utilize o termo "corte a seco" ou "corte seco" no corpo do e-mail.
3. ESTRUTURA PERSUASIVA E TÉCNICA:
   - Explique o comportamento físico do cacho e sua curvatura (porosidade, distribuição de peso, caimento).
   - Relembre suavemente que o atendimento no Studio do Jon é individual e exclusive, com horários disputados de quarta a sábado.
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

    const { subject, htmlBody, newsletterId, testEmail, recipients: customRecipients } = req.body;

    if (!subject || !htmlBody) {
      return res.status(400).json({ error: 'subject e htmlBody são obrigatórios' });
    }

    if (!MAILERSEND_API_KEY) {
      return res.status(500).json({ 
        error: 'Chave de API do MailerSend não configurada. Configure MAILERSEND_API_KEY nas variáveis da Vercel.' 
      });
    }

    const fullHtml = wrapNewsletterHtml(subject, htmlBody);

    // ── TEST MODE ─────────────────────────────────────────────────────────────
    if (testEmail) {
      try {
        const messageId = await sendMailerSend(testEmail, 'Teste', subject, fullHtml);
        return res.status(200).json({ success: true, mode: 'test', messageId, sent: 1 });
      } catch (err) {
        console.error('Test email send error:', err.message);
        return res.status(500).json({ error: 'Falha no envio de teste', details: err.message });
      }
    }

    // ── PRODUCTION MODE ───────────────────────────────────────────────────────
    if (!db) {
      return res.status(500).json({ error: 'Firebase não inicializado' });
    }

    let recipients = [];
    if (customRecipients && Array.isArray(customRecipients)) {
      recipients = customRecipients;
    } else {
      try {
        const snapshot = await getDocs(collection(db, 'client_profiles'));
        snapshot.forEach(docSnap => {
          const d = docSnap.data();
          if (d.email && d.email.includes('@') && d.newsletter !== false && !d.emailInvalid && !d.unsubscribed) {
            recipients.push({
              email: d.email.trim().toLowerCase(),
              name: (d.name || 'Cliente').split(' ')[0]
            });
          }
        });
      } catch (err) {
        console.error('Firestore query error:', err);
        return res.status(500).json({ error: 'Erro ao buscar clientes no Firestore', details: err.message });
      }
    }

    if (recipients.length === 0) {
      return res.status(200).json({ success: true, sent: 0, message: 'Nenhuma cliente elegível com email ativo.' });
    }

    let sent = 0;
    let errors = 0;
    let lastMessageId = '';

    try {
      // MailerSend Bulk Sending
      const CHUNK_SIZE = 500;
      for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
        const chunk = recipients.slice(i, i + CHUNK_SIZE);
        const bulkEmails = chunk.map(r => ({
          from: {
            email: 'contato@ojonquecortou.com.br',
            name: 'O Jon Que Cortou'
          },
          to: [
            {
              email: r.email,
              name: r.name
            }
          ],
          subject: subject,
          html: fullHtml.replace(/{nome}/g, r.name)
        }));

        const resBulk = await fetch('https://api.mailersend.com/v1/bulk-email', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bulkEmails)
        });

        if (!resBulk.ok) {
          const errText = await resBulk.text();
          throw new Error(`MailerSend Bulk Error ${resBulk.status}: ${errText}`);
        }

        const bulkData = await resBulk.json();
        lastMessageId = bulkData.bulk_email_id || 'mailersend-bulk-ok';
        sent += chunk.length;
      }

      // Save to Firestore
      if (db) {
        try {
          await addDoc(collection(db, 'newsletter_sends'), {
            newsletterId: newsletterId || 'newsletter',
            subject,
            sentAt: new Date().toISOString(),
            sentCount: sent,
            errors: errors,
            messageId: lastMessageId
          });
        } catch (e) {
          console.warn('Firestore save log failed:', e.message);
        }
      }

      return res.status(200).json({
        success: true,
        mode: 'production',
        sent,
        total: recipients.length,
        errors,
        messageId: lastMessageId
      });

    } catch (err) {
      console.error('Batch send campaign error:', err.message);
      return res.status(500).json({ error: 'Falha no envio da campanha', details: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
