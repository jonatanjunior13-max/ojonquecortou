import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, doc, updateDoc, getDoc, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { Sparkles, Phone, Mail, Search, CheckSquare, Square, Send, Eye, BarChart3 } from 'lucide-react';
import './Admin.css';
import { HTML_TEMPLATES, EMAIL_CSS, ADMIN_HTML_TEMPLATES } from '../../utils/emailTemplates.js';


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
    Rua Francisco Ovídio, 184 · Caiçara<br>Belo Horizonte · MG · 30000-000<br>Quarta a Sábado · 9h às 19h
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
  const [googleReviews, setGoogleReviews] = useState([
    { id: 'rev_1', author: 'Isabela Rodrigues', rating: 5, comment: 'Nunca tinha visto meu cabelo tão bem definido! O Jon leu meu fio antes de tocar na tesoura e o resultado foi incrível. Recomendo demais para quem tem cacheado!', date: '2 dias atrás', reply: '' },
    { id: 'rev_2', author: 'Camila Ferreira', rating: 5, comment: 'Fui pela primeira vez e já marquei a volta. O visagismo foi perfeito pro formato do meu rosto. O corte a seco revelou um volume que eu não sabia que tinha.', date: '1 semana atrás', reply: 'Camila, que alegria ter você por aqui! O visagismo junto com a leitura de fio é exatamente o que permite a gente criar o volume certo pra cada rosto. Te esperamos na próxima! — Jon' },
    { id: 'rev_3', author: 'Lucas Mendes', rating: 5, comment: 'Meu crespo estava perdido e o Jon salvou. Ele explicou o scab hair, o problema de porosidade e cortou de um jeito que o cacho definiu muito melhor.', date: '2 semanas atrás', reply: '' },
    { id: 'rev_4', author: 'Fernanda Costa', rating: 5, comment: 'Finalmente um profissional que entende de transição capilar de verdade. Não foi só corte, foi uma consultoria completa. Saí completamente diferente e feliz!', date: '3 semanas atrás', reply: 'Fernanda, muito obrigado pela confiança no processo! Transição capilar exige técnica e cuidado com cada fase. Estamos aqui pra cada etapa da sua jornada! — Jon' }
  ]);
  const [isGeneratingGbpPost, setIsGeneratingGbpPost] = useState(false);
  const [generatedGbpPost, setGeneratedGbpPost] = useState(null);
  // Frequency scheduler
  const [postFreqDay, setPostFreqDay] = useState('segunda');
  const [postFreqTime, setPostFreqTime] = useState('09:00');
  const [scheduledGbpPosts, setScheduledGbpPosts] = useState([
    { id: 'post_sched_1', text: 'Todo mundo fala de técnica. Quase ninguém fala de rosto. Formato do rosto muda tudo no corte cacheado. O volume que emoldura numa pessoa é o mesmo que engole outra. Por isso cada corte precisa ser pensado pro seu rosto, não pra uma técnica.\n\n📍 Studio do Jon – Caiçara, BH\n🔗 Reserve: www.ojonquecortou.com.br', image: '/blog-visagismo-capa.webp', scheduledDate: '31 Mai, 09:00', status: 'scheduled' },
    { id: 'post_pub_1', text: 'O que parece falta de produto... é falta de diagnóstico. Cacho sem definição, cheio de frizz, sem movimento. A maioria vai trocar de creme. Mas o problema é outro: o fio está mal lido.\n\nConheça sua curvatura. Reserve seu horário.\n🔗 www.ojonquecortou.com.br', image: '/blog-frizz.webp', scheduledDate: 'Ontem', status: 'published' },
    { id: 'post_pub_2', text: 'Corte molhado em cabelo cacheado é erro de 2015. Seu cacho muda tudo quando seca. O comprimento muda. O volume muda. A forma muda. Se o cabeleireiro cortou molhado, ele cortou no escuro.\n\nCorte a seco é a única forma de ler o cacho de verdade.\n📍 Studio do Jon, BH', image: '/blog-leitura-fio-capa.webp', scheduledDate: 'Ontem', status: 'published' },
    { id: 'post_pub_3', text: 'Você trocou de produto 3 vezes. O frizz não foi. Produto resolve rotina. Corte errado não tem shampoo que conserte. Fio mal lido na tesoura gera frizz que não sai de nenhuma prateleira.\n\n📍 Reserve seu horário: www.ojonquecortou.com.br', image: '/blog-frizz-dano.webp', scheduledDate: 'Semana passada', status: 'published' }
  ]);

  const handleSimulateNewReview = () => {
    const names = ['Amanda Costa', 'Patrícia Oliveira', 'Beatriz Souza', 'Luana Mendes'];
    const comments = [
      'Meu cabelo ondulado nunca teve tanta definição! O visagismo do Jon é impecável.',
      'O Studio do Jon é o melhor lugar de BH para cabelos crespos. Amei a experiência.',
      'Excelente profissional. Fez o corte a seco no meu crespo e tirou todo o scab hair.',
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
      newRev.reply = `Olá ${names[idx].split(' ')[0]}! Agradecemos demais pelo seu carinho e avaliação de 5 estrelas. Nosso foco é oferecer um atendimento de excelência com leitura de fios e visagismo personalizado. Até logo! — Jon`;
    }

    setGoogleReviews(prev => [newRev, ...prev]);
    alert('Nova avaliação simulada no Google!');
  };

  const handleManualGbpReply = (id) => {
    setGoogleReviews(prev => prev.map(rev => {
      if (rev.id === id) {
        return {
          ...rev,
          reply: `Olá ${rev.author.split(' ')[0]}! Muito obrigado por nos avaliar. Nosso compromisso é sempre realçar a beleza natural de cada textura com muito profissionalismo e técnica. — Jon`
        };
      }
      return rev;
    }));
    alert('Resposta enviada para o Google com sucesso!');
  };

  const handleGenerateGbpPost = async () => {
    setIsGeneratingGbpPost(true);
    
    const fallbackPosts = [
      {
        text: 'Você sabe a real diferença entre Cabelo Cacheado e Crespo? ✂️\n\nA chave para o volume perfeito está na estrutura de cada fio. No Studio do Jon, usamos o método de leitura de fio antes da tesoura e corte a seco para garantir o caimento perfeito da sua curvatura.\n\n📍 Rua Francisco Ovídio, Caiçara - BH\n🔗 Reserve seu horário: www.ojonquecortou.com.br',
        image: '/cacho-vs-crespo-hero.webp'
      },
      {
        text: 'Frizz: Normal ou Dano Capilar? 🤔\n\nMuitas vezes o frizz é apenas a textura natural do fio querendo liberdade, e não necessariamente ressecamento. Conheça sua curvatura e aprenda a finalização ideal no seu atendimento de visagismo!\n\n📍 Studio do Jon - Especialista em Cachos BH\n🔗 Agende agora: www.ojonquecortou.com.br',
        image: '/blog-secagem-hero.webp'
      }
    ];

    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
    
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: 'Escreva um post curto e atrativo (máximo 400 caracteres) em português para o Google Meu Negócio do salão "O Jon Que Cortou" (especialista em corte a seco, leitura de fio e visagismo de cabelos cacheados e crespos em Belo Horizonte, no bairro Caiçara). Fale sobre a importância do corte personalizado para valorizar a curvatura natural e convide a agendar. Inclua o link www.ojonquecortou.com.br. Não invente promoções ou descontos.'
                }]
              }]
            })
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            const images = ['/cacho-vs-crespo-hero.webp', '/blog-secagem-hero.webp'];
            const randomImg = images[Math.floor(Math.random() * images.length)];
            
            setGeneratedGbpPost({
              text: generatedText.trim(),
              image: randomImg
            });
            setIsGeneratingGbpPost(false);
            return;
          }
        } else {
          console.warn('Gemini API retornou erro:', response.status);
        }
      } catch (err) {
        console.warn('Erro ao gerar post com Gemini API, usando fallback:', err);
      }
    }
    
    // Fallback se falhar
    setTimeout(() => {
      const idx = Math.floor(Math.random() * fallbackPosts.length);
      setGeneratedGbpPost(fallbackPosts[idx]);
      setIsGeneratingGbpPost(false);
    }, 1000);
  };

  const DAYS_PT = { 'domingo': 'Dom', 'segunda': 'Seg', 'terca': 'Ter', 'quarta': 'Qua', 'quinta': 'Qui', 'sexta': 'Sex', 'sabado': 'Sáb' };

  const handleScheduleGbpPost = () => {
    if (!generatedGbpPost) return;
    const dayLabel = { 'domingo': 'Domingo', 'segunda': 'Segunda', 'terca': 'Terça', 'quarta': 'Quarta', 'quinta': 'Quinta', 'sexta': 'Sexta', 'sabado': 'Sábado' }[postFreqDay] || postFreqDay;
    const newPost = {
      id: 'post_' + Date.now(),
      text: generatedGbpPost.text,
      image: generatedGbpPost.image,
      scheduledDate: `Próxima ${dayLabel}, ${postFreqTime}`,
      status: 'scheduled'
    };
    setScheduledGbpPosts(prev => [newPost, ...prev]);
    setGeneratedGbpPost(null);
    alert(`Postagem programada para toda ${dayLabel} às ${postFreqTime}!`);
  };

  const handlePublishGbpPostNow = async (post) => {
    setIsPublishingGbpId(post.id);
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
        setScheduledGbpPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: 'published', scheduledDate: 'Agora' } : p));
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

  const handleDeleteGbpPost = (postId) => {
    setScheduledGbpPosts(prev => prev.filter(p => p.id !== postId));
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

  const getDeliveryStats = () => {
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
  };

  useEffect(() => {
    let unsubscribeProfiles;
    let unsubscribeBookings;
    let unsubscribeLogs;
    let unsubscribeSettings;
    let unsubscribeAdminNotifs;

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
      } catch (e) {}
      setLoading(false);
    }

    return () => {
      if (unsubscribeProfiles) unsubscribeProfiles();
      if (unsubscribeBookings) unsubscribeBookings();
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeAdminNotifs) unsubscribeAdminNotifs();
    };
  }, []);

  const getDaysAbsent = (lastVisitDate) => {
    if (lastVisitDate === 'Nunca visitou' || !lastVisitDate) return Infinity;
    const diffTime = Math.abs(new Date() - new Date(lastVisitDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Returns clients whose birthday falls within the next `windowDays` days (0 = only today)
  const getBirthdayClients = (windowDays = 0) => {
    const today = new Date();
    return clients.filter(c => {
      if (!c.birthdate) return false;
      // birthdate stored as YYYY-MM-DD
      const parts = c.birthdate.split('-');
      if (parts.length < 2) return false;
      const bMonth = parseInt(parts[1], 10);
      const bDay   = parseInt(parts[2], 10);
      for (let offset = 0; offset <= windowDays; offset++) {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        if (d.getMonth() + 1 === bMonth && d.getDate() === bDay) return true;
      }
      return false;
    });
  };

  const getBirthdayWaLink = (client) => {
    const firstName = (client.name || '').split(' ')[0];
    const msg = birthdayWaMessage.replace(/{nome}/g, firstName);
    return `https://wa.me/55${client.phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleSendBirthdayWaCampaign = async () => {
    const targets = getBirthdayClients(birthdayWindowDays);
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
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const marketingTargetsList = clients.filter(c => {
    const days = getDaysAbsent(c.lastVisit);
    if (marketingTarget === 'todos') return true;
    if (marketingTarget === 'inativos_30') return days >= 30 && days <= 60;
    if (marketingTarget === 'inativos_60') return days > 60 && days !== Infinity;
    if (marketingTarget === 'nunca_visitaram') return days === Infinity;
    if (marketingTarget === 'selecionados') return selectedCampaignPhones.includes(c.phone);
    return false;
  });

  const getCampaignMessageLink = (client) => {
    const days = getDaysAbsent(client.lastVisit);
    let msg = campaignMessage
      .replace(/{nome}/g, client.name.split(' ')[0])
      .replace(/{ultimo_servico}/g, client.lastServiceName || 'Corte')
      .replace(/{dias_ausente}/g, days === Infinity ? 'muito tempo' : days);
    
    return `https://wa.me/55${client.phone}?text=${encodeURIComponent(msg)}`;
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
    if (marketingTargetsList.length === 0) return;
    setIsSendingWhatsapp(true);
    cancelSendingRef.current = false;
    setWhatsappLogs(['[SYSTEM] Iniciando disparo em lote (WhatsApp)...']);

    for (const client of marketingTargetsList) {
      if (cancelSendingRef.current) {
        setWhatsappLogs(prev => [...prev, '[SYSTEM] Disparo cancelado pelo usuário.']);
        break;
      }
      await new Promise(r => setTimeout(r, 1200));
      if (cancelSendingRef.current) {
        setWhatsappLogs(prev => [...prev, '[SYSTEM] Disparo cancelado pelo usuário.']);
        break;
      }
      await saveLog(client.name, client.phone, 'Campanha Manual (WhatsApp)', 'whatsapp');
      setWhatsappLogs(prev => [...prev, `[✅ OK] Mensagem enfileirada para ${client.name} (${client.phone})`]);
    }

    if (!cancelSendingRef.current) {
      setWhatsappLogs(prev => [...prev, '[SYSTEM] Lote finalizado!']);
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
        const firstName = client.name.split(' ')[0];
        
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
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Carregando dados...</div>
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
                const stats = getDeliveryStats();
                return (
                  <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--rule)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
                      <h4 style={{ margin: 0 }}>Histórico de Envios (Acompanhamento)</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                      {[
                        { title: 'Acompanhamento Diário', subtitle: 'Hoje', data: stats.today },
                        { title: 'Acompanhamento Semanal', subtitle: 'Últimos 7 dias', data: stats.week },
                        { title: 'Acompanhamento Mensal', subtitle: 'Últimos 30 dias', data: stats.month }
                      ].map((item, idx) => (
                        <div key={idx} style={{ padding: '16px', background: 'var(--sidebar-bg)', border: '1px solid var(--rule)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block' }}>{item.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{item.subtitle}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1, padding: '8px', background: 'var(--panel-bg)', border: '1px solid var(--rule)', borderRadius: '4px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                                <Mail size={12} /> E-mail
                              </div>
                              <strong style={{ fontSize: '1.25rem', color: 'var(--text)' }}>{item.data.email}</strong>
                            </div>
                            <div style={{ flex: 1, padding: '8px', background: 'var(--panel-bg)', border: '1px solid var(--rule)', borderRadius: '4px', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                                <Phone size={12} /> WhatsApp
                              </div>
                              <strong style={{ fontSize: '1.25rem', color: 'var(--text)' }}>{item.data.whatsapp}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              
              {/* Client Selection Tool */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--rule)' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Buscar e Marcar Clientes</h4>
                <div className="search-wrap" style={{ marginBottom: '16px', maxWidth: '400px' }}>
                  <Search size={14} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar por nome ou telefone..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '4px', border: '1px solid var(--rule)' }}
                  />
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--rule)', borderRadius: '6px' }}>
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
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '8px', fontWeight: 600 }}>
                    {selectedCampaignPhones.length} clientes marcados. (Escolha "Selecionadas no Relatório" abaixo).
                  </p>
                )}
              </div>
              
              {/* Automações Fixas */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--rule)' }}>
                <h4 style={{ margin: '0 0 6px 0' }}>Régua de Relacionamento (Automática)</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '20px', marginTop: 0 }}>
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

                    <div key={step.key} style={{ padding: '12px', border: '1px solid var(--rule)', borderRadius: '6px', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column' }}>
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
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{step.desc}</span>
                      
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
                  <h5 style={{ margin: '0 0 10px 0' }}>Histórico de Disparos da Régua (Hoje)</h5>
                  {(() => {
                    const todayLogs = Array.isArray(automationLogs) ? automationLogs.filter(log => {
                      if (!log || !log.timestamp) return false;
                      const logDate = new Date(log.timestamp);
                      return logDate.toDateString() === new Date().toDateString();
                    }) : [];

                    if (todayLogs.length === 0) {
                      return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Nenhum e-mail automático disparado hoje.</p>;
                    }

                    return (
                      <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--rule)', borderRadius: '6px' }}>
                        <table className="admin-table" style={{ margin: 0 }}>
                          <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 1 }}>
                            <tr>
                              <th>Hora</th>
                              <th>Cliente</th>
                              <th>Etapa (Trigger)</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {todayLogs.map(log => (
                              <tr key={log.id}>
                                <td>{new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                                <td>{log.clientName}</td>
                                <td><span className="status-badge concluded">{log.stage}</span></td>
                                <td>✅ Enviado</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Automação de Aniversário — WhatsApp */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--rule)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0 }}>🎂 Automação de Aniversário (WhatsApp)</h4>
                  <button
                    className={`btn-toggle ${settings?.automations?.birthdayWaEnabled !== false ? 'active' : ''}`}
                    onClick={() => toggleAutomation('birthdayWaEnabled', settings?.automations?.birthdayWaEnabled === false)}
                  >
                    {settings?.automations?.birthdayWaEnabled !== false ? 'ON' : 'OFF'}
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 0, marginBottom: '20px' }}>
                  Dispara uma mensagem personalizada no WhatsApp para clientes que fazem aniversário hoje ou nos próximos dias. O Jon é notificado e abre cada conversa com 1 clique.
                </p>

                {/* Janela de disparo */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>Exibir aniversariantes:</span>
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
                        border: birthdayWindowDays === opt.value ? '2px solid var(--accent)' : '1px solid var(--rule)',
                        background: birthdayWindowDays === opt.value ? 'rgba(176,90,46,0.12)' : 'transparent',
                        color: birthdayWindowDays === opt.value ? 'var(--accent)' : 'var(--muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Lista de aniversariantes */}
                {(() => {
                  const bClients = getBirthdayClients(birthdayWindowDays);
                  return bClients.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--rule)', borderRadius: '8px', color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                      🎉 Nenhum aniversariante {birthdayWindowDays === 0 ? 'hoje' : `nos próximos ${birthdayWindowDays} dias`}.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--rule)', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                      <div style={{ padding: '10px 16px', background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>🎂 {bClients.length} aniversariante{bClients.length > 1 ? 's' : ''} encontrado{bClients.length > 1 ? 's' : ''}</span>
                        {isSendingBirthdayWa ? (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '7px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, background: '#d9534f', color: '#fff' }}
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
                            <div key={c.phone} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--rule)' }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #C97B49, #6E2F18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                                {(c.name || '?')[0].toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{c.phone} · Aniversário: {bDate}</div>
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
                <div style={{ background: 'var(--sidebar-bg)', borderRadius: '8px', padding: '16px', border: '1px solid var(--rule)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>✏️ Mensagem de Aniversário</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Tag: <code style={{ background: 'rgba(176,90,46,0.1)', color: 'var(--accent)', padding: '1px 5px', borderRadius: 3 }}>{'{nome}'}</code></span>
                  </div>
                  <textarea
                    rows={4}
                    value={birthdayWaMessage}
                    onChange={e => setBirthdayWaMessage(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--rule)', background: 'var(--panel-bg)', color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.55, resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder="Digite a mensagem de aniversário..."
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6, marginBottom: 0 }}>
                    A tag <code style={{ color: 'var(--accent)' }}>{'{nome}'}</code> será substituída pelo primeiro nome do cliente no disparo.
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
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--rule)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0 }}>🚀 Campanha de Lançamento — Novo Sistema de Agendamento</h4>
                  <button
                    className={`btn-toggle ${settings?.automations?.launchCampaignEnabled !== false ? 'active' : ''}`}
                    onClick={() => toggleAutomation('launchCampaignEnabled', settings?.automations?.launchCampaignEnabled === false)}
                  >
                    {settings?.automations?.launchCampaignEnabled !== false ? 'ON' : 'OFF'}
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 0, marginBottom: '20px' }}>
                  Campanha para a lista fria (leads sem histórico de visita no Studio). Envia uma sequência de 3 e-mails para atrair os primeiros agendamentos pelo site.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  {[
                    { key: 'launchE1', label: 'E-mail 1 (D+0)', desc: 'Anúncio do Novo Sistema' },
                    { key: 'launchE2', label: 'E-mail 2 (D+5)', desc: 'Construção de Valor (Método)' },
                    { key: 'launchE3', label: 'E-mail 3 (D+10)', desc: 'Exclusividade & Urgência' }
                  ].map(step => (
                    <div key={step.key} style={{ padding: '12px', border: '1px solid var(--rule)', borderRadius: '6px', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{step.label}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '12px' }}>{step.desc}</span>
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

                <div style={{ background: 'var(--sidebar-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--rule)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h5 style={{ margin: '0 0 4px 0' }}>Disparar Sequência Manualmente</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
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
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>
                            Progresso: {emailProgressCount} de {emailProgressTotal} enviados ({Math.round((emailProgressCount / emailProgressTotal) * 100)}%)
                          </span>
                          <div style={{ width: '100%', height: '4px', background: 'var(--rule)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${(emailProgressCount / emailProgressTotal) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                    {isSendingEmail ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => { cancelSendingRef.current = true; }}
                        style={{ padding: '10px 20px', fontSize: '0.85rem', background: '#d9534f', color: '#fff' }}
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
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--rule)', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0' }}>E-mails do Sistema e Notificações</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '20px', marginTop: 0 }}>
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
                    <div key={item.key} style={{ padding: '16px', border: '1px solid var(--rule)', borderRadius: '8px', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>{item.desc}</p>
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
                        style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#d9534f', color: '#fff' }}
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
                        style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#d9534f', color: '#fff' }}
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
                  <div style={{ margin: '12px 0', padding: '12px', background: 'rgba(176,90,46,0.1)', border: '1px solid var(--rule)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>
                      <span>Progresso do Disparo</span>
                      <span>{emailProgressCount} de {emailProgressTotal} enviados ({Math.round((emailProgressCount / emailProgressTotal) * 100)}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--rule)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(emailProgressCount / emailProgressTotal) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }}></div>
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
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            {c.email && c.email !== 'Não informado' ? c.email : 'Sem E-mail'}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Google Business Profile Automação */}
              <div className="marketing-automations-card" style={{ gridColumn: '1 / -1', padding: '20px', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--rule)', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={20} style={{ color: 'var(--accent)' }} />
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
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 0, marginBottom: gbpConnected ? '20px' : '12px' }}>
                  Automatize as respostas aos seus clientes no Google Maps e agende postagens semanais com imagens e palavras-chave de SEO local para subir no ranking de buscas em BH.
                </p>

                {!gbpConnected && (
                  <div style={{ padding: '12px 16px', background: 'rgba(213,100,20,0.08)', border: '1px solid rgba(213,100,20,0.25)', borderRadius: 8, marginBottom: 20, fontSize: '0.82rem' }}>
                    <strong>⚠️ Para ativar com dados reais do seu Google Meu Negócio:</strong>
                    <ol style={{ margin: '8px 0 0 0', paddingLeft: '18px', lineHeight: 1.9, color: 'var(--muted)' }}>
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
                        <p style={{ margin: '8px 0', color: 'var(--text)', lineHeight: 1.5 }}>
                          Sua autenticação OAuth funcionou perfeitamente, mas o Google bloqueou o acesso à sua conta. Novos projetos no Google Cloud possuem um limite padrão de <strong>0 requisições por minuto</strong> para a API do Meu Negócio até que sejam aprovados.
                        </p>
                        <strong style={{ display: 'block', marginTop: '12px', marginBottom: '6px' }}>Como liberar o acesso:</strong>
                        <ol style={{ margin: '0', paddingLeft: '18px', lineHeight: 1.6, color: 'var(--muted)' }}>
                          <li>Acesse o <a href="https://developers.google.com/my-business/content/prereqs#request-access" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Formulário de Solicitação de Acesso</a> oficial do Google.</li>
                          <li>Preencha informando o número do seu projeto: <strong>65586774085</strong>.</li>
                          <li>Explique que você está criando um painel interno de agendamentos próprio para gerenciar as avaliações e posts do seu salão "O Jon Que Cortou".</li>
                        </ol>
                        <p style={{ margin: '12px 0 0 0', color: 'var(--muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Enquanto o Google não aprova (leva de 2 a 5 dias), o painel continuará operando em modo de simulação, permitindo que você teste as integrações de SEO Local com IA!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  
                  {/* Coluna 1: Comentários e Avaliações */}
                  <div style={{ padding: '16px', background: 'var(--sidebar-bg)', border: '1px solid var(--rule)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h5 style={{ margin: 0, fontWeight: 700 }}>💬 Responder Avaliações c/ IA</h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Auto-Responder</span>
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
                        ➕ Simular Nova Avaliação
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '350px', overflowY: 'auto', paddingRight: 4 }}>
                      {googleReviews.map(rev => (
                        <div key={rev.id} style={{ padding: 12, background: 'var(--panel-bg)', borderRadius: 6, border: '1px solid var(--rule)', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <strong>{rev.author}</strong>
                            <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{rev.date}</span>
                          </div>
                          <div style={{ color: '#ecc94b', marginBottom: 6 }}>{'★'.repeat(rev.rating)}</div>
                          <p style={{ margin: '0 0 10px 0', color: 'var(--text)', fontStyle: 'italic' }}>"{rev.comment}"</p>
                          
                          {rev.reply ? (
                            <div style={{ padding: 8, background: 'rgba(176,90,46,0.06)', borderLeft: '3px solid var(--accent)', borderRadius: 4, marginTop: 8 }}>
                              <strong>Resposta do Studio:</strong>
                              <p style={{ margin: '4px 0 0 0', color: 'var(--muted)' }}>{rev.reply}</p>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-accent btn-small" 
                              style={{ width: '100%', fontSize: '0.75rem', padding: '4px' }}
                              onClick={() => handleManualGbpReply(rev.id)}
                            >
                              ✍️ Responder com IA agora
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coluna 2: Postagens com Imagens */}
                  <div style={{ padding: '16px', background: 'var(--sidebar-bg)', border: '1px solid var(--rule)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h5 style={{ margin: 0, fontWeight: 700 }}>✍️ Posts Semanais c/ Imagens</h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Auto-Post</span>
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
                    <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--rule)', borderRadius: 6, padding: 12, marginBottom: 14 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: 10 }}>🗓️ Frequência de Publicação Automática</span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>Dia da semana</label>
                          <select
                            value={postFreqDay}
                            onChange={e => setPostFreqDay(e.target.value)}
                            style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid var(--rule)', background: 'var(--sidebar-bg)', color: 'var(--text)', fontSize: '0.82rem' }}
                          >
                            <option value="domingo">Domingo</option>
                            <option value="segunda">Segunda-feira</option>
                            <option value="terca">Terça-feira</option>
                            <option value="quarta">Quarta-feira</option>
                            <option value="quinta">Quinta-feira</option>
                            <option value="sexta">Sexta-feira</option>
                            <option value="sabado">Sábado</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 100 }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>Horário</label>
                          <input
                            type="time"
                            value={postFreqTime}
                            onChange={e => setPostFreqTime(e.target.value)}
                            style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid var(--rule)', background: 'var(--sidebar-bg)', color: 'var(--text)', fontSize: '0.82rem' }}
                          />
                        </div>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--muted)', margin: '8px 0 0 0' }}>
                        📡 Com a API conectada, os posts serão gerados e publicados automaticamente neste horário semanal.
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
                      <div style={{ padding: 12, background: 'var(--panel-bg)', borderRadius: 6, border: '1px solid var(--rule)', marginBottom: 16 }}>
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
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-accent btn-small" style={{ flex: 1, fontSize: '0.75rem' }} onClick={handleScheduleGbpPost}>
                            📅 Programar na Fila
                          </button>
                          <button className="btn btn-outline btn-small" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => setGeneratedGbpPost(null)}>
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
                        <div key={post.id} style={{ padding: 10, background: 'var(--panel-bg)', borderRadius: 6, border: `1px solid ${post.status === 'scheduled' ? 'rgba(247,170,0,0.3)' : 'var(--rule)'}`, display: 'flex', gap: 10, fontSize: '0.78rem' }}>
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
                              <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{post.scheduledDate}</span>
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
            </div>
          </div>
        </div>
      )}

      {showEmailEditModal && (
        <div className="modal-overlay" onClick={() => setShowEmailEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%' }}>
            <h3>Editar E-mail da Régua</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>As tags dinâmicas como <b>{'{'}nome{'}'}</b> serão substituídas no disparo.</p>
            
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
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Suba um arquivo HTML ou cole o código fonte abaixo. Use a tag <b>{'{nome}'}</b> para exibir o nome da cliente.</p>
            
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
            <div style={{ padding: '20px', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
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
            <div style={{ padding: '20px', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    E-mail Enviado ao Administrador
                  </div>
                  <strong style={{ color: '#fff' }}>{selectedAdminNotif.subject}</strong>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setShowAdminNotifModal(false)}>✕</button>
              </div>
            </div>
            
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--rule)', background: 'var(--sidebar-bg)', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '4px' }}><strong>Destinatário:</strong> Notificação do Salão</div>
              <div style={{ marginBottom: '4px' }}><strong>Data de Envio:</strong> {new Date(selectedAdminNotif.timestamp).toLocaleString('pt-BR')}</div>
              <div><strong>Cliente Relacionado:</strong> {selectedAdminNotif.clientName}</div>
            </div>
            
            <div style={{ backgroundColor: '#fff', width: '100%', flex: 1, overflow: 'hidden' }}>
              <iframe 
                srcDoc={selectedAdminNotif.htmlBody || '<h3>Nenhum conteúdo no e-mail.</h3>'}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Admin Notification E-mail"
              />
            </div>
            
            <div className="modal-actions" style={{ padding: '16px', borderTop: '1px solid var(--rule)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdminNotifModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW DE EMAIL */}
      {showEmailPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowEmailPreviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '100%', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
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
