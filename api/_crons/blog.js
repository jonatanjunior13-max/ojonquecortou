// Automação de blog desativada — geração de posts agora é feita
// diretamente pelo assistente de IA (Antigravity) via tarefa agendada,
// que gera o texto, a imagem e publica no Firestore automaticamente.
// Este endpoint está reservado para uso futuro ou chamadas manuais de emergência.

export default async function handler(req, res) {
  return res.status(200).json({
    message: 'A geração automática de posts agora é gerenciada pelo assistente de IA. Este endpoint está desativado.'
  });
}
