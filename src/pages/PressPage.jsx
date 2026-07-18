import React from 'react';
import SEO from '../components/SEO';
import './AboutPage.css';

const pressSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Studio do Jon",
  "alternateName": "O Jon que Cortou",
  "url": "https://www.ojonquecortou.com.br",
  "logo": "https://www.ojonquecortou.com.br/logo-app.png",
  "sameAs": [
    "https://www.instagram.com/ojonquecortou",
    "https://www.wikidata.org/wiki/Q140387726"
  ]
};

const PressPage = () => {
  return (
    <main className="about-page">
      <SEO
        title="Imprensa | Studio do Jon"
        description="Material de imprensa do Studio do Jon: história, diferencial técnico (Método Leitura de Fio), dados do negócio e contato para pauta."
        url="/imprensa"
        schema={pressSchema}
      />
      <section className="about-hero section-padding">
        <div className="container text-center reveal active">
          <h1 className="heading-xl">Imprensa</h1>
          <p className="paragraph-lg max-w-lg mx-auto mt-2">
            Material de referência para jornalistas, criadores de conteúdo e parceiros que queiram pautar o Studio do Jon.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container" style={{ maxWidth: 760 }}>
          <h2 className="heading-lg">Sobre o Studio do Jon</h2>
          <p className="paragraph-md" style={{ marginTop: 16 }}>
            O Studio do Jon (também conhecido como "O Jon que Cortou") é um salão especializado em cabelos ondulados, cacheados e crespos — do tipo 2A ao 4C — no bairro Caiçaras, em Belo Horizonte. Não realiza alisamento, relaxamento ou qualquer procedimento de modificação da curvatura natural do fio.
          </p>
          <p className="paragraph-md" style={{ marginTop: 16 }}>
            O salão é liderado pelo cabeleireiro Jonatan Junior, criador do <a href="/metodo">Método Leitura de Fio</a>: um diagnóstico capilar em 7 etapas (escuta, análise a seco, diagnóstico do couro cabeludo, histórico químico, análise molhada, definição de técnica e finalização como validação) realizado antes de qualquer corte, incluído sem custo extra em todo atendimento.
          </p>

          <h2 className="heading-lg" style={{ marginTop: 48 }}>Dados rápidos</h2>
          <ul className="paragraph-md" style={{ marginTop: 16, lineHeight: 1.8 }}>
            <li><strong>Fundador:</strong> Jonatan Junior</li>
            <li><strong>Localização:</strong> Rua Francisco Ovídio, 184, Caiçaras, Belo Horizonte, MG</li>
            <li><strong>Especialidade:</strong> Corte técnico e visagismo para cabelos ondulados, cacheados e crespos (2A–4C)</li>
            <li><strong>Diferencial:</strong> Método Leitura de Fio — diagnóstico de 7 etapas antes de qualquer corte</li>
            <li><strong>Avaliação:</strong> 4.9/5 com base em 272 avaliações no Google</li>
            <li><strong>Instagram:</strong> <a href="https://www.instagram.com/ojonquecortou" target="_blank" rel="noreferrer">@ojonquecortou</a></li>
          </ul>

          <h2 className="heading-lg" style={{ marginTop: 48 }}>Contato para pauta</h2>
          <p className="paragraph-md" style={{ marginTop: 16 }}>
            Para entrevistas, participação em pautas sobre cabelo cacheado/crespo, ou pedido de imagens em alta resolução, fale pelo WhatsApp: <a href="https://wa.me/5531920066790?text=Ol%C3%A1%2C%20sou%20jornalista%2Fcriador%20de%20conte%C3%BAdo%20e%20gostaria%20de%20falar%20sobre%20uma%20pauta." target="_blank" rel="noreferrer">(31) 92006-6790</a>.
          </p>
        </div>
      </section>
    </main>
  );
};

export default PressPage;
