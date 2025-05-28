// ✅ Google Apps Script (Código.gs) — versão final e funcional
function doPost(e) {
  try {
    const folder = DriveApp.getFolderById("1fVrMwqSFCCXub1FSZHP2O58nyS5r_VuH");
    const sheet = SpreadsheetApp.openById("1M6HM-HvYHu45c4agdyT6ayfE3ekZmUA0Fbhplyb8LRY").getSheetByName("Página1");

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Dados do formulário ausentes");
    }

    const data = JSON.parse(e.postData.contents);
    let imageUrl = "";

    if (data.imageBase64 && typeof data.imageBase64 === "string" && data.imageBase64.includes(",")) {
      try {
        const base64Data = data.imageBase64.split(",")[1];
        const contentType = data.imageBase64.match(/^data:(.*);base64,/)[1];
        const fileName = `${data.nomeLugar}_${new Date().getTime()}.jpg`;
        const decodedBytes = Utilities.base64Decode(base64Data);
        const blob = Utilities.newBlob(decodedBytes, contentType).setName(fileName);
        const file = folder.createFile(blob);
        imageUrl = file.getUrl();
      } catch (imgErr) {
        Logger.log("Erro ao processar imagem: " + imgErr.message);
      }
    } else {
      Logger.log("⚠️ Nenhuma imagem válida foi enviada ou base64 malformado");
    }

    sheet.appendRow([
      data.nomeLugar || "",
      data.descricao || "",
      data.atendente || "",
      data.espaco || "",
      data.atendimento || "",
      data.comida || "",
      data.bebida || "",
      data.preco || "",
      imageUrl,
      new Date()
    ]);

    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    Logger.log("Erro geral: " + err.message);
    return ContentService.createTextOutput("ERRO: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

// ✅ HTML (input seguro de imagem)
// <input type="file" id="foto" accept="image/png,image/jpeg,image/webp">

// ✅ JavaScript (fetch para enviar como JSON puro)
let map;
let coords = null;

function initMap(lat, lng) {
  map = L.map('map').setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  coords = { lat, lng };
}

function detectLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => initMap(position.coords.latitude, position.coords.longitude),
      () => initMap(38.7169, -9.1399) // fallback para Lisboa
    );
  } else {
    initMap(38.7169, -9.1399);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  detectLocation();

  const form = document.getElementById("reviewForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const response = grecaptcha.getResponse();
    if (!response) {
      alert("Por favor, confirme que você não é um robô.");
      return;
    }

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

    const fileInput = document.getElementById('foto');
    const file = fileInput.files[0];

    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem é muito grande (máx. 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        formData.imageBase64 = reader.result;
        enviarParaGoogle(formData);
      };
      reader.readAsDataURL(file);
    } else {
      enviarParaGoogle(formData);
    }
  });
});

function enviarParaGoogle(formData) {
  fetch("https://script.google.com/macros/s/AKfycbyIQPVmGj7EHmTRLbfQe681wfA3gTDvtbRrOjaGn33fg8DyLEkmQ2lzgMK_Wvsw9LdRKg/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  })
    .then(res => res.text())
    .then(text => {
      console.log("Resposta do servidor:", text);
      if (text.includes("OK")) {
        alert("✅ Avaliação enviada com sucesso!");
        document.getElementById("reviewForm").reset();
        grecaptcha.reset();

        if (map && coords) {
          L.marker([coords.lat, coords.lng])
            .addTo(map)
            .bindPopup(`<strong>${formData.nomeLugar}</strong><br>⭐ Enviado com sucesso!`)
            .openPopup();
        }
      } else {
        alert("❌ Erro ao enviar: " + text);
      }
    })
    .catch(err => alert("Erro ao conectar: " + err.message));
}
