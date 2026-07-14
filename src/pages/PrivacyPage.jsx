import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const LAST_UPDATED = '14 de julho de 2026';

const sectionStyle = {
  padding: 'clamp(40px, 6vw, 64px) 0',
  borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
};

const h2Style = {
  fontFamily: "'DM Serif Display', Georgia, serif",
  fontWeight: 400,
  fontSize: 'clamp(1.35rem, 3vw, 1.75rem)',
  color: 'var(--ink, #1A1310)',
  margin: '0 0 16px',
};

const pStyle = {
  fontFamily: "'Manrope', sans-serif",
  fontSize: '0.975rem',
  lineHeight: 1.75,
  color: 'var(--muted, #a39687)',
  margin: '0 0 14px',
};

const liStyle = { ...pStyle, margin: '0 0 8px' };

const linkStyle = { color: 'var(--accent, #FF2D8B)', textDecoration: 'underline' };

const PrivacyPage = () => {
  return (
    <main className="privacy-page" style={{ paddingTop: '5rem' }}>
      <SEO
        title="Política de Privacidade | Studio do Jon"
        description="Como o Studio do Jon (O Jon que Cortou) coleta, usa, armazena e protege seus dados pessoais, em conformidade com a LGPD."
        url="/politica-privacidade"
      />

      {/* Hero */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted, #a39687)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ display: 'inline-block', width: 18, height: 1, background: 'var(--muted, #a39687)' }} />
            Privacidade & Dados
          </p>

          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(2.25rem, 6vw, 3.75rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: 'var(--ink, #1A1310)',
            margin: '0 0 20px',
          }}>
            Política de Privacidade
          </h1>

          <p style={{ ...pStyle, maxWidth: '65ch', margin: 0 }}>
            Esta política explica quais dados o <strong>Studio do Jon (O Jon que Cortou)</strong> coleta
            quando você visita nosso site ou agenda um atendimento, para que finalidades usamos essas
            informações, com quem elas podem ser compartilhadas e quais direitos você tem sobre seus
            dados, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
          <p style={{ ...pStyle, marginTop: '14px', fontSize: '0.85rem', fontStyle: 'italic' }}>
            Última atualização: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Controlador dos dados */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>1. Quem é o controlador dos seus dados</h2>
          <p style={pStyle}>
            O controlador dos dados pessoais tratados através deste site é:
          </p>
          <p style={pStyle}>
            <strong>O Jon que Cortou — Studio do Jon</strong> (Jonatan Junior, profissional autônomo)<br />
            Rua Francisco Ovídio, 184, Caiçaras, Belo Horizonte - MG, CEP 30770-040<br />
            E-mail: <a href="mailto:contato@ojonquecortou.com.br" style={linkStyle}>contato@ojonquecortou.com.br</a><br />
            Telefone/WhatsApp: <a href="https://wa.me/553135866673" style={linkStyle}>(31) 3586-6673</a>
          </p>
        </div>
      </section>

      {/* Dados coletados */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>2. Quais dados coletamos</h2>
          <p style={pStyle}>Coletamos os seguintes tipos de dados, conforme sua interação com o site:</p>
          <ul style={{ paddingLeft: '20px', margin: '0 0 14px' }}>
            <li style={liStyle}><strong>Dados de agendamento:</strong> nome, telefone/WhatsApp, e-mail, serviço escolhido e horário, informados ao marcar um atendimento em <Link to="/agendar" style={linkStyle}>/agendar</Link>.</li>
            <li style={liStyle}><strong>Dados de atendimento:</strong> histórico de serviços realizados e observações técnicas sobre o cabelo (curvatura, histórico químico, cuidados), registrados pelo profissional para dar continuidade ao atendimento.</li>
            <li style={liStyle}><strong>Dados de contato e newsletter:</strong> e-mail informado voluntariamente para receber comunicações do Studio do Jon.</li>
            <li style={liStyle}><strong>Dados de navegação:</strong> páginas visitadas, dispositivo, origem do acesso e interações no site, coletados via cookies e ferramentas de análise (ver seção 5).</li>
            <li style={liStyle}><strong>Comunicações:</strong> mensagens trocadas via WhatsApp para confirmação, lembrete ou reagendamento de horários.</li>
          </ul>
          <p style={pStyle}>Não coletamos dados de pagamento (cartão de crédito) através deste site — pagamentos são feitos presencialmente no Studio.</p>
        </div>
      </section>

      {/* Finalidade */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>3. Para que usamos seus dados</h2>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li style={liStyle}>Confirmar, lembrar e gerenciar seus agendamentos (execução do serviço contratado).</li>
            <li style={liStyle}>Dar continuidade ao seu histórico de atendimento e recomendar cuidados adequados ao seu cabelo.</li>
            <li style={liStyle}>Enviar comunicações sobre seu agendamento (confirmação, lembrete de 24h, reagendamento) via e-mail e WhatsApp.</li>
            <li style={liStyle}>Enviar newsletter e novidades, apenas para quem se inscreveu voluntariamente (você pode cancelar a qualquer momento).</li>
            <li style={liStyle}>Entender como o site é utilizado, medir desempenho de conteúdo e campanhas de anúncios, e melhorar a experiência de navegação.</li>
            <li style={liStyle}>Cumprir obrigações legais e regulatórias, quando aplicável.</li>
          </ul>
        </div>
      </section>

      {/* Compartilhamento com terceiros */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>4. Compartilhamento com terceiros</h2>
          <p style={pStyle}>
            Não vendemos seus dados pessoais. Utilizamos os seguintes serviços de terceiros como
            operadores de dados, cada um regido por sua própria política de privacidade:
          </p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li style={liStyle}><strong>Google Firebase</strong> — hospedagem, banco de dados e autenticação da área administrativa e de clientes.</li>
            <li style={liStyle}><strong>Google Calendar</strong> — sincronização de horários de agendamento.</li>
            <li style={liStyle}><strong>Google Analytics</strong> e <strong>Vercel Analytics</strong> — métricas de tráfego e comportamento no site.</li>
            <li style={liStyle}><strong>Meta (Facebook/Instagram Ads)</strong> — mensuração de campanhas publicitárias via Pixel e API de Conversões (endereço IP, navegador e eventos de navegação).</li>
            <li style={liStyle}><strong>WhatsApp Business</strong> — envio de confirmações, lembretes e comunicação direta sobre seu atendimento.</li>
            <li style={liStyle}><strong>MailerSend / Titan E-mail</strong> — envio de e-mails transacionais e newsletter.</li>
          </ul>
          <p style={{ ...pStyle, marginTop: '14px' }}>
            Esses serviços podem processar dados em servidores fora do Brasil, sempre sob contratos e
            salvaguardas compatíveis com a LGPD.
          </p>
        </div>
      </section>

      {/* Cookies */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>5. Cookies e tecnologias de rastreamento</h2>
          <p style={pStyle}>
            Usamos cookies próprios e de terceiros (Google Analytics, Vercel Analytics, Meta Pixel) para
            entender como você navega no site e medir a performance de conteúdo e anúncios. Você pode
            bloquear ou apagar cookies a qualquer momento nas configurações do seu navegador — isso não
            impede o uso do site, mas pode limitar algumas funcionalidades de personalização.
          </p>
        </div>
      </section>

      {/* Retenção */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>6. Por quanto tempo guardamos seus dados</h2>
          <p style={pStyle}>
            Dados de agendamento e histórico de atendimento são mantidos enquanto você for cliente ativo
            do Studio do Jon, para dar continuidade ao seu acompanhamento capilar. E-mails de newsletter
            são mantidos até você cancelar a inscrição. Dados de navegação (analytics) seguem os prazos
            padrão das ferramentas utilizadas (tipicamente entre 14 e 26 meses). Você pode solicitar a
            exclusão antecipada dos seus dados a qualquer momento (ver seção 7).
          </p>
        </div>
      </section>

      {/* Direitos do usuário */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>7. Seus direitos como titular dos dados</h2>
          <p style={pStyle}>Nos termos do art. 18 da LGPD, você tem direito a:</p>
          <ul style={{ paddingLeft: '20px', margin: '0 0 14px' }}>
            <li style={liStyle}>Confirmar a existência de tratamento dos seus dados.</li>
            <li style={liStyle}>Acessar os dados que temos sobre você.</li>
            <li style={liStyle}>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li style={liStyle}>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li style={liStyle}>Solicitar a portabilidade dos seus dados a outro fornecedor.</li>
            <li style={liStyle}>Eliminar dados tratados com o seu consentimento.</li>
            <li style={liStyle}>Revogar o consentimento a qualquer momento (ex: sair da newsletter).</li>
            <li style={liStyle}>Obter informações sobre com quem compartilhamos seus dados.</li>
          </ul>
          <p style={pStyle}>
            Para exercer qualquer um desses direitos, entre em contato pelo e-mail{' '}
            <a href="mailto:contato@ojonquecortou.com.br" style={linkStyle}>contato@ojonquecortou.com.br</a>{' '}
            ou pelo WhatsApp <a href="https://wa.me/553135866673" style={linkStyle}>(31) 3586-6673</a>.
            Responderemos sua solicitação dentro de um prazo razoável. Se não ficar satisfeito, você
            também pode registrar reclamação junto à Autoridade Nacional de Proteção de Dados (ANPD),
            em <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" style={linkStyle}>gov.br/anpd</a>.
          </p>
        </div>
      </section>

      {/* Segurança */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>8. Segurança dos dados</h2>
          <p style={pStyle}>
            Adotamos medidas técnicas e organizacionais razoáveis para proteger seus dados contra acesso
            não autorizado, perda, alteração ou divulgação indevida, incluindo conexão criptografada
            (HTTPS) e controle de acesso à área administrativa.
          </p>
        </div>
      </section>

      {/* Menores */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>9. Crianças e adolescentes</h2>
          <p style={pStyle}>
            Nossos serviços são destinados a maiores de 18 anos. Agendamentos para menores de idade devem
            ser feitos por um responsável legal, que se torna o titular dos dados de contato fornecidos.
          </p>
        </div>
      </section>

      {/* Alterações */}
      <section style={{ ...sectionStyle, borderBottom: 'none' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>10. Alterações nesta política</h2>
          <p style={pStyle}>
            Esta política pode ser atualizada periodicamente para refletir mudanças em nossos serviços ou
            na legislação. A data da última atualização está sempre indicada no topo desta página.
          </p>
          <p style={{ ...pStyle, marginTop: '20px' }}>
            Dúvidas sobre privacidade? Fale com a gente pelo{' '}
            <a href="mailto:contato@ojonquecortou.com.br" style={linkStyle}>contato@ojonquecortou.com.br</a>.
          </p>
        </div>
      </section>
    </main>
  );
};

export default PrivacyPage;
