// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAZB6NqPVNwgfi0ExswGX41ASWqh05TLWI",
  authDomain: "mistery-shopi.firebaseapp.com",
  projectId: "mistery-shopi",
  storageBucket: "mistery-shopi.appspot.com",
  messagingSenderId: "696029436266",
  appId: "1:696029436266:web:fd133cb0121858aa6aed13"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

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
  L.marker([lat, lng]).addTo(map).bindPopup('Você está aqui.').openPopup();
  map.setView([lat, lng], 13);
});

function adicionarLugar(lugar) {
  const marcador = L.marker([lugar.lat, lugar.lng]).addTo(map);
  marcador.bindPopup(`<b>${lugar.nome}</b>`);
  marcador.on('click', function () {
    document.getElementById('lugar-detalhes').innerHTML = `
      <h3>${lugar.nome}</h3>
      <img src="${lugar.foto}" alt="${lugar.nome}" style="max-width:100%;">
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

  const file = dados.get('foto');
  const fileName = `${Date.now()}-${file.name}`;
  const storageRef = storage.ref().child(`fotos/${fileName}`);

  try {
    await storageRef.put(file);
    const fotoUrl = await storageRef.getDownloadURL();

    const novoLugar = {
      nome: dados.get('nome'),
      foto: fotoUrl,
      atendente: dados.get('atendente'),
      experiencia: dados.get('experiencia'),
      lat: parseFloat(dados.get('lat')),
      lng: parseFloat(dados.get('lng')),
      atendimento: parseInt(dados.get('atendimento')),
      espaco: parseInt(dados.get('espaco')),
      comida: parseInt(dados.get('comida')),
      bebida: parseInt(dados.get('bebida')),
      valores: parseInt(dados.get('valores')),
      created_at: new Date().toISOString()
    };

    await db.collection('mistery-shop').add(novoLugar);
    adicionarLugar(novoLugar);
    form.reset();
  } catch (error) {
    alert('Erro ao salvar ou subir imagem');
    console.error(error);
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  const snapshot = await db.collection('mistery-shop').get();
  snapshot.forEach(doc => adicionarLugar(doc.data()));
});
