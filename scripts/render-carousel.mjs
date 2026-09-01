import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const projectRoot = 'C:\\Users\\jonat\\Documents\\antigravity\\proud-lovelace';

const carousel = {
  id: 'carrossel-01-09',
  title: 'Como pentear cabelo cacheado sem quebrar (O erro da tração pela raiz)',
  coverImage: path.join(projectRoot, 'public', 'blog-embaraco.webp'),
  slides: [
    {
      type: 'cover',
      line1: 'O ERRO NO BANHO',
      line2: 'QUE PARTE SEU CACHO',
      line3: 'o jeito certo de desembaraçar'
    },
    {
      type: 'second_cover',
      line1: 'Seu cabelo não parou de crescer.',
      line2: 'A raiz continua fazendo o trabalho dela.',
      line3: 'É o jeito que você passa o pente que está partindo o fio →'
    },
    {
      type: 'content',
      tag: '01 · O EFEITO ACÚMULO',
      headline: 'Puxar da raiz empurra os nós para a ponta.',
      body: 'Eles se juntam num bloco impenetrável. Na primeira trava, o fio quebra.'
    },
    {
      type: 'content',
      tag: '02 · A FÍSICA DO ATRITO',
      headline: 'Fio seco não estica: ele parte.',
      body: 'Condicionador no banho reduz o atrito. Tentar desembaraçar a seco rasga a cutícula.'
    },
    {
      type: 'content',
      tag: '03 · A CONTA QUE NÃO FECHA',
      headline: 'O cabelo cresce 1cm e quebra 2cm.',
      body: 'Não é falta de crescimento. É a força da sua mão quebrando o comprimento.'
    },
    {
      type: 'content',
      tag: '04 · DE BAIXO PARA CIMA',
      headline: 'Desembarace sempre pelas pontas.',
      body: 'Solte os últimos centímetros primeiro. Suba para o meio e termine na raiz.'
    },
    {
      type: 'content',
      tag: '05 · LEITURA DE RESISTÊNCIA',
      headline: 'A tração que seu fio suporta é individual.',
      body: 'Fio poroso ou descolorido rompe fácil. A escova certa respeita a saúde da fibra.'
    },
    {
      type: 'fecho',
      line1: 'O crescimento acontece na raiz.',
      line2: 'O comprimento é você quem protege no banho.',
      line3: 'Sem pressa e sem força bruta.'
    },
    {
      type: 'cta',
      headline: 'Quantos centímetros você perde na escova?',
      body: 'Manda para a amiga que puxa pela raiz e reclama que o cabelo não cresce.',
      action: 'Salva para a próxima lavagem.'
    }
  ]
};

