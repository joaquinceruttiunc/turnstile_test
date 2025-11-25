// El callback se ejecuta cuando Turnstile genera el token
function onTurnstileSuccess(token) {
  console.log("Token generado:", token);
}

const form = document.getElementById("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Tomamos el token que genera Turnstile automáticamente
  const token = document.querySelector('input[name="cf-turnstile-response"]').value;

  console.log("Enviando token:", token);

  const res = await fetch("/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
  });

  const data = await res.json();
  console.log("Respuesta del servidor:", data);

  alert(JSON.stringify(data, null, 2));
});
