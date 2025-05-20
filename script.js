const SUPABASE_URL = 'https://zshzefyearvrfyznfaqj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzaHplZnllYXlydmZ5em5mYXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NDc2NTksImV4cCI6MjA2MzMyMzY1OX0.J-bWwWWHnZ6LK9qd6-b48ro9-NRcBk-2miKHzBaLmM8';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const map = L.map('map').setView([38.7169, -9.1399], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

map.on('click', function (e) {
  document.getElementById('input-lat').value = e.latlng.lat;
  document.getElementById('input-lng').value = e.latlng.lng;
});

navigator.geolocation.getCurrentPosition(function (pos) {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  L.marker([lat, lng])
    .addTo(map)
    .bindPopup('Você está aqui.')
    .openPopup();

  map.setView([lat, lng], 13);
});

function adicionarLugar(lugar) {
  const marcador = L.marker([lugar.lat, lugar.lng]).addTo(map);
  marcador.bindPopup(`<b>${lugar.nome}</b>`);

  marcador.on('click', function () {
    const container = document.getElementById('lugar-detalhes');
    container.innerHTML = `
      <h3>${lugar.nome}</h3>
      <img src="${lugar.foto}" alt="${lugar.nome}">
      <p><strong>Atendente:</strong> ${lugar.atendente}</p>
      <p><strong>Experiência:</strong> ${lugar.experiencia}</p>
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

document.getElementById('lugar-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;
  const dados = new FormData(form);

  const nomeArquivo = `${Date.now()}-${dados.get('foto').name}`;
  const arquivo = dados.get('foto');

  const { data: uploadData, error: uploadError } = await client.storage
    .from('fotos')
    .upload(nomeArquivo, arquivo);

  if (uploadError) {
    alert('Erro ao fazer upload da imagem.');
    console.error(uploadError);
    return;
  }

  const { data: publicUrl } = client.storage
    .from('fotos')
    .getPublicUrl(nomeArquivo);

  const novoLugar = {
    nome: dados.get('nome'),
    foto: publicUrl.publicUrl,
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

  const { error } = await client
    .from('reviews')
    .insert([novoLugar]);

  if (error) {
    alert('Erro ao salvar o review.');
    console.error(error);
    return;
  }

  adicionarLugar(novoLugar);
  form.reset();
});

window.addEventListener('DOMContentLoaded', async () => {
  const { data: lugares, error } = await client
    .from('reviews')
    .select('*');

  if (error) {
    console.error('Erro ao carregar os reviews:', error);
    return;
  }

  lugares.forEach(adicionarLugar);
});
