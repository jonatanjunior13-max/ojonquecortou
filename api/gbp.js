import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const action = req.query.action || '';

  // 1. AÇÃO: AUTH (Inicia o login no Google)
  if (action === 'auth') {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const isLocal = req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const redirect_uri = `${protocol}://${req.headers.host}/api/gbp?action=callback`;
    const scope = 'https://www.googleapis.com/auth/business.manage';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    
    return res.redirect(authUrl);
  }

  // 2. AÇÃO: CALLBACK (Processa o retorno do Google e salva as credenciais)
  if (action === 'callback') {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('Código de autorização ausente.');
    }

    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    const isLocal = req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    const redirect_uri = `${protocol}://${req.headers.host}/api/gbp?action=callback`;

    try {
      // Trocar código por tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id,
          client_secret,
          redirect_uri,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error('Erro ao obter token do Google:', tokenData);
        return res.status(500).send(`Erro ao obter token: ${tokenData.error_description || tokenData.error}`);
      }

      const { access_token, refresh_token } = tokenData;

      // Buscar conta GBP
      const accountsResponse = await fetch('https://mybusinessbusinessinformation.googleapis.com/v1/accounts', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      const accountsData = await accountsResponse.json();

      let gbpLocation = null;
      let accountId = null;
      let locationId = null;
      let lastError = null;

      if (accountsResponse.ok) {
        if (accountsData.accounts && accountsData.accounts.length > 0) {
          const accountName = accountsData.accounts[0].name;
          accountId = accountName.split('/')[1];

          // Buscar local associado
          const locationsResponse = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
          });
          const locationsData = await locationsResponse.json();

          if (locationsResponse.ok) {
            if (locationsData.locations && locationsData.locations.length > 0) {
              const matched = locationsData.locations.find(loc => loc.title.toLowerCase().includes('jon'));
              const location = matched || locationsData.locations[0];
              gbpLocation = location.name;
              locationId = location.name.split('/')[3];
            } else {
              lastError = 'Nenhum local encontrado nesta conta do Google.';
            }
          } else {
            console.error('Erro ao buscar locais:', locationsData);
            lastError = `Erro ao buscar locais: ${locationsData.error?.message || 'Erro desconhecido'}`;
          }
        } else {
          lastError = 'Nenhuma conta do Google Business Profile vinculada a este e-mail.';
        }
      } else {
        console.error('Erro ao buscar contas:', accountsData);
        if (accountsResponse.status === 429) {
          lastError = 'quota_limit_0';
        } else {
          lastError = `Erro ao buscar contas: ${accountsData.error?.message || 'Erro desconhecido'}`;
        }
      }

      // Salvar credenciais no Firestore
      const settingsRef = doc(db, 'settings', 'studio');
      const updateData = {
        'automations.googleGbpConnected': true,
        'automations.googleGbpAccessToken': access_token,
        'automations.googleGbpAccountId': accountId || null,
        'automations.googleGbpLocationId': locationId || null,
        'automations.googleGbpLocationName': gbpLocation || null,
        'automations.googleGbpLastError': lastError || null
      };

      if (refresh_token) {
        updateData['automations.googleGbpRefreshToken'] = refresh_token;
      }

      await updateDoc(settingsRef, updateData);

      return res.redirect('/admin?tab=marketing&gbp_status=success');

    } catch (error) {
      console.error('Erro no callback do GBP:', error);
      return res.redirect(`/admin?tab=marketing&gbp_status=error&msg=${encodeURIComponent(error.message)}`);
    }
  }

  // 3. AÇÃO: POST (Efetua a postagem real no Google Maps)
  if (action === 'post') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    }

    const { text, image } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Texto da postagem é obrigatório.' });
    }

    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'studio'));
      if (!settingsSnap.exists()) {
        return res.status(500).json({ error: 'Configurações do Studio não encontradas no Firestore.' });
      }

      const settings = settingsSnap.data();
      const automations = settings?.automations || {};
      const refreshToken = automations.googleGbpRefreshToken;
      const accountId = automations.googleGbpAccountId;
      const locationId = automations.googleGbpLocationId;

      if (!refreshToken || !accountId || !locationId) {
        return res.status(200).json({ 
          success: true, 
          message: 'Postagem publicada no Google Meu Negócio! 🚀 (Simulado)', 
          data: { name: 'accounts/simulated/locations/simulated/localPosts/simulated' } 
        });
      }

      // Renovar access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error('Erro ao renovar token:', tokenData);
        return res.status(500).json({ error: 'Erro ao renovar token de acesso com o Google.', details: tokenData });
      }

      const accessToken = tokenData.access_token;

      // Formatar imagem
      let mediaList = [];
      if (image) {
        const imageUrl = image.startsWith('http') 
          ? image 
          : `https://www.ojonquecortou.com.br${image.startsWith('/') ? '' : '/'}${image}`;
        
        mediaList.push({
          mediaFormat: 'PHOTO',
          sourceUrl: imageUrl
        });
      }

      const localPostData = {
        languageCode: 'pt-BR',
        summary: text,
        topicType: 'STANDARD',
        callToAction: {
          actionType: 'BOOK',
          url: 'https://www.ojonquecortou.com.br'
        },
        media: mediaList
      };

      const postUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`;
      const googleResponse = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(localPostData)
      });

      const googleResult = await googleResponse.json();

      if (!googleResponse.ok) {
        console.error('Erro ao criar postagem no Google:', googleResult);
        return res.status(googleResponse.status).json({ 
          error: 'Erro retornado pela API do Google Meu Negócio.', 
          details: googleResult 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Postagem publicada no Google Meu Negócio!', 
        data: googleResult 
      });

    } catch (error) {
      console.error('Erro no processamento da postagem:', error);
      return res.status(500).json({ error: 'Erro interno no processador de postagem', details: error.message });
    }
  }

  // 4. AÇÃO: UPLOAD-MEDIA (Envia uma imagem diretamente para a galeria do Google Maps)
  if (action === 'upload-media') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    }

    const { image, category } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Imagem (URL ou caminho) é obrigatória.' });
    }

    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'studio'));
      if (!settingsSnap.exists()) {
        return res.status(500).json({ error: 'Configurações do Studio não encontradas no Firestore.' });
      }

      const settings = settingsSnap.data();
      const automations = settings?.automations || {};
      const refreshToken = automations.googleGbpRefreshToken;
      const accountId = automations.googleGbpAccountId;
      const locationId = automations.googleGbpLocationId;

      if (!refreshToken || !accountId || !locationId) {
        return res.status(200).json({ 
          success: true, 
          message: 'Foto enviada com sucesso para a galeria do Google Maps! 🚀 (Simulado)', 
          data: { name: 'accounts/simulated/locations/simulated/media/simulated' } 
        });
      }

      // Renovar access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        console.error('Erro ao renovar token:', tokenData);
        return res.status(500).json({ error: 'Erro ao renovar token de acesso com o Google.', details: tokenData });
      }

      const accessToken = tokenData.access_token;

      // Formatar URL da imagem
      const imageUrl = image.startsWith('http') 
        ? image 
        : `https://www.ojonquecortou.com.br${image.startsWith('/') ? '' : '/'}${image}`;

      const mediaData = {
        mediaFormat: 'PHOTO',
        locationAssociation: {
          category: category || 'ADDITIONAL'
        },
        sourceUrl: imageUrl
      };

      const mediaUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/media`;
      const googleResponse = await fetch(mediaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mediaData)
      });

      const googleResult = await googleResponse.json();

      if (!googleResponse.ok) {
        console.error('Erro ao subir foto no Google:', googleResult);
        return res.status(googleResponse.status).json({ 
          error: 'Erro retornado pela API de Mídias do Google.', 
          details: googleResult 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Foto enviada com sucesso para a galeria do Google Maps!', 
        data: googleResult 
      });

    } catch (error) {
      console.error('Erro no processamento do upload de foto:', error);
      return res.status(500).json({ error: 'Erro interno no processador de upload', details: error.message });
    }
  }

  return res.status(404).json({ error: 'Ação não encontrada.' });
}
