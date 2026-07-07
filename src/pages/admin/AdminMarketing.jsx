import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, storage } from '../../config/firebase';
import { collection, onSnapshot, doc, updateDoc, getDoc, query, orderBy, limit, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { Sparkles, Phone, Mail, Search, CheckSquare, Square, Send, Eye, BarChart3, Newspaper, RefreshCw, ChevronRight, BookOpen } from 'lucide-react';
import './Admin.css';
import { HTML_TEMPLATES, EMAIL_CSS, ADMIN_HTML_TEMPLATES } from '../../utils/emailTemplates.js';
import { TRENDING_THEMES, GBP_REVIEW_REPLIES } from '../../utils/marketingDatabase.js';

// Imagens próprias on-brand (existem em /public) usadas como fallback confiável
// quando a geração de imagem do Gemini falhar. Servem rápido do domínio e são
// válidas como sourceUrl no Google Business Profile.
const GBP_FALLBACK_IMAGES = [
  '/blog-frizz.webp', '/blog-curvaturas.webp', '/blog-finalizacao-perfeita.webp',
  '/blog-leitura-fio-capa.webp', '/blog-cronograma-capilar.webp', '/blog-encolhimento.webp',
  '/blog-arquitetura-volume.webp', '/blog-3-erros-capa.webp', '/blog-inverno-cachos-bh.webp',
  '/blog-day-after.webp', '/blog-embaraco.webp', '/blog-jon-analisando-mecha.webp',
  '/blog-leitura-fio-seco.webp', '/blog-frizz-dano.webp',
];
const pickGbpFallbackImage = () => GBP_FALLBACK_IMAGES[Math.floor(Math.random() * GBP_FALLBACK_IMAGES.length)];

// Gera imagem via Imagen (Gemini API). Retorna data URI base64 ou null em qualquer falha
// (key sem acesso a imagem, quota, modelo indisponível) — chamador cai no fallback local.
async function generateGeminiImage(imagePrompt, apiKey) {
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.includes('placeholder')) return null;
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: imagePrompt }],
          parameters: { sampleCount: 1, aspectRatio: '4:3' }
        })
      }
    );
    if (!resp.ok) {
      console.warn('Imagen falhou (HTTP ' + resp.status + '), usando fallback local.');
      return null;
    }
    const data = await resp.json();
    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) {
      console.warn('Imagen não retornou imagem, usando fallback local.');
      return null;
    }
    return `data:image/png;base64,${b64}`;
  } catch (err) {
    console.warn('Erro ao gerar imagem com Imagen, usando fallback local:', err);
    return null;
  }
}


const EMAIL_PREVIEWS = {
  seqD1: { subject: '{nome}, como tá o fio hoje?', body: HTML_TEMPLATES['d1'] },
  seqD7: { subject: 'A semana mais importante do seu cabelo (e quase ninguém fala sobre isso)', body: HTML_TEMPLATES['d7'] },
  seqD21: { subject: '3 semanas de corte novo. Agora vem a parte boa.', body: HTML_TEMPLATES['d21'] },
  seqD35: { subject: '{nome}, chegou a hora.', body: HTML_TEMPLATES['d35'] },
  seqD60: { subject: 'Uma coisa que percebi depois de anos cortando cacheado', body: HTML_TEMPLATES['d60'] },
  seqD90: { subject: 'Seu fio tá te dizendo algo. Você tá ouvindo?', body: HTML_TEMPLATES['d90'] },
  seqD150: {
    subject: 'Seu cabelo tem memória, {nome}',
    body: `
<div style="background-color: #FAF5E8; padding: 56px 56px 48px; color: #1A1310; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(26, 19, 16, 0.14); padding-bottom: 22px; margin-bottom: 40px;">
    <tr>
      <td align="left" valign="middle">
        <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: #1A1310; color: #FAF5E8; text-align: center; line-height: 26px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 15px; margin-right: 10px;">J</span>
        <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 16px; letter-spacing: -0.01em; color: #1A1310;">Studio do Jon</span>
      </td>
    </tr>
  </table>

  <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #6B5A4B;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #6B5A4B; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Saudade
  </span>
  <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 44px; letter-spacing: -0.018em; line-height: 1.1; color: #1A1310; margin: 20px 0 0; max-width: 14ch;">
    Faz tempo, <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; color: #6E2F18;">{nome}.</span>
  </h1>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />

  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 28px 0 0; max-width: 54ch;">
    Já faz cerca de 5 meses desde o seu último corte no Studio. O cabelo ondulado, cacheado e crespo tem memória e perde a forma à medida que cresce.
  </p>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15.5px; line-height: 1.65; color: #2E241E; margin: 12px 0 0; max-width: 54ch;">
    Que tal agendar um horário para resgatar o corte, devolver a definição e cuidar da saúde dos fios?
  </p>

  <div style="margin-top: 28px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #1A1310; color: #FAF5E8; padding: 14px 22px; border-radius: 999px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; border: 1px solid transparent;">Quero agendar meu horário →</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(26, 19, 16, 0.14); margin: 32px 0;" />
  <div style="margin-top: 36px;">
    <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 30px; line-height: 1; color: #6E2F18;">Jon</div>
  </div>
  <p style="font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.65; color: #6B5A4B; margin: 12px 0 0; max-width: 52ch;">
    <strong style="color: #1A1310; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: #6B5A4B; margin: 12px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>

<div style="background-color: #EFE5D2; padding: 36px 56px 44px; border-top: 1px solid rgba(26, 19, 16, 0.14); font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="font-family: 'DM Serif Display', Georgia, serif; font-size: 28px; line-height: 1; letter-spacing: -0.015em; color: #1A1310; margin: 0 0 10px;">
    Studio do Jon <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #6E2F18; display: block; margin-top: 4px;">— corte com leitura.</span>
  </div>
  <p style="font-size: 13.5px; color: #6B5A4B; line-height: 1.5; margin: 0 0 20px 0;">
    Rua Francisco Ovídio, 184 · Caiçaras<br>Belo Horizonte · MG · 30770-040<br>Quarta a Sábado · 9h às 19h
  </p>
  <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #6B5A4B; border-top: 1px solid rgba(26, 19, 16, 0.14); padding-top: 18px; margin-top: 18px;">
    © 2026 Studio do Jon
  </div>
</div>
`
  },
  birthdayEnabled: { subject: 'Parabéns, {nome}.', body: HTML_TEMPLATES['aniversario'] },
  launchE1: { subject: 'Agendamento online no Studio do Jon. Acabou de mudar.', body: HTML_TEMPLATES['launch_e1'] },
  launchE2: { subject: 'Antes de marcar em qualquer lugar, você precisa saber isso.', body: HTML_TEMPLATES['launch_e2'] },
  launchE3: { subject: 'Primeiros agendamentos pelo novo site têm prioridade de horário.', body: HTML_TEMPLATES['launch_e3'] }
};


