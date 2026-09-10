import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './AboutPage.css';

const TRINKS_URL = '/agendar';

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jonatan Junior",
  "alternateName": "Jon",
  "jobTitle": "Especialista em cabelos ondulados, cacheados e crespos",
  "description": "Cabeleireiro especialista em cabelos cacheados, crespos e ondulados em Belo Horizonte. Criador do Método Leitura de Fio — diagnóstico capilar em 7 etapas antes de qualquer corte.",
  "worksFor": {
    "@type": "HairSalon",
    "name": "Studio do Jon",
    "url": "https://www.ojonquecortou.com.br"
  },
  "url": "https://www.ojonquecortou.com.br/sobre",
  "sameAs": [
    "https://www.instagram.com/ojonquecortou"
  ],
  "knowsAbout": [
    "Método Leitura de Fio",
    "Corte a seco para cabelos cacheados",
    "Visagismo capilar",
    "Transição capilar",
    "Descoloração em cabelos cacheados",
    "Porosidade capilar",
    "Curvatura capilar tipos 2A ao 4C"
  ]
};

const AboutPage = () => {
  return (
    <main className="about-page">
      <SEO 
        title="Cabeleireiro Especialista em Cachos BH | Jon" 
        description="Conheça o Jon, cabeleireiro especialista em cabelos cacheados, crespos e ondulados em BH. Conheça o Método Leitura de Fio e o espaço no bairro Caiçaras." 
        schema={personSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Muito Prazer, <span className="text-gradient">O Jon</span>.</h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Especialista em curvaturas e visagismo no coração do bairro Caiçaras, BH.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container about-grid">
          <div className="about-visual reveal">
            <div className="about-image-wrap">
              <img src="/jon-trabalhando.jpg" alt="Jonatan Junior realizando corte de cabelo cacheado no Studio do Jon em Belo Horizonte" className="about-image" />
            </div>
            <div className="experience-tag">
              <span className="exp-number">8-9</span>
              <span className="exp-text">Anos de Especialização</span>
            </div>
          </div>
          
          <div className="about-content reveal">
            <h2 className="heading-lg mb-2">O Cabelo não mente.<br />O corte errado, sim.</h2>
            <p className="paragraph-md mb-2">
              Se você procura um especialista em cachos em Belo Horizonte que realmente entenda a ciência por trás das curvaturas, prazer. Meu Studio é um refúgio para quem cansou de cortes genéricos e busca um atendimento personalizado para cabelos ondulados, cacheados e crespos.
            </p>
            <p className="paragraph-md mb-3">
              Não sou apenas um cabeleireiro. Sou um leitor de fios. No Caiçaras (BH), construí um espaço focado na <strong>liberdade do seu fio natural</strong>, utilizando técnicas que respeitam o fator de encolhimento e a identidade de cada cliente.
            </p>
            <div className="cta-group">
              <Link to="/agendar" className="btn btn-primary">Agendar Leitura de Fio</Link>
              <Link to="/servicos" className="btn btn-outline">Ver Serviços</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trajetória, Método e Filosofia (Paridade Total com Conteúdo Estático) ── */}
      <section className="section-padding about-story-section">
        <div className="container" style={{ maxWidth: 840 }}>
          <div className="reveal active">
            <h2 className="heading-lg mb-3">Trajetória e Anos de Experiência</h2>
            <p className="paragraph-md mb-3">
              Há quase uma década atrás da cadeira (8 a 9 anos dedicados ao ofício), Jonatan Junior construiu sua trajetória profissional focada quase que integralmente no universo dos cabelos com curvatura — ondulados, cacheados e crespos. Passou por formações técnicas em corte, coloração e química capilar, mas foi na prática diária, atendendo centenas de texturas diferentes no bairro Caiçaras, que desenvolveu o olhar clínico que hoje é a marca registrada do Studio do Jon.
            </p>
            <p className="paragraph-md mb-4">
              Anos de atendimento a cabelos que chegavam danificados por descolorações mal avaliadas, cortes feitos com o fio molhado e esticado, ou queixas de "cabelo que não cresce" (quando na verdade só estava quebrando) revelaram um padrão: a maioria dos problemas capilares não nascia do cabelo em si, mas da falta de diagnóstico antes da tesoura ou da química.
            </p>
          </div>

          <div className="reveal active mt-4">
            <h2 className="heading-lg mb-3">A Origem do Método Leitura de Fio</h2>
            <p className="paragraph-md mb-3">
              O Método Leitura de Fio não surgiu de um curso ou de uma fórmula copiada. Nasceu da repetição de um mesmo erro visto em centenas de atendimentos: cortar ou transformar quimicamente um cabelo cacheado do mesmo jeito que se trata um cabelo liso, ignorando que a fibra com curvatura se comporta como uma mola — encolhe ao secar, reage diferente à porosidade e exige leitura individual antes de qualquer intervenção.
            </p>
            <p className="paragraph-md mb-4">
              Jonatan percebeu que preview e resultado só coincidiam quando havia, antes da tesoura, uma etapa de escuta, análise a seco, análise molhada e checagem de histórico químico. Dessa constatação nasceu um protocolo estruturado em 7 etapas, testado e refinado atendimento após atendimento, até se tornar parte obrigatória (e sem custo extra) de todo corte realizado no Studio do Jon. Hoje, a Leitura de Fio é o que diferencia o Studio do Jon de salões que ainda tratam cabelo cacheado com fórmulas prontas de revista.
            </p>
          </div>

          <div className="reveal active mt-4">
            <h2 className="heading-lg mb-3">Especialização em Curvaturas 2A a 4C</h2>
            <p className="paragraph-md mb-3">
              Jonatan Junior atende e se especializou em todo o espectro de curvaturas — do tipo 2A (ondulado suave, raiz mais lisa e onda que aparece no comprimento) ao 4C (crespo compacto, altíssimo fator de encolhimento e fibra fina, porém volumosa). Essa amplitude importa porque cada faixa de curvatura exige uma abordagem técnica distinta: um corte que funciona perfeitamente em um 3A pode arruinar a forma de um 4B se aplicado sem ajuste.
            </p>
            <p className="paragraph-md mb-4">
              No Studio do Jon, o diagnóstico da Leitura de Fio identifica exatamente em qual (ou quais, já que é comum uma cabeça abrigar mais de um padrão) tipo de curvatura o cliente se encaixa, e a partir disso define graduação, angulação e técnica de finalização. Jonatan trata 2A, 2B, 2C, 3A, 3B, 3C, 4A, 4B e 4C como universos técnicos distintos, cada um com sua própria lógica de corte, volume e cuidado.
            </p>
          </div>

          <div className="reveal active mt-4">
            <h2 className="heading-lg mb-3">Filosofia: Respeito ao Cacho Natural, Zero Química Alisante</h2>
            <p className="paragraph-md mb-3">
              A filosofia por trás do Studio do Jon é simples de enunciar e rigorosa de cumprir: o cabelo com curvatura não precisa ser corrigido, precisa ser compreendido. Por isso, Jonatan Junior não realiza nenhum tipo de alisamento, relaxamento, escova progressiva ou qualquer procedimento que modifique quimicamente a curvatura natural do fio.
            </p>
            <p className="paragraph-md mb-4">
              O trabalho é 100% voltado para cabelos naturais — definição, saúde e forma são conquistadas através de corte técnico, visagismo e tratamentos capilares (hidratação, nutrição, reconstrução), nunca através de química alisante. Essa escolha é também um posicionamento: em um mercado ainda cheio de salões que "domesticam" o cacho com escova ou química, o Studio do Jon existe para provar que dá para ter cabelo saudável, bonito e de manutenção viável sem abrir mão da textura natural. Para quem está em transição capilar, esse compromisso significa suporte técnico real, sem pressa e sem empurrar procedimentos químicos como atalho.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding technique-section">
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Método & Técnica</h2>
          </div>
          
          <div className="technique-grid">
            <div className="card reveal stagger-1">
              <span className="tech-emoji">🔬</span>
              <h3>Leitura de Fio</h3>
              <p>Análise clínica de porosidade, espessura e saúde antes de qualquer tesoura.</p>
            </div>
            <div className="card reveal stagger-2">
              <span className="tech-emoji">✂️</span>
              <h3>Corte com Técnica</h3>
              <p>Escultura do volume real, garantindo que o visual funcione no seu dia a dia.</p>
            </div>
            <div className="card reveal stagger-3">
              <span className="tech-emoji">🪞</span>
              <h3>Visagismo</h3>
              <p>Harmonização do corte com o formato do seu rosto e sua personalidade.</p>
            </div>
          </div>
        </div>
      </section>
      {/* ── Como Chegar ── */}
      <section className="section-padding" style={{ background: 'var(--bg-warm)' }}>
        <div className="container">
          <div className="text-center reveal mb-4">
            <h2 className="heading-md">Como Chegar</h2>
            <p className="paragraph-md" style={{ marginTop: '0.5rem' }}>
              Studio do Jon · R. Belmiro Braga, 544 · Caiçaras · Belo Horizonte, MG · CEP 30770-550
            </p>
          </div>
          <div className="reveal" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--rule)', boxShadow: '0 8px 32px rgba(26,19,16,0.08)' }}>
            <iframe
              src="https://maps.google.com/maps?q=Rua+Belmiro+Braga,+544,+Cai%C3%A7aras,+Belo+Horizonte+-+MG&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="450"
              style={{ border: 0, display: 'block' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização do Studio do Jon — Rua Belmiro Braga, 544, Caiçaras, Belo Horizonte"
            />
          </div>
          <p className="text-center paragraph-md" style={{ marginTop: '1.5rem', color: 'var(--muted)' }}>
            📍 Bairro Caiçaras · BH · Próximo ao metrô Gameleira
          </p>
        </div>
      </section>

      <section className="about-cta-bottom section-padding">
        <div className="container text-center reveal">
          <h2 className="heading-lg mb-2">Venha viver essa experiência</h2>
          <p className="paragraph-lg mb-4 max-w-md mx-auto">
            Meu Studio no Caiçaras está pronto para receber você e seus cachos.
          </p>
          <Link to="/agendar" className="btn btn-primary">
            Garantir meu horário agora
          </Link>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
