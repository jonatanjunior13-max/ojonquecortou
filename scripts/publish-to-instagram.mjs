import dotenv from 'dotenv';
dotenv.config();

const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
const igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

const imageUrls = [
  'https://www.ojonquecortou.com.br/carousels/01-09/slide-1.jpg',
  'https://www.ojonquecortou.com.br/carousels/01-09/slide-2.jpg',
  'https://www.ojonquecortou.com.br/carousels/01-09/slide-3.jpg',
  'https://www.ojonquecortou.com.br/carousels/01-09/slide-4.jpg',
  'https://www.ojonquecortou.com.br/carousels/01-09/slide-5.jpg',
  'https://www.ojonquecortou.com.br/carousels/01-09/slide-6.jpg',
  'https://www.ojonquecortou.com.br/carousels/01-09/slide-7.jpg',
  'https://www.ojonquecortou.com.br/carousels/01-09/slide-8.jpg',
  'https://www.ojonquecortou.com.br/carousels/01-09/slide-9.jpg'
];

const caption = `O erro de 30 segundos no banho que está quebrando o seu cacho pelo meio.

Como pentear cabelo cacheado sem quebrar é uma das dúvidas que mais chegam no estúdio — e a maioria das pessoas acha que o cabelo parou de crescer quando, na verdade, está sendo partido na escova.

Imagina o cenário: você entra no chuveiro com pressa, apoia o pente direto no topo da cabeça e puxa com força até a ponta. Você escuta aquele estalo seco e vê uma maçaroca de fios na mão.

O que acabou de acontecer ali foi quebra mecânica por acúmulo de nós.

Quando você puxa da raiz para baixo, você não está desembaraçando. Você está varrendo todos os micro-nós soltos da cabeça e empurrando tudo para o mesmo ponto, criando uma barreira impenetrável nas pontas. Quando a escova trava nesse bolo e você força a mão, o fio ultrapassa o limite de elasticidade da queratina e se parte no meio.

O jeito que protege o seu comprimento:

- Água e emoliência sempre: nunca passe pente em fio seco ou sem produto. O condicionador ou a máscara criam a película que reduz o atrito e permite que as fibras escorreguem.
- A regra dos três terços: comece desembaraçando os últimos 5 centímetros das pontas. Quando estiver livre, solte o meio. Só no final passe o pente desde a raiz.
- Dedos antes da ferramenta: use as mãos para abrir os nós maiores antes de entrar com qualquer escova.

Seu couro cabeludo trabalha todo mês para entregar comprimento. Não seja você a pessoa que decapita esse resultado no box por pura pressa.

Manda esse post pra amiga que vive reclamando que o cacho dela não sai do lugar e vive puxando a raiz na força bruta.

Especialista em corte para cabelos ondulados, cacheados e crespos com foco em visagismo em Belo Horizonte.

#cachos #cachosbrasil #cacheadas #curlygirls #curls`;

async function publish() {
  if (!accessToken || !igAccountId) {
    console.error('Erro: INSTAGRAM_ACCESS_TOKEN ou INSTAGRAM_BUSINESS_ACCOUNT_ID ausente no .env');
    process.exit(1);
  }

  console.log('Iniciando publicação no Instagram (@ojonquecortou)...');
  const itemIds = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const createUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media`;
    const resp = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: url,
        is_carousel_item: true,
        access_token: accessToken
      })
    });
    const data = await resp.json();
    if (data.error) {
      console.error(`Erro ao criar slide ${i + 1}:`, data.error);
      process.exit(1);
    }
    console.log(`✓ Slide ${i + 1}/9 registrado: ID ${data.id}`);
    itemIds.push(data.id);
  }

  console.log('Criando container do carrossel completo...');
  const createCarouselUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media`;
  const cResp = await fetch(createCarouselUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: itemIds,
      caption: caption,
      access_token: accessToken
    })
  });
  const cData = await cResp.json();
  if (cData.error) {
    console.error('Erro ao criar carrossel:', cData.error);
    process.exit(1);
  }
  const creationId = cData.id;
  console.log(`✓ Container do carrossel pronto: ID ${creationId}`);

  console.log('Publicando carrossel no feed...');
  const publishUrl = `https://graph.facebook.com/v20.0/${igAccountId}/media_publish`;
  const pResp = await fetch(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: accessToken
    })
  });
  const pData = await pResp.json();
  if (pData.error) {
    console.error('Erro ao publicar carrossel:', pData.error);
    process.exit(1);
  }

  console.log('🎉 Carrossel publicado com sucesso no Instagram!');
  console.log('Post ID:', pData.id);
}

publish().catch(e => { console.error(e); process.exit(1); });
