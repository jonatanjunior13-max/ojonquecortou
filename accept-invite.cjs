const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const keyPath = path.join('C:', 'Users', 'jonat', 'Downloads', 'extreme-cable-425610-j1-e387bfebdf02.json');

async function main() {
  console.log("Lendo credenciais do arquivo:", keyPath);
  if (!fs.existsSync(keyPath)) {
    console.error("Arquivo JSON não encontrado!");
    return;
  }
  
  const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  
  const auth = new google.auth.JWT(
    keyFile.client_email,
    null,
    keyFile.private_key,
    ['https://www.googleapis.com/auth/business.manage']
  );

  console.log("Autenticando...");
  await auth.authorize();
  console.log("Autenticado com sucesso!");

  const accountId = '10674996025577230390';

  console.log(`Buscando convites pendentes para a conta: ${accountId}...`);
  
  const tokenInfo = await auth.authorize();
  const accessToken = tokenInfo.access_token;

  const invitationsUrl = `https://mybusinessaccountmanagement.googleapis.com/v1/accounts/${accountId}/invitations`;
  
  console.log("Chamando URL:", invitationsUrl);
  const response = await fetch(invitationsUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log("Resposta da listagem de convites:", JSON.stringify(data, null, 2));

  if (data.invitations && data.invitations.length > 0) {
    for (const invite of data.invitations) {
      console.log(`Aceitando convite: ${invite.name} (${invite.role})...`);
      const acceptUrl = `https://mybusinessaccountmanagement.googleapis.com/v1/${invite.name}:accept`;
      
      const acceptRes = await fetch(acceptUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      });

      if (acceptRes.ok) {
        console.log(`Convite ${invite.name} ACEITO com sucesso!`);
      } else {
        const errText = await acceptRes.text();
        console.error(`Erro ao aceitar convite: ${errText}`);
      }
    }
  } else {
    console.log("Nenhum convite pendente foi retornado pela API para essa conta.");
  }
}

main().catch(console.error);
