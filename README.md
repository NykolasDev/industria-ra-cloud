# Sistema de Apoio à Manutenção Industrial com RA e Serviços em Nuvem

Protótipo didático: WebAR (A-Frame + MindAR) + API Flask + MQTT + Docker Compose.
**Ativo:** Torno CNC (`CNC-01`), setor Usinagem.
> Todos os valores de temperatura, vibração e status são **SIMULADOS** e didáticos.
> Não representam limites reais de segurança ou manutenção.

**Equipe:** _(nomes)_ • **URL da WebAR:** _(link do GitHub Pages)_

## Arquitetura
```
Target (torno) -> WebAR (HTML/CSS/JS + A-Frame + MindAR)
                     | HTTP/JSON
                     v
                  API Flask  <-- assina MQTT --  Broker Mosquitto  <-- publica --  Simulador
```
Diagrama detalhado em `docs/arquitetura.md`.

## Estrutura
```
compose.yaml            orquestra os 3 serviços
frontend/               WebAR (publicado no GitHub Pages)
backend/                API Flask + Dockerfile
mqtt/mosquitto.conf     configuração do broker
simulator/              publicador MQTT de telemetria fictícia
docs/                   arquitetura, testes, análise IaaS/PaaS/SaaS
```

## Serviços e portas
| Serviço   | Container    | Porta | Função |
|-----------|--------------|-------|--------|
| mqtt      | ra-mqtt      | 1883  | Broker Mosquitto |
| backend   | ra-backend   | 5000  | API Flask (assina MQTT, responde HTTP/JSON) |
| simulator | ra-simulator | —     | Publica telemetria fictícia a cada 5 s |

Dependências: `backend` e `simulator` dependem do `mqtt`.

## Como executar
Requisitos: Docker e Docker Compose.
```bash
docker compose up --build
```
Teste a API:
```bash
curl http://localhost:5000/api/equipamentos/CNC-01
curl http://localhost:5000/api/equipamentos/CNC-01/telemetria
```
Parar: `docker compose down`

## Endpoints
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/equipamentos/<id>` | Identificação do ativo |
| GET | `/api/equipamentos/<id>/telemetria` | Último dado recebido via MQTT |
| GET | `/api/health` | Verificação simples |

## Tópicos MQTT
`industria/CNC-01/temperatura` • `industria/CNC-01/vibracao` • `industria/CNC-01/status`

Publicar um valor manualmente (pare antes o simulador para ele não sobrescrever):
```bash
docker compose stop simulator
docker exec ra-mqtt mosquitto_pub -t industria/CNC-01/temperatura -m 47.2
docker compose start simulator   # retoma a simulação
```

## Frontend (WebAR)
1. Coloque a imagem do target em `frontend/assets/images/` e o arquivo compilado em `frontend/assets/targets/torno-cnc.mind` (compilador: https://hiukim.github.io/mind-ar-js-doc/tools/compile).
2. Edite `frontend/js/config.js` e ajuste `API_BASE`.
3. Publique a pasta `frontend/` (GitHub Pages).

### Atenção: HTTPS e a API
A câmera exige HTTPS, e o GitHub Pages é HTTPS. Um site HTTPS **não pode** chamar uma API `http://` (mixed content). Soluções:
- Expor a API por um túnel HTTPS, por exemplo `cloudflared tunnel --url http://localhost:5000` ou `ngrok http 5000`, e colocar a URL `https://...` em `API_BASE`; ou
- Publicar a API em uma VM/plataforma com HTTPS.

Ao usar túnel, a URL muda a cada execução: atualize o `config.js` e republique.

## Documentação
- `docs/arquitetura.md` - diagrama e responsabilidades
- `docs/testes.md` - matriz de testes (T01-T09)
- `docs/analise-cloud.md` - IaaS/PaaS/SaaS, decisões de dados, respostas técnicas
