import React from 'react';
import { Scissors, Sparkles, Sun } from 'lucide-react';
import './Services.css';

const Services = () => {
  return (
    <section className="services-section section-padding" id="servicos">
      <div className="container">
        <div className="section-header text-center">
          <span className="badge mx-auto">Nossas Especialidades</span>
          <h2 className="heading-lg">Muito além de um corte</h2>
          <p className="paragraph-lg max-w-lg mx-auto">
            Serviços desenhados para realçar a curvatura natural e devolver a saúde dos seus fios.
          </p>
        </div>
        
        <div className="services-grid">
          {/* Service Card 1 */}
          <div className="service-card">
             <div className="service-icon blue-icon">
               <Scissors size={28} />
             </div>
             <h3>Corte Especializado</h3>
             <p className="text-gray">
               Corte a seco ou molhado com técnica exclusiva, visando a arquitetura do seu cacho. Inclui consultoria e finalização.
             </p>
             <div className="service-price">
               <span>A partir de</span>
               <strong>R$ 190</strong>
             </div>
          </div>
          
          {/* Service Card 2 */}
          <div className="service-card featured-card">
             <div className="popular-tag">Mais Buscado</div>
             <div className="service-icon magenta-icon">
               <Sparkles size={28} />
             </div>
             <h3 className="text-white">Tratamento + Corte</h3>
             <p className="text-light-gray">
               A experiência completa. Reposição de nutrientes alinhada ao corte perfeito, devolvendo volume e definição extremas.
             </p>
             <div className="service-price text-white">
               <span>Consulte valores</span>
               <strong>Agende aqui</strong>
             </div>
          </div>
          
          {/* Service Card 3 */}
          <div className="service-card">
             <div className="service-icon blue-icon">
               <Sun size={28} />
             </div>
             <h3>Morena Iluminada e Mechas</h3>
             <p className="text-gray">
               Técnicas exclusivas de clareamento desenhadas para preservar a estrutura e a saúde do seu cacho. Tons sofisticados e iluminados, criados sob medida para o seu tom de pele e estilo.
             </p>
             <div className="service-price">
               <span>Pós-Avaliação</span>
               <strong>Sob Consulta</strong>
             </div>
          </div>
        </div>
        
        <div className="services-cta text-center mt-4">
           <a href="http://trinks.com/ateliedoscachosmg" target="_blank" rel="noreferrer" className="btn btn-primary">
              Ver Todos os Serviços no Trinks
           </a>
        </div>
      </div>
    </section>
  );
};

export default Services;
