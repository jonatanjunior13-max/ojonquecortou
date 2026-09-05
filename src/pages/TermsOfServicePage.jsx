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

const TermsOfServicePage = () => {
  return (
    <main className="terms-page" style={{ paddingTop: '5rem' }}>
      <SEO
        title="Termos de Serviço | Studio do Jon"
        description="Termos de serviço e condições de uso do Studio do Jon (O Jon que Cortou) para agendamentos de corte e gerenciamento administrativo."
        url="/termos-de-servico"
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
            Termos & Condições
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
            Termos de Serviço
          </h1>

          <p style={{ ...pStyle, maxWidth: '65ch', margin: 0 }}>
            Bem-vindo ao Studio do Jon (O Jon que Cortou). Estes termos regulam seu uso do site
            <a href="https://www.ojonquecortou.com.br" style={linkStyle}> www.ojonquecortou.com.br</a> e
            dos serviços de agendamento e autenticação associados.
          </p>
          <p style={{ ...pStyle, marginTop: '14px', fontSize: '0.85rem', fontStyle: 'italic' }}>
            Última atualização: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Propósito do App */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>1. Propósito do Aplicativo</h2>
          <p style={pStyle}>
            O Studio do Jon oferece um sistema de agendamento online seguro para cortes de cabelo especializados
            em cabelos cacheados, ondulados e crespos. A autenticação via OAuth do Google garante segurança
            nos agendamentos e no acesso ao painel administrativo do studio.
          </p>
          <p style={pStyle}>
            Este serviço é destinado a clientes que desejam agendar atendimentos capilares com Jonatan Junior
            (o Jon) e ao staff administrativo do Studio do Jon para gerenciar a agenda, inventário e operações.
          </p>
        </div>
      </section>

      {/* Autenticação e Segurança */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>2. Autenticação e Segurança</h2>
          <p style={pStyle}>
            Utilizamos Google OAuth para autenticação segura. Ao fazer login com sua conta Google, você autoriza
            o Studio do Jon a acessar informações básicas da sua conta Google conforme necessário para agendamentos.
          </p>
          <p style={pStyle}>
            Você é responsável por manter a confidencialidade de suas credenciais e por toda atividade que ocorra
            sob sua conta. Não compartilhe suas credenciais com terceiros.
          </p>
        </div>
      </section>

      {/* Uso Aceitável */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>3. Uso Aceitável</h2>
          <p style={pStyle}>Você concorda em usar este site e seus serviços exclusivamente para:</p>
          <ul style={{ paddingLeft: '20px', margin: '0 0 14px' }}>
            <li style={liStyle}>Agendar atendimentos no Studio do Jon.</li>
            <li style={liStyle}>Gerenciar seus agendamentos (visualizar, alterar, cancelar).</li>
            <li style={liStyle}>Acessar funcionalidades administrativas (para staff autorizado).</li>
            <li style={liStyle}>Fins legítimos relacionados aos serviços do studio.</li>
          </ul>
          <p style={pStyle}>
            Você concorda em NÃO usar este site para atividades ilegais, fraudulentas, abusivas ou prejudiciais.
          </p>
        </div>
      </section>

      {/* Cancelamento e Reembolsos */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>4. Cancelamento de Agendamentos</h2>
          <p style={pStyle}>
            Cancelamentos devem ser feitos através do site ou entrando em contato diretamente pelo WhatsApp
            <a href="https://wa.me/5531983044059" style={linkStyle}> (31) 98304-4059</a>.
            Consulte a política de cancelamento específica para cada serviço no momento do agendamento.
          </p>
        </div>
      </section>

      {/* Limitação de Responsabilidade */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>5. Limitação de Responsabilidade</h2>
          <p style={pStyle}>
            O Studio do Jon fornece este site e seus serviços "como estão". Não oferecemos garantias, expressas
            ou implícitas, quanto à adequação, comercialização ou adequação para um fim específico.
          </p>
          <p style={pStyle}>
            Não seremos responsáveis por danos indiretos, incidentais ou consequentes decorrentes do uso ou
            impossibilidade de usar este site ou seus serviços.
          </p>
        </div>
      </section>

      {/* Mudanças nos Termos */}
      <section style={sectionStyle}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>6. Mudanças nestes Termos</h2>
          <p style={pStyle}>
            O Studio do Jon se reserva o direito de modificar estes termos a qualquer momento. As modificações
            entram em vigor imediatamente após publicação. Seu uso contínuo do site significa aceitação dos
            termos modificados.
          </p>
        </div>
      </section>

      {/* Contato */}
      <section style={{ ...sectionStyle, borderBottom: 'none' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <h2 style={h2Style}>7. Contato</h2>
          <p style={pStyle}>
            Dúvidas sobre estes termos? Entre em contato:
          </p>
          <p style={pStyle}>
            <strong>O Jon que Cortou — Studio do Jon</strong><br />
            Rua Belmiro Braga, 544, Caiçaras, Belo Horizonte - MG<br />
            E-mail: <a href="mailto:contato@ojonquecortou.com.br" style={linkStyle}>contato@ojonquecortou.com.br</a><br />
            WhatsApp: <a href="https://wa.me/5531983044059" style={linkStyle}>(31) 98304-4059</a>
          </p>
        </div>
      </section>
    </main>
  );
};

export default TermsOfServicePage;
