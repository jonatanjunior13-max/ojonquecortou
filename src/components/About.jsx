import React from 'react';
import './About.css';

const About = () => {
  return (
    <section className="about-section section-padding" id="sobre">
      <div className="container about-container">
        <div className="about-visual">
          <div className="image-wrapper">
             <div className="main-photo" style={{ overflow: 'hidden' }}>
                <img src="/jon-trabalhando.jpg" alt="Jon trabalhando em atendimento" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             </div>
             <div className="experience-badge glass-panel">
               <span className="exp-number text-magenta">8+</span>
               <span className="exp-text">Anos de<br/>Experiência</span>
             </div>
          </div>
        </div>
        
        <div className="about-content">
          <h2 className="heading-lg mb-1">
            Muito prazer,<br/>
            Eu sou o <span className="text-magenta">Jon</span>.
          </h2>
          <div className="title-underline"></div>
          
          <p className="paragraph-lg mt-2">
            Acredito que o seu cabelo ondulado, cacheado ou crespo não é um "problema" a ser resolvido, mas uma potência a ser celebrada. 
          </p>
          <p className="paragraph-lg">
            Transformei minha própria jornada com os fios naturais em uma metodologia de corte que respeita a curvatura, o volume e o estilo de vida de cada cliente. Aqui, unimos ciência capilar com acolhimento para que você saia amando o que vê no espelho.
          </p>
          
          <ul className="about-list">
            <li>
              <div className="list-icon">✓</div>
              <span>Corte com técnica respeitando a curvatura real</span>
            </li>
            <li>
              <div className="list-icon">✓</div>
              <span>Consultoria personalizada de finalização</span>
            </li>
            <li>
              <div className="list-icon">✓</div>
              <span>Ambiente acolhedor e sem julgamentos</span>
            </li>
          </ul>

          <div className="mt-4">
             <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary">
                Agendar com o Jon
             </a>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
};

export default About;
