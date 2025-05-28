let map;
let coords = null;
let markers = [];
let imagensDaReview = [];
let imagemAtual = 0;

// Adiciona marcador no mapa com múltiplas avaliações
function addOrUpdateMarker(lat, lng, novaReview) {
  let reviewsPorLocal = JSON.parse(localStorage.getItem('reviewsPorLocal') || '[]');
  const posIndex = reviewsPorLocal.findIndex(p =>
    Math.abs(p.coords.lat - lat) < 0.0001 && Math.abs(p.coords.lng - lng) < 0.0001
  );

  if (posIndex !== -1) {
    reviewsPorLocal[posIndex].reviews.push(novaReview);
  } else {
    reviewsPorLocal.push({
      coords: { lat, lng },
      reviews: [novaReview]
    });
  }

  localStorage.setItem('reviewsPorLocal', JSON.stringify(reviewsPorLocal));
  carregarMarcadores();
}

// Cria ou recria todos os marcadores
function carregarMarcadores() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const reviewsPorLocal = JSON.parse(localStorage.getItem('reviewsPorLocal') || '[]');

  reviewsPorLocal.forEach(local => {
    const marker = L.marker([local.coords.lat, local.coords.lng]).addTo(map);

    const todasNotas = local.reviews.map(r => {
      const total = [r.espaco, r.atendimento, r.comida, r.bebida, r.preco].map(Number);
      return total.reduce((a, b) => a + b, 0) / total.length;
    });

    const mediaGeral = (todasNotas.reduce((a, b) => a + b, 0) / todasNotas.length).toFixed(1);

    const popupContent = `
      <div style="text-align:center;">
        <strong>Você está aqui</strong><br>
        ⭐ Nota média: <strong>${mediaGeral}</strong>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.on('click', () => mostrarBox(local.reviews));
    markers.push(marker);
  });
}

// Exibe o box com as avaliações daquele local
function mostrarBox(listaDeReviews) {
  let box = document.getElementById('box-detalhes');
  if (!box) {
    box = document.createElement('section');
    box.id = 'box-detalhes';
    box.style.background = 'rgba(0,51,102,0.85)';
    box.style.margin = '20px auto';
    box.style.padding = '20px';
    box.style.width = '90%';
    box.style.maxWidth = '800px';
    box.style.borderRadius = '20px';
    box.style.color = '#fff';
    box.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    const mapa = document.getElementById('map');
    mapa.parentNode.insertBefore(box, document.getElementById('formulario'));
  }

  box.innerHTML = `<h2>Avaliações deste local</h2>`;

  let imagensParaModal = [];

  listaDeReviews.forEach((avaliacao) => {
    const div = document.createElement('div');
    div.className = 'review';

    if (avaliacao.imagem) {
      imagensParaModal.push(avaliacao.imagem);
    }

    const indexNaLista = imagensParaModal.length - 1;

    div.innerHTML = `
      <strong>${avaliacao.nomeLugar}</strong> - Atendente: ${avaliacao.atendente || 'N/A'}<br>
      <em>${avaliacao.descricao}</em><br>
      ${avaliacao.imagem ? `<div class="thumbnail-container" data-img-index="${indexNaLista}"></div>` : ''}
      ⭐ Espaço: ${avaliacao.espaco} | Atendimento: ${avaliacao.atendimento} | Comida: ${avaliacao.comida} | Bebida: ${avaliacao.bebida} | Preço: ${avaliacao.preco}
    `;

    box.appendChild(div);

    if (avaliacao.imagem) {
      const container = div.querySelector('.thumbnail-container');
      const img = document.createElement('img');
      img.src = avaliacao.imagem;
      img.alt = "Foto do local";
      img.style.maxWidth = "120px";
      img.style.maxHeight = "100px";
      img.style.margin = "10px 0";
      img.style.borderRadius = "8px";
      img.style.cursor = "pointer";
      img.addEventListener('click', () => {
        abrirModal(imagensParaModal, indexNaLista);
      });
      container.appendChild(img);
    }
  });
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
  carregarMarcadores();
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

  // Envio do formulário
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

    const novaReview = {
      nomeLugar: document.getElementById('nomeLugar').value,
      atendente: document.getElementById('atendente').value,
      descricao: document.getElementById('descricao').value,
      espaco: document.getElementById('espaco').value,
      atendimento: document.getElementById('atendimento').value,
      comida: document.getElementById('comida').value,
      bebida: document.getElementById('bebida').value,
      preco: document.getElementById('preco').value,
      imagem: null
    };

    const finalizarEnvio = () => {
      addOrUpdateMarker(coords.lat, coords.lng, novaReview);
      document.getElementById('reviewForm').reset();
      grecaptcha.reset();
      mostrarMensagemSucesso();
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = function () {
        novaReview.imagem = reader.result;
        finalizarEnvio();
      };
      reader.readAsDataURL(file);
    } else {
      finalizarEnvio();
    }
  });

  // Modal controles
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
