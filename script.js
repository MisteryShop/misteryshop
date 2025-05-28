let map;
let coords = null;
let markers = [];
let imagensDaReview = [];
let imagemAtual = 0;

// Cria ou recria todos os marcadores locais armazenados (DESATIVADO)
function carregarMarcadores() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  // localStorage desativado — substituído por backend
}

// Exibe o box com as avaliações daquele local (mantido caso queira adaptar no futuro)
function mostrarBox(listaDeReviews) {
  // Se quiser reusar dados locais, pode reativar esta função
}

// Modal de imagem
function abrirModal(imagemSrcs, index) {
  imagensDaReview = imagemSrcs;
  imagemAtual = index;
  document.getElementById('imagemAmpliada').src = imagensDaReview[imagemAtual];
  document.getElementById('imagemModal').classList.remove('hidden');
}

// Entrada manual
function showCityInput() {
  const section = document.createElement('section');
  section.innerHTML = `
    <div style="text-align:center; margin-top: 10px;">
      <label>Digite sua cidade:</label>
      <input type="text" id="cidadeManual" placeholder="Lisboa">
      <button onclick="buscarCidade()">Buscar</button>
    </div>
  `;
  document.body.insertBefore(section, document.getElementById('map'));
}

async function buscarCidade() {
  const cidade = document.getElementById('cidadeManual').value;
  if (!cidade) return;
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cidade}`);
  const data = await response.json();
  if (data.length > 0) {
    const { lat, lon } = data[0];
    initMap(lat, lon);
  }
}

// Inicializa o mapa
function initMap(lat, lng) {
  map = L.map('map').setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  coords = { lat, lng };
}

// Detecta localização
function detectLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => initMap(position.coords.latitude, position.coords.longitude),
      () => showCityInput()
    );
  } else {
    showCityInput();
  }
}

// Mensagem de sucesso
function mostrarMensagemSucesso() {
  const msg = document.getElementById('mensagemEnviada');
  msg.innerText = "✅ Sua avaliação foi enviada com sucesso!";
  msg.style.display = "block";
  setTimeout(() => {
    msg.style.display = "none";
  }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  detectLocation();

  const scrollBtn = document.getElementById('scrollToForm');
  const formSection = document.getElementById('formulario');

  if (scrollBtn && formSection) {
    scrollBtn.addEventListener('click', () => {
      formSection.scrollIntoView({ behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
      const formTop = formSection.getBoundingClientRect().top;
      if (formTop < window.innerHeight * 0.8) {
        scrollBtn.classList.add('hidden');
      } else {
        scrollBtn.classList.remove('hidden');
      }
    });
  }

  document.getElementById('reviewForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const response = grecaptcha.getResponse();
    if (!response) {
      alert("Por favor, confirme que você não é um robô.");
      return;
    }

    if (!coords) {
      alert("Espere o mapa carregar primeiro.");
      return;
    }

    const fileInput = document.getElementById('foto');
    const file = fileInput.files[0];

    const formData = {
      nomeLugar: document.getElementById('nomeLugar').value,
      atendente: document.getElementById('atendente').value,
      descricao: document.getElementById('descricao').value,
      espaco: document.getElementById('espaco').value,
      atendimento: document.getElementById('atendimento').value,
      comida: document.getElementById('comida').value,
      bebida: document.getElementById('bebida').value,
      preco: document.getElementById('preco').value,
      imageBase64: ""
    };

    const finalizarEnvio = () => {
     const formBody = new FormData();
for (let key in formData) {
  formBody.append(key, formData[key]);
}

fetch("https://script.google.com/macros/s/AKfycbyIQPVmGj7EHmTRLbfQe681wfA3gTDvtbRrOjaGn33fg8DyLEkmQ2lzgMK_Wvsw9LdRKg/exec", {
  method: "POST",
  body: formBody
})
     .then(res => res.text())
.then(text => {
  console.log("Resposta do servidor:", text);
  if (text.includes("OK")) {
    document.getElementById('reviewForm').reset();
    grecaptcha.reset();
    mostrarMensagemSucesso();
    L.marker([coords.lat, coords.lng])
  .addTo(map)
  .bindPopup(`<strong>${formData.nomeLugar}</strong><br>⭐ Enviado com sucesso!`)
  .openPopup();
  } else {
    alert("Erro ao enviar: " + text);
  }
});
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = function () {
        formData.imageBase64 = reader.result;
        finalizarEnvio();
      };
      reader.readAsDataURL(file);
    } else {
      finalizarEnvio();
    }
  });

  document.getElementById('fecharModal').addEventListener('click', () => {
    document.getElementById('imagemModal').classList.add('hidden');
  });

  document.getElementById('anterior').addEventListener('click', () => {
    imagemAtual = (imagemAtual - 1 + imagensDaReview.length) % imagensDaReview.length;
    document.getElementById('imagemAmpliada').src = imagensDaReview[imagemAtual];
  });

  document.getElementById('proxima').addEventListener('click', () => {
    imagemAtual = (imagemAtual + 1) % imagensDaReview.length;
    document.getElementById('imagemAmpliada').src = imagensDaReview[imagemAtual];
  });
});
