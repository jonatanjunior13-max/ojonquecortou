const run = async () => {
  try {
    const res = await fetch("https://www.ojonquecortou.com.br/api/send-email", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientEmail: "contato@ojonquecortou.com.br",
        clientName: "Test",
        type: "horario_confirmado",
        serviceName: "Corte",
        date: "2023-10-10",
        time: "10:00"
      })
    });
    
    // Ler como texto primeiro para ver se Vercel retornou 500 html
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (e) {
    console.error('Error fetching:', e);
  }
};

run();