function generateSlideHtml(slide, index, total, coverBase64) {
  const isCover = slide.type === 'cover';
  const isSecondCover = slide.type === 'second_cover';
  const isFecho = slide.type === 'fecho';
  const isCta = slide.type === 'cta';

  let bgStyle = "background: #0a0a0a;";
  if (isCover && coverBase64) {
    bgStyle = `background: linear-gradient(180deg, rgba(10,10,10,0.2) 0%, rgba(10,10,10,0.1) 45%, rgba(10,10,10,0.92) 80%, #0a0a0a 100%), url('data:image/webp;base64,${coverBase64}') center top / cover no-repeat;`;
  }

  let contentHtml = '';

  if (isCover) {
    contentHtml = `
      <div class="slide-header">
        <span class="slide-brand">STUDIO DO JON</span>
        <span class="slide-counter">01 / 09</span>
      </div>
      <div class="cover-bottom">
        <div class="c-line1">${slide.line1}</div>
        <div class="c-line2">${slide.line2}</div>
        <div class="c-line3">${slide.line3}</div>
      </div>
    `;
  } else if (isSecondCover) {
    contentHtml = `
      <div class="slide-header">
        <span class="slide-brand">MÉTODO LEITURA DE FIO</span>
        <span class="slide-counter">02 / 09</span>
      </div>
      <div class="second-cover-center">
        <div class="sc-line1">${slide.line1}</div>
        <div class="sc-line2">${slide.line2}</div>
        <div class="sc-line3">${slide.line3}</div>
      </div>
      <div class="slide-footer">
        <span>Arraste para entender a física do atrito →</span>
      </div>
    `;
  } else if (isFecho) {
    contentHtml = `
      <div class="slide-header">
        <span class="slide-brand">MÉTODO LEITURA DE FIO</span>
        <span class="slide-counter">08 / 09</span>
      </div>
      <div class="fecho-center">
        <div class="f-line1">${slide.line1}</div>
        <div class="f-line2">${slide.line2}</div>
        <div class="f-line3">${slide.line3}</div>
      </div>
      <div class="slide-footer">
        <span>Studio do Jon · Especialista em Cachos BH</span>
      </div>
    `;
  } else if (isCta) {
    contentHtml = `
      <div class="slide-header">
        <span class="slide-brand">STUDIO DO JON</span>
        <span class="slide-counter">09 / 09</span>
      </div>
      <div class="cta-center">
        <div class="cta-icon">✦</div>
        <div class="cta-title">${slide.headline}</div>
        <div class="cta-body">${slide.body}</div>
        <div class="cta-badge">${slide.action}</div>
      </div>
      <div class="slide-footer">
        <span>@ojonquecortou · Rua Belmiro Braga, 544 · Caiçaras, BH</span>
      </div>
    `;
  } else {
    // Content slide
    contentHtml = `
      <div class="slide-header">
        <span class="slide-tag">${slide.tag}</span>
        <span class="slide-counter">0${index + 1} / 09</span>
      </div>
      <div class="content-center">
        <div class="content-headline">${slide.headline}</div>
        <div class="content-body">${slide.body}</div>
      </div>
      <div class="slide-footer">
        <span>Studio do Jon · Método Leitura de Fio</span>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }
        body {
          width: 1080px;
          height: 1350px;
          ${bgStyle}
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 90px 80px;
          overflow: hidden;
        }
        .slide-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          z-index: 2;
        }
        .slide-brand {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 3px;
          color: #c8852a;
          text-transform: uppercase;
        }
        .slide-tag {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 3px;
          color: #c8852a;
          text-transform: uppercase;
        }
        .slide-counter {
          font-size: 22px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 2px;
        }
        
        /* Cover */
        .cover-bottom {
          margin-top: auto;
          text-align: center;
          z-index: 2;
          padding-bottom: 20px;
        }
        .c-line1 {
          font-size: 64px;
          font-weight: 400;
          letter-spacing: 1px;
          color: #ffffff;
          text-transform: uppercase;
          line-height: 1.15;
          text-shadow: 0 8px 30px rgba(0,0,0,0.9);
        }
        .c-line2 {
          font-size: 68px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #c8852a;
          text-transform: uppercase;
          line-height: 1.15;
          margin-top: 8px;
          margin-bottom: 16px;
          text-shadow: 0 8px 35px rgba(0,0,0,0.95);
        }
        .c-line3 {
          font-size: 34px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: 0.5px;
          text-shadow: 0 4px 15px rgba(0,0,0,0.9);
        }

        /* Second Cover */
        .second-cover-center {
          margin: auto 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sc-line1 {
          font-size: 54px;
          font-weight: 300;
          color: #ffffff;
          line-height: 1.3;
        }
        .sc-line2 {
          font-size: 54px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.3;
        }
        .sc-line3 {
          font-size: 54px;
          font-weight: 700;
          color: #c8852a;
          line-height: 1.3;
          margin-top: 10px;
        }

        /* Content */
        .content-center {
          margin: auto 0;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }
        .content-headline {
          font-size: 62px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.22;
          letter-spacing: -0.5px;
        }
        .content-body {
          font-size: 38px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.82);
          line-height: 1.5;
        }

        /* Fecho */
        .fecho-center {
          margin: auto 0;
          display: flex;
          flex-direction: column;
          gap: 28px;
          text-align: center;
        }
        .f-line1 {
          font-size: 56px;
          font-weight: 400;
          color: #ffffff;
          line-height: 1.3;
        }
        .f-line2 {
          font-size: 56px;
          font-weight: 700;
          color: #c8852a;
          line-height: 1.3;
        }
        .f-line3 {
          font-size: 38px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 10px;
        }

        /* CTA */
        .cta-center {
          margin: auto 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 32px;
        }
        .cta-icon {
          font-size: 64px;
          color: #c8852a;
        }
        .cta-title {
          font-size: 58px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.25;
          max-width: 900px;
        }
        .cta-body {
          font-size: 36px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.45;
          max-width: 850px;
        }
        .cta-badge {
          display: inline-block;
          margin-top: 16px;
          background: #c8852a;
          color: #0a0a0a;
          font-size: 32px;
          font-weight: 700;
          padding: 20px 48px;
          border-radius: 60px;
          letter-spacing: 0.5px;
        }

        /* Footer */
        .slide-footer {
          width: 100%;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 28px;
          display: flex;
          justify-content: space-between;
          font-size: 22px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.45);
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      ${contentHtml}
    </body>
    </html>
  `;
}

async function renderCarouselImages() {
  const outputDir = path.join(projectRoot, 'public', 'carousels', '01-09');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const coverImagePath = path.join(projectRoot, 'public', 'blog-embaraco.webp');
  let coverBase64 = '';
  if (fs.existsSync(coverImagePath)) {
    coverBase64 = fs.readFileSync(coverImagePath).toString('base64');
  }

  console.log('Iniciando Puppeteer para renderizar 9 slides em 1080x1350px...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });

  const generatedFiles = [];

  for (let i = 0; i < carousel.slides.length; i++) {
    const slide = carousel.slides[i];
    const html = generateSlideHtml(slide, i, carousel.slides.length, coverBase64);
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    const fileName = `slide-${i + 1}.jpg`;
    const filePath = path.join(outputDir, fileName);
    
    await page.screenshot({
      path: filePath,
      type: 'jpeg',
      quality: 95
    });

    console.log(`✓ Slide ${i + 1}/9 gerado: ${fileName}`);
    generatedFiles.push(filePath);
  }

  await browser.close();
  console.log('Todos os 9 slides foram gerados com sucesso em:', outputDir);
  return generatedFiles;
}

renderCarouselImages().catch(err => {
  console.error('Erro ao renderizar slides:', err);
  process.exit(1);
});
