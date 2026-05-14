import React from 'react';
import SEO from '../components/SEO';
import './Gallery.css';

const galleryImages = [
  {
    id: 101,
    url: '/corte-a-seco-cachos-definidos-bh.jpg',
    title: 'Corte a Seco Visagista',
    description: 'Análise de curvatura antes da tesoura. Definição absoluta para cachos tipo 3.'
  },
  {
    id: 102,
    url: '/especialista-em-cabelo-cacheado-resultado.jpg',
    title: 'Leitura de Fio Realizada',
    description: 'Harmonia entre volume e definição. Resultado de um corte que respeita o histórico do fio.'
  },
  {
    id: 103,
    url: '/corte-masculino-crespo-estilizado-bh.png',
    title: 'Mohawk Crespo Estilizado',
    description: 'Design técnico para crespos (4A/B). Geometria e atitude com foco em visagismo.'
  },
  {
    id: 104,
    url: '/visagismo-cabelo-cacheado-grisalho.jpg',
    title: 'Valorização de Grisalhos',
    description: 'Corte moderno para realçar a textura e o brilho natural dos cachos maduros.'
  },
  {
    id: 105,
    url: '/finalizacao-cachos-ondulados-bh.jpg',
    title: 'Ondulados com Definição',
    description: 'Técnica de finalização que elimina o frizz excessivo e realça as ondas 2C.'
  },
  {
    id: 1,
    url: '/gallery-1.png',
    title: 'Transformação 3B',
    description: 'Corte técnico para definição máxima e controle de frizz.'
  },
  {
    id: 2,
    url: '/gallery-2.png',
    title: 'Afro Power 4A',
    description: 'Volume e geometria respeitando a estrutura do fio crespo.'
  },
  {
    id: 3,
    url: '/gallery-3.png',
    title: 'Shaggy Masculino',
    description: 'Estilo e praticidade para cachos 2C/3A.'
  },
  {
    id: 4,
    url: '/gallery-4.png',
    title: 'Wolf Cut 3C',
    description: 'Camadas estratégicas para movimento e atitude selvagem.'
  },
  {
    id: 5,
    url: '/blog-shag-capa.webp',
    title: 'Shag Moderno',
    description: 'O corte tendência de 2026 para cabelos ondulados.'
  },
  {
    id: 6,
    url: '/blog-wolf-capa.webp',
    title: 'Geometria de Cachos',
    description: 'Equilíbrio de volume e silhueta visagista.'
  }
];

const GalleryPage = () => {
  return (
    <main className="gallery-page">
      <SEO 
        title="Resultados Reais | Galeria de Cachos e Crespos Studio do Jon" 
        description="Confira as transformações reais do Studio do Jon em Belo Horizonte. Galeria de fotos de cortes técnicos em cabelos ondulados, cacheados e crespos." 
      />
      
      <section className="gallery-hero">
        <div className="container">
          <h1 className="heading-xl reveal active">Resultados Reais</h1>
          <p className="paragraph-lg reveal active stagger-1">
            Não é mágica, é leitura de fio. Cada foto aqui é o resultado de uma análise técnica que respeita a identidade de cada curvatura.
          </p>
        </div>
      </section>

      <section className="gallery-section section-padding">
        <div className="container">
          <div className="gallery-grid">
            {galleryImages.map((item, index) => (
              <div key={item.id} className={`gallery-item reveal active stagger-${(index % 4) + 1}`}>
                <div className="gallery-img-wrap">
                  <img src={item.url} alt={item.title} className="gallery-img" />
                  <div className="gallery-overlay">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="gallery-cta text-center reveal active mt-4">
            <h2 className="heading-lg mb-2">Pronta para sua transformação?</h2>
            <p className="paragraph-md mb-4">Seu cabelo merece um corte que entenda a linguagem dele.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="http://trinks.com/ojonquecortou" target="_blank" rel="noreferrer" className="btn btn-primary">
                Agendar Horário
              </a>
              <a href="https://wa.me/553135866673" target="_blank" rel="noreferrer" className="btn btn-outline">
                Falar com Especialista
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default GalleryPage;
