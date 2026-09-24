document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Configuração ---------- */
  const CFG = window.APP_CONFIG;

  /* ---------- Referências ---------- */
  const scene         = document.querySelector("#ar-scene");
  const target        = document.querySelector("#target");
  const cameraElement = document.querySelector("#ar-camera");

  const status      = document.querySelector("#status");
  const badge       = document.querySelector("#badge");
  const panel       = document.querySelector("#info-panel");
  const panelTitle  = document.querySelector("#info-title");
  const panelText   = document.querySelector("#info-text");
  const panelDetail = document.querySelector("#info-detail");
  const closeButton = document.querySelector("#close-panel");
  const liveBox     = document.querySelector("#info-live");
  const refreshBtn  = document.querySelector("#refresh-btn");

  const hotspots = Array.from(document.querySelectorAll(".hotspot"));
  let tracking = false;

  /* ---------- Conteúdo ESTÁTICO (pertence à interface) ----------
     dynamic: true => além do texto, consulta a API Flask. */
  const information = {
    placa: {
      title: "Cabeçote e placa",
      text: "A placa fixa a peça e o cabeçote fornece o movimento de rotação necessário ao torneamento.",
      detail: "A fixação correta é essencial para precisão e segurança."
    },
    torre: {
      title: "Torre de ferramentas",
      text: "A torre organiza as ferramentas de corte e permite selecionar a ferramenta necessária em cada etapa do programa CNC.",
      detail: "A indexação da torre pode integrar a sequência automática de usinagem."
    },
    comando: {
      title: "Painel de comando CNC",
      text: "O painel é a interface entre operador, programa CNC e sistema de controle da máquina.",
      detail: "Os dados apresentados nesta experiência são didáticos."
    },
    seguranca: {
      title: "Proteção e segurança",
      text: "Portas, proteções e intertravamentos ajudam a separar o operador da região de usinagem.",
      detail: "A Realidade Aumentada não substitui treinamento ou documentação do fabricante."
    },
    monitoramento: {
      title: "Monitoramento",
      text: "Dados operacionais obtidos da API a cada consulta.",
      detail: "Valores SIMULADOS para fins didáticos. Não são limites reais de segurança ou manutenção.",
      dynamic: true
    }
  };

  let currentTopic = null;

  /* ---------- Painel ---------- */
  function showInformation(topicName) {
    const selected = information[topicName];
    if (!selected) return;

    currentTopic = topicName;
    panelTitle.textContent  = selected.title;
    panelText.textContent   = selected.text;
    panelDetail.textContent = selected.detail;
    panel.classList.remove("hidden");

    // Tópicos estáticos não mostram a área de dados da API
    liveBox.classList.toggle("hidden", !selected.dynamic);
    refreshBtn.classList.toggle("hidden", !selected.dynamic);

    if (selected.dynamic) {
      loadMonitoring();
    }
  }

  function hideInformation() {
    currentTopic = null;
    panel.classList.add("hidden");
  }

  /* ---------- Comunicação com a API Flask ---------- */
  async function fetchJson(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CFG.TIMEOUT_MS);
    try {
      const response = await fetch(`${CFG.API_BASE}${path}`, {
        signal: controller.signal,
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function addRow(label, value) {
    const row = document.createElement("div");
    row.className = "live-row";
    const a = document.createElement("span");
    const b = document.createElement("strong");
    a.textContent = label;
    b.textContent = value;
    row.append(a, b);
    liveBox.appendChild(row);
  }

  function formatValue(value, unit) {
    return value === null || value === undefined ? "—" : `${value} ${unit}`;
  }

  async function loadMonitoring() {
    liveBox.className = "live";
    liveBox.textContent = "Consultando a API...";

    try {
      // Identificação + telemetria em paralelo
      const [equip, telem] = await Promise.all([
        fetchJson(`/api/equipamentos/${CFG.EQUIPAMENTO_ID}`),
        fetchJson(`/api/equipamentos/${CFG.EQUIPAMENTO_ID}/telemetria`)
      ]);

      // Se o usuário fechou/trocou o painel durante a consulta, ignora
      if (currentTopic !== "monitoramento") return;

      liveBox.textContent = "";
      addRow("Equipamento", `${equip.id} • ${equip.tipo}`);
      addRow("Setor", equip.setor);
      addRow("Status", telem.status);
      addRow("Temperatura", formatValue(telem.temperatura, "°C"));
      addRow("Vibração", formatValue(telem.vibracao, "mm/s"));
      addRow("Última atualização", telem.atualizacao || "—");

      const note = document.createElement("div");
      note.className = "live-note";
      note.textContent = "Dados simulados (didáticos).";
      liveBox.appendChild(note);

    } catch (error) {
      console.error("Falha ao consultar a API:", error);
      if (currentTopic !== "monitoramento") return;
      liveBox.className = "live error";
      liveBox.textContent =
        "⚠ Não foi possível consultar os dados do equipamento. " +
        "Verifique a disponibilidade do serviço e tente novamente.";
    }
  }

  /* ---------- Eventos de interface ---------- */
  hotspots.forEach((button) => {
    button.addEventListener("pointerup", (event) => {
      event.preventDefault();
      event.stopPropagation();
      showInformation(button.dataset.topic);
    });
  });

  refreshBtn.addEventListener("pointerup", (event) => {
    event.preventDefault();
    loadMonitoring();
  });

  closeButton.addEventListener("pointerup", (event) => {
    event.preventDefault();
    hideInformation();
  });

  /* ---------- Eventos do MindAR ---------- */
  scene.addEventListener("arReady", () => {
    status.textContent = "Câmera pronta. Aponte para a imagem do torno.";
    badge.textContent  = "PROCURANDO ALVO";
  });

  scene.addEventListener("arError", () => {
    status.textContent = "Não foi possível iniciar a câmera.";
    badge.textContent  = "ERRO";
  });

  target.addEventListener("targetFound", () => {
    tracking = true;
    status.textContent = "Torno reconhecido. Toque em um ponto numerado.";
    badge.textContent  = "● RA ATIVA";
    hotspots.forEach((b) => b.classList.add("visible"));
  });

  target.addEventListener("targetLost", () => {
    tracking = false;
    status.textContent = "Alvo perdido. Aponte novamente para a imagem.";
    badge.textContent  = "PROCURANDO ALVO";
    hotspots.forEach((b) => b.classList.remove("visible"));
    hideInformation();
  });

  /* ---------- 3D -> 2D: hotspots acompanham o target ---------- */
  function updateHotspotPositions() {
    requestAnimationFrame(updateHotspotPositions);
    if (!tracking) return;

    const camera = cameraElement.getObject3D("camera");
    if (!camera || !target.object3D) return;

    target.object3D.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    hotspots.forEach((button) => {
      const localPoint = new THREE.Vector3(
        Number(button.dataset.x),
        Number(button.dataset.y),
        Number(button.dataset.z)
      );
      const worldPoint = target.object3D.localToWorld(localPoint);
      const projected  = worldPoint.clone().project(camera);

      const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      button.style.left = `${screenX}px`;
      button.style.top  = `${screenY}px`;

      const inside =
        projected.z > -1 && projected.z < 1 &&
        screenX > -80 && screenX < window.innerWidth + 80 &&
        screenY > -80 && screenY < window.innerHeight + 80;
      button.style.visibility = inside ? "visible" : "hidden";
    });
  }

  updateHotspotPositions();
});
