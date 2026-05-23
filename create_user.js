const fetch = require('node-fetch'); // fetch is available in node 18+ globally, but let's use global fetch

const run = async () => {
  try {
    const res = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBkmKUQs0Nf_oer1Mvwtg_QumzXANX7m0Y", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: "contato@ojonquecortou.com.br",
        password: "7956#Jon",
        returnSecureToken: true
      })
    });
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
};

run();
