const map = L.map('map').setView([38.7169, -9.1399], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Preenche coordenadas ao clicar no mapa
map.on('click', function (e) {
  document.getElementById('input-lat').value = e.latlng.lat;
  document.getElementById('input-lng').value = e.latlng.lng;
});

// Mostra posição atual do usuário
navigator.geolocation.getCurrentPosition(function (pos) {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  L.marker([lat, lng]).addTo(map).bindPopup('Você está aqui.').openPopup();
  map.setView([lat, lng], 13);
});

// Adiciona ponto no mapa
function adicionarLugar(lugar) {
  const marker = L.marker([lugar.lat, lugar.lng]).addTo(map);
  marker.bindPopup(`<b>${lugar.nome}</b>`);
  marker.on('click', () => {
    const box = document.getElementById('lugar-detalhes');
    box.innerHTML = `
      <h3>${lugar.nome}</h3>
      <p><strong>Atendente:</strong> ${lugar.atendente || '---'}</p>
      <p><strong>Experiência:</strong> ${lugar.experiencia || '---'}</p>
      <ul>
        <li>🧑 Atendimento: ${lugar.atendimento}/5</li>
        <li>📐 Espaço: ${lugar.espaco}/5</li>
        <li>🍽️ Comida: ${lugar.comida}/5</li>
        <li>🍷 Bebida: ${lugar.bebida}/5</li>
        <li>💰 Valores: ${lugar.valores}/5</li>
      </ul>
    `;
  });
}

// Evento de envio
document.getElementById('lugar-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const form = e.target;
  const dados = new FormData(form);

  const novoLugar = {
    nome: dados.get('nome'),
    atendente: dados.get('atendente'),
    experiencia: dados.get('experiencia'),
    lat: parseFloat(dados.get('lat')),
    lng: parseFloat(dados.get('lng')),
    atendimento: parseInt(dados.get('atendimento')),
    espaco: parseInt(dados.get('espaco')),
    comida: parseInt(dados.get('comida')),
    bebida: parseInt(dados.get('bebida')),
    valores: parseInt(dados.get('valores'))
  };

  let lista = JSON.parse(localStorage.getItem('mistery_shop')) || [];
  lista.push(novoLugar);
  localStorage.setItem('mistery_shop', JSON.stringify(lista));

  adicionarLugar(novoLugar);
  form.reset();
  alert('Review salvo!');
});

// Ao abrir a página, renderiza todos
window.addEventListener('DOMContentLoaded', () => {
  const salvos = JSON.parse(localStorage.getItem('mistery_shop')) || [];
  salvos.forEach(adicionarLugar);
});