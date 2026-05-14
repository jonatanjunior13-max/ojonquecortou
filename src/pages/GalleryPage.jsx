import React from 'react';
import SEO from '../components/SEO';
import './Gallery.css';

const galleryImages = [
  {
    id: 115,
    url: '/corte-visagista-cachos-bh.png',
    title: 'Corte Visagista Personalizado',
    description: 'Análise de rosto para criar camadas que favorecem a moldura facial em cachos tipo 3.'
  },
  {
    id: 116,
    url: '/longo-cacheado-natural-bh.png',
    title: 'Cabelos Longos e Definidos',
    description: 'Manutenção de saúde e brilho em curvaturas naturais com corte estratégico.'
  },
  {
    id: 117,
    url: '/mechas-vermelhas-cabelo-curto-cacheado.png',
    title: 'Short Curly com Mechas',
    description: 'Estilo moderno com iluminação vermelha para destacar o movimento do corte curto.'
  },
  {
    id: 118,
    url: '/volume-afro-crespo-bh.jpg',
    title: 'Poder do Afro',
    description: 'Valorização do volume natural com corte geométrico para crespos e afros.'
  },
  {
    id: 119,
    url: '/cabelo-ondulado-ruivo-especialista.png',
    title: 'Ruivo Ondulado',
    description: 'Coloração personalizada e corte que realça as ondas naturais sem perder o comprimento.'
  },
  {
    id: 110,
    url: '/cabelo-cacheado-longo-definicao-bh.jpg',
    title: 'Cachos Longos e Saudáveis',
    description: 'Manutenção de comprimento com corte técnico para redução de peso e aumento de definição.'
  },
  {
    id: 111,
    url: '/mechas-em-cabelo-cacheado-visagismo-bh.jpg',
    title: 'Iluminação Visagista',
    description: 'Mechas criadas estrategicamente para valorizar o rosto e a curvatura natural.'
  },
  {
    id: 112,
    url: '/resultado-mechas-cachos-definidos.jpg',
    title: 'Design de Mechas e Brilho',
    description: 'Contraste e luminosidade em cabelos cacheados com foco total na saúde da fibra.'
  },
  {
    id: 113,
    url: '/corte-curto-cacheado-com-mechas-bh.jpg',
    title: 'Curto Iluminado',
    description: 'Praticidade e estilo moderno com mechas pontuais em corte curto estruturado.'
  },
  {
    id: 114,
    url: '/especialista-em-cachos-curto-resultado.png',
    title: 'Corte Curto Visagista',
    description: 'Resultado de um design focado em praticidade e estilo para curvaturas 3B/C.'
  },
  {
    id: 106,
    url: '/corte-masculino-cachos-com-luzes-bh.jpg',
    title: 'Cachos com Luzes',
    description: 'Corte visagista masculino para realçar a iluminação técnica e o volume superior.'
  },
  {
    id: 107,
    url: '/coloracao-cachos-vermelhos-especialista.jpg',
    title: 'Explosão de Cor',
    description: 'Coloração em cachos tipo 3. Saúde do fio mantida com brilho e definição vibrante.'
  },
  {
    id: 108,
    url: '/volume-cabelo-crespo-vermelho-resultado.jpg',
    title: 'Arquitetura de Volume',
    description: 'Corte estruturado para cabelos crespos coloridos, focando em forma e equilíbrio.'
  },
  {
    id: 109,
    url: '/corte-curto-cacheado-feminino-bh.jpg',
    title: 'Curto Moderno e Prático',
    description: 'Design de cacho curto para facilitar a rotina sem perder o estilo visagista.'
  },
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