const AdminMarketing = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [selectedThemeId, setSelectedThemeId] = useState(TRENDING_THEMES[0].id);
  const [extraInstruction, setExtraInstruction] = useState('');
  const cancelSendingRef = useRef(false);

  // Marketing states
  const [searchTerm, setSearchTerm] = useState('');
  const [marketingTarget, setMarketingTarget] = useState('todos');
  const [marketingChannel, setMarketingChannel] = useState('whatsapp');
  const [campaignMessage, setCampaignMessage] = useState('Oi {nome}, vimos que faz {dias_ausente} dias desde seu último {ultimo_servico}. Saudade dos seus cachos!');
  const [emailCampaignSubject, setEmailCampaignSubject] = useState('Sentimos sua falta no Studio do Jon! ✂️');
  const [emailCampaignBody, setEmailCampaignBody] = useState('<p>Olá <b>{nome}</b>!</p><p>Já faz {dias_ausente} dias que não cuidamos do seu cabelo. Seu último procedimento foi {ultimo_servico}.</p><p>Que tal agendar um horário esta semana?</p>');
  
  const [selectedCampaignPhones, setSelectedCampaignPhones] = useState([]);
  
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailProgressCount, setEmailProgressCount] = useState(0);
  const [emailProgressTotal, setEmailProgressTotal] = useState(0);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [showEmailEditModal, setShowEmailEditModal] = useState(false);
  const [editingTemplateKey, setEditingTemplateKey] = useState(null);
  const [editingTemplateContent, setEditingTemplateContent] = useState({ subject: '', body: '' });
  const [emailPreviewContent, setEmailPreviewContent] = useState({ subject: '', body: '' });
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  const [showCustomHtmlModal, setShowCustomHtmlModal] = useState(false);
  const [showCustomPreviewModal, setShowCustomPreviewModal] = useState(false);
  const [editingCustomKey, setEditingCustomKey] = useState(null);
  const [editingCustomHtml, setEditingCustomHtml] = useState('');
  const [customPreviewHtml, setCustomPreviewHtml] = useState('');
  const [emailLogs, setEmailLogs] = useState([]);
  const [whatsappLogs, setWhatsappLogs] = useState([]);
  const [automationLogs, setAutomationLogs] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [selectedAdminNotif, setSelectedAdminNotif] = useState(null);
  const [showAdminNotifModal, setShowAdminNotifModal] = useState(false);

  // Newsletter states
  const JUNE_2026_NEWSLETTER_HTML = `<div style="background-color: #0A0A0A; padding: 56px 56px 48px; color: #FFFFFF; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 22px; margin-bottom: 36px;">
    <tr>
      <td align="left" valign="middle">
        <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: #DCA354; color: #0A0A0A; text-align: center; line-height: 26px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 15px; margin-right: 10px; font-weight: 700;">J</span>
        <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 16px; letter-spacing: -0.01em; color: #FFFFFF;">Studio do Jon</span>
      </td>
      <td align="right" valign="middle">
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #A0A0A0;">Junho · 2026</span>
      </td>
    </tr>
  </table>

  <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #DCA354;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #DCA354; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Leitura de Fio · Edição de Junho
  </span>

  <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 42px; letter-spacing: -0.018em; line-height: 1.08; color: #FFFFFF; margin: 18px 0 0; max-width: 16ch;">O frizz que nenhum creme <span style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; color: #DCA354;">vai resolver.</span></h1>

  <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 32px 0;" />

  <p style="font-family: 'Manrope', sans-serif; font-size: 15.5px; line-height: 1.68; color: #EFE5D2; margin: 0 0 18px; max-width: 56ch;">Você trocou o leave-in. Trocou o gel. Trocou o shampoo. Talvez até a marca de água do banho. E o frizz voltou. Exatamente do mesmo jeito.</p>

  <p style="font-family: 'Manrope', sans-serif; font-size: 15.5px; line-height: 1.68; color: #EFE5D2; margin: 0 0 18px; max-width: 56ch;">Isso acontece porque o frizz que persiste raramente é problema de produto. É problema de <strong style="color: #FFFFFF;">ângulo de corte.</strong></p>

  <p style="font-family: 'Manrope', sans-serif; font-size: 15.5px; line-height: 1.68; color: #EFE5D2; margin: 0 0 18px; max-width: 56ch;">Quando o fio é cortado no angle correto, a cutícula fica exposta de um jeito que nenhuma finalização consegue fechar. O creme sela por um dia. Depois a umidade entra, a cutícula levanta, e o frizz aparece. De novo.</p>

  <div style="background: #141414; border-left: 3px solid #DCA354; border-radius: 0 4px 4px 0; padding: 20px 24px; margin: 28px 0;">
    <p style="font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; line-height: 1.3; color: #FFFFFF; margin: 0; font-weight: 400;">"O Método Leitura de Fio lê a curvatura antes da tesoura. Não para ter uma técnica bonita. Para cortar no ângulo que o <span style='font-style: italic; color: #DCA354;'>seu</span> fio pede."</p>
    <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #DCA354; margin: 12px 0 0;">— Jon</p>
  </div>

  <p style="font-family: 'Manrope', sans-serif; font-size: 15.5px; line-height: 1.68; color: #EFE5D2; margin: 0 0 18px; max-width: 56ch;">O diagnóstico que faz antes do corte — o que chamamos de Leitura de Fio — identifica a porosidade, a curvatura e o padrão de crescimento do seu cabelo. Só então a tesoura entra.</p>

  <p style="font-family: 'Manrope', sans-serif; font-size: 15.5px; line-height: 1.68; color: #EFE5D2; margin: 0 0 28px; max-width: 56ch;">O resultado é um corte que define sem depender de produto. Que dura mais. Que seca com forma, não com frizz.</p>

  <div style="margin-top: 8px; margin-bottom: 32px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #DCA354; color: #0A0A0A; padding: 14px 24px; border-radius: 999px; font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; text-decoration: none;">Agendar minha leitura de fio →</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 32px 0;" />

  <div style="margin-top: 28px;">
    <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 32px; line-height: 1; color: #DCA354;">Jon</div>
  </div>
  <p style="font-family: 'Manrope', sans-serif; font-size: 13.5px; line-height: 1.65; color: #A0A0A0; margin: 10px 0 0; max-width: 52ch;">
    <strong style="color: #FFFFFF; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #A0A0A0; margin: 10px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>`;

  const [newsletters, setNewsletters] = useState([
    {
      id: 'newsletter-junho-2026',
      month: 'Junho 2026',
      subject: 'O frizz que nenhum creme vai resolver.',
      status: 'draft', // draft | approved | sent
      createdAt: new Date().toISOString(),
      sentAt: null,
      sentCount: 0,
      htmlBody: JUNE_2026_NEWSLETTER_HTML
    }
  ]);
  const [activeNewsletterId, setActiveNewsletterId] = useState('newsletter-junho-2026');
  const [showNewsletterPreview, setShowNewsletterPreview] = useState(false);
  const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);
  const [isGeneratingNewsletter, setIsGeneratingNewsletter] = useState(false);
  const [newsletterSendLog, setNewsletterSendLog] = useState([]);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // Bounces states
  const [showBounceList, setShowBounceList] = useState(false);
  const [bouncesData, setBouncesData] = useState([]);
  const [isLoadingBounces, setIsLoadingBounces] = useState(false);

  const activeNewsletter = newsletters.find(n => n.id === activeNewsletterId);

  const handleApproveNewsletter = (id) => {
    setNewsletters(prev => prev.map(n => n.id === id ? { ...n, status: 'approved' } : n));
  };

  const handleFetchBounces = async () => {
    setIsLoadingBounces(true);
    try {
      const res = await fetch('/api/mailgun-webhook?token=studio-jon-admin');
      const data = await res.json();
      if (data.success) {
        setBouncesData(data.items || []);
        setShowBounceList(true);
      } else {
        alert('Erro ao buscar lista de bounces: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      alert('Falha na requisição: ' + err.message);
    } finally {
      setIsLoadingBounces(false);
    }
  };

  const handleRegenerateNewsletter = async (id) => {
    setIsGeneratingNewsletter(true);
    let apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
    if (apiKey === 'undefined' || apiKey === 'null' || apiKey.includes('placeholder')) {
      apiKey = '';
    }

    const selectedTheme = TRENDING_THEMES.find(t => t.id === selectedThemeId) || TRENDING_THEMES[0];
    const runFallback = () => {
      const fallbackSubject = selectedTheme.title;
      
      const introTemplates = [
        `Fala, pessoal! Por aqui o foco sempre foi a saúde real e a física por trás de cada curvatura. Hoje, trago um assunto crucial para quem busca liberdade e praticidade: <strong>${selectedTheme.title}</strong>.`,
        `E aí, pessoal! Passando aqui para bater um papo sincero e técnico sobre um assunto que impacta diretamente o caimento do seu cabelo: <strong>${selectedTheme.title}</strong>.`,
        `Olá! Quem frequenta o Studio sabe que eu prezo muito pela explicação lógica de cada tratamento. Hoje vamos analisar um ponto importante: <strong>${selectedTheme.title}</strong>.`
      ];

      const midTemplates = [
        `Muitos me perguntam sobre isso, e a resposta está na leitura da estrutura de cada mecha: ${selectedTheme.description}`,
        `No dia a dia do salão, vejo muitas dúvidas sobre esse ponto. A explicação científica para isso é simples: ${selectedTheme.description}`,
        `Entender esse comportamento é fundamental para que você tenha autonomia na sua finalização: ${selectedTheme.description}`
      ];

      const concludeTemplates = [
        `No Studio do Jon, com o Método Leitura de Fio, nós analisamos a anatomia e a geometria da sua curvatura antes de qualquer corte ou tratamento. Respeitamos o caimento natural e a taxa de encolhimento de cada mecha no seu dia a dia, sem surpresas desagradáveis ou truques de finalizadores pesados.`,
        `Com o Método Leitura de Fio, o objetivo é entender a fundo a densidade e a porosidade de cada mecha. Planejamos a distribuição de camadas respeitando a identidade visual e o caimento natural para que o visual funcione de verdade na sua rotina.`,
        `Aqui, cada corte é desenhado individualmente. Estudamos a distribuição de peso e a geometria tridimensional do cacho para que você tenha leveza, volume equilibrado e a certeza de um caimento incrível.`
      ];

      const quotes = [
        `"Cabelo com curvatura não aceita regras prontas ou adivinhações. A física do fio dita o caimento e o visagismo revela a identidade."`,
        `"O cabelo é a moldura do rosto. O visagismo traduz quem você é através das linhas tridimensionais do cacho."`,
        `"Saúde capilar não é milagre de internet; é ciência, pH equilibrado e o respeito à individualidade de cada curvatura."`
      ];

      const hash = selectedTheme.title.length % 3;
      const intro = introTemplates[hash];
      const mid = midTemplates[(hash + 1) % 3];
      const conclude = concludeTemplates[(hash + 2) % 3];
      const quote = quotes[hash];

      const fallbackBody = `<div style="background-color: #0A0A0A; padding: 56px 56px 48px; color: #FFFFFF; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 22px; margin-bottom: 36px;">
    <tr>
      <td align="left" valign="middle">
        <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: #DCA354; color: #0A0A0A; text-align: center; line-height: 26px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 15px; margin-right: 10px; font-weight: 700;">J</span>
        <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 16px; letter-spacing: -0.01em; color: #FFFFFF;">Studio do Jon</span>
      </td>
      <td align="right" valign="middle">
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #A0A0A0;">Junho · 2026</span>
      </td>
    </tr>
  </table>

  <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #DCA354;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #DCA354; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    ${selectedTheme.category} · Leitura de Fio
  </span>

  <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 42px; letter-spacing: -0.018em; line-height: 1.08; color: #FFFFFF; margin: 18px 0 0; max-width: 24ch;">${selectedTheme.title}</h1>

  <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 32px 0;" />

  <p style="font-family: 'Manrope', sans-serif; font-size: 15.5px; line-height: 1.68; color: #EFE5D2; margin: 0 0 18px; max-width: 56ch;">
    ${intro}
  </p>
  
  <p style="font-family: 'Manrope', sans-serif; font-size: 15.5px; line-height: 1.68; color: #EFE5D2; margin: 0 0 18px; max-width: 56ch;">
    ${mid}
  </p>

  <p style="font-family: 'Manrope', sans-serif; font-size: 15.5px; line-height: 1.68; color: #EFE5D2; margin: 0 0 18px; max-width: 56ch;">
    ${conclude}
  </p>

  <div style="background: #141414; border-left: 3px solid #DCA354; border-radius: 0 4px 4px 0; padding: 20px 24px; margin: 28px 0;">
    <p style="font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; line-height: 1.3; color: #FFFFFF; margin: 0; font-weight: 400;">${quote}</p>
    <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #DCA354; margin: 12px 0 0;">— Jon</p>
  </div>

  <p style="font-family: 'Manrope', sans-serif; font-size: 15.5px; line-height: 1.68; color: #EFE5D2; margin: 0 0 18px; max-width: 56ch;">
    Quer entender como isso se aplica à sua rotina? O atendimento é exclusivo, feito com hora marcada de quarta a sábado, para dar a atenção que você e seus fios merecem.
  </p>

  <div style="margin-top: 8px; margin-bottom: 32px;">
    <a href="https://ojonquecortou.com.br/agendar" style="display: inline-block; background-color: #DCA354; color: #0A0A0A; padding: 14px 24px; border-radius: 999px; font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; text-decoration: none;">Agendar minha leitura de fio →</a>
  </div>

  <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 32px 0;" />

  <div style="margin-top: 28px;">
    <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 32px; line-height: 1; color: #DCA354;">Jon</div>
  </div>
</div>`;

      setNewsletters(prev => prev.map(n => n.id === id ? {
        ...n,
        subject: fallbackSubject,
        htmlBody: fallbackBody,
        status: 'draft'
      } : n));
      alert(`Nova newsletter gerada com sucesso! Tema: "${fallbackSubject}" 🎉`);
      setIsGeneratingNewsletter(false);
    };

    if (!apiKey) {
      setTimeout(() => {
        runFallback();
      }, 1200);
      return;
    }

    try {
      const promptText = `Você é o Jon, cabeleireiro profissional especialista em cachos, crespos e visagismo no salão "O Jon Que Cortou" (@ojonquecortou) em Belo Horizonte (Caiçaras).
Você está escrevendo a edição mensal da sua newsletter pessoal "Leitura de Fio" baseando-se no tema: "${randomTopic}".

DIRETRIZ DE ORIGINALIDADE E PESQUISA:
Faça uma pesquisa interna (seu conhecimento geral da web) para trazer dados inovadores, correlações físicas interessantes ou novidades de cuidados capilares. Evite criar o mesmo texto repetitivo. Cada e-mail gerado deve ter uma perspectiva fresca e única, mesmo se gerado com o mesmo tema.

Siga rigorosamente as diretrizes abaixo:
1. SOE HUMANO, DIRETO E AUTÊNTICO: Escreva como uma pessoa real em uma conversa direta, com calor humano e informalidade brasileira. Use expressões informais brasileiras e gírias amigáveis com moderação (ex: "valeu demais", "tô por aqui", "TMJ", "abraço", "obrigado de coração").
2. EVITE CLICHÊS DE MARKETING E JARGÃO CORPORATIVO: Nunca use frases prontas ou robotizadas (como "ficou linda", "cachos perfeitos", "venha arrasar", "tratamento revolucionário"). Use analogias reais de arquitetura, geometria e física do cabelo (Método Leitura de Fio, corte a seco, saúde real do fio).
3. ESTRUTURA PERSUASIVA E TÉCNICA:
   - Mostre que o cacho seco se comporta diferente do molhado (fator de encolhimento, caimento real).
   - Explique o problema de forma científica/física (anatomia do fio, cutículas, porosidade, distribuição de peso).
   - Relembre suavemente que o atendimento no Studio do Jon é individual e exclusivo, com horários disputados de quarta a sábado.
   - Traga esperança de que nenhum cabelo é "impossível", apenas precisa da leitura geométrica correta.
4. VARIABILIDADE E NÃO REPETIÇÃO: Construa um texto corrido fluido, mantendo a informalidade técnica de uma conversa sincera de profissional para cliente.

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

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.subject && parsed.bodyHtml) {
            const fullHtml = `<div style="background-color: #0A0A0A; padding: 56px 56px 48px; color: #FFFFFF; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 22px; margin-bottom: 36px;">
    <tr>
      <td align="left" valign="middle">
        <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: #DCA354; color: #0A0A0A; text-align: center; line-height: 26px; font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 15px; margin-right: 10px; font-weight: 700;">J</span>
        <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 16px; letter-spacing: -0.01em; color: #FFFFFF;">Studio do Jon</span>
      </td>
      <td align="right" valign="middle">
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #A0A0A0;">Junho · 2026</span>
      </td>
    </tr>
  </table>

  <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #DCA354;">
    <span style="display: inline-block; width: 18px; height: 1px; background-color: #DCA354; vertical-align: middle; margin-right: 10px; opacity: 0.6;"></span>
    Leitura de Fio · Edição Mensal
  </span>

  <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 42px; letter-spacing: -0.018em; line-height: 1.08; color: #FFFFFF; margin: 18px 0 0; max-width: 16ch;">${parsed.subject}</h1>

  <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 32px 0;" />

  ${parsed.bodyHtml}

  <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 32px 0;" />

  <div style="margin-top: 28px;">
    <div style="font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 32px; line-height: 1; color: #DCA354;">Jon</div>
  </div>
  <p style="font-family: 'Manrope', sans-serif; font-size: 13.5px; line-height: 1.65; color: #A0A0A0; margin: 10px 0 0; max-width: 52ch;">
    <strong style="color: #FFFFFF; font-weight: 600;">Studio do Jon</strong><br />
    Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
  </p>
  <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #A0A0A0; margin: 10px 0 0;">
    @ojonquecortou · ojonquecortou.com.br/agendar
  </p>
  <div style="height: 48px;"></div>
</div>`;

            setNewsletters(prev => prev.map(n => n.id === id ? {
              ...n,
              subject: parsed.subject,
              htmlBody: fullHtml,
              status: 'draft'
            } : n));
            alert('Nova newsletter gerada com sucesso via IA! 🎉');
            setIsGeneratingNewsletter(false);
          } else {
            runFallback();
          }
        } else {
          runFallback();
        }
      } else {
        console.warn('Gemini API returned error status:', response.status);
        alert('Erro ao chamar a API para gerar nova newsletter. Usando fallback.');
        runFallback();
      }
    } catch (err) {
      console.error('Error generating newsletter:', err);
      alert('Erro inesperado ao gerar newsletter. Usando fallback.');
      runFallback();
    } finally {
      setIsGeneratingNewsletter(false);
    }
  };

  const handleSendNewsletterTest = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      alert('Digite um email válido para teste.');
      return;
    }
    const nl = activeNewsletter;
    if (!nl) return;
    setIsSendingNewsletter(true);
    setNewsletterSendLog(['[SISTEMA] Enviando email de teste via Mailgun...']);
    try {
      const res = await fetch('/api/newsletter-mailgun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': 'studio-jon-admin' },
        body: JSON.stringify({ subject: nl.subject, htmlBody: nl.htmlBody, newsletterId: nl.id, testEmail: testEmailAddress })
      });
      const data = await res.json();
      if (data.success) {
        setNewsletterSendLog(prev => [...prev, `[✅ OK] Email de teste enviado para ${testEmailAddress}. Message ID: ${data.messageId}`]);
      } else {
        setNewsletterSendLog(prev => [...prev, `[❌ ERRO] ${data.error} — ${data.details || ''}`]);
      }
    } catch (err) {
      setNewsletterSendLog(prev => [...prev, `[❌ ERRO] Falha na requisição: ${err.message}`]);
    } finally {
      setIsSendingNewsletter(false);
    }
  };

  const handleSendNewsletterToAll = async () => {
    const nl = activeNewsletter;
    if (!nl || nl.status !== 'approved') {
      alert('Aprove a newsletter antes de enviar para todas as clientes.');
      return;
    }
    const confirm1 = window.confirm(`Confirmar envio da newsletter "${nl.subject}" para TODAS as clientes com email cadastrado?`);
    if (!confirm1) return;
    setIsSendingNewsletter(true);
    setNewsletterSendLog(['[SISTEMA] Conectando ao Mailgun...', '[SISTEMA] Buscando lista de clientes...']);
    try {
      const res = await fetch('/api/newsletter-mailgun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': 'studio-jon-admin' },
        body: JSON.stringify({ subject: nl.subject, htmlBody: nl.htmlBody, newsletterId: nl.id })
      });
      const data = await res.json();
      if (data.success) {
        const sentCount = data.sent;
        setNewsletterSendLog(prev => [...prev,
          `[✅ OK] Newsletter enviada com sucesso para ${sentCount} cliente(s)!`,
          `[✅ OK] Message ID Mailgun: ${data.messageId}`
        ]);
        setNewsletters(prev => prev.map(n => n.id === nl.id ? {
          ...n,
          status: 'sent',
          sentAt: new Date().toISOString(),
          sentCount
        } : n));
        // Save to Firestore
        if (db) {
          try {
            await addDoc(collection(db, 'newsletter_sends'), {
              newsletterId: nl.id,
              subject: nl.subject,
              sentAt: new Date().toISOString(),
              sentCount,
              messageId: data.messageId
            });
          } catch (e) { console.warn('Firestore save newsletter log failed:', e); }
        }
      } else {
        setNewsletterSendLog(prev => [...prev, `[❌ ERRO] ${data.error}`, data.details ? `[DETALHE] ${data.details}` : '']);
      }
    } catch (err) {
      setNewsletterSendLog(prev => [...prev, `[❌ ERRO] Falha na requisição: ${err.message}`]);
    } finally {
      setIsSendingNewsletter(false);
    }
  };

  // Birthday WhatsApp automation
  const [birthdayWaMessage, setBirthdayWaMessage] = useState(
    '{nome}, parabéns!\\nAniversário com o cabelo bem lido é diferente. Você sabe disso.\\nFeliz aniversário. Se quiser passar pelo Studio esse mês: ojonquecortou.com.br/agendar\\n— Jon'
  );
  const [birthdayWindowDays, setBirthdayWindowDays] = useState(0); // 0 = hoje, 7 = próximos 7 dias
  const [birthdayWaLogs, setBirthdayWaLogs] = useState([]);
  const [isSendingBirthdayWa, setIsSendingBirthdayWa] = useState(false);

  // Google Business Profile states
  const gbpConnected = !!settings?.automations?.googleGbpConnected;
  const [isPublishingGbpId, setIsPublishingGbpId] = useState(null);
  const [isPublishingGbpNow, setIsPublishingGbpNow] = useState(false);
  const [googleReviews, setGoogleReviews] = useState([
    { id: 'rev_1', author: 'Isabela Rodrigues', rating: 5, comment: 'Nunca tinha visto meu cabelo tão bem definido! O Jon leu meu fio antes de tocar na tesoura e o resultado foi incrível. Recomendo demais para quem tem cacheado!', date: '2 dias atrás', reply: '' },
    { id: 'rev_2', author: 'Camila Ferreira', rating: 5, comment: 'Fui pela primeira vez e já marquei a volta. O visagismo foi perfeito pro formato do meu rosto. O corte a seco revelou um volume que eu não sabia que tinha.', date: '1 semana atrás', reply: 'Camila, que alegria ter você por aqui! O visagismo junto com a leitura de fio é exatamente o que permite a gente criar o volume certo pra cada rosto. Te esperamos na próxima! — Jon' },
    { id: 'rev_3', author: 'Lucas Mendes', rating: 5, comment: 'Meu crespo estava perdido e o Jon salvou. Ele explicou o scab hair, o problema de porosidade e cortou de um jeito que o cacho definiu muito melhor.', date: '2 semanas atrás', reply: '' },
    { id: 'rev_4', author: 'Fernanda Costa', rating: 5, comment: 'Finalmente um profissional que entende de transição capilar de verdade. Não foi só corte, foi uma consultoria completa. Saí completamente diferente e feliz!', date: '3 semanas atrás', reply: 'Fernanda, muito obrigado pela confiança no processo! Transição capilar exige técnica e cuidado com cada fase. Estamos aqui pra cada etapa da sua jornada! — Jon' }
  ]);
  const [isGeneratingGbpPost, setIsGeneratingGbpPost] = useState(false);
  const [generatedGbpPost, setGeneratedGbpPost] = useState(null);
  const [themeSearchQuery, setThemeSearchQuery] = useState('');
  const [selectedThemeCategory, setSelectedThemeCategory] = useState('Todos');
  
  // Frequency scheduler (multiple days)
  const selectedPostingDays = settings?.automations?.google_posting_days || ['segunda'];
  const [postFreqTime, setPostFreqTime] = useState(settings?.automations?.google_posting_time || '09:00');
  const [scheduledGbpPosts, setScheduledGbpPosts] = useState([]);

  const handleTogglePostingDay = async (day) => {
    let updatedDays = [...selectedPostingDays];
    if (updatedDays.includes(day)) {
      updatedDays = updatedDays.filter(d => d !== day);
    } else {
      updatedDays.push(day);
    }
    try {
      await updateDoc(doc(db, 'settings', 'studio'), {
        'automations.google_posting_days': updatedDays
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFreqTime = async (timeVal) => {
    setPostFreqTime(timeVal);
    try {
      await updateDoc(doc(db, 'settings', 'studio'), {
        'automations.google_posting_time': timeVal
      });
    } catch (err) {
      console.error(err);
    }
  };

  const generatePersonalizedFallbackReply = (authorName, commentText = '') => {
    const firstName = authorName.split(' ')[0];
    const textLower = commentText.toLowerCase();

    if (textLower.includes('transição') || textLower.includes('química') || textLower.includes('scab')) {
      return `Fala, ${firstName}! Que orgulho ver sua evolução. A transição capilar exige muita paciência e acolhimento, e o método de leitura de fio serve justamente pra te guiar nas texturas e devolver a autoestima. Conta comigo nessa jornada! — Jon`;
    }
    if (textLower.includes('visagismo') || textLower.includes('rosto') || textLower.includes('formato') || textLower.includes('traço')) {
      return `Que depoimento sensacional, ${firstName}! O visagismo associado à leitura de fio serve exatamente para desenhar as camadas e volumes ideais para destacar a sua personalidade e traços únicos. Valeu demais pela confiança! — Jon`;
    }
    if (textLower.includes('crespo') || textLower.includes('crespa') || textLower.includes('4c') || textLower.includes('volume')) {
      return `Fala, ${firstName}! Valorizar a textura rica do cabelo crespo e o volume tridimensional sem tentar forçar padrões artificiais é a nossa filosofia aqui. Muito obrigado pela confiança no Método Leitura de Fio! TMJ! — Jon`;
    }
    if (textLower.includes('frizz') || textLower.includes('porosidade') || textLower.includes('ressecado') || textLower.includes('hidrat')) {
      return `Muito obrigado pelo retorno, ${firstName}! Entender a porosidade do fio e equilibrar o pH faz toda a diferença para acabar com o frizz de forma lógica, sem encher o cabelo de cremes. Qualquer coisa, tô por aqui! — Jon`;
    }
    if (textLower.includes('defin') || textLower.includes('cacho') || textLower.includes('mola')) {
      return `Valeu demais pela confiança, ${firstName}! A leitura de fio serve justamente para entender o que o seu cacho precisa para reter a umidade natural e a definição perfeita. Fico felizão que tenha gostado do resultado! — Jon`;
    }

    return `E aí, ${firstName}! Valeu demais pelo carinho e pela visita. Cada detalhe que a gente desenha serve para valorizar a sua identidade natural e trazer mais praticidade no dia a dia. Tamo junto! — Jon`;
  };

  const handleSimulateNewReview = async () => {
    const names = ['Amanda Costa', 'Patrícia Oliveira', 'Beatriz Souza', 'Luana Mendes'];
    const comments = [
      'Meu cabelo ondulado nunca teve tanta definição! O visagismo do Jon é impecável.',
      'O Studio do Jon é o melhor lugar de BH para cabelos crespos. Amei a experiência.',
      'Excelente profissional. Fez o corte geométrico no meu crespo e tirou todo o scab hair.',
      'Atendimento maravilhoso, o método de leitura de fio antes da tesoura é sensacional!'
    ];
    const idx = Math.floor(Math.random() * names.length);
    const newRev = {
      id: 'rev_' + Date.now(),
      author: names[idx],
      rating: 5,
      comment: comments[idx],
      date: 'Agora mesmo',
      reply: ''
    };

    if (settings?.automations?.google_reviews_enabled !== false) {
      let replyText = '';
      const apiKey = localStorage.getItem('google_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
      
      if (apiKey && apiKey !== 'undefined' && apiKey !== 'null' && !apiKey.includes('placeholder')) {
        try {
          const promptText = `Você é o Jon, cabeleireiro profissional especialista em cachos, crespos, transição capilar e visagismo no salão "O Jon Que Cortou" em Belo Horizonte.
Você está escrevendo uma resposta pessoal, curta (máximo 250 caracteres) e muito natural para um cliente que deixou uma avaliação.

REGRAS CRÍTICAS DE TOM DE VOZ (COMO O JON FALA):
1. SOE HUMANO E AUTÊNTICO: Escreva de forma totalmente humana, calorosa e direta, como em uma conversa de WhatsApp. Use termos naturais como "valeu demais", "fico felizão", "tô por aqui", "TMJ", "abraço", "obrigado de coração".
2. ZERO CLICHÊS DE MARKETING OU RESPOSTAS CORPORATIVAS: NUNCA use frases prontas como "Agradecemos o seu feedback", "Nossa missão é a sua satisfação", "Volte sempre", "Prezado(a) cliente", "Ficamos contentes", ou adjetivos vazios como "cachos perfeitos".
3. TOM TÉCNICO E EMPÁTICO: Foque na saúde do fio, na leitura geométrica e física do cabelo em seu caimento natural (Método Leitura de Fio). NUNCA mencione o termo "corte a seco".
4. PERSONALIZADO E NÃO REPETITIVO: Se o cliente citou algo (transição, volume, franja, definição), faça referência técnica a isso de forma natural. Varie bastante a abertura (ex: "E aí, [Nome]!", "Fala, [Nome]!", "Valeu demais pelo carinho, [Nome]!", "Que massa ler isso, [Nome]!").

Nome do cliente: ${names[idx]}
Nota da avaliação: 5 estrelas
Comentário do cliente: "${comments[idx]}"

Escreva apenas o texto da resposta direta em português do Brasil, sem aspas. Termine assinando com "— Jon".`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            const generatedReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generatedReply) {
              replyText = generatedReply.trim();
            }
          }
        } catch (err) {
          console.warn('Erro ao gerar resposta simulada com Gemini API:', err);
        }
      }

      if (!replyText) {
        replyText = generatePersonalizedFallbackReply(names[idx], comments[idx]);
      }
      newRev.pendingReply = replyText;
    }

    setGoogleReviews(prev => [newRev, ...prev]);
    alert('Nova avaliação simulada no Google!');
  };

  const handleManualGbpReply = async (id) => {
    const review = googleReviews.find(r => r.id === id);
    if (!review) return;

    let replyText = '';
    const apiKey = localStorage.getItem('google_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';

    if (apiKey && apiKey !== 'undefined' && apiKey !== 'null' && !apiKey.includes('placeholder')) {
      try {
        const promptText = `Você é o Jon, cabeleireiro profissional especialista em cachos, crespos, transição capilar e visagismo no salão "O Jon Que Cortou" em Belo Horizonte.
Você está escrevendo uma resposta pessoal, curta (máximo 250 caracteres) e muito natural para um cliente que deixou uma avaliação.

REGRAS CRÍTICAS DE TOM DE VOZ (COMO O JON FALA):
1. SOE HUMANO E AUTÊNTICO: Escreva de forma totalmente humana, calorosa e direta, como em uma conversa de WhatsApp. Use termos naturais como "valeu demais", "fico felizão", "tô por aqui", "TMJ", "abraço", "obrigado de coração".
2. ZERO CLICHÊS DE MARKETING OU RESPOSTAS CORPORATIVAS: NUNCA use frases prontas como "Agradecemos o seu feedback", "Nossa missão é a sua satisfação", "Volte sempre", "Prezado(a) cliente", "Ficamos contentes", ou adjetivos vazios como "cachos perfeitos".
3. TOM TÉCNICO E EMPÁTICO: Foque na saúde do fio, na leitura geométrica e física do cabelo em seu caimento natural (Método Leitura de Fio). NUNCA mencione o termo "corte a seco".
4. VARIABILIDADE E NÃO REPETIÇÃO: Altere a abertura e a estrutura das respostas para não parecerem templates repetitivos.
5. PERSONALIZADO E NÃO REPETITIVO: Se o cliente citou algo (transição, volume, franja, definição), faça referência técnica a isso de forma natural. Varie bastante a abertura (ex: "E aí, [Nome]!", "Fala, [Nome]!", "Valeu demais pelo carinho, [Nome]!", "Que massa ler isso, [Nome]!").

Nome do cliente: ${review.author}
Nota da avaliação: ${review.rating} estrelas
Comentário do cliente: "${review.comment}"

Escreva apenas o texto da resposta direta em português do Brasil, sem aspas. Termine assinando com "— Jon".`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }]
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generatedReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedReply) {
            replyText = generatedReply.trim();
          }
        }
      } catch (err) {
        console.warn('Erro ao gerar resposta manual com Gemini API:', err);
      }
    }

    if (!replyText) {
      replyText = generatePersonalizedFallbackReply(review.author, review.comment);
    }

    // Save as pending (draft) for approval instead of auto-publishing
    setGoogleReviews(prev => prev.map(rev => {
      if (rev.id === id) {
        return { ...rev, pendingReply: replyText };
      }
      return rev;
    }));
  };

  const handleApproveReply = async (id) => {
    const review = googleReviews.find(r => r.id === id);
    if (!review || !review.pendingReply) return;

    const replyText = review.pendingReply;

    if (!gbpConnected || !settings?.automations?.googleGbpAccountId) {
      setGoogleReviews(prev => prev.map(rev => {
        if (rev.id === id) {
          return { ...rev, reply: replyText, pendingReply: null };
        }
        return rev;
      }));
      alert('Resposta aprovada e publicada! 🚀');
      return;
    }

    try {
      const res = await fetch('/api/gbp?action=reply-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: id,
          replyComment: replyText
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGoogleReviews(prev => prev.map(rev => {
          if (rev.id === id) {
            return { ...rev, reply: replyText, pendingReply: null };
          }
          return rev;
        }));
        alert('Resposta publicada no Google Maps! 🚀');
      } else {
        alert(`Erro ao enviar resposta: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao enviar resposta ao Google.');
    }
  };

  const handleRegenerateReply = async (id) => {
    // Clear pending and regenerate
    setGoogleReviews(prev => prev.map(rev => {
      if (rev.id === id) {
        return { ...rev, pendingReply: null };
      }
      return rev;
    }));
    await handleManualGbpReply(id);
  };

  const handleGenerateGbpPost = async (specificTheme = null) => {
    setIsGeneratingGbpPost(true);
    const cleanedTheme = specificTheme || TRENDING_THEMES.find(t => t.id === selectedThemeId) || TRENDING_THEMES[0];

    const generateDynamicFallbackPost = (theme = null) => {
      if (theme && theme.title) {
        const hooks = [
          `Vamos falar sobre ${theme.title}? 💡`,
          `${theme.title}: por que isso importa para o seu cacho? ✂️`,
          `Entenda o impacto de: ${theme.title} 🌀`,
          `O segredo por trás de: ${theme.title} ✨`
        ];
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const image = pickGbpFallbackImage();
        const text = `${pick(hooks)}\n\n${theme.description || ''}\n\nNo Studio do Jon, cada detalhe é planejado no estado seco para respeitar a anatomia do seu fio.\n\n📍 Caiçaras — BH | Studio do Jon\n🔗 Reserve agora: www.ojonquecortou.com.br`;
        return { text, image };
      }

      const hooks = [
        'Seu fio tem memória — você sabia? 💡',
        'Corte a seco: por que faz toda a diferença? ✂️',
        'Cachos e crespos não são iguais. Sabia disso? 🤷‍♀️',
        'Frizz: textura natural ou sinal de dano? 🔍',
        'Qual é o segredo de um cacho bem definido? 🌀',
        'A curvatura do seu fio diz muito sobre o corte ideal! ✨',
        'Leitura de fio: o passo que a maioria dos salões pula ❌',
        'Visagismo para cachos e crespos: entenda por que importa 🎯',
        'Transição capilar? O corte certo acelera tudo! 🌿',
        'Volume, definição e leveza no mesmo corte — é possível! 🎉',
        'Cada curvatura pede uma técnica diferente. Conheça a sua! 💫',
        'O corte que respeita seu fio é o que dura mais ⏳',
      ];

      const bodies = [
        'No Studio do Jon, cada atendimento começa com a leitura de fio — uma análise da estrutura, porosidade e curvatura antes de qualquer tesoura. Isso garante que o corte potencialize o que o seu cabelo já tem de melhor.',
        'Cortar o cabelo cacheado molhado é como desenhar em uma mola esticada. A seco, conseguimos ver o caimento real de cada cacho, respeitando o encolhimento e distribuindo o volume perfeitamente para o seu rosto.',
        'Nosso método exclusivo combina visagismo e saúde capilar. Mais do que mudar a aparência, o objetivo é encontrar a proporção ideal que valorize a sua beleza natural e combine com a sua rotina diária.',
        'Muitas vezes, o frizz é apenas o seu cacho pedindo a finalização ou hidratação corretas. A Leitura de Fio identifica se o seu cabelo precisa de água, óleos ou reconstrução para reter a definição e o brilho.',
      ];

      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const image = pickGbpFallbackImage();
      const text = `${pick(hooks)}\n\n${pick(bodies)}\n\nNo Studio do Jon, cada detalhe é planejado para respeitar a geometria do seu fio.\n\n📍 Caiçaras — BH | Studio do Jon\n🔗 Reserve agora: www.ojonquecortou.com.br`;
      return { text, image };
    };

    const isDemo = !db;
    const apiKey = localStorage.getItem('google_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
    
    if (!isDemo && apiKey && apiKey !== 'undefined' && apiKey !== 'null' && !apiKey.includes('placeholder')) {
      try {
        let promptText = '';
        if (cleanedTheme) {
          promptText = `SYSTEM: Gerador de Posts para Google Business Profile — Studio do Jon
 
IDENTIDADE
Você escreve posts para o GBP do Studio do Jon (@ojonquecortou), cabeleireiro especialista em cabelos ondulados, cacheados e crespos em BH. Tom: direto, técnico, sem enrolação. Frase curta. Sem template de IA. Sem emojis decorativos (💡✨🌀🌿💫 — NUNCA).

ESTRUTURA OBRIGATÓRIA DE CADA POST
1. GANCHO (1-2 linhas): Começa com o erro que o cliente comete, a dor real, ou uma afirmação contraintuitiva. Sem "Você sabia que...". Sem "Vamos falar sobre...".
2. DESENVOLVIMENTO (3-5 linhas): A causa técnica do problema. Mencionar ao menos um destes: Método Leitura de Fio, visagismo, diagnóstico de couro, histórico químico, encolhimento, porosidade. NUNCA utilize o termo "corte a seco" ou "seco".
3. CTA (1-2 linhas): Direto ao ponto. Incluir sempre: ojonquecortou.com.br/agendar e "📍 Caiçaras — BH | Studio do Jon"
 
LIMITES TÉCNICOS
- Máximo 1.500 caracteres (limite do GBP)
- Hashtags no final: #cachos #cacheadas #cacheada #curlyhair #cabelocacheado
- CTA action type: BOOK (não CALL, não LEARN_MORE)
 
VERIFICAÇÃO ORTOGRÁFICA OBRIGATÓRIA
Antes de finalizar QUALQUER post, faça uma revisão de ortografia letra por letra. Erros comuns a verificar:
- "Imperdível" (nunca "Imerdivel" ou "Imperdível" sem acento)
- "Porosidade" (não "Poroisidade")
- "Visagismo" (não "Visajismo")
- Acentuação de: técnica, próprio, análise, após, está, através, método
- Confirme que não há palavras cortadas ou frases incompleta
 
TEMA DO POST (Utilize este tema específico para criar o post):
- Tópico: "${cleanedTheme.title}" - Descrição: "${cleanedTheme.description}"
 
DIRETRIZ DE ORIGINALIDADE E PESQUISA:
Não escreva sempre o mesmo texto. Use seu conhecimento geral da web para correlacionar o tema a novidades, rotinas diárias do ano de 2026, ou fatos curiosos de transição ou saúde do fio. Cada post deve ser totalmente original e único.
 
${extraInstruction ? `INSTRUÇÃO EXTRA/FOCO DO USUÁRIO (Incorpore isso de forma totalmente orgânica): "${extraInstruction}"\n` : ''}
 
NUNCA ESCREVER
- "Cada detalhe é planejado" — genérico
- "Conheça a sua curvatura" — vago
- "Nosso método exclusivo combina..." — corporativo
- Qualquer frase que poderia ser de qualquer salão do Brasil
- Emojis como 💡✨🌀✂️🌿 (exceto 📍 para localização)
- "Entenda o impacto de:" ou "O segredo por trás de:" — formato de lista AI
- Qualquer menção a "corte a seco" ou "seco".
 
EXEMPLO DE POST BOM (referência de tom)
"Modelar cabelo cacheado com regras prontas de corte reto é erro de 2015.
Seu cacho muda tudo dependendo da umidade e de como ele encolhe. O comprimento muda. O volume muda. A forma muda. Se o cabeleireiro cortou esticado, ele cortou no escuro.
Aqui, a tesoura só toca o fio depois da Leitura de Fio. Respeitando a anatomia natural do cacho, com o cacho real na frente.
Agenda pelo link do perfil.
Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
📍 Caiçaras — BH | Studio do Jon | ojonquecortou.com.br/agendar
#cachos #cacheadas #cacheada #curlyhair #cabelocacheado"
 
Você deve retornar obrigatoriamente um objeto JSON com as seguintes chaves:
{
  "text": "o texto do post em português",
  "image_prompt": "descrição detalhada em inglês com palavras-chave separadas por vírgula para um gerador de imagens IA descrevendo uma imagem realista e profissional relacionada ao tema do post (ex: gorgeous defined curly hair, professional salon setting, realistic)"
}`;
        } else {
          promptText = `SYSTEM: Gerador de Posts para Google Business Profile — Studio do Jon

IDENTIDADE
Você escreve posts para o GBP do Studio do Jon (@ojonquecortou), cabeleireiro especialista em cabelos ondulados, cacheados e crespos em BH. Tom: direto, técnico, sem enrolação. Frase curta. Sem template de IA. Sem emojis decorativos (💡✨🌀🌿💫 — NUNCA).

ESTRUTURA OBRIGATÓRIA DE CADA POST
1. GANCHO (1-2 linhas): Começa com o erro que o cliente comete, a dor real, ou uma afirmação contraintuitiva. Sem "Você sabia que...". Sem "Vamos falar sobre...".
2. DESENVOLVIMENTO (3-5 linhas): A causa técnica do problema. Mencionar ao menos um destes: Método Leitura de Fio, corte a seco, visagismo, diagnóstico de couro, histórico químico, encolhimento, porosidade.
3. CTA (1-2 linhas): Direto ao ponto. Incluir sempre: ojonquecortou.com.br/agendar e "📍 Caiçaras — BH | Studio do Jon"

LIMITES TÉCNICOS
- Máximo 1.500 caracteres (limite do GBP)
- Hashtags no final: #cachos #cacheadas #cacheada #curlyhair #cabelocacheado
- CTA action type: BOOK (não CALL, não LEARN_MORE)

VERIFICAÇÃO ORTOGRÁFICA OBRIGATÓRIA
Antes de finalizar QUALQUER post, faça uma revisão de ortografia letra por letra. Erros comuns a verificar:
- "Imperdível" (nunca "Imerdivel" ou "Imperdível" sem acento)
- "Porosidade" (não "Poroisidade")
- "Visagismo" (não "Visajismo")
- Acentuação de: técnica, próprio, análise, após, está, através, método
- Confirme que não há palavras cortadas ou frases incompleta

TÓPICOS VÁLIDOS (Escolha aleatoriamente um destes tópicos para o post, rotando sem repetir o mesmo em posts consecutivos):
- Corte molhado vs. seco (e por que molhado é erro)
- Visagismo + formato de rosto
- Transição capilar
- Descoloração em cabelos cacheados
- Leitura de fio: o que é e por que muda o resultado
- Frizz estrutural vs. frizz de produto
- Wolf cut / tendência + leitura de fio
- Cronograma capilar vs. corte certo

NUNCA ESCREVER
- "Cada detalhe é planejado" — genérico
- "Conheça a sua curvatura" — vago
- "Nosso método exclusivo combina..." — corporativo
- Qualquer frase que poderia ser de qualquer salão do Brasil
- Emojis como 💡✨🌀✂️🌿 (exceto 📍 para localização)
- "Entenda o impacto de:" ou "O segredo por trás de:" — formato de lista AI

EXEMPLO DE POST BOM (referência de tom)
"Corte molhado em cabelo cacheado é erro de 2015.
Seu cacho muda tudo quando seca. O comprimento muda. O volume muda. A forma muda. Se o cabeleireiro cortou molhado, ele cortou no escuro.
Aqui, a tesoura só toca o fio depois da Leitura de Fio. A seco. Com o cacho real na frente.
Agenda pelo link do perfil.
Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.
📍 Caiçaras — BH | Studio do Jon | ojonquecortou.com.br/agendar
#cachos #cacheadas #cacheada #curlyhair #cabelocacheado"

Você deve retornar obrigatoriamente um objeto JSON com as seguintes chaves:
{
  "text": "o texto do post em português",
  "image_prompt": "descrição em inglês para IA de imagem, profissional e realista"
}`;
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: promptText }]
              }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generatedJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedJsonText) {
            try {
              const parsed = JSON.parse(generatedJsonText.trim());
              const text = parsed.text || '';
              const imagePrompt = parsed.image_prompt || 'gorgeous defined curly hair, professional hair salon, realistic photo';
              const geminiImage = await generateGeminiImage(imagePrompt, apiKey);
              const image = geminiImage || pickGbpFallbackImage();

              setGeneratedGbpPost({ text: text.trim(), image });
              setIsGeneratingGbpPost(false);
              return;
            } catch (jsonErr) {
              console.warn('Erro ao parsear JSON do Gemini, usando fallback:', jsonErr);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao gerar post com Gemini API, usando fallback:', err);
      }
    }

    setTimeout(() => {
      setGeneratedGbpPost(generateDynamicFallbackPost(cleanedTheme));
      setIsGeneratingGbpPost(false);
    }, 800);
  };

  const handleGenerateGbpPostForTheme = (theme) => {
    handleGenerateGbpPost(theme);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleScheduleGbpPost = async () => {
    if (!generatedGbpPost) return;
    const daysLabels = selectedPostingDays.map(d => {
      return { 'domingo': 'Dom', 'segunda': 'Seg', 'terca': 'Ter', 'quarta': 'Qua', 'quinta': 'Qui', 'sexta': 'Sex', 'sabado': 'Sáb' }[d] || d;
    }).join(', ');

    // Imagens do Gemini vêm como data URI (base64). O Google Business Profile exige
    // sourceUrl público, então subimos pro Storage (gallery/) e usamos a URL hospedada
    // — o api/gbp.js converte essa URL do firebasestorage em /api/media/<arquivo>.
    let postImage = generatedGbpPost.image;
    if (postImage && postImage.startsWith('data:') && storage) {
      try {
        const fileRef = storageRef(storage, `gallery/gbp-${Date.now()}.png`);
        await uploadString(fileRef, postImage, 'data_url');
        postImage = await getDownloadURL(fileRef);
      } catch (err) {
        console.warn('Erro ao subir imagem do post para o Storage, usando fallback local:', err);
        postImage = pickGbpFallbackImage();
      }
    }

    const newPost = {
      id: 'post_' + Date.now(),
      text: generatedGbpPost.text,
      image: postImage,
      scheduledDate: `Próximos dias: ${daysLabels} às ${postFreqTime}`,
      status: 'scheduled',
      timestamp: new Date().toISOString()
    };

    // Update state immediately to prevent "sumir" feel
    setScheduledGbpPosts(prev => [newPost, ...prev]);
    try {
      const local = JSON.parse(localStorage.getItem('demo_gbp_posts')) || [];
      localStorage.setItem('demo_gbp_posts', JSON.stringify([newPost, ...local]));
    } catch(e){}

    if (db) {
      try {
        await setDoc(doc(db, 'gbp_posts', newPost.id), newPost);
      } catch (err) {
        console.error("Erro ao salvar post no Firestore:", err);
      }
    }

    setGeneratedGbpPost(null);
    alert(`Postagem programada nos dias (${daysLabels}) às ${postFreqTime}!`);
  };

  const handlePublishGbpPostImmediately = async () => {
    if (!generatedGbpPost) return;
    setIsPublishingGbpNow(true);

    let postImage = generatedGbpPost.image;
    if (postImage && postImage.startsWith('data:') && storage) {
      try {
        const fileRef = storageRef(storage, `gallery/gbp-${Date.now()}.png`);
        await uploadString(fileRef, postImage, 'data_url');
        postImage = await getDownloadURL(fileRef);
      } catch (err) {
        console.warn('Erro ao subir imagem do post para o Storage, usando fallback local:', err);
        postImage = pickGbpFallbackImage();
      }
    }

    const newPost = {
      id: 'post_' + Date.now(),
      text: generatedGbpPost.text,
      image: postImage,
      scheduledDate: 'Agora',
      status: 'published',
      timestamp: new Date().toISOString()
    };

    // Update state immediately
    setScheduledGbpPosts(prev => [newPost, ...prev]);
    try {
      const local = JSON.parse(localStorage.getItem('demo_gbp_posts')) || [];
      localStorage.setItem('demo_gbp_posts', JSON.stringify([newPost, ...local]));
    } catch(e){}

    if (db) {
      try {
        await setDoc(doc(db, 'gbp_posts', newPost.id), newPost);
      } catch (err) {
        console.error("Erro ao salvar post no Firestore:", err);
      }
    }

    if (!gbpConnected || !settings?.automations?.googleGbpAccountId) {
      setTimeout(() => {
        alert('Publicado com sucesso no Google Meu Negócio! 🚀 (Simulado)');
        setIsPublishingGbpNow(false);
        setGeneratedGbpPost(null);
      }, 1000);
      return;
    }

    try {
      const res = await fetch('/api/gbp?action=post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newPost.text,
          image: newPost.image
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Publicado com sucesso no Google Meu Negócio! 🚀');
      } else {
        alert(`Erro ao publicar no Google: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao tentar publicar no Google.');
    } finally {
      setIsPublishingGbpNow(false);
      setGeneratedGbpPost(null);
    }
  };

  const handlePublishGbpPostNow = async (post) => {
    setIsPublishingGbpId(post.id);
    
    // Check if Google Business Profile API is connected. If not, run simulation.
    if (!gbpConnected || !settings?.automations?.googleGbpAccountId) {
      setTimeout(async () => {
        alert('Publicado com sucesso no Google Meu Negócio! 🚀 (Simulado)');
        if (db) {
          try {
            await updateDoc(doc(db, 'gbp_posts', post.id), {
              status: 'published',
              scheduledDate: 'Agora'
            });
          } catch (e) {
            console.error(e);
          }
        } else {
          setScheduledGbpPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'published', scheduledDate: 'Agora' } : p));
          try {
            const local = JSON.parse(localStorage.getItem('demo_gbp_posts')) || [];
            const updated = local.map(p => p.id === post.id ? { ...p, status: 'published', scheduledDate: 'Agora' } : p);
            localStorage.setItem('demo_gbp_posts', JSON.stringify(updated));
          } catch(e){}
        }
        setIsPublishingGbpId(null);
      }, 1000);
      return;
    }

    try {
      const res = await fetch('/api/gbp?action=post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: post.text,
          image: post.image
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Publicado com sucesso no Google Meu Negócio! 🚀');
        if (db) {
          await updateDoc(doc(db, 'gbp_posts', post.id), {
            status: 'published',
            scheduledDate: 'Agora'
          });
        } else {
          setScheduledGbpPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'published', scheduledDate: 'Agora' } : p));
          try {
            const local = JSON.parse(localStorage.getItem('demo_gbp_posts')) || [];
            const updated = local.map(p => p.id === post.id ? { ...p, status: 'published', scheduledDate: 'Agora' } : p);
            localStorage.setItem('demo_gbp_posts', JSON.stringify(updated));
          } catch(e){}
        }
      } else {
        alert(`Erro ao publicar no Google: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao tentar publicar no Google.');
    } finally {
      setIsPublishingGbpId(null);
    }
  };

  const handleDeleteGbpPost = async (postId) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'gbp_posts', postId));
      } catch (err) {
        console.error("Erro ao excluir post do Firestore:", err);
      }
    } else {
      setScheduledGbpPosts(prev => prev.filter(p => p.id !== postId));
      try {
        const local = JSON.parse(localStorage.getItem('demo_gbp_posts')) || [];
        localStorage.setItem('demo_gbp_posts', JSON.stringify(local.filter(p => p.id !== postId)));
      } catch(e){}
    }
  };

  const saveLog = async (clientName, clientPhone, stage, channel) => {
    const clientObj = clients.find(c => c.phone === clientPhone);
    const email = clientObj?.email || '';
    const newLog = {
      timestamp: new Date().toISOString(),
      clientName,
      clientPhone: clientPhone || '',
      email: email || '',
      stage,
      channel, // 'email' or 'whatsapp'
      status: 'success'
    };

    if (db) {
      try {
        await addDoc(collection(db, 'automation_logs'), newLog);
      } catch (err) {
        console.error("Erro ao salvar log no Firestore:", err);
      }
    } else {
      // Demo/Offline Mode
      try {
        const localLogs = JSON.parse(localStorage.getItem('demo_automation_logs')) || [];
        const updated = [{ id: 'demo_' + Date.now() + Math.random().toString(36).substr(2, 5), ...newLog }, ...localLogs];
        localStorage.setItem('demo_automation_logs', JSON.stringify(updated));
        setAutomationLogs(updated);
      } catch (e) {
        console.error("Erro ao salvar log no localStorage:", e);
      }
    }
  };

  const deliveryStats = useMemo(() => {
    const now = new Date();
    const stats = {
      today: { email: 0, whatsapp: 0 },
      week: { email: 0, whatsapp: 0 },
      month: { email: 0, whatsapp: 0 }
    };

    const getLogChannel = (log) => {
      if (log.channel) return log.channel;
      const stage = (log.stage || '').toLowerCase();
      if (stage.includes('whatsapp') || stage.includes('wa') || stage.includes('whats') || stage.includes('birthday')) {
        return 'whatsapp';
      }
      return 'email';
    };

    automationLogs.forEach(log => {
      if (!log.timestamp) return;
      const logDate = new Date(log.timestamp);
      if (isNaN(logDate.getTime())) return;

      const diffMs = now - logDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const channel = getLogChannel(log);

      const isToday = logDate.toDateString() === now.toDateString();
      const isThisWeek = diffDays <= 7;
      const isThisMonth = diffDays <= 30;

      if (isToday) {
        if (channel === 'email') stats.today.email++;
        else stats.today.whatsapp++;
      }
      if (isThisWeek) {
        if (channel === 'email') stats.week.email++;
        else stats.week.whatsapp++;
      }
      if (isThisMonth) {
        if (channel === 'email') stats.month.email++;
        else stats.month.whatsapp++;
      }
    });

    return stats;
  }, [automationLogs]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowEmailEditModal(false);
        setShowBounceListModal(false);
        setShowPreviewModal(false);
        setShowPreviewNewsletterFull(false);
        setShowAutomationEditModal(false);
        setShowAutomationPreviewModal(false);
        setShowEmailPreviewModal(false);
        try { setShowGbpLogModal(false); } catch(e){}
        try { setShowCustomHtmlModal(false); } catch(e){}
        try { setShowCustomPreviewModal(false); } catch(e){}
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let unsubscribeProfiles;
    let unsubscribeBookings;
    let unsubscribeLogs;
    let unsubscribeSettings;
    let unsubscribeAdminNotifs;
    let unsubscribeGbpPosts;

    const loadData = async () => {
      try {
        unsubscribeSettings = onSnapshot(doc(db, 'settings', 'studio'), (docSnap) => {
          if (docSnap.exists()) {
            setSettings(docSnap.data());
          } else {
            setSettings({ automations: {} });
          }
        });

        unsubscribeLogs = onSnapshot(collection(db, 'automation_logs'), (logsSnap) => {
          const lgs = [];
          logsSnap.forEach(d => lgs.push({ id: d.id, ...d.data() }));
          lgs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAutomationLogs(lgs);
        });

        unsubscribeAdminNotifs = onSnapshot(
          query(collection(db, 'admin_notifications'), orderBy('timestamp', 'desc'), limit(50)),
          (snap) => {
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            setAdminNotifications(list);
          }
        );
        const placeholders = ['post_sched_1', 'post_pub_1', 'post_pub_2', 'post_pub_3'];

        unsubscribeGbpPosts = onSnapshot(collection(db, 'gbp_posts'), (postsSnap) => {
          const pst = [];
          postsSnap.forEach(d => {
            if (!placeholders.includes(d.id)) {
              pst.push({ id: d.id, ...d.data() });
            }
          });
          pst.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          setScheduledGbpPosts(pst);
        });

        const profiles = [];
        unsubscribeProfiles = onSnapshot(collection(db, 'client_profiles'), (profSnap) => {
          profiles.length = 0;
          profSnap.forEach(d => profiles.push({ phone: d.id, ...d.data() }));
          
          unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (bookSnap) => {
            const bookings = [];
            bookSnap.forEach(d => bookings.push({ id: d.id, ...d.data() }));
            
            // Build unified clients array
            const clientMap = new Map();
            bookings.forEach(b => {
              if (['Pendente', 'Confirmado', 'Concluído'].includes(b.status)) {
                const phone = b.clientPhone || b.phone;
                if (!phone) return;
                const existing = clientMap.get(phone) || { name: b.clientName, phone: phone, visits: [], lastServiceName: b.serviceName, email: '', birthdate: b.clientBirthdate || b.birthdate || '' };
                existing.visits.push(new Date(b.date + 'T00:00:00'));
                if (!existing.email && b.clientEmail) existing.email = b.clientEmail;
                if (!existing.email && b.email) existing.email = b.email;
                if (!existing.birthdate && (b.clientBirthdate || b.birthdate)) existing.birthdate = b.clientBirthdate || b.birthdate;
                clientMap.set(phone, existing);
              }
            });

            profiles.forEach(p => {
              const existing = clientMap.get(p.phone) || { name: p.name || 'Cliente', phone: p.phone, visits: [], lastServiceName: 'Nenhum', email: p.email || '', birthdate: p.birthdate || '', lastVisit: p.lastVisit || '' };
              if (p.email) existing.email = p.email;
              if (p.name) existing.name = p.name;
              if (p.birthdate) existing.birthdate = p.birthdate;
              if (p.lastVisit) existing.lastVisit = p.lastVisit;
              clientMap.set(p.phone, existing);
            });

            const merged = Array.from(clientMap.values()).map(c => {
              c.visits.sort((a, b) => b - a);
              return {
                ...c,
                lastVisit: c.visits.length > 0 ? c.visits[0].toISOString() : (c.lastVisit || 'Nunca visitou'),
                totalVisits: c.visits.length
              };
            });
            
            setClients(merged);
            setLoading(false);
          });
        });

      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    if (db) {
      loadData();
    } else {
      try {
        const localLogs = JSON.parse(localStorage.getItem('demo_automation_logs')) || [];
        setAutomationLogs(localLogs);
        const localPosts = JSON.parse(localStorage.getItem('demo_gbp_posts')) || [];
        setScheduledGbpPosts(localPosts);
      } catch (e) {}
      setLoading(false);
    }

    return () => {
      if (unsubscribeProfiles) unsubscribeProfiles();
      if (unsubscribeBookings) unsubscribeBookings();
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeAdminNotifs) unsubscribeAdminNotifs();
      if (unsubscribeGbpPosts) unsubscribeGbpPosts();
    };
  }, []);

  useEffect(() => {
    const fetchRealReviews = async () => {
      if (!gbpConnected) return;
      try {
        const res = await fetch('/api/gbp?action=get-reviews');
        if (res.ok) {
          const data = await res.json();
            setGoogleReviews(prev => {
              return data.reviews.map(newRev => {
                const match = prev.find(r => r.id === newRev.id);
                if (match && match.pendingReply) {
                  return { ...newRev, pendingReply: match.pendingReply };
                }
                return newRev;
              });
            });
        }
      } catch (err) {
        console.warn('Erro ao carregar avaliações reais:', err);
      }
    };
    fetchRealReviews();
    const interval = setInterval(fetchRealReviews, 30000);
    return () => clearInterval(interval);
  }, [gbpConnected, settings]);

  const getDaysAbsent = (lastVisitDate) => {
    if (lastVisitDate === 'Nunca visitou' || !lastVisitDate) return Infinity;
    const diffTime = Math.abs(new Date() - new Date(lastVisitDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const birthdayClients = useMemo(() => {
    const today = new Date();
    return clients.filter(c => {
      if (!c.birthdate) return false;
      const parts = c.birthdate.split('-');
      if (parts.length < 2) return false;
      const bMonth = parseInt(parts[1], 10);
      const bDay   = parseInt(parts[2], 10);
      for (let offset = 0; offset <= birthdayWindowDays; offset++) {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        if (d.getMonth() + 1 === bMonth && d.getDate() === bDay) return true;
      }
      return false;
    });
  }, [clients, birthdayWindowDays]);

  const getBirthdayWaLink = (client) => {
    const firstName = (client.name || '').split(' ')[0];
    const msg = birthdayWaMessage.replace(/{nome}/g, firstName);
    return `https://wa.me/55${client.phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleSendBirthdayWaCampaign = async () => {
    const targets = birthdayClients;
    if (targets.length === 0) return;
    setIsSendingBirthdayWa(true);
    cancelSendingRef.current = false;
    setBirthdayWaLogs(['[SISTEMA] Iniciando disparo de aniversário...']);
    for (const client of targets) {
      if (cancelSendingRef.current) {
        setBirthdayWaLogs(prev => [...prev, '[SISTEMA] Disparo cancelado pelo usuário.']);
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
      if (cancelSendingRef.current) {
        setBirthdayWaLogs(prev => [...prev, '[SISTEMA] Disparo cancelado pelo usuário.']);
        break;
      }
      await saveLog(client.name, client.phone, 'Aniversário (WhatsApp)', 'whatsapp');
      setBirthdayWaLogs(prev => [...prev, `[✅ OK] Mensagem enfileirada para ${client.name} (${client.phone})`]);
    }
    if (!cancelSendingRef.current) {
      setBirthdayWaLogs(prev => [...prev, '[SISTEMA] Disparo finalizado! Verifique o WhatsApp.']);
    }
    setIsSendingBirthdayWa(false);
  };

  const toggleClientSelection = (phone) => {
    setSelectedCampaignPhones(prev => 
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    );
  };

  const toggleAutomation = async (key, newValue) => {
    try {
      await updateDoc(doc(db, 'settings', 'studio'), {
        [`automations.${key}`]: newValue
      });
      // A UI vai atualizar automaticamente via onSnapshot
    } catch (err) {
      console.error("Erro ao atualizar automação:", err);
      alert("Erro ao salvar configuração.");
    }
  };

  const filteredClients = clients.filter(c =>
    (c.name || 'Cliente').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (c.phone || '').includes(searchTerm || '')
  );

  const marketingTargetsList = useMemo(() => {
    return clients.filter(c => {
      const days = getDaysAbsent(c.lastVisit);
      if (marketingTarget === 'todos') return true;
      if (marketingTarget === 'inativos_30') return days >= 30 && days <= 60;
      if (marketingTarget === 'inativos_60') return days > 60 && days !== Infinity;
      if (marketingTarget === 'nunca_visitaram') return days === Infinity;
      if (marketingTarget === 'selecionados') return selectedCampaignPhones.includes(c.phone);
      return false;
    });
  }, [clients, marketingTarget, selectedCampaignPhones]);

  const getCampaignMessageLink = (client) => {
    const days = getDaysAbsent(client.lastVisit);
    let msg = campaignMessage
      .replace(/{nome}/g, (client.name || 'Cliente').split(' ')[0])
      .replace(/{ultimo_servico}/g, client.lastServiceName || 'Corte')
      .replace(/{dias_ausente}/g, days === Infinity ? 'muito tempo' : days);
    
    return `https://wa.me/55${client.phone || ''}?text=${encodeURIComponent(msg)}`;
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplateKey) return;
    try {
      await updateDoc(doc(db, 'settings', 'studio'), {
        [`email_templates.${editingTemplateKey}`]: editingTemplateContent
      });
      setShowEmailEditModal(false);
      alert('Template salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar template.');
    }
  };

  const handleSendWhatsappCampaign = async () => {
    if (marketingTargetsList.length === 0) {
      alert('Nenhum cliente no segmento escolhido para disparar.');
      return;
    }

    const gateway = settings?.waReminderGateway || 'zapi';
    const isGatewayConfigured = 
      (gateway === 'zapi' && settings?.zApiInstanceId && settings?.zApiToken) ||
      (gateway === 'evolution' && settings?.evolutionApiUrl && settings?.evolutionApiKey && settings?.evolutionInstanceName) ||
      (gateway === 'custom' && settings?.customWebhookUrl);

    if (!settings?.waReminderEnabled || !isGatewayConfigured) {
      alert('Por favor, ative e configure suas credenciais de integração do WhatsApp na aba "Configurações" antes de realizar disparos em lote.');
      return;
    }

    if (!confirm(`Deseja iniciar o envio automático de mensagens para ${marketingTargetsList.length} clientes via ${gateway.toUpperCase()}?`)) {
      return;
    }

    setIsSendingWhatsapp(true);
    cancelSendingRef.current = false;
    const logTime = () => new Date().toLocaleTimeString('pt-BR');
    setWhatsappLogs([`[${logTime()}] 🚀 Iniciando campanha em lote via ${gateway.toUpperCase()}...`]);

    for (const client of marketingTargetsList) {
      if (cancelSendingRef.current) {
        setWhatsappLogs(prev => [...prev, `[${logTime()}] 🛑 Disparo cancelado pelo usuário.`]);
        break;
      }

      const days = getDaysAbsent(client.lastVisit);
      const daysText = days === Infinity ? 'algum' : days;
      const msgText = campaignMessage
        .replace(/{nome}/g, client.name)
        .replace(/{ultimo_servico}/g, client.lastServiceName || 'serviço')
        .replace(/{dias_ausente}/g, daysText);

      const cleanPhone = (client.phone || '').replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setWhatsappLogs(prev => [...prev, `[${logTime()}] ⚠️ Pulado: ${client.name} (Telefone inválido)`]);
        continue;
      }

      const phoneWithDDI = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      setWhatsappLogs(prev => [...prev, `[${logTime()}] 🔄 Enviando para ${client.name}...`]);

      let url = '';
      let headers = { 'Content-Type': 'application/json' };
      let body = {};

      if (gateway === 'zapi') {
        url = `https://api.z-api.io/instances/${settings.zApiInstanceId}/token/${settings.zApiToken}/send-text`;
        body = {
          phone: phoneWithDDI,
          message: msgText
        };
      } else if (gateway === 'evolution') {
        url = `${settings.evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${settings.evolutionInstanceName}`;
        headers['apikey'] = settings.evolutionApiKey;
        body = {
          number: phoneWithDDI,
          text: msgText
        };
      } else if (gateway === 'custom') {
        url = settings.customWebhookUrl;
        body = {
          phone: phoneWithDDI,
          message: msgText,
          clientName: client.name,
          daysAbsent: daysText,
          lastService: client.lastServiceName
        };
      }

      let responseOk = false;
      try {
        if (!db) {
          responseOk = true;
          setWhatsappLogs(prev => [...prev, `[${logTime()}] [DEMO] Simulando sucesso de envio WhatsApp para ${client.name}`]);
        } else {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
          });
          responseOk = response.ok;
        }
      } catch (err) {
        setWhatsappLogs(prev => [...prev, `[${logTime()}] ❌ Falha no envio para ${client.name}: ${err.message}`]);
      }

      if (responseOk) {
        await saveLog(client.name, client.phone, 'Campanha Manual (WhatsApp)', 'whatsapp');
        setWhatsappLogs(prev => [...prev, `[${logTime()}] ✅ Sucesso: enviado para ${client.name}`]);
      } else {
        setWhatsappLogs(prev => [...prev, `[${logTime()}] ❌ Falha no gateway para ${client.name}`]);
      }

      // Intervalo regulamentar
      await new Promise(r => setTimeout(r, 1500));
    }

    if (!cancelSendingRef.current) {
      setWhatsappLogs(prev => [...prev, `[${logTime()}] 🎉 Campanha finalizada com sucesso! Todos os disparos concluídos.`]);
    }
    setIsSendingWhatsapp(false);
  };

  const handleSendEmailCampaign = async () => {
    if (marketingTargetsList.length === 0) return;
    
    const targets = [...marketingTargetsList];
    const total = targets.length;
    
    // Configurações de proteção otimizadas para Resend
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 2000;
    const INDIVIDUAL_DELAY = 200;
    
    const estTimeMinutes = Math.ceil(((total * INDIVIDUAL_DELAY) + (Math.floor(total / BATCH_SIZE) * BATCH_DELAY)) / 60000);
    
    if (!confirm(`Deseja iniciar a campanha para ${total} clientes com a Proteção otimizada para Resend?\n\nConfiguração:\n- Intervalo entre e-mails: ${INDIVIDUAL_DELAY/1000}s\n- Lote de segurança: ${BATCH_SIZE} e-mails\n- Pausa entre lotes: ${BATCH_DELAY/1000}s\n- Tempo total estimado: ~${estTimeMinutes} minuto(s).`)) {
      return;
    }

    setIsSendingEmail(true);
    cancelSendingRef.current = false;
    setEmailProgressTotal(total);
    setEmailProgressCount(0);
    const logTime = () => new Date().toLocaleTimeString('pt-BR');
    setEmailLogs([
      `[${logTime()}] 🚀 Iniciando campanha otimizada para Resend`,
      `[${logTime()}] 📬 Total de destinatários: ${total} | Tempo estimado: ~${estTimeMinutes} min`
    ]);

    let count = 0;
    for (const client of targets) {
      if (cancelSendingRef.current) {
        setEmailLogs(prev => [...prev, `[${logTime()}] 🛑 Disparo cancelado pelo usuário.`]);
        break;
      }
      count++;
      setEmailProgressCount(count);
      
      // Delay de proteção individual
      if (count > 1) {
        // Se acabamos de completar um lote, espera o delay do lote, caso contrário o delay individual
        const finishedBatch = (count - 1) % BATCH_SIZE === 0;
        if (finishedBatch) {
          setEmailLogs(prev => [...prev, `[${logTime()}] ⏳ Lote de ${BATCH_SIZE} e-mails concluído. Pausa de segurança de ${BATCH_DELAY/1000}s para evitar SPAM no Titan...`]);
          const delaySteps = BATCH_DELAY / 1000;
          for (let s = 0; s < delaySteps; s++) {
            if (cancelSendingRef.current) break;
            await new Promise(r => setTimeout(r, 1000));
          }
        } else {
          setEmailLogs(prev => [...prev, `[${logTime()}] ⏳ Aguardando ${INDIVIDUAL_DELAY/1000}s de intervalo regulamentar...`]);
          const delaySteps = INDIVIDUAL_DELAY / 1000;
          for (let s = 0; s < delaySteps; s++) {
            if (cancelSendingRef.current) break;
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      if (cancelSendingRef.current) {
        setEmailLogs(prev => [...prev, `[${logTime()}] 🛑 Disparo cancelado pelo usuário.`]);
        break;
      }

      setEmailLogs(prev => [...prev, `[${logTime()}] 🔄 [${count}/${total}] Processando: ${client.name} (${client.email || 'sem e-mail'})...`]);

      if (!client.email || client.email === 'Não informado' || !client.email.includes('@')) {
        setEmailLogs(prev => [...prev, `[${logTime()}] ⚠️ Pulado: E-mail inválido ou não cadastrado.`]);
      } else {
        const days = getDaysAbsent(client.lastVisit);
        const firstName = (client.name || 'Cliente').split(' ')[0];
        
        const subject = emailCampaignSubject
          .replace(/{nome}/g, firstName)
          .replace(/{ultimo_servico}/g, client.lastServiceName || 'Corte')
          .replace(/{dias_ausente}/g, days === Infinity ? 'muito tempo' : days);
          
        let content = emailCampaignBody
          .replace(/{nome}/g, firstName)
          .replace(/{ultimo_servico}/g, client.lastServiceName || 'Corte')
          .replace(/{dias_ausente}/g, days === Infinity ? 'muito tempo' : days);

        if (!content.includes('<p') && !content.includes('<br')) {
          content = '<p>' + content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>') + '</p>';
        }

        let responseOk = false;
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'campanha',
              subject,
              htmlBody: content,
              clientEmail: client.email,
              clientName: client.name
            })
          });
          responseOk = response.ok;
        } catch (error) {
          if (!db) {
            responseOk = true;
            setEmailLogs(prev => [...prev, `[${logTime()}] [DEMO] Simulando sucesso de envio para ${client.email}`]);
          } else {
            setEmailLogs(prev => [...prev, `[${logTime()}] ❌ Erro de conexão para ${client.email}: ${error.message}`]);
          }
        }

        if (responseOk) {
          await saveLog(client.name, client.phone, 'Campanha Manual (E-mail)', 'email');
          if (db) {
            setEmailLogs(prev => [...prev, `[${logTime()}] 📧 Sucesso: enviado para ${client.email}`]);
          }
        } else {
          setEmailLogs(prev => [...prev, `[${logTime()}] ❌ Falha no envio para ${client.email}`]);
        }
      }
    }

    if (!cancelSendingRef.current) {
      setEmailLogs(prev => [...prev, `[${logTime()}] ✅ Campanha de e-mail concluída com sucesso!`]);
    }
    setIsSendingEmail(false);
  };

  const handleSaveCustomHtml = async () => {
    if (!editingCustomKey) return;
    try {
      await updateDoc(doc(db, 'settings', 'studio'), {
        [`custom_automations.${editingCustomKey}`]: editingCustomHtml
      });
      setShowCustomHtmlModal(false);
      alert('Automação HTML salva com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar automação HTML.');
    }
  };

  const handleCustomFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditingCustomHtml(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="admin-clients-page">
      <div className="crm-header-tabs" style={{ marginBottom: 20 }}>
        <button className="crm-tab-btn active" style={{ cursor: 'default' }}>
          <Sparkles size={16} /> Central de Campanhas
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--adm-muted)' }}>Carregando dados...</div>
      ) : (
        <div className="crm-body-content">
          <div className="marketing-tab-view">
            <header className="report-header">
              <h3>Campanhas & Automações de Relacionamento (Marketing CRM)</h3>
              <p>Selecione um segmento de clientes, defina o canal de disparo (WhatsApp ou E-mail) e crie campanhas direcionadas.</p>
            </header>

            <div className="marketing-layout-grid">
              
              {/* Histórico de Envios Dashboard Widget */}
              {(() => {
                const stats = deliveryStats;
                return (
                  <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--adm-rule)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <BarChart3 size={18} style={{ color: 'var(--adm-gold)' }} />
                      <h4 style={{ margin: 0 }}>Histórico de Envios (Acompanhamento)</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                      {[
                        { title: 'Acompanhamento Diário', subtitle: 'Hoje', data: stats.today },
                        { title: 'Acompanhamento Semanal', subtitle: 'Últimos 7 dias', data: stats.week },
                        { title: 'Acompanhamento Mensal', subtitle: 'Últimos 30 dias', data: stats.month }
                      ].map((item, idx) => (
                        <div key={idx} style={{ padding: '16px', background: 'var(--sidebar-bg)', border: '1px solid var(--adm-rule)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>{item.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{item.subtitle}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1, padding: '8px', background: 'var(--panel-bg)', border: '1px solid var(--adm-rule)', borderRadius: '4px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                                <Mail size={12} /> E-mail
                              </div>
                              <strong style={{ fontSize: '1.25rem', color: 'var(--adm-text)' }}>{item.data.email}</strong>
                            </div>
                            <div style={{ flex: 1, padding: '8px', background: 'var(--panel-bg)', border: '1px solid var(--adm-rule)', borderRadius: '4px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                                <Phone size={12} /> WhatsApp
                              </div>
                              <strong style={{ fontSize: '1.25rem', color: 'var(--adm-text)' }}>{item.data.whatsapp}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              
              {/* Client Selection Tool */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--adm-rule)' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Buscar e Marcar Clientes</h4>
                <div className="search-wrap" style={{ marginBottom: '16px', maxWidth: '400px' }}>
                  <Search size={14} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar por nome ou telefone..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '4px', border: '1px solid var(--adm-rule)' }}
                  />
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--adm-rule)', borderRadius: '6px' }}>
                  <table className="admin-table" style={{ margin: 0 }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 1 }}>
                      <tr>
                        <th style={{ width: 40, textAlign: 'center' }}>
                          <button 
                            className="btn-icon" 
                            onClick={() => {
                              if (selectedCampaignPhones.length === filteredClients.length) {
                                setSelectedCampaignPhones([]);
                              } else {
                                setSelectedCampaignPhones(filteredClients.map(c => c.phone));
                              }
                            }}
                          >
                            {selectedCampaignPhones.length === filteredClients.length && filteredClients.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </th>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Última Visita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map(c => {
                        const days = getDaysAbsent(c.lastVisit);
                        return (
                          <tr key={c.phone} style={{ background: selectedCampaignPhones.includes(c.phone) ? 'rgba(47, 133, 90, 0.1)' : 'transparent' }}>
                            <td style={{ textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedCampaignPhones.includes(c.phone)}
                                onChange={() => toggleClientSelection(c.phone)}
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                              />
                            </td>
                            <td>{c.name}</td>
                            <td>{c.phone}</td>
                            <td>{days === Infinity ? 'Sem visitas' : `${days} dias atrás`}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {selectedCampaignPhones.length > 0 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--adm-gold)', marginTop: '8px', fontWeight: 600 }}>
                    {selectedCampaignPhones.length} clientes marcados. (Escolha "Selecionadas no Relatório" abaixo).
                  </p>
                )}
              </div>
              
              {/* Automações Fixas */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--adm-rule)' }}>
                <h4 style={{ margin: '0 0 6px 0' }}>Régua de Relacionamento (Automática)</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', marginBottom: '20px', marginTop: 0 }}>
                  Acompanhe a jornada pós-atendimento. O sistema verifica diariamente e dispara a sequência abaixo.
                </p>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', background: 'var(--sidebar-bg)', padding: '12px', borderRadius: '6px' }}>
                  <strong style={{ flex: 1 }}>Régua Completa (Mestre)</strong>
                  <button 
                    className={`btn-toggle ${settings?.automations?.sequenceEnabled !== false ? 'active' : ''}`}
                    onClick={() => toggleAutomation('sequenceEnabled', settings?.automations?.sequenceEnabled === false)}
                  >
                    {settings?.automations?.sequenceEnabled !== false ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {[
                    { key: 'seqD1', label: 'E-mail 1 (D+1)', desc: 'Cuidado Imediato' },
                    { key: 'seqD7', label: 'E-mail 2 (D+7)', desc: 'Semana Crítica' },
                    { key: 'seqD21', label: 'E-mail 3 (D+21)', desc: 'Pico de Definição' },
                    { key: 'seqD35', label: 'E-mail 4 (D+35/50)', desc: 'Rebooking Ideal' },
                    { key: 'seqD60', label: 'E-mail 5 (D+60)', desc: 'Reativação Suave' },
                    { key: 'seqD90', label: 'E-mail 6 (D+90)', desc: 'Último Contato' },
                    { key: 'seqD150', label: 'E-mail 7 (D+150)', desc: 'Reativação (150 dias)' },
                    { key: 'birthdayEnabled', label: 'Aniversário (D-5)', desc: 'Convite c/ antecedência' }
                  ].map(step => (

                    <div key={step.key} style={{ padding: '12px', border: '1px solid var(--adm-rule)', borderRadius: '6px', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{step.label}</span>
                        <button 
                          className={`btn-toggle ${settings?.automations?.[step.key] !== false ? 'active' : ''}`}
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={() => toggleAutomation(step.key, settings?.automations?.[step.key] === false)}
                        >
                          {settings?.automations?.[step.key] !== false ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>{step.desc}</span>
                      
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button 
                          className="btn btn-outline btn-small"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.7rem', padding: '4px' }}
                          onClick={() => {
                            setEditingTemplateKey(step.key);
                            setEditingTemplateContent(settings?.email_templates?.[step.key] || EMAIL_PREVIEWS[step.key]);
                            setShowEmailEditModal(true);
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="btn btn-outline btn-small"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.7rem', padding: '4px' }}
                          onClick={() => {
                            setEmailPreviewContent(settings?.email_templates?.[step.key] || EMAIL_PREVIEWS[step.key]);
                            setShowEmailPreviewModal(true);
                          }}
                        >
                          <Eye size={12} /> Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '30px' }}>
                  <h5 style={{ margin: '0 0 12px 0' }}>📋 Disparos de Hoje — Todos os Canais</h5>
                  {(() => {
                    const TRANSACTIONAL_STAGES = [
                      'solicitacao_recebida', 'horario_confirmado', 'lembrete_24h',
                      'booking_confirmed', 'booking_pending', 'reminder_24h',
                      'admin_solicitacao_recebida', 'admin_horario_confirmado',
                      'reativacao_5_meses', 'cancel_booking'
                    ];

                    const getLogChannel = (log) => {
                      if (log.channel) return log.channel;
                      const stage = (log.stage || '').toLowerCase();
                      if (stage.includes('whatsapp') || stage.includes('wa_') || stage.includes('birthday') || stage.includes('aniversar')) return 'whatsapp';
                      return 'email';
                    };

                    const isTransactional = (log) => {
                      const stage = (log.stage || '').toLowerCase();
                      return TRANSACTIONAL_STAGES.some(s => stage.includes(s)) ||
                        stage.includes('solicitac') || stage.includes('confirm') ||
                        stage.includes('lembrete') || stage.includes('cancel') ||
                        stage.includes('reminder') || stage.includes('pending');
                    };

                    const todayLogs = Array.isArray(automationLogs) ? [...automationLogs]
                      .filter(log => {
                        if (!log || !log.timestamp) return false;
                        return new Date(log.timestamp).toDateString() === new Date().toDateString();
                      })
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      : [];

                    const CHANNEL_ICON = { email: '📧', whatsapp: '📱', transacional: '⚙️' };
                    const CHANNEL_COLOR = { email: '#58A6FF', whatsapp: '#25D366', transacional: 'var(--adm-gold)' };

                    if (todayLogs.length === 0) {
                      return <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem' }}>Nenhum disparo registrado hoje.</p>;
                    }

                    return (
                      <div style={{ border: '1px solid var(--adm-rule)', borderRadius: 6, overflow: 'hidden', maxHeight: '165px', overflowY: 'auto' }}>
                        <table className="admin-table" style={{ margin: 0 }}>
                          <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 1 }}>
                            <tr>
                              <th style={{ width: 60 }}>Hora</th>
                              <th>Cliente</th>
                              <th style={{ width: 100 }}>Canal</th>
                              <th>Etapa / Trigger</th>
                              <th>Contato</th>
                              <th style={{ width: 80 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {todayLogs.map((log, i) => {
                              const ch = isTransactional(log) ? 'transacional' : getLogChannel(log);
                              return (
                                <tr key={log.id || i}>
                                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                                    {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td style={{ fontWeight: 500 }}>{log.clientName || '—'}</td>
                                  <td>
                                    <span style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '2px 8px',
                                      borderRadius: 12,
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      background: ch === 'whatsapp' ? 'rgba(37,211,102,0.12)' : ch === 'transacional' ? 'rgba(212,132,154,0.1)' : 'rgba(88,166,255,0.1)',
                                      color: CHANNEL_COLOR[ch]
                                    }}>
                                      {CHANNEL_ICON[ch]} {ch === 'transacional' ? 'Transacional' : ch === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '0.78rem' }}>
                                    <span style={{ background: 'var(--sidebar-bg)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                      {log.stage || '—'}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>
                                    {ch === 'whatsapp' ? (log.clientPhone || '—') : (log.email || log.clientPhone || '—')}
                                  </td>
                                  <td>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: 12,
                                      fontSize: '0.7rem',
                                      fontWeight: 600,
                                      background: log.status === 'error' ? 'rgba(248,81,73,0.12)' : 'rgba(46,160,67,0.12)',
                                      color: log.status === 'error' ? '#F85149' : '#2EA043'
                                    }}>
                                      {log.status === 'error' ? '❌ Erro' : '✅ Enviado'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Automação de Aniversário — WhatsApp */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--adm-rule)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0 }}>🎂 Automação de Aniversário (WhatsApp)</h4>
                  <button
                    className={`btn-toggle ${settings?.automations?.birthdayWaEnabled !== false ? 'active' : ''}`}
                    onClick={() => toggleAutomation('birthdayWaEnabled', settings?.automations?.birthdayWaEnabled === false)}
                  >
                    {settings?.automations?.birthdayWaEnabled !== false ? 'ON' : 'OFF'}
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', marginTop: 0, marginBottom: '20px' }}>
                  Dispara uma mensagem personalizada no WhatsApp para clientes que fazem aniversário hoje ou nos próximos dias. O Jon é notificado e abre cada conversa com 1 clique.
                </p>

                {/* Janela de disparo */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--adm-muted)' }}>Exibir aniversariantes:</span>
                  {[
                    { label: 'Somente hoje', value: 0 },
                    { label: 'Próximos 3 dias', value: 3 },
                    { label: 'Próximos 7 dias', value: 7 },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setBirthdayWindowDays(opt.value)}
                      style={{
                        padding: '6px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                        border: birthdayWindowDays === opt.value ? '2px solid var(--adm-gold)' : '1px solid var(--adm-rule)',
                        background: birthdayWindowDays === opt.value ? 'rgba(176,90,46,0.12)' : 'transparent',
                        color: birthdayWindowDays === opt.value ? 'var(--adm-gold)' : 'var(--adm-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Lista de aniversariantes */}
                {(() => {
                  const bClients = birthdayClients;
                  return bClients.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--adm-rule)', borderRadius: '8px', color: 'var(--adm-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                      🎉 Nenhum aniversariante {birthdayWindowDays === 0 ? 'hoje' : `nos próximos ${birthdayWindowDays} dias`}.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--adm-rule)', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                      <div style={{ padding: '10px 16px', background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--adm-rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>🎂 {bClients.length} aniversariante{bClients.length > 1 ? 's' : ''} encontrado{bClients.length > 1 ? 's' : ''}</span>
                        {isSendingBirthdayWa ? (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '7px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--adm-danger)', color: '#fff' }}
                            onClick={() => { cancelSendingRef.current = true; }}
                          >
                            🛑 Parar Disparos
                          </button>
                        ) : (
                          <button
                            className="btn btn-accent"
                            style={{ padding: '7px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={handleSendBirthdayWaCampaign}
                          >
                            <Send size={13} /> 🚀 Disparar para todos
                          </button>
                        )}
                      </div>
                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {bClients.map(c => {
                          const bParts = (c.birthdate || '').split('-');
                          const bDate = bParts.length === 3 ? `${bParts[2]}/${bParts[1]}` : '—';
                          return (
                            <div key={c.phone} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--adm-rule)' }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C97B49, #6E2F18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                                {(c.name || '?')[0].toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--adm-muted)' }}>{c.phone} · Aniversário: {bDate}</div>
                              </div>
                              <a
                                href={getBirthdayWaLink(c)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-accent btn-small btn-whatsapp-direct"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', padding: '6px 12px', whiteSpace: 'nowrap', flexShrink: 0 }}
                              >
                                <Send size={11} /> WhatsApp
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Editor de mensagem */}
                <div style={{ background: 'var(--sidebar-bg)', borderRadius: '8px', padding: '16px', border: '1px solid var(--adm-rule)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>✏️ Mensagem de Aniversário</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Tag: <code style={{ background: 'rgba(176,90,46,0.1)', color: 'var(--adm-gold)', padding: '1px 5px', borderRadius: 3 }}>{'{nome}'}</code></span>
                  </div>
                  <textarea
                    rows={4}
                    value={birthdayWaMessage}
                    onChange={e => setBirthdayWaMessage(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--adm-rule)', background: 'var(--panel-bg)', color: 'var(--adm-text)', fontSize: '0.88rem', lineHeight: 1.55, resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder="Digite a mensagem de aniversário..."
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', marginTop: 6, marginBottom: 0 }}>
                    A tag <code style={{ color: 'var(--adm-gold)' }}>{'{nome}'}</code> será substituída pelo primeiro nome do cliente no disparo.
                  </p>
                </div>

                {/* Log de disparos */}
                {birthdayWaLogs.length > 0 && (
                  <div style={{ marginTop: 16, background: '#1e1e1e', color: '#00ff00', fontFamily: 'monospace', padding: 12, borderRadius: 6, fontSize: '0.8rem', maxHeight: 140, overflowY: 'auto', border: '1px solid #333' }}>
                    {birthdayWaLogs.map((log, i) => <div key={i} style={{ marginBottom: 2 }}>{log}</div>)}
                  </div>
                )}
              </div>

              {/* Campanha de Lançamento (Novo Sistema) */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--adm-rule)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0 }}>🚀 Campanha de Lançamento — Novo Sistema de Agendamento</h4>
                  <button
                    className={`btn-toggle ${settings?.automations?.launchCampaignEnabled !== false ? 'active' : ''}`}
                    onClick={() => toggleAutomation('launchCampaignEnabled', settings?.automations?.launchCampaignEnabled === false)}
                  >
                    {settings?.automations?.launchCampaignEnabled !== false ? 'ON' : 'OFF'}
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', marginTop: 0, marginBottom: '20px' }}>
                  Campanha para a lista fria (leads sem histórico de visita no Studio). Envia uma sequência de 3 e-mails para atrair os primeiros agendamentos pelo site.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  {[
                    { key: 'launchE1', label: 'E-mail 1 (D+0)', desc: 'Anúncio do Novo Sistema' },
                    { key: 'launchE2', label: 'E-mail 2 (D+5)', desc: 'Construção de Valor (Método)' },
                    { key: 'launchE3', label: 'E-mail 3 (D+10)', desc: 'Exclusividade & Urgência' }
                  ].map(step => (
                    <div key={step.key} style={{ padding: '12px', border: '1px solid var(--adm-rule)', borderRadius: '6px', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{step.label}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginBottom: '12px' }}>{step.desc}</span>
                      <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                        <button 
                          className="btn btn-outline btn-small"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.7rem', padding: '4px' }}
                          onClick={() => {
                            setEditingTemplateKey(step.key);
                            setEditingTemplateContent(settings?.email_templates?.[step.key] || EMAIL_PREVIEWS[step.key]);
                            setShowEmailEditModal(true);
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className="btn btn-outline btn-small"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.7rem', padding: '4px' }}
                          onClick={() => {
                            setEmailPreviewContent(settings?.email_templates?.[step.key] || EMAIL_PREVIEWS[step.key]);
                            setShowEmailPreviewModal(true);
                          }}
                        >
                          <Eye size={12} /> Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--sidebar-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--adm-rule)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h5 style={{ margin: '0 0 4px 0' }}>Disparar Sequência Manualmente</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                        Alvos: {
                          clients.filter(c => {
                            if (!c.email || c.email === 'Não informado' || !c.email.includes('@')) return false;
                            const phone = c.phone || '';
                            const alreadySent = Array.isArray(automationLogs) && automationLogs.some(log => log.clientPhone === phone && log.stage === 'launch_e1');
                            return !alreadySent;
                          }).length
                        } contatos pendentes.
                      </p>
                      {isSendingEmail && emailProgressTotal > 0 && (
                        <div style={{ marginTop: '8px', minWidth: '200px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--adm-gold)' }}>
                            Progresso: {emailProgressCount} de {emailProgressTotal} enviados ({Math.round((emailProgressCount / emailProgressTotal) * 100)}%)
                          </span>
                          <div style={{ width: '100%', height: '4px', background: 'var(--adm-rule)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(emailProgressCount / emailProgressTotal) * 100}%`, height: '100%', background: 'var(--adm-gold)', transition: 'width 0.3s ease' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                    {isSendingEmail ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => { cancelSendingRef.current = true; }}
                        style={{ padding: '10px 20px', fontSize: '0.85rem', background: 'var(--adm-danger)', color: '#fff' }}
                      >
                        🛑 Parar Disparos
                      </button>
                    ) : (
                      <button
                        className="btn btn-accent"
                        onClick={async () => {
                          const targets = clients.filter(c => {
                             if (!c.email || c.email === 'Não informado' || !c.email.includes('@')) return false;
                             const phone = c.phone || '';
                             const alreadySent = Array.isArray(automationLogs) && automationLogs.some(log => log.clientPhone === phone && log.stage === 'launch_e1');
                             return !alreadySent;
                           });
                          const total = targets.length;
                          if (total === 0) {
                            alert('Nenhum alvo válido encontrado.');
                            return;
                          }

                          const BATCH_SIZE = 10;
                          const BATCH_DELAY = 2000;
                          const INDIVIDUAL_DELAY = 150;
                          
                          const estTimeMinutes = Math.ceil(((total * INDIVIDUAL_DELAY) + (Math.floor(total / BATCH_SIZE) * BATCH_DELAY)) / 60000);

                          if (!confirm(`Deseja iniciar a campanha de lançamento REAL para ${total} contatos via Resend?\n\nConfiguração de Proteção (Resend):\n- Intervalo: ${INDIVIDUAL_DELAY}ms\n- Lote: ${BATCH_SIZE} e-mails\n- Pausa lote: ${BATCH_DELAY/1000}s\n- Tempo total: ~${estTimeMinutes} min.`)) return;
                          
                          setEmailProgressTotal(total);
                          setEmailProgressCount(0);
                          setIsSendingEmail(true);
                          cancelSendingRef.current = false;
                          const logTime = () => new Date().toLocaleTimeString('pt-BR');
                          setEmailLogs([
                            `[${logTime()}] 🚀 Iniciando Campanha de Lançamento REAL via Resend (E-mail 1)`,
                            `[${logTime()}] Alvos válidos: ${total} | Tempo estimado: ~${estTimeMinutes} min`
                          ]);

                          const tpl = settings?.email_templates?.launchE1 || EMAIL_PREVIEWS.launchE1;
                          let count = 0;

                          for (const client of targets) {
                            if (cancelSendingRef.current) {
                              setEmailLogs(prev => [...prev, `[${logTime()}] 🛑 Disparo cancelado pelo usuário.`]);
                              break;
                            }
                            try {
                              const firstName = (client.name || 'Cliente').split(' ')[0];
                              const subject = (tpl.subject || 'Agendamento online no Studio do Jon. Acabou de mudar.').replace(/{nome}/g, firstName);
                              
                              // Replace dynamic tags in template body
                              let content = (tpl.body || '').replace(/{nome}/g, firstName);
                              
                              const response = await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  type: 'launch_campaign',
                                  subject: subject,
                                  htmlBody: content,
                                  clientEmail: client.email,
                                  clientName: client.name
                                })
                              });

                              if (response.ok) {
                                setEmailLogs(prev => [...prev, `[${logTime()}] ✅ E-mail 1 enviado para ${client.name} (${client.email})`]);
                                await saveLog(client.name, client.phone, 'launch_e1', 'email');
                              } else {
                                setEmailLogs(prev => [...prev, `[${logTime()}] ❌ Erro ao enviar para ${client.name}: Status ${response.status}`]);
                              }
                            } catch (err) {
                              setEmailLogs(prev => [...prev, `[${logTime()}] ❌ Erro de rede para ${client.name}: ${err.message}`]);
                            }

                            count++;
                            setEmailProgressCount(count);
                            if (count < total) {
                              if (count % BATCH_SIZE === 0) {
                                setEmailLogs(prev => [...prev, `[${logTime()}] ⏳ Pausa de segurança de ${BATCH_DELAY/1000}s...`]);
                                const delaySteps = BATCH_DELAY / 1000;
                                for (let s = 0; s < delaySteps; s++) {
                                  if (cancelSendingRef.current) break;
                                  await new Promise(r => setTimeout(r, 1000));
                                }
                              } else {
                                await new Promise(r => setTimeout(r, INDIVIDUAL_DELAY));
                              }
                            }
                          }

                          if (!cancelSendingRef.current) {
                            setEmailLogs(prev => [...prev, `[${logTime()}] 🏁 Campanha de lançamento concluída com sucesso!`]);
                          }
                          setIsSendingEmail(false);
                        }}
                        style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                      >
                        🚀 Disparar Sequência
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* E-mails do Sistema e Notificações */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--adm-rule)', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0' }}>E-mails do Sistema e Notificações</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', marginBottom: '20px', marginTop: 0 }}>
                  Edite o HTML das automações automáticas do sistema e acompanhe o histórico de notificações de agendamentos.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {[
                    { key: 'solicitacao_recebida', label: 'Pedido em Espera', desc: 'Disparado quando um cliente solicita agendamento (aguardando aprovação).', toggleKey: 'waitingRequestEmailEnabled' },
                    { key: 'horario_confirmado', label: 'Confirmação de Horário', desc: 'Disparado quando o agendamento é confirmado pelo administrador.', toggleKey: 'bookingConfirmationEmailEnabled' },
                    { key: 'lembrete_24h', label: 'Lembrete de Agendamento (24h)', desc: 'Disparado automaticamente 24 horas antes do horário marcado.', toggleKey: 'reminder24hEmailEnabled' },
                    { key: 'reativacao_5_meses', label: 'Reativação (150+ dias)', desc: 'Enviado para clientes inativos há mais de 5 meses sem novas reservas.', toggleKey: 'seqD150' },
                    { key: 'admin_solicitacao_recebida', label: 'Pedido em Espera (Admin)', desc: 'Enviado para você (Administrador) quando há uma nova solicitação.', toggleKey: 'adminWaitingRequestEmailEnabled' },
                    { key: 'admin_horario_confirmado', label: 'Confirmação de Horário (Admin)', desc: 'Enviado para você (Administrador) quando um agendamento é confirmado.', toggleKey: 'adminBookingConfirmationEmailEnabled' }
                  ].map(item => (
                    <div key={item.key} style={{ padding: '16px', border: '1px solid var(--adm-rule)', borderRadius: '8px', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.label}</span>
                          <button 
                            className={`btn-toggle ${settings?.automations?.[item.toggleKey] !== false ? 'active' : ''}`}
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            onClick={() => toggleAutomation(item.toggleKey, settings?.automations?.[item.toggleKey] === false)}
                          >
                            {settings?.automations?.[item.toggleKey] !== false ? 'ON' : 'OFF'}
                          </button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>{item.desc}</p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        <button 
                          className="btn btn-outline btn-small"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.75rem', padding: '6px' }}
                          onClick={() => {
                            setEditingCustomKey(item.key);
                            setEditingCustomHtml(settings?.custom_automations?.[item.key] || '');
                            setShowCustomHtmlModal(true);
                          }}
                        >
                          ⚙️ Configurar HTML
                        </button>
                        <button 
                          className="btn btn-outline btn-small"
                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '0.75rem', padding: '6px' }}
                          onClick={() => {
                            const customHtml = settings?.custom_automations?.[item.key];
                            const fallback = ADMIN_HTML_TEMPLATES[item.key];
                            if (customHtml || fallback) {
                              setEmailPreviewContent({ subject: item.label, body: customHtml || fallback });
                              setShowEmailPreviewModal(true);
                            } else {
                              setCustomPreviewHtml('<h3>Nenhum template HTML enviado ainda para esta automação.</h3>');
                              setShowCustomPreviewModal(true);
                            }
                          }}
                        >
                          <Eye size={14} /> Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Template */}
              <div className="marketing-config-card">
                <h4>Configurar Campanha</h4>

                <div className="form-group-sleek">
                  <label>Público Alvo Segmentado</label>
                  <select value={marketingTarget} onChange={e => setMarketingTarget(e.target.value)}>
                    <option value="todos">Todos os Clientes ({clients.length})</option>
                    <option value="inativos_30">Clientes Ausentes (30 a 60 dias) ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d >= 30 && d <= 60; }).length})</option>
                    <option value="inativos_60">Clientes Adormecidos (&gt;60 dias) ({clients.filter(c => { const d = getDaysAbsent(c.lastVisit); return d > 60 && d !== Infinity; }).length})</option>
                    <option value="nunca_visitaram">Sem Agendamento no Salão ({clients.filter(c => getDaysAbsent(c.lastVisit) === Infinity).length})</option>
                    <option value="selecionados">Selecionados Acima ({selectedCampaignPhones.length})</option>
                  </select>
                </div>

                <div className="form-group-sleek">
                  <label>Canal de Disparo</label>
                  <div className="campaign-channel-toggle" style={{ display: 'flex', gap: '12px', margin: '8px 0' }}>
                    <button 
                      type="button" 
                      className={`btn ${marketingChannel === 'whatsapp' ? 'btn-accent' : 'btn-outline'}`}
                      onClick={() => setMarketingChannel('whatsapp')}
                      style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                    >
                      <Phone size={14} style={{ marginRight: 6 }} /> WhatsApp
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${marketingChannel === 'email' ? 'btn-accent' : 'btn-outline'}`}
                      onClick={() => setMarketingChannel('email')}
                      style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
                    >
                      <Mail size={14} style={{ marginRight: 6 }} /> E-mail (Automático)
                    </button>
                  </div>
                </div>

                {marketingChannel === 'whatsapp' ? (
                  <div className="form-group-sleek">
                    <label>Texto da Campanha (Suporta Tags Dinâmicas)</label>
                    <textarea 
                      rows="5"
                      value={campaignMessage}
                      onChange={e => setCampaignMessage(e.target.value)}
                      placeholder="Use as tags para personalizar..."
                    ></textarea>
                    
                    <div className="tags-legend">
                      <strong>Tags disponíveis:</strong>
                      <span className="tag-pill-ref" onClick={() => setCampaignMessage(prev => prev + ' {nome}')}>{`{nome}`}</span>
                      <span className="tag-pill-ref" onClick={() => setCampaignMessage(prev => prev + ' {ultimo_servico}')}>{`{ultimo_servico}`}</span>
                      <span className="tag-pill-ref" onClick={() => setCampaignMessage(prev => prev + ' {dias_ausente}')}>{`{dias_ausente}`}</span>
                    </div>
                  </div>
                ) : (
                  <div className="email-campaign-form">
                    <div className="form-group-sleek">
                      <label>Assunto do E-mail</label>
                      <input 
                        type="text"
                        value={emailCampaignSubject}
                        onChange={e => setEmailCampaignSubject(e.target.value)}
                        placeholder="Assunto da campanha..."
                      />
                    </div>
                    
                    <div className="form-group-sleek" style={{ marginTop: '12px' }}>
                      <label>Corpo do E-mail (HTML permitido)</label>
                      <textarea 
                        rows="6"
                        value={emailCampaignBody}
                        onChange={e => setEmailCampaignBody(e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                      ></textarea>
                      
                      <div className="tags-legend">
                        <strong>Tags disponíveis:</strong>
                        <span className="tag-pill-ref" onClick={() => setEmailCampaignBody(prev => prev + ' {nome}')}>{`{nome}`}</span>
                        <span className="tag-pill-ref" onClick={() => setEmailCampaignBody(prev => prev + ' {ultimo_servico}')}>{`{ultimo_servico}`}</span>
                        <span className="tag-pill-ref" onClick={() => setEmailCampaignBody(prev => prev + ' {dias_ausente}')}>{`{dias_ausente}`}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Targets */}
              <div className="marketing-targets-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0 }}>Alvos da Campanha ({marketingTargetsList.length} Clientes)</h4>
                  
                  {marketingChannel === 'email' && (
                    isSendingEmail ? (
                      <button 
                        className="btn btn-danger" 
                        onClick={() => { cancelSendingRef.current = true; }}
                        style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--adm-danger)', color: '#fff' }}
                      >
                        🛑 Parar Disparos
                      </button>
                    ) : (
                      <button 
                        className="btn btn-accent" 
                        onClick={handleSendEmailCampaign}
                        disabled={marketingTargetsList.length === 0}
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Disparar E-mails
                      </button>
                    )
                  )}

                  {marketingChannel === 'whatsapp' && (
                    isSendingWhatsapp ? (
                      <button 
                        className="btn btn-danger" 
                        onClick={() => { cancelSendingRef.current = true; }}
                        style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--adm-danger)', color: '#fff' }}
                      >
                        🛑 Parar Disparos
                      </button>
                    ) : (
                      <button 
                        className="btn btn-accent" 
                        onClick={handleSendWhatsappCampaign}
                        disabled={marketingTargetsList.length === 0}
                        style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        🚀 Disparar em Lote
                      </button>
                    )
                  )}
                </div>

                {marketingChannel === 'whatsapp' ? (
                  <p className="sub-instruction">Dispare automaticamente via API Gateway configurada ou clique em "WhatsApp" em cada linha para enviar manualmente.</p>
                ) : (
                  <p className="sub-instruction">Simule ou conecte o disparo de e-mails em massa através de nossa API integrada.</p>
                )}

                {marketingChannel === 'email' && isSendingEmail && emailProgressTotal > 0 && (
                  <div style={{ margin: '12px 0', padding: '12px', background: 'rgba(176,90,46,0.1)', border: '1px solid var(--adm-rule)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--adm-gold)' }}>
                      <span>Progresso do Disparo</span>
                      <span>{emailProgressCount} de {emailProgressTotal} enviados ({Math.round((emailProgressCount / emailProgressTotal) * 100)}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--adm-rule)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(emailProgressCount / emailProgressTotal) * 100}%`, height: '100%', background: 'var(--adm-gold)', transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>
                )}

                {marketingChannel === 'whatsapp' && whatsappLogs.length > 0 && (
                  <div className="email-sim-console" style={{ background: '#1e1e1e', color: '#00ff00', fontFamily: 'monospace', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', height: '160px', overflowY: 'auto', border: '1px solid #333', marginBottom: '16px' }}>
                    {whatsappLogs.map((log, index) => <div key={index} style={{ marginBottom: '2px' }}>{log}</div>)}
                  </div>
                )}

                {marketingChannel === 'email' && emailLogs.length > 0 && (
                  <div className="email-sim-console" style={{ background: '#1e1e1e', color: '#00ff00', fontFamily: 'monospace', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', height: '160px', overflowY: 'auto', border: '1px solid #333', marginBottom: '16px' }}>
                    {emailLogs.map((log, index) => <div key={index} style={{ marginBottom: '2px' }}>{log}</div>)}
                  </div>
                )}

                <div className="targets-scroll-list" style={{ maxHeight: '350px' }}>
                  {marketingTargetsList.length === 0 ? (
                    <p className="no-data-msg">Nenhum cliente no segmento escolhido.</p>
                  ) : (
                    marketingTargetsList.map(c => (
                      <div key={c.phone} className="marketing-target-row">
                        <div className="target-client-info">
                          <h5>{c.name}</h5>
                          <span>WhatsApp: {c.phone} | Ausente há: {getDaysAbsent(c.lastVisit) === Infinity ? 'Sem Visitas' : `${getDaysAbsent(c.lastVisit)} dias`}</span>
                        </div>
                        
                        {marketingChannel === 'whatsapp' ? (
                          <a 
                            href={getCampaignMessageLink(c)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-accent btn-small btn-whatsapp-direct"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Send size={12} /> WhatsApp
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                            {c.email && c.email !== 'Não informado' ? c.email : 'Sem E-mail'}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Google Business Profile Automação */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--adm-rule)', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={20} style={{ color: 'var(--adm-gold)' }} />
                    <h4 style={{ margin: 0 }}>📈 Google Business Profile (Automação de SEO Local)</h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: gbpConnected ? '#38a169' : '#e53e3e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: gbpConnected ? '#38a169' : '#e53e3e', display: 'inline-block' }}></span>
                      {gbpConnected ? 'API Conectada' : 'API não conectada (modo demo)'}
                    </span>
                    {gbpConnected ? (
                      <button 
                        className="btn btn-outline btn-small" 
                        onClick={async () => {
                          if (window.confirm('Tem certeza que deseja desconectar a conta do Google?')) {
                            await updateDoc(doc(db, 'settings', 'studio'), {
                              'automations.googleGbpConnected': false,
                              'automations.googleGbpAccessToken': null,
                              'automations.googleGbpRefreshToken': null,
                              'automations.googleGbpAccountId': null,
                              'automations.googleGbpLocationId': null,
                              'automations.googleGbpLocationName': null
                            });
                          }
                        }}
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      >
                        Desconectar
                      </button>
                    ) : (
                      <a 
                        href="/api/gbp?action=auth"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = '/api/gbp?action=auth';
                        }}
                        className="btn btn-outline btn-small" 
                        style={{ fontSize: '0.75rem', padding: '4px 10px', textDecoration: 'none' }}
                      >
                        Conectar Google
                      </a>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', marginTop: 0, marginBottom: gbpConnected ? '20px' : '12px' }}>
                  Automatize as respostas aos seus clientes no Google Maps e agende postagens semanais com imagens e palavras-chave de SEO local para subir no ranking de buscas em BH.
                </p>

                {!gbpConnected && (
                  <div style={{ padding: '12px 16px', background: 'rgba(213,100,20,0.08)', border: '1px solid rgba(213,100,20,0.25)', borderRadius: 8, marginBottom: 20, fontSize: '0.82rem' }}>
                    <strong>⚠️ Para ativar com dados reais do seu Google Meu Negócio:</strong>
                    <ol style={{ margin: '8px 0 0 0', paddingLeft: '18px', lineHeight: 1.9, color: 'var(--adm-muted)' }}>
                      <li>Crie a credencial OAuth no console do Google Cloud</li>
                      <li>Clique em <strong>"Conectar Google"</strong> acima para fazer login e autorizar o site</li>
                    </ol>
                  </div>
                )}

                {gbpConnected && (!settings?.automations?.googleGbpAccountId || settings?.automations?.googleGbpLastError === 'quota_limit_0') && (
                  <div style={{ padding: '16px', background: 'rgba(213,100,20,0.08)', border: '1px solid rgba(213,100,20,0.3)', borderRadius: 8, marginBottom: 20, fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>⚠️</span>
                      <div>
                        <strong style={{ color: '#d56414', fontSize: '0.85rem' }}>Acesso Restrito ao Google Business Profile (Quota Zero)</strong>
                        <p style={{ margin: '8px 0', color: 'var(--adm-text)', lineHeight: 1.5 }}>
                          Sua autenticação OAuth funcionou perfeitamente, mas o Google bloqueou o acesso à sua conta. Novos projetos no Google Cloud possuem um limite padrão de <strong>0 requisições por minuto</strong> para a API do Meu Negócio até que sejam aprovados.
                        </p>
                        <strong style={{ display: 'block', marginTop: '12px', marginBottom: '6px' }}>Como liberar o acesso:</strong>
                        <ol style={{ margin: '0', paddingLeft: '18px', lineHeight: 1.6, color: 'var(--adm-muted)' }}>
                          <li>Acesse o <a href="https://developers.google.com/my-business/content/prereqs#request-access" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--adm-gold)', textDecoration: 'underline' }}>Formulário de Solicitação de Acesso</a> oficial do Google.</li>
                          <li>Preencha informando o número do seu projeto: <strong>65586774085</strong>.</li>
                          <li>Explique que você está criando um painel interno de agendamentos próprio para gerenciar as avaliações e posts do seu salão "O Jon Que Cortou".</li>
                        </ol>
                        <p style={{ margin: '12px 0 0 0', color: 'var(--adm-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Enquanto o Google não aprova (leva de 2 a 5 dias), o painel continuará operando em modo de simulação, permitindo que você teste as integrações de SEO Local com IA!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {gbpConnected && settings?.automations?.googleGbpLastError === 'needs_reconnect' && (
                  <div style={{ padding: '16px', background: 'rgba(213,100,20,0.08)', border: '1px solid rgba(213,100,20,0.3)', borderRadius: 8, marginBottom: 20, fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>⚠️</span>
                      <div>
                        <strong style={{ color: '#d56414', fontSize: '0.85rem' }}>Reconexão Necessária com o Google</strong>
                        <p style={{ margin: '8px 0', color: 'var(--adm-text)', lineHeight: 1.5 }}>
                          Atualizamos as permissões necessárias para incluir a sincronização de produtos com o Google Merchant Center. Para ativar esta função, clique em <strong>"Desconectar"</strong> e depois em <strong>"Conectar Google"</strong> novamente para autorizar as novas permissões.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seletor de Assuntos Unificado */}
                <div style={{ padding: '20px', background: 'var(--sidebar-bg)', border: '1px solid var(--adm-rule)', borderRadius: '6px', marginBottom: '20px' }}>
                  <h5 style={{ margin: '0 0 10px 0', fontWeight: 700 }}>🎯 Seletor de Assuntos Unificado</h5>
                  <p style={{ margin: '0 0 15px 0', fontSize: '0.82rem', color: 'var(--adm-muted)' }}>
                    Escolha um tema técnico de cachos nas abas da Galeria ou use a busca abaixo. A IA usará esses dados e sua inteligência de busca na web para formular um post totalmente original.
                  </p>
                  
                  {/* Busca e Categoria */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--adm-muted)' }} />
                      <input 
                        type="text"
                        placeholder="Buscar assunto (ex: 'frizz', 'crespo', 'visagismo')..."
                        value={themeSearchQuery}
                        onChange={e => setThemeSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: '4px', border: '1px solid var(--adm-rule)', background: 'var(--panel-bg)', color: 'var(--adm-text)', fontSize: '0.82rem' }}
                      />
                    </div>
                    <select
                      value={selectedThemeCategory}
                      onChange={e => setSelectedThemeCategory(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--adm-rule)', background: 'var(--panel-bg)', color: 'var(--adm-text)', fontSize: '0.82rem', minWidth: '160px' }}
                    >
                      <option value="todos">Todas as Categorias</option>
                      <option value="Corte & Visagismo">Corte & Visagismo</option>
                      <option value="Saúde & Tratamento">Saúde & Tratamento</option>
                      <option value="Finalização & Cuidados">Finalização & Cuidados</option>
                      <option value="Transição Capilar">Transição Capilar</option>
                      <option value="Mitos & Verdades">Mitos & Verdades</option>
                      <option value="Crespos & Ondas">Crespos & Ondas</option>
                      <option value="Coloração & Química">Coloração & Química</option>
                      <option value="Casos Reais & Rotinas">Casos Reais & Rotinas</option>
                    </select>
                  </div>

                  {/* Grid de Cards de Temas */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                    gap: '12px', 
                    maxHeight: '260px', 
                    overflowY: 'auto', 
                    padding: '6px', 
                    border: '1px solid var(--adm-rule)', 
                    borderRadius: '4px',
                    background: 'var(--panel-bg)',
                    marginBottom: '15px'
                  }}>
                    {TRENDING_THEMES.filter(theme => {
                      const matchesCategory = selectedThemeCategory === 'todos' || theme.category === selectedThemeCategory;
                      const matchesSearch = theme.title.toLowerCase().includes(themeSearchQuery.toLowerCase()) || 
                                            theme.description.toLowerCase().includes(themeSearchQuery.toLowerCase()) ||
                                            (theme.keywords && theme.keywords.toLowerCase().includes(themeSearchQuery.toLowerCase()));
                      return matchesCategory && matchesSearch;
                    }).map(theme => {
                      const isSelected = selectedThemeId === theme.id;
                      return (
                        <div 
                          key={theme.id}
                          onClick={() => {
                            setSelectedThemeId(theme.id);
                            // Rola a tela levemente para focar nas ações do formulário se necessário
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '4px',
                            border: isSelected ? '1px solid var(--adm-gold)' : '1px solid rgba(255,255,255,0.06)',
                            background: isSelected ? 'rgba(220,163,84,0.08)' : 'var(--sidebar-bg)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '4px'
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) e.currentTarget.style.border = '1px solid rgba(220,163,84,0.4)';
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)';
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--adm-gold)', textTransform: 'uppercase' }}>
                                {theme.category}
                              </span>
                              {isSelected && <span style={{ fontSize: '0.65rem', color: 'var(--adm-gold)' }}>● Ativo</span>}
                            </div>
                            <h6 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--adm-text)' }}>{theme.title}</h6>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: 'var(--adm-muted)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {theme.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '15px' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                        Tema Ativo: <strong style={{ color: 'var(--adm-text)' }}>{(() => {
                          const activeTheme = TRENDING_THEMES.find(t => t.id === selectedThemeId);
                          return activeTheme ? `${activeTheme.category} — ${activeTheme.title}` : 'Nenhum selecionado';
                        })()}</strong>
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="btn btn-accent btn-small"
                        onClick={() => handleGenerateGbpPost()}
                        disabled={isGeneratingGbpPost}
                        style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        🤖 Gerar Post GBP
                      </button>
                      <button 
                        className="btn btn-accent btn-small"
                        onClick={() => activeNewsletter && handleRegenerateNewsletter(activeNewsletter.id)}
                        disabled={isGeneratingNewsletter}
                        style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        📧 Gerar Newsletter
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--adm-text)' }}>
                      ✍️ Instruções extras para o post / Pesquisa de novidades na Internet (Opcional):
                    </label>
                    <textarea
                      value={extraInstruction}
                      onChange={e => setExtraInstruction(e.target.value)}
                      placeholder="Ex: 'pesquise tendências de visagismo de 2026', 'foco em rotina de hidratação de inverno em BH', 'mencione cabelos descoloridos'"
                      rows={2}
                      style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid var(--adm-rule)', background: 'var(--panel-bg)', color: 'var(--adm-text)', fontSize: '0.82rem', fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                  {selectedThemeId && (() => {
                    const th = TRENDING_THEMES.find(t => t.id === selectedThemeId);
                    return th ? (
                      <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--adm-muted)', borderTop: '1px dashed var(--adm-rule)', paddingTop: '10px' }}>
                        <strong>Descrição Técnica:</strong> {th.description}
                      </div>
                    ) : null;
                  })()}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  
                  {/* Coluna 1: Comentários e Avaliações */}
                  <div style={{ padding: '16px', background: 'var(--sidebar-bg)', border: '1px solid var(--adm-rule)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h5 style={{ margin: 0, fontWeight: 700 }}>💬 Responder Avaliações c/ IA</h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Auto-Responder</span>
                        <button 
                          className={`btn-toggle ${settings?.automations?.google_reviews_enabled !== false ? 'active' : ''}`}
                          style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                          onClick={() => toggleAutomation('google_reviews_enabled', settings?.automations?.google_reviews_enabled === false)}
                        >
                          {settings?.automations?.google_reviews_enabled !== false ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <button className="btn btn-outline btn-small" style={{ fontSize: '0.75rem', flex: 1 }} onClick={handleSimulateNewReview}>
                        🔄 Simular Nova Avaliação
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '350px', overflowY: 'auto', paddingRight: 4 }}>
                      {googleReviews.map(rev => (
                        <div key={rev.id} style={{ padding: 12, background: 'var(--panel-bg)', borderRadius: 6, border: '1px solid var(--adm-rule)', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong>{rev.author}</strong>
                            <span style={{ color: 'var(--adm-muted)', fontSize: '0.75rem' }}>{rev.date}</span>
                          </div>
                          <div style={{ color: '#ecc94b', marginBottom: 6 }}>{'★'.repeat(rev.rating)}</div>
                          <p style={{ margin: '0 0 10px 0', color: 'var(--adm-text)', fontStyle: 'italic' }}>"{rev.comment}"</p>
                          
                          {rev.reply ? (
                            <div style={{ padding: 8, background: 'rgba(176,90,46,0.06)', borderLeft: '3px solid var(--adm-gold)', borderRadius: 4, marginTop: 8 }}>
                              <strong>✅ Resposta publicada:</strong>
                              <p style={{ margin: '4px 0 0 0', color: 'var(--adm-muted)' }}>{rev.reply}</p>
                            </div>
                          ) : rev.pendingReply ? (
                            <div style={{ padding: 10, background: 'rgba(220,163,84,0.08)', borderLeft: '3px solid #DCA354', borderRadius: 4, marginTop: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <strong style={{ fontSize: '0.78rem' }}>✍️ Rascunho gerado:</strong>
                                <span style={{ fontSize: '0.65rem', color: '#DCA354', fontWeight: 600, background: 'rgba(220,163,84,0.15)', padding: '2px 8px', borderRadius: 12 }}>Aguardando aprovação</span>
                              </div>
                              <p style={{ margin: '0 0 10px 0', color: 'var(--adm-text)', fontSize: '0.8rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{rev.pendingReply}</p>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button 
                                  className="btn btn-accent btn-small" 
                                  style={{ flex: 1, fontSize: '0.75rem', padding: '6px 12px' }}
                                  onClick={() => handleApproveReply(rev.id)}
                                >
                                  ✅ Aprovar e Publicar
                                </button>
                                <button 
                                  className="btn btn-outline btn-small" 
                                  style={{ flex: 1, fontSize: '0.75rem', padding: '6px 12px' }}
                                  onClick={() => handleRegenerateReply(rev.id)}
                                >
                                  🔄 Gerar Outra
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-accent btn-small" 
                              style={{ width: '100%', fontSize: '0.75rem', padding: '4px' }}
                              onClick={() => handleManualGbpReply(rev.id)}
                            >
                              ✍️ Gerar Resposta com IA
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coluna 2: Postagens com Imagens */}
                  <div style={{ padding: '16px', background: 'var(--sidebar-bg)', border: '1px solid var(--adm-rule)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h5 style={{ margin: 0, fontWeight: 700 }}>✍️ Posts Semanais c/ Imagens</h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>Auto-Post</span>
                        <button 
                          className={`btn-toggle ${settings?.automations?.google_posting_enabled !== false ? 'active' : ''}`}
                          style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                          onClick={() => toggleAutomation('google_posting_enabled', settings?.automations?.google_posting_enabled === false)}
                        >
                          {settings?.automations?.google_posting_enabled !== false ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    {/* Frequência de postagem */}
                    <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--adm-rule)', borderRadius: 6, padding: 12, marginBottom: 14 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: 10 }}>📅 Frequência de Publicação Automática</span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 220 }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', fontWeight: 600 }}>Dias da semana para postar</label>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'].map(day => {
                              const label = { 'domingo': 'Dom', 'segunda': 'Seg', 'terca': 'Ter', 'quarta': 'Qua', 'quinta': 'Qui', 'sexta': 'Sex', 'sabado': 'Sáb' }[day];
                              const isSelected = selectedPostingDays.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => handleTogglePostingDay(day)}
                                  className={`btn ${isSelected ? 'btn-accent' : 'btn-outline'} btn-small`}
                                  style={{ padding: '3px 6px', fontSize: '0.7rem', textTransform: 'capitalize', minWidth: '34px' }}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 85 }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', fontWeight: 600 }}>Horário</label>
                          <input
                            type="time"
                            value={postFreqTime}
                            onChange={e => handleSaveFreqTime(e.target.value)}
                            style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid var(--adm-rule)', background: 'var(--sidebar-bg)', color: 'var(--adm-text)', fontSize: '0.82rem' }}
                          />
                        </div>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--adm-muted)', margin: '8px 0 0 0' }}>
                        📡 Os posts serão gerados e publicados automaticamente nos dias e horários selecionados.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <button 
                        className="btn btn-accent" 
                        style={{ flex: 1, fontSize: '0.8rem', padding: '8px 12px' }}
                        onClick={handleGenerateGbpPost}
                        disabled={isGeneratingGbpPost}
                      >
                        {isGeneratingGbpPost ? 'Gerando...' : '🤖 Gerar Post de SEO Local'}
                      </button>
                    </div>

                    {generatedGbpPost && (
                      <div style={{ padding: 12, background: 'var(--panel-bg)', borderRadius: 6, border: '1px solid var(--adm-rule)', marginBottom: 16 }}>
                        <h6 style={{ margin: '0 0 8px 0', fontWeight: 600 }}>Post Sugerido pela IA:</h6>
                        <p style={{ fontSize: '0.8rem', whiteSpace: 'pre-line', margin: '0 0 12px 0', background: 'var(--sidebar-bg)', padding: 8, borderRadius: 4 }}>
                          {generatedGbpPost.text}
                        </p>
                        {generatedGbpPost.image && (
                          <div style={{ position: 'relative', marginBottom: 12 }}>
                            <img src={generatedGbpPost.image} alt="Preview" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 4 }} />
                            <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4 }}>Imagem de Cachos</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              className="btn btn-accent btn-small" 
                              style={{ flex: 1, fontSize: '0.75rem' }} 
                              onClick={handlePublishGbpPostImmediately}
                              disabled={isPublishingGbpNow}
                            >
                              {isPublishingGbpNow ? 'Publicando...' : '🚀 Publicar Agora'}
                            </button>
                            <button 
                              className="btn btn-primary btn-small" 
                              style={{ flex: 1, fontSize: '0.75rem', background: 'var(--adm-rule)', color: 'var(--adm-text)', border: 'none' }} 
                              onClick={handleScheduleGbpPost}
                            >
                              📅 Programar na Fila
                            </button>
                          </div>
                          <button className="btn btn-outline btn-small" style={{ fontSize: '0.75rem', width: '100%' }} onClick={() => setGeneratedGbpPost(null)}>
                            Descartar
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 8px 0' }}>
                      <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem' }}>📋 Histórico de Posts ({scheduledGbpPosts.length})</h6>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, background: 'rgba(247,170,0,0.15)', color: '#d69e00', fontWeight: 600 }}>
                          {scheduledGbpPosts.filter(p => p.status === 'scheduled').length} programado(s)
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 12, background: 'rgba(56,161,105,0.15)', color: '#38a169', fontWeight: 600 }}>
                          {scheduledGbpPosts.filter(p => p.status === 'published').length} publicado(s)
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                      {scheduledGbpPosts.map(post => (
                        <div key={post.id} style={{ padding: 10, background: 'var(--panel-bg)', borderRadius: 6, border: `1px solid ${post.status === 'scheduled' ? 'rgba(247,170,0,0.3)' : 'var(--adm-rule)'}`, display: 'flex', gap: 10, fontSize: '0.78rem' }}>
                          <img src={post.image} alt="Thumbnail" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 4px 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontWeight: 600, lineHeight: 1.35 }}>{post.text}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ 
                                fontSize: '0.65rem', padding: '1px 6px', borderRadius: 10, fontWeight: 700,
                                background: post.status === 'scheduled' ? 'rgba(247,170,0,0.15)' : 'rgba(56,161,105,0.15)',
                                color: post.status === 'scheduled' ? '#d69e00' : '#38a169'
                              }}>
                                {post.status === 'scheduled' ? '🕒 Programado' : '✅ Publicado'}
                              </span>
                              <span style={{ color: 'var(--adm-muted)', fontSize: '0.7rem' }}>{post.scheduledDate}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignSelf: 'center', flexShrink: 0 }}>
                            {post.status === 'scheduled' && (
                              <button 
                                className="btn btn-accent btn-small" 
                                style={{ fontSize: '0.65rem', padding: '3px 6px', whiteSpace: 'nowrap' }}
                                onClick={() => handlePublishGbpPostNow(post)}
                                disabled={isPublishingGbpId === post.id}
                              >
                                {isPublishingGbpId === post.id ? 'Publicando...' : 'Publicar'}
                              </button>
                            )}
                            <button 
                              className="btn btn-outline btn-small" 
                              style={{ fontSize: '0.65rem', padding: '3px 6px', color: '#e53e3e', borderColor: '#e53e3e' }}
                              onClick={() => handleDeleteGbpPost(post.id)}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>



              {/* ───────── NEWSLETTER LEITURA DE FIO ───────── */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '24px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--adm-rule)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Newspaper size={18} style={{ color: 'var(--adm-gold)' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>Newsletter · Leitura de Fio</h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--adm-muted)' }}>Gerada automaticamente · contato@ojonquecortou.com.br → todas as clientes</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {newsletters.map(nl => (
                      <button
                        key={nl.id}
                        onClick={() => setActiveNewsletterId(nl.id)}
                        className={`btn ${activeNewsletterId === nl.id ? 'btn-accent' : 'btn-outline'} btn-small`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {nl.month}
                      </button>
                    ))}
                    <button
                      onClick={handleFetchBounces}
                      className="btn btn-outline btn-small"
                      style={{ fontSize: '0.75rem', borderColor: 'rgba(229,62,62,0.6)', color: 'var(--adm-danger)', display: 'flex', alignItems: 'center', gap: 6 }}
                      disabled={isLoadingBounces}
                    >
                      <RefreshCw size={12} style={{ animation: isLoadingBounces ? 'spin 1.5s linear infinite' : 'none' }} /> {isLoadingBounces ? 'Carregando...' : 'Verificar Bounces'}
                    </button>
                  </div>
                </div>

                {activeNewsletter && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
                    {/* LEFT: info + actions */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Assunto</div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--adm-text)' }}>{activeNewsletter.subject}</div>
                        </div>
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '0.7rem', padding: '3px 10px', borderRadius: 12, fontWeight: 700,
                          background: activeNewsletter.status === 'sent' ? 'rgba(56,161,105,0.15)' : activeNewsletter.status === 'approved' ? 'rgba(99,102,241,0.15)' : 'rgba(247,170,0,0.15)',
                          color: activeNewsletter.status === 'sent' ? 'var(--adm-success)' : activeNewsletter.status === 'approved' ? '#6366f1' : '#d69e00'
                        }}>
                          {activeNewsletter.status === 'sent' ? `✅ Enviada (${activeNewsletter.sentCount} clientes)` : activeNewsletter.status === 'approved' ? '🟣 Aprovada — pronta para envio' : '🟡 Rascunho — aguardando aprovação'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                        <button
                          className="btn btn-outline btn-small"
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={() => setShowNewsletterPreview(true)}
                        >
                          <Eye size={13} /> Visualizar newsletter
                        </button>

                        {activeNewsletter.status === 'draft' && (
                          <button
                            className="btn btn-accent btn-small"
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => handleApproveNewsletter(activeNewsletter.id)}
                          >
                            <CheckSquare size={13} /> Aprovar newsletter
                          </button>
                        )}

                        {(activeNewsletter.status === 'draft' || activeNewsletter.status === 'approved') && (
                          <button
                            className="btn btn-outline btn-small"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--adm-danger)', color: 'var(--adm-danger)', background: 'transparent' }}
                            onClick={() => handleRegenerateNewsletter(activeNewsletter.id)}
                            disabled={isGeneratingNewsletter}
                          >
                            <RefreshCw size={13} style={{ animation: isGeneratingNewsletter ? 'spin 1.5s linear infinite' : 'none' }} /> {isGeneratingNewsletter ? 'Gerando...' : 'Desaprovar e Gerar Outra'}
                          </button>
                        )}

                        {activeNewsletter.status !== 'sent' && (
                          <button
                            className="btn btn-accent btn-small"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: activeNewsletter.status === 'approved' ? '#6E2F18' : undefined, borderColor: activeNewsletter.status === 'approved' ? '#6E2F18' : undefined }}
                            onClick={handleSendNewsletterToAll}
                            disabled={isSendingNewsletter || activeNewsletter.status !== 'approved'}
                          >
                            <Send size={13} /> {isSendingNewsletter ? 'Enviando...' : 'Enviar para todas as clientes'}
                          </button>
                        )}
                      </div>

                      {/* Test email */}
                      {activeNewsletter.status !== 'sent' && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, maxWidth: 480 }}>
                          <input
                            type="email"
                            placeholder="seu@email.com (enviar teste)"
                            value={testEmailAddress}
                            onChange={e => setTestEmailAddress(e.target.value)}
                            style={{ flex: 1, padding: '7px 12px', borderRadius: 4, border: '1px solid var(--adm-rule)', fontSize: '0.85rem', background: 'var(--input-bg)', color: 'var(--adm-text)' }}
                          />
                          <button
                            className="btn btn-outline btn-small"
                            style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}
                            onClick={handleSendNewsletterTest}
                            disabled={isSendingNewsletter}
                          >
                            <Send size={12} /> Enviar teste
                          </button>
                        </div>
                      )}

                      {/* Send log */}
                      {newsletterSendLog.length > 0 && (
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: '#0d1117', color: '#e8f8e8', borderRadius: 6, padding: '10px 14px', maxHeight: 140, overflowY: 'auto', lineHeight: 1.7 }}>
                          {newsletterSendLog.map((line, i) => <div key={i}>{line}</div>)}
                        </div>
                      )}

                      {activeNewsletter.sentAt && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--adm-muted)', marginTop: 10 }}>
                          Enviada em {new Date(activeNewsletter.sentAt).toLocaleString('pt-BR')} · {activeNewsletter.sentCount} destinatária(s)
                        </p>
                      )}
                    </div>

                    {/* RIGHT: mini preview */}
                    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--adm-rule)', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', height: 420 }}>
                      <div style={{ background: 'var(--sidebar-bg)', padding: '8px 14px', fontSize: '0.72rem', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }}></span>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }}></span>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840', display: 'inline-block' }}></span>
                        <span style={{ marginLeft: 8 }}>newsletter_{activeNewsletter.id}.html</span>
                      </div>
                      <iframe
                        srcDoc={`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Preview</title></head><body style="margin:0;padding:0;background:#EFE5D2;">${activeNewsletter.htmlBody}</body></html>`}
                        style={{ width: '200%', height: '840px', border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left', display: 'block' }}
                        title="Newsletter Preview"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW NEWSLETTER FULL */}
      {showNewsletterPreview && activeNewsletter && (
        <div className="modal-overlay" onClick={() => setShowNewsletterPreview(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--adm-rule)' }}>
              <div style={{ color: 'var(--adm-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Newsletter · {activeNewsletter.month}
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>{activeNewsletter.subject}</div>
            </div>
            <div style={{ backgroundColor: '#EFE5D2', width: '100%', height: '600px' }}>
              <iframe
                srcDoc={`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Preview</title></head><body style="margin:0;padding:0;background:#EFE5D2;">${activeNewsletter.htmlBody}</body></html>`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Newsletter Full Preview"
              />
            </div>
            <div className="modal-actions" style={{ padding: '20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowNewsletterPreview(false)}>Fechar</button>
              {activeNewsletter.status === 'draft' && (
                <button type="button" className="btn btn-accent" onClick={() => { handleApproveNewsletter(activeNewsletter.id); setShowNewsletterPreview(false); }}>
                  <CheckSquare size={14} style={{ marginRight: 6 }} /> Aprovar e fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BOUNCE LIST */}
      {showBounceList && (
        <div className="modal-overlay" onClick={() => setShowBounceList(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '80vh', overflowY: 'auto', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontFamily: "'DM Serif Display', Georgia, serif" }}>Lista de Bounces (Emails Rejeitados)</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--adm-muted)' }}>
              Essas clientes tiveram e-mails marcados como inválidos ou inexistentes pelo servidor Mailgun. Recomendamos corrigir os cadastros no Firestore ou desativar o envio de newsletter para elas.
            </p>

            {bouncesData.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px 0', color: 'var(--adm-muted)' }}>Nenhum e-mail rejeitado (bounce) encontrado no Mailgun! 🎉</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--adm-rule)', color: 'var(--adm-muted)' }}>
                      <th style={{ padding: '10px 8px' }}>Cliente</th>
                      <th style={{ padding: '10px 8px' }}>E-mail</th>
                      <th style={{ padding: '10px 8px' }}>Telefone (ID)</th>
                      <th style={{ padding: '10px 8px' }}>Status News</th>
                      <th style={{ padding: '10px 8px' }}>Motivo do Erro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bouncesData.map((b, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--adm-rule)' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600 }}>{b.name}</td>
                        <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>{b.email}</td>
                        <td style={{ padding: '10px 8px', color: 'var(--adm-muted)' }}>{b.phone || 'N/A'}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{
                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10,
                            background: b.newsletterStatus === 'Ativo' ? 'rgba(56,161,105,0.15)' : 'rgba(229,62,62,0.15)',
                            color: b.newsletterStatus === 'Ativo' ? 'var(--adm-success)' : 'var(--adm-danger)'
                          }}>
                            {b.newsletterStatus}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', color: 'var(--adm-danger)', fontSize: '0.78rem' }}>{b.error || 'Desconhecido'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-outline" onClick={() => setShowBounceList(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {showEmailEditModal && (
        <div className="modal-overlay" onClick={() => setShowEmailEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
            <h3>Editar E-mail da Régua</h3>
            <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem' }}>As tags dinâmicas como <b>{'{'}nome{'}'}</b> serão substituídas no disparo.</p>
            
            <div className="form-group-sleek">
              <label>Assunto</label>
              <input 
                type="text" 
                value={editingTemplateContent.subject} 
                onChange={e => setEditingTemplateContent({...editingTemplateContent, subject: e.target.value})} 
              />
            </div>
            <div className="form-group-sleek" style={{ marginTop: '12px' }}>
              <label>Corpo do E-mail (HTML permitido)</label>
              <textarea 
                rows="10" 
                value={editingTemplateContent.body} 
                onChange={e => setEditingTemplateContent({...editingTemplateContent, body: e.target.value})} 
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              ></textarea>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowEmailEditModal(false)}>Cancelar</button>
              <button type="button" className="btn btn-accent" onClick={handleSaveTemplate}>Salvar E-mail</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR AUTOMACAO HTML */}
      {showCustomHtmlModal && (
        <div className="modal-overlay" onClick={() => setShowCustomHtmlModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%' }}>
            <h3>Configurar HTML para Automação</h3>
            <p style={{ color: 'var(--adm-muted)', fontSize: '0.85rem' }}>Suba um arquivo HTML ou cole o código fonte abaixo. Use a tag <b>{'{nome}'}</b> para exibir o nome da cliente.</p>
            
            <div style={{ marginBottom: 16 }}>
              <input 
                type="file" 
                accept=".html" 
                id="custom-html-file-upload" 
                style={{ display: 'none' }} 
                onChange={handleCustomFileUpload} 
              />
              <label htmlFor="custom-html-file-upload" className="btn btn-outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                📁 Escolher arquivo HTML
              </label>
            </div>

            <div className="form-group-sleek">
              <label>Código Fonte HTML</label>
              <textarea 
                rows="15" 
                value={editingCustomHtml} 
                onChange={e => setEditingCustomHtml(e.target.value)} 
                style={{ fontFamily: 'monospace', fontSize: '0.82rem', width: '100%', background: '#1e1e1e', color: '#f8f8f2', border: '1px solid #333', borderRadius: 4, padding: 8 }}
                placeholder="<!-- Cole seu HTML aqui -->"
              ></textarea>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCustomHtmlModal(false)}>Cancelar</button>
              <button type="button" className="btn btn-accent" onClick={handleSaveCustomHtml}>Salvar HTML</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW AUTOMACAO HTML */}
      {showCustomPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowCustomPreviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--adm-rule)' }}>
              <div style={{ color: 'var(--adm-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Visualização do Template HTML
              </div>
              <strong style={{ color: '#fff' }}>Preview</strong>
            </div>
            
            <div style={{ backgroundColor: '#f0eee9', width: '100%', height: '550px' }}>
              <iframe 
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <title>Preview</title>
                  </head>
                  <body style="margin: 0; padding: 0;">
                    ${customPreviewHtml.replace(/{nome}/g, 'Cliente Exemplo')}
                  </body>
                  </html>
                `}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Custom HTML Preview"
              />
            </div>
            
            <div className="modal-actions" style={{ padding: '16px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowCustomPreviewModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de E-mail do Admin */}
      {showAdminNotifModal && selectedAdminNotif && (
        <div className="modal-overlay" onClick={() => setShowAdminNotifModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '95%', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '80vh' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--adm-rule)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--adm-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    E-mail Enviado ao Administrador
                  </div>
                  <strong style={{ color: '#fff' }}>{selectedAdminNotif.subject}</strong>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowAdminNotifModal(false)}>✕</button>
              </div>
            </div>
            
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--adm-rule)', background: 'var(--sidebar-bg)', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '4px' }}><strong>Destinatário:</strong> Notificação do Salão</div>
              <div style={{ marginBottom: '4px' }}><strong>Data de Envio:</strong> {new Date(selectedAdminNotif.timestamp).toLocaleString('pt-BR')}</div>
              <div><strong>Cliente Relacionado:</strong> {selectedAdminNotif.clientName}</div>
            </div>
            
            <div style={{ backgroundColor: 'var(--adm-surface)', width: '100%', flex: 1, overflow: 'hidden' }}>
              <iframe 
                srcDoc={selectedAdminNotif.htmlBody || '<h3>Nenhum conteúdo no e-mail.</h3>'}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Admin Notification E-mail"
              />
            </div>
            
            <div className="modal-actions" style={{ padding: '16px', borderTop: '1px solid var(--adm-rule)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdminNotifModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW DE EMAIL */}
      {showEmailPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowEmailPreviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--adm-rule)' }}>
              <div style={{ color: 'var(--adm-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Preview de E-mail
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff' }}>{emailPreviewContent.subject.replace(/{nome}/g, '[Nome]')}</div>
            </div>
            
            <div style={{ backgroundColor: '#f0eee9', width: '100%', height: '600px' }}>
              <iframe 
                srcDoc={`
                  <!DOCTYPE html>
                  <html lang="pt-BR">
                  <head>
                    <meta charset="utf-8">
                    <title>Preview</title>
                    <style>${EMAIL_CSS}</style>
                  </head>
                  <body style="margin: 0; padding: 0; background-color: #f0eee9; -webkit-font-smoothing: antialiased;">
                    <div class="mail-stage">
                      ${(emailPreviewContent.body || '').replace(/{nome}/g, '[Nome]')}
                    </div>
                  </body>
                  </html>
                `}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Email Preview"
              />
            </div>
            
            <div className="modal-actions" style={{ padding: '20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowEmailPreviewModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarketing;
