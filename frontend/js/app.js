document.addEventListener("DOMContentLoaded", () => {
    const scene = document.querySelector("#ar-scene");
    const target = document.querySelector("#target");
    const cameraElement = document.querySelector("#ar-camera");

    const status = document.querySelector("#status");
    const badge = document.querySelector("#badge");
    const panel = document.querySelector("#info-panel");
    const panelCategory = document.querySelector("#info-category");
    const panelTitle = document.querySelector("#info-title");
    const panelText = document.querySelector("#info-text");
    const panelDetail = document.querySelector("#info-detail");
    const closeButton = document.querySelector("#close-panel");

    const hotspots = Array.from(document.querySelectorAll(".hotspot"));
    let tracking = false;

    // URL da API Flask no ambiente local/docker
    const API_URL = "http://localhost:5000/api/equipamentos/FUR-01/telemetria";

    // Informações Estáticas da Furadeira
    const staticInformation = {
        base: {
            title: "Base e Mesa de Trabalho",
            text: "Estrutura de fixação da peça. Verifique o aperto dos mordaços e a lubrificação do barramento.",
            detail: "Frequência de inspeção: Diária (Início de turno)."
        },
        coluna: {
            title: "Coluna Estrutural",
            text: "Suporta a cremalheira de elevação. Mantenha limpa sem cavacos acumulados.",
            detail: "Curso máximo de elevação: 450mm."
        },
        cabecote: {
            title: "Motor e Cabeçote",
            text: "Motor trifásico e caixa de engrenagens de transmissão de torque.",
            detail: "Especificação: 3 HP / Rotação nominal: 1750 RPM."
        }
    };

    // Consulta assíncrona à API Flask
    async function fetchDynamicTelemetry() {
        panelCategory.textContent = "TELEMETRIA EM TEMPO REAL (API)";
        panelTitle.textContent = "Painel de Controle";
        panelText.textContent = "Consultando serviços em nuvem...";
        panelDetail.textContent = "";
        panel.classList.remove("hidden");

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Serviço indisponível");
            
            const data = await response.json();
            
            panelText.innerHTML = `
                <strong>Status:</strong> ${data.status.toUpperCase()}<br />
                <strong>Temperatura:</strong> ${data.temperatura} °C<br />
                <strong>Vibração:</strong> ${data.vibracao} mm/s
            `;
            panelDetail.textContent = `Última atualização recebida: ${data.atualizacao} (Dados Simulados)`;
        } catch (error) {
            // Mensagem de contingência exigida
            panelText.textContent = "⚠ Não foi possível consultar os dados do equipamento.";
            panelDetail.textContent = "Verifique a disponibilidade do serviço e tente novamente.";
        }
    }

    function showInformation(topic) {
        if (topic === "monitoramento") {
            fetchDynamicTelemetry();
        } else if (staticInformation[topic]) {
            const info = staticInformation[topic];
            panelCategory.textContent = "INFORMAÇÃO TÉCNICA ESTRUTURAL";
            panelTitle.textContent = info.title;
            panelText.textContent = info.text;
            panelDetail.textContent = info.detail;
            panel.classList.remove("hidden");
        }
    }

    function hideInformation() {
        panel.classList.add("hidden");
    }

    hotspots.forEach(button => {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            showInformation(button.dataset.topic);
        };
        button.addEventListener("click", handler);
        button.addEventListener("pointerup", handler);
    });

    closeButton.addEventListener("click", hideInformation);
    closeButton.addEventListener("pointerup", hideInformation);

    scene.addEventListener("arReady", () => {
        status.textContent = "Câmera ativa. Aponte para a Furadeira.";
        badge.textContent = "PROCURANDO ALVO";
    });

    target.addEventListener("targetFound", () => {
        tracking = true;
        status.textContent = "Furadeira FUR-01 Reconhecida.";
        badge.textContent = "● RA ATIVA";
        hotspots.forEach(b => b.classList.add("visible"));
    });

    target.addEventListener("targetLost", () => {
        tracking = false;
        status.textContent = "Alvo perdido. Reaponte a câmera.";
        badge.textContent = "PROCURANDO ALVO";
        hotspots.forEach(b => b.classList.remove("visible"));
        hideInformation();
    });

    // Projeção 3D local -> Pixels 2D da tela
    function updateHotspotPositions() {
        requestAnimationFrame(updateHotspotPositions);
        if (!tracking) return;
        
        const camera = cameraElement.getObject3D("camera");
        if (!camera || !target.object3D) return;
        
        target.object3D.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        
        hotspots.forEach(button => {
            const localPoint = new THREE.Vector3(
                Number(button.dataset.x),
                Number(button.dataset.y),
                Number(button.dataset.z)
            );
            
            const worldPoint = target.object3D.localToWorld(localPoint);
            const projectedPoint = worldPoint.clone().project(camera);
            
            const screenX = (projectedPoint.x * 0.5 + 0.5) * window.innerWidth;
            const screenY = (-projectedPoint.y * 0.5 + 0.5) * window.innerHeight;
            
            button.style.left = `${screenX}px`;
            button.style.top = `${screenY}px`;
        });
    }

    updateHotspotPositions();
});