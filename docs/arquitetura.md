# Arquitetura do Sistema — Furadeira de Bancada (FUR-01)

> ⚠ Todos os valores de temperatura, vibração e status são **SIMULADOS e didáticos**.
> Não representam limites reais de segurança nem parâmetros oficiais de máquinas.

## Diagrama

```
FURADEIRA (FUR-01)
      │ target visual (imagem impressa)
      ▼
APLICAÇÃO WebAR  (HTML + CSS + JavaScript + A-Frame + MindAR)
      │ HTTP / JSON  (fetch)
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

## Fluxo de dados

1. **Simulador (`simulator.py`):** publica leituras fictícias a cada 3 s nos tópicos
   `industria/FUR-01/temperatura`, `industria/FUR-01/vibracao` e `industria/FUR-01/status`.
2. **Broker MQTT (Mosquitto):** recebe as mensagens na porta 1883 e as entrega a quem assinou os tópicos.
3. **API Flask (`app.py`):** assina `industria/+/+`, guarda o último valor de cada campo **em memória**
   e expõe `GET /api/equipamentos/FUR-01` (identificação) e
   `GET /api/equipamentos/FUR-01/telemetria` (status, temperatura, vibração e hora da atualização).
4. **WebAR (`app.js`):** ao tocar no hotspot 4 (Painel / Monitoramento), executa `fetch()` (HTTP GET)
   na API e mostra os dados no painel. Se a API não responder, exibe a mensagem de indisponibilidade.

O navegador **não** usa MQTT. Ele só conversa com a API por HTTP/JSON.

## Separação de dados

| Estáticos (frontend) | Dinâmicos (API Flask) |
|---|---|
| Nome do componente | Status operacional simulado |
| Descrição e função | Temperatura simulada |
| Orientações gerais de manutenção | Vibração simulada |
| Conteúdo didático dos hotspots 1, 2 e 3 | Última atualização |

**Justificativas:**
- Dados estáticos mudam raramente. No frontend, não geram chamada de rede e continuam disponíveis mesmo com a API fora do ar.
- Dados dinâmicos mudam o tempo todo e vêm de fonte externa à interface. Se ficassem no `app.js`, estariam sempre desatualizados.

## Containers e portas

| Serviço | Container | Porta | Depende de |
|---|---|---|---|
| Broker MQTT | `fur01-mqtt` | 1883 | — |
| API Flask | `fur01-api` | 5000 | broker (healthcheck) |
| Simulador | `fur01-simulator` | — | broker (healthcheck) |

Tudo é iniciado com `docker compose up --build -d`.

## Tratamento de falhas

- **API indisponível:** a RA continua ativa, os hotspots 1 a 3 seguem funcionando e só o monitoramento mostra o aviso.
- **Broker indisponível:** a API continua respondendo com o último valor em memória (que ficará desatualizado) e reconecta sozinha quando o broker voltar.