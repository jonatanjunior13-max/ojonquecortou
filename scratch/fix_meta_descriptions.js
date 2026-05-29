import fs from 'fs';

const filePath = 'src/data/posts.js';
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  {
    old: "metaDescription: 'Cronograma capilar para cabelo cacheado começa com diagnóstico — não com produto. Jon explica como ler o fio antes de montar qualquer protocolo. Studio do Jon, BH.',",
    new: "metaDescription: 'Cronograma capilar para cabelo cacheado começa com diagnóstico, não produto. Veja como ler o seu fio antes de montar qualquer protocolo no Studio do Jon, BH.',"
  },
  {
    old: "metaDescription: 'Guia definitivo de produtos para cabelo cacheado em 2026. Jon explica como escolher xampus, finalizadores, evitar excesso de proteína e onde investir seu dinheiro. Studio do Jon, BH.',",
    new: "metaDescription: 'Guia de produtos para cabelo cacheado em 2026. Aprenda a escolher xampu, finalizador, evitar excesso de proteína e onde investir. Studio do Jon, BH.',"
  },
  {
    old: "metaDescription: 'Cabelo cacheado ressecado que não retém hidratação? Descubra por que isso acontece e como resolver com técnica, não com milagre. Guia completo do Jon que Cortou.',",
    new: "metaDescription: 'Cabelo cacheado ressecado que não retém hidratação? Descubra por que isso acontece e como resolver com técnica, não milagre, no Studio do Jon em BH.',"
  },
  {
    old: "metaDescription: 'pH capilar para cabelos cacheados: entenda como a acidez controla o brilho e a definição. Guia técnico sobre acidificação capilar e saúde do fio com o especialista Jon.',",
    new: "metaDescription: 'pH capilar para cacheados: entenda como a acidez controla o brilho e a definição. Guia sobre acidificação capilar e saúde do fio com o Jon.',"
  },
  {
    old: "metaDescription: 'Cansada de ter a raiz crespa e a nuca lisa? Veja como o corte com leitura de um especialista em cabelo cacheado BH conecta texturas sem deixar buracos no volume.',",
    new: "metaDescription: 'Raiz crespa e nuca lisa? Veja como o corte com leitura de um especialista em cachos em BH conecta texturas e equilibra o volume do seu cabelo.',"
  },
  {
    old: "metaDescription: 'Fez luzes e o cacho esticado? Entenda por que o pó descolorante mata sua curvatura e como um cabeleireiro especialista em cachos Belo Horizonte pode salvar seu fio.',",
    new: "metaDescription: 'Fez luzes e o cacho esticou? Entenda por que a descoloração altera a curvatura e como um especialista em cachos em Belo Horizonte pode salvar seu fio.',"
  },
  {
    old: "metaDescription: 'O efeito pirâmide acabou com o seu volume? Descubra como a leitura de fio e o corte para cabelo cacheado em BH do Studio do Jon devolvem a forma dos seus cachos.',",
    new: "metaDescription: 'Efeito pirâmide no cabelo? Descubra como a leitura de fio e o corte para cabelo cacheado do Studio do Jon em BH devolvem a forma dos seus cachos.',"
  },
  {
    old: "metaDescription: 'Cansada de brigar com o espelho? Entenda por que assumir sua curvatura natural em 2026 é o maior ato de respeito com você mesma. Dicas de transição e corte com o Jon que Cortou.',",
    new: "metaDescription: 'Assumir sua curvatura natural em 2026 é o maior ato de respeito consigo mesma. Dicas exclusivas de transição e corte com o especialista Jon que Cortou.',"
  },
  {
    old: "metaDescription: 'Fizeram buracos no seu volume? Entenda por que o corte a seco para cabelo cacheado exige leitura de fio e como o Studio do Jon conserta a geometria do seu cacho.',",
    new: "metaDescription: 'Buracos no volume? Entenda por que o corte a seco para cabelo cacheado exige leitura de fio e como o Studio do Jon conserta a geometria do seu cacho.',"
  }
];

let replacedCount = 0;
for (const rep of replacements) {
  if (content.includes(rep.old)) {
    content = content.replace(rep.old, rep.new);
    replacedCount++;
  } else {
    console.warn(`WARNING: Target text not found for replacement:\n${rep.old}`);
  }
}

if (replacedCount > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`SUCCESS: Successfully updated ${replacedCount} meta descriptions in posts.js.`);
} else {
  console.error("ERROR: No replacements were made.");
}
