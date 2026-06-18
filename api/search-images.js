export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Parâmetro query é obrigatório' });
  }

  const normalized = query.toLowerCase();

  // Curated database of premium stock photos to bypass rate-limiting and 401 Unsplash errors
  const imagesDb = {
    oleo: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617897903246-719242758050?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1615396899839-c99c121888b0?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80'
    ],
    shampoo: [
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519735000599-4d47340c3c67?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'
    ],
    condicionador: [
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80'
    ],
    mascara: [
      'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1629732047847-50b7ecf0cbf1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1631730359575-38e4755d772b?w=600&auto=format&fit=crop&q=80'
    ],
    finalizador: [
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80'
    ],
    escova: [
      'https://images.unsplash.com/photo-1590156546746-c58a8d162410?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1593114183097-f7b59c61bdef?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80'
    ],
    default: [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80'
    ]
  };

  let category = 'default';

  if (normalized.includes('oleo') || normalized.includes('óleo') || normalized.includes('argan') || normalized.includes('pinga')) {
    category = 'oleo';
  } else if (normalized.includes('shampoo') || normalized.includes('co-wash')) {
    category = 'shampoo';
  } else if (normalized.includes('condicionador')) {
    category = 'condicionador';
  } else if (normalized.includes('mascara') || normalized.includes('máscara') || normalized.includes('cream') || normalized.includes('morte')) {
    category = 'mascara';
  } else if (normalized.includes('escova') || normalized.includes('pente') || normalized.includes('fitagem') || normalized.includes('acessorio') || normalized.includes('acessório')) {
    category = 'escova';
  } else if (normalized.includes('finalizador') || normalized.includes('gelatina') || normalized.includes('gel') || normalized.includes('mousse') || normalized.includes('juba') || normalized.includes('crespos') || normalized.includes('ondas') || normalized.includes('spray')) {
    category = 'finalizador';
  }

  const urls = imagesDb[category];

  return res.status(200).json({ urls });
}
