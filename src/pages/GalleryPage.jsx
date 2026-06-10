import React from 'react';
import SEO from '../components/SEO';
import './Gallery.css';

const galleryImages = [
  {
    id: 170,
    url: '/cachos-curtos-definidos-bh.webp',
    title: 'Cachos Curtos Definidos',
    description: 'Corte curto valorizando a textura e moldura facial natural.'
  },
  {
    id: 171,
    url: '/cachos-longos-castanhos-bh.webp',
    title: 'Cachos Longos Clássicos',
    description: 'Cachos longos e escuros com movimento e definição uniforme.'
  },
  {
    id: 172,
    url: '/corte-ondulado-ruivo-bh.webp',
    title: 'Franja Ondulada e Cor',
    description: 'Corte médio com franja despojada em tom ruivo acobreado brilhante.'
  },
  {
    id: 173,
    url: '/cabelo-longo-ondulado-bh.webp',
    title: 'Longo Ondulado Natural',
    description: 'Corte de cabelo ondulado longo, trazendo leveza e caimento perfeito.'
  },
  {
    id: 174,
    url: '/cachos-medios-volumosos-bh.webp',
    title: 'Cachos Médios com Volume',
    description: 'Volume empoderado e definição marcante em cachos médios estruturados.'
  },
  {
    id: 160,
    url: '/cachos-masculinos-longos.webp',
    title: 'Masculino Longo Definido',
    description: 'Cabelo cacheado longo masculino com definição e contorno impecáveis.'
  },
  {
    id: 161,
    url: '/cabelo-curto-platinado.webp',
    title: 'Curto Platinado Ousado',
    description: 'Pixie platinado em textura ondulada natural, super moderno e estiloso.'
  },
  {
    id: 162,
    url: '/cachos-ruivos-definicao.webp',
    title: 'Ruivo Acobreado Vibrante',
    description: 'Curvatura definida com tonalidade ruiva quente e brilhante.'
  },
  {
    id: 163,
    url: '/corte-crespo-com-volume.webp',
    title: 'Crespo Iluminado Volumoso',
    description: 'Corte arredondado valorizando o volume e trazendo iluminação dourada sutil.'
  },
  {
    id: 164,
    url: '/cachos-longos-acobreados.webp',
    title: 'Longos Acobreados Definidos',
    description: 'Cachos longos e saudáveis com brilho e cor acobreada natural.'
  },
  {
    id: 150,
    url: '/cachos-longos-luzes.webp',
    title: 'Cachos Longos e Iluminados',
    description: 'Cachos longos e volumosos com iluminação sutil. Definição impecável vista de costas.'
  },
  {
    id: 151,
    url: '/cachos-longos-sorriso-bh.webp',
    title: 'Sorriso e Definição',
    description: 'Cachos longos e naturais moldurando o rosto com leveza e movimento.'
  },
  {
    id: 152,
    url: '/cachos-medios-definidos.webp',
    title: 'Volume e Harmonia',
    description: 'Corte médio visagista que valoriza o volume natural e a definição dos cachos.'
  },
  {
    id: 153,
    url: '/corte-pixie-cacheado.webp',
    title: 'Pixie Cut Cacheado',
    description: 'Corte curto moderno e cheio de personalidade para valorizar a curvatura natural.'
  },
  {
    id: 154,
    url: '/corte-curto-grisalho.webp',
    title: 'Grisalho com Estilo',
    description: 'Cachos grisalhos curtos definidos e cheios de vida, unindo modernidade e sofisticação.'
  },
  {
    id: 130,
    url: '/cachos-masculino-luzes-mel-frente.webp',
    title: 'Masculino com Luzes Mel',
    description: 'Cachos curtos masculinos com iluminação mel. Volume controlado e estilo marcante.'
  },
  {
    id: 131,
    url: '/cachos-masculino-undercut-lateral.webp',
    title: 'Undercut Cacheado Lateral',
    description: 'Vista lateral de undercut em cachos com luzes mel. Design que valoriza a curvatura superior.'
  },
  {
    id: 132,
    url: '/coloracao-ruivo-cachos-explosao.webp',
    title: 'Ruivo Explosão de Cor',
    description: 'Coloração ruiva intensa em cachos soltos. Brilho e definição do couro à ponta.'
  },
  {
    id: 133,
    url: '/cachos-longos-castanhos-definidos.webp',
    title: 'Longos com Definição Perfeita',
    description: 'Cachos longos castanhos vistos de lado. Camadas e leveza para um resultado natural e vibrante.'
  },
  {
    id: 134,
    url: '/cachos-escuros-sorridentes-estudio.webp',
    title: 'Cachos Escuros Iluminados',
    description: 'Cachos médios escuros com reflexos naturais. Corte que moldura o rosto com elegância.'
  },
  {
    id: 135,
    url: '/cachos-longos-castanhos-sorriso.webp',
    title: 'Cachos Longos com Sorriso',
    description: 'Cachos longos e saudáveis com definição natural. Resultado de um corte técnico a seco.'
  },
  {
    id: 136,
    url: '/cachos-infantil-definidos-estudio.webp',
    title: 'Cachinhos Infantis Definidos',
    description: 'Corte especializado para os pequenos. Cachos infantis com forma e definição preservadas.'
  },
  {
    id: 137,
    url: '/corte-curto-ondulado-jeans-bh.webp',
    title: 'Curto Ondulado Moderno',
    description: 'Corte curto feminino em ondulados. Leveza e forma para um visual descomplicado e atual.'
  },
  {
    id: 138,
    url: '/cachos-curtos-mechas-douradas.webp',
    title: 'Curto com Mechas Douradas',
    description: 'Cachos curtos com mechas douradas estratégicas. Volume e brilho em perfeita harmonia.'
  },
  {
    id: 120,
    url: '/corte-curto-cacheado-feminino-visagismo.webp',
    title: 'Corte Curto com Visagismo',
    description: 'Design personalizado para realçar os traços faciais em cabelos curtos tipo 3.'
  },
  {
    id: 121,
    url: '/curto-cacheado-ruivo-estilo-bh.webp',
    title: 'Ruivo Curto de Atitude',
    description: 'Coloração copper vibrante em corte curto estruturado com definição estratégica.'
  },
  {
    id: 122,
    url: '/corte-moderno-cabelo-ondulado-curto.webp',
    title: 'Ondulado Curto e Moderno',
    description: 'Leveza e movimento para quem busca um visual prático, elegante e versátil.'
  },
  {
    id: 123,
    url: '/corte-masculino-cacheado-bh-resultado.webp',
    title: 'Cacheado Masculino',
    description: 'Manutenção de volume e forma para o homem moderno que valoriza a curvatura natural.'
  },
  {
    id: 124,
    url: '/definicao-extrema-cachos-longos-bh.webp',
    title: 'Definição Máxima de Cachos',
    description: 'Cabelos longos com brilho intenso e forma impecável da raiz às pontas.'
  },
  {
    id: 115,
    url: '/corte-visagista-cachos-bh.webp',
    title: 'Corte Visagista Personalizado',
    description: 'Análise de rosto para criar camadas que favorecem a moldura facial em cachos tipo 3.'
  },
  {
    id: 116,
    url: '/longo-cacheado-natural-bh.webp',
    title: 'Cabelos Longos e Definidos',
    description: 'Manutenção de saúde e brilho in curvaturas naturais com corte estratégico.'
  },
  {
    id: 117,
    url: '/mechas-vermelhas-cabelo-curto-cacheado.webp',
    title: 'Short Curly com Mechas',
    description: 'Estilo moderno com iluminação vermelha para destacar o movimento do corte curto.'
  },
  {
    id: 118,
    url: '/volume-afro-crespo-bh.webp',
    title: 'Poder do Afro',
    description: 'Valorização do volume natural com corte geométrico para crespos e afros.'
  },
  {
    id: 119,
    url: '/cabelo-ondulado-ruivo-especialista.webp',
    title: 'Ruivo Ondulado',
    description: 'Coloração personalizada e corte que realça as ondas naturais sem perder o comprimento.'
  },
  {
    id: 110,
    url: '/cabelo-cacheado-longo-definicao-bh.webp',
    title: 'Cachos Longos and Saudáveis',
    description: 'Manutenção de comprimento com corte técnico para redução de peso e aumento de definição.'
  },
  {
    id: 111,
    url: '/mechas-em-cabelo-cacheado-visagismo-bh.webp',
    title: 'Iluminação Visagista',
    description: 'Mechas criadas estrategicamente para valorizar o rosto e a curvatura natural.'
  },
  {
    id: 112,
    url: '/resultado-mechas-cachos-definidos.webp',
    title: 'Design de Mechas e Brilho',
    description: 'Contraste e luminosidade em cabelos cacheados com foco total na saúde da fibra.'
  },
  {
    id: 113,
    url: '/corte-curto-cacheado-com-mechas-bh.webp',
    title: 'Curto Iluminado',
    description: 'Praticidade e estilo moderno com mechas pontuais em corte curto estruturado.'
  },
  {
    id: 114,
    url: '/especialista-em-cachos-curto-resultado.webp',
    title: 'Corte Curto Visagista',
    description: 'Resultado de um design focado em praticidade e estilo para curvaturas 3B/C.'
  },
  {
    id: 106,
    url: '/corte-masculino-cachos-com-luzes-bh.webp',
    title: 'Cachos com Luzes',
    description: 'Corte visagista masculino para realçar a iluminação técnica e o volume superior.'
  },
  {
    id: 107,
    url: '/coloracao-cachos-vermelhos-especialista.webp',
    title: 'Explosão de Cor',
    description: 'Coloração em cachos tipo 3. Saúde do fio mantida com brilho e definição vibrante.'
  },
  {
    id: 108,
    url: '/volume-cabelo-crespo-vermelho-resultado.webp',
    title: 'Arquitetura de Volume',
    description: 'Corte estruturado para cabelos crespos coloridos, focando em forma e equilíbrio.'
  },
  {
    id: 109,
    url: '/corte-curto-cacheado-feminino-bh.webp',
    title: 'Curto Moderno e Prático',
    description: 'Design de cacho curto para facilitar a rotina sem perder o estilo visagista.'
  },
  {
    id: 101,
    url: '/corte-a-seco-cachos-definidos-bh.webp',
    title: 'Corte a Seco Visagista',
    description: 'Análise de curvatura antes da tesoura. Definição absoluta para cachos tipo 3.'
  },
  {
    id: 102,
    url: '/especialista-em-cabelo-cacheado-resultado.webp',
    title: 'Leitura de Fio Realizada',
    description: 'Harmonia entre volume e definição. Resultado de um corte que respeita o histórico do fio.'
  },
  {
    id: 103,
    url: '/corte-masculino-crespo-estilizado-bh.webp',
    title: 'Mohawk Crespo Estilizado',
    description: 'Design técnico para crespos (4A/B). Geometria e atitude com foco in visagismo.'
  },
  {
    id: 104,
    url: '/visagismo-cabelo-cacheado-grisalho.webp',
    title: 'Valorização de Grisalhos',
    description: 'Corte moderno para realçar a textura e o brilho natural dos cachos maduros.'
  },
  {
    id: 105,
    url: '/finalizacao-cachos-ondulados-bh.webp',
    title: 'Ondulados com Definição',
    description: 'Técnica de finalização que elimina o frizz excessivo e realça as ondas 2C.'
  }
];

const GalleryPage = () => {
  return (
    <main className="gallery-page">
      <SEO 
        title="Cortes de Cabelos Cacheados BH | Antes e Depois | Studio do Jon" 
        description="Veja fotos reais de antes e depois de cortes de cabelos cacheados, crespos e ondulados feitos pelo especialista Jon em Belo Horizonte. Inspire-se!" 
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
                  <img src={item.url} alt={`${item.title} — ${item.description} no Studio do Jon em Belo Horizonte`} className="gallery-img" />
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
              <a href="/agendar" className="btn btn-primary">
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
