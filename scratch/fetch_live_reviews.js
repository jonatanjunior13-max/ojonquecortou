fetch('https://www.ojonquecortou.com.br/api/reviews')
  .then(res => res.json())
  .then(data => console.log('Live Reviews API result:', JSON.stringify(data, null, 2)))
  .catch(console.error);
