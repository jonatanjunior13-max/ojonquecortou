fetch('https://www.ojonquecortou.com.br')
  .then(r => r.text())
  .then(html => {
    console.log('Includes G-2HCS01RSP2:', html.includes('G-2HCS01RSP2'));
  });
