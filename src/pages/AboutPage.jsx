import React from 'react';
import About from '../components/About';

const AboutPage = () => {
  return (
    <main className="page-container pt-20">
      <About />
      <section className="section-padding container">
        <div className="glass-panel p-6 rounded-lg">
          <h3 className="heading-md mb-2 text-magenta">Nossa Filosofia</h3>
          <p className="text-gray mb-2">
            A beleza premium não está apenas no resultado, mas em cada detalhe da experiência. 
            Do momento em que você senta na cadeira até a hora de sair, tudo é pensado para o seu 
            conforto, bem-estar e autoestima.
          </p>
          <p className="text-gray">
            (Espaço reservado para mais detalhes da sua história, certificações, prêmios ou jornada profissional que você queira adicionar futuramente).
          </p>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
