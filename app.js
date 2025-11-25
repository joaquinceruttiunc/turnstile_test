// El callback se ejecuta cuando Turnstile genera el token
function onTurnstileSuccess(token) {
  console.log("Token generado:", token);
}

const form = document.getElementById("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Tomamos el token que genera Turnstile automáticamente
  const input = document.querySelector('input[name="cf-turnstile-response"]');
  const token = input ? input.value : null;

  if (!token) {
    alert('No se encontró token de Turnstile. Asegúrate de que el widget cargó correctamente.');
    return;
  }

  console.log("Enviando token:", token);

  try {
    const res = await fetch("/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} - ${text}`);
    }

    // Protegernos contra respuestas vacías o no-JSON que causen JSON.parse errors
    const contentType = res.headers.get('content-type') || '';
    const contentLength = res.headers.get('content-length');

    if (contentLength === '0') {
      throw new Error('Respuesta vacía del servidor');
    }

    if (!contentType.includes('application/json')) {
      // intentar leer como texto y mostrarlo para depuración
      const text = await res.text();
      try {
        // intentar parsear por si acaso es JSON sin el header correcto
        const maybe = JSON.parse(text);
        console.log('Respuesta del servidor (parsed):', maybe);
        alert(JSON.stringify(maybe, null, 2));
      } catch (e) {
        throw new Error('Se recibió respuesta no-JSON: ' + text);
      }
    } else {
      const data = await res.json();
      console.log("Respuesta del servidor:", data);
      alert(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(err);
    alert('Error verificando Turnstile: ' + err.message);
  }
});
