# 🛠️ Sistema de Apoio à Manutenção Industrial com Realidade Aumentada e Serviços em Nuvem — Furadeira (`FUR-01`)

> ⚠ **Aviso:** todos os dados de temperatura, vibração e status gerados pelo simulador são **simulados e didáticos**, usados apenas para demonstrar a arquitetura. Não são limites reais de segurança nem parâmetros oficiais de máquinas.

Protótipo acadêmico (Análise e Desenvolvimento de Sistemas, UCs de Realidade Aumentada e Computação em Nuvem) de uma aplicação **WebAR** integrada a serviços conteinerizados para apoio à manutenção da **Furadeira de Bancada `FUR-01`**.

O técnico aponta a câmera do celular para o target (imagem da furadeira) e vê quatro hotspots interativos. Três mostram informações técnicas estáticas. O quarto consulta uma **API Flask**, que recebe dados simulados por **MQTT**.

---

## 🏗️ Arquitetura

```text
FURADEIRA (FUR-01)
      │ target visual (imagem impressa / furadeira-target.png)
      ▼
APLICAÇÃO WebAR  (HTML + CSS + JavaScript + A-Frame + MindAR)
      │ HTTP / JSON (fetch)
      ▼
API FLASK  (container fur01-api, porta 5000)
      ▲ dados atualizados (assinante MQTT)
      │
BROKER MQTT  (container fur01-mqtt, Mosquitto, porta 1883)
      ▲ publicação
      │
SIMULADOR DE TELEMETRIA  (container fur01-simulator)

Infraestrutura de serviços: Docker + Docker Compose
```

- O **navegador não usa MQTT**: ele só conversa com a API por HTTP/JSON.
- A RA consulta a API ao tocar no hotspot 4 (ou em "Atualizar"). O dado novo aparece **na próxima consulta**.
- O último valor recebido fica **em memória** na API.

Mais detalhes em `docs/arquitetura.md` e no diagrama `docs/arquitetura.png`.

---

## 📂 Estrutura do repositório

```text
industria-ra-cloud/
├── compose.yaml              # Orquestração dos containers
├── README.md
├── frontend/                 # Aplicação WebAR (publicada no GitHub Pages)
│   ├── index.html            # A-Frame + MindAR
│   ├── css/style.css         # HUD, hotspots e painel
│   ├── js/
│   │   ├── config.js         # URL da API
│   │   └── app.js            # Tracking, hotspots e consumo da API
│   └── assets/
│       ├── images/furadeira-target.png   # Imagem do target
│       └── targets/furadeira.mind        # Target compilado (MindAR)
├── backend/                  # API Flask
│   ├── app.py                # Endpoints HTTP + subscriber MQTT
│   ├── requirements.txt
│   └── Dockerfile
├── mqtt/mosquitto.conf       # Configuração do broker
├── simulator/                # Publisher MQTT
│   ├── simulator.py
│   ├── requirements.txt
│   └── Dockerfile
└── docs/
    ├── arquitetura.md
    ├── arquitetura.png
    ├── analise-cloud.md      # IaaS, PaaS e SaaS
    └── testes.md             # Matriz de testes T01 a T09
```

---

## ⚙️ Como executar

### Requisitos
- Docker e Docker Compose v2
- Celular com navegador moderno e câmera
- Conta no GitHub (para publicar o frontend)

### 1. Backend e infraestrutura (Docker Compose)

Na raiz do projeto:

```bash
docker compose up --build -d     # sobe broker, API e simulador
docker compose ps                # confere os containers
curl http://localhost:5000/api/saude
docker compose logs -f api simulator
docker compose down              # encerra tudo
```

### 2. Frontend WebAR (GitHub Pages, HTTPS)

A câmera do celular só funciona em **HTTPS**.

1. Envie o projeto para um repositório no GitHub.
2. Em **Settings → Pages**, escolha a branch `main` e a pasta do frontend, e salve. Se o Pages só oferecer a raiz ou `/docs`, publique o conteúdo de `frontend/` nela.
3. Abra a URL gerada (ex.: `https://usuario.github.io/industria-ra-cloud/`) no celular.

### 3. Conectando o frontend HTTPS à API

Uma página HTTPS **não pode** chamar uma API `http://` (o navegador bloqueia como *mixed content*), e `localhost` no celular aponta para o próprio celular. Por isso a API precisa de uma URL HTTPS pública. Para a demonstração, use um túnel:

```bash
cloudflared tunnel --url http://localhost:5000
# ou: ngrok http 5000
```

Copie a URL `https://...` gerada e coloque-a em `frontend/js/config.js` (ou na query `?api=` se o seu `app.js` suportar). Faça commit e publique novamente.

---

## 🔌 Portas, containers e dependências

| Serviço | Container | Porta | Depende de | Descrição |
|---|---|---|---|---|
| Broker MQTT | `fur01-mqtt` | 1883 | — | Intermediário de mensagens |
| API Flask | `fur01-api` | 5000 | broker | Serve telemetria em HTTP/JSON e assina o MQTT |
| Simulador | `fur01-simulator` | — | broker | Publica leituras fictícias |

## 🌐 Endpoints da API

| Método | Rota | Retorno |
|---|---|---|
| GET | `/api/equipamentos/FUR-01` | Identificação (id, tipo, setor, status) |
| GET | `/api/equipamentos/FUR-01/telemetria` | Temperatura, vibração, status e hora da atualização |
| GET | `/api/saude` | Estado da API e da conexão MQTT |

## 📡 Tópicos MQTT

```text
industria/FUR-01/temperatura
industria/FUR-01/vibracao
industria/FUR-01/status
```

---

## 🧪 Como testar

A matriz completa (T01 a T09) está em `docs/testes.md`. Resumo:

1. **Abrir a aplicação:** acesse a URL HTTPS no celular e permita a câmera.
2. **Escanear o target:** aponte para a imagem da furadeira. O status muda para "RA ATIVA" e os 4 hotspots aparecem.
3. **Hotspots 1, 2 e 3:** mostram informações estáticas de Base, Coluna e Cabeçote/Motor.
4. **Hotspot 4 (Painel / Monitoramento):** faz `fetch()` na API e exibe status, temperatura e vibração.
5. **Publicar um novo valor via MQTT** (pare o simulador antes, senão ele sobrescreve o valor):

```bash
   docker compose stop simulator
   docker compose exec mqtt mosquitto_pub -t industria/FUR-01/temperatura -m 55.5
   curl http://localhost:5000/api/equipamentos/FUR-01/telemetria
```

   Toque em "↻ Atualizar" na RA para ver o novo valor. Para voltar ao normal: `docker compose start simulator`.
6. **Indisponibilidade da API:**

```bash
   docker compose stop api      # RA mostra o aviso
   docker compose start api     # consulta volta a funcionar
```

   Mensagem exibida:
   > *"⚠ Não foi possível consultar os dados do equipamento. Verifique a disponibilidade do serviço e tente novamente."*

---

## ⚠ Limitações conhecidas

- Dados mantidos em memória (perdem-se ao reiniciar a API).
- Broker sem autenticação e sem TLS (apenas didático).
- CORS liberado para qualquer origem.
- Todos os valores de telemetria são fictícios.

## 📚 Documentação adicional

- `docs/arquitetura.md`: fluxo de dados, separação estático vs. dinâmico e tratamento de falhas.
- `docs/analise-cloud.md`: IaaS, PaaS e SaaS justificados por responsabilidades de provedor e consumidor.
- `docs/testes.md`: matriz de testes T01 a T09.

## 👥 Equipe

Nomes e responsabilidades: Nykolas e Otávio (Ambos Desenvolvedores)