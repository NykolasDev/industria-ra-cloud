"""
API Flask do Sistema de Apoio à Manutenção Industrial.

- Assina os tópicos MQTT  industria/<id>/<grandeza>
- Guarda o ÚLTIMO valor recebido em memória
- Expõe os dados por HTTP/JSON para a aplicação WebAR

Todos os dados são SIMULADOS (didáticos).
"""
import os
import threading
from datetime import datetime

import paho.mqtt.client as mqtt
from flask import Flask, jsonify
from flask_cors import CORS

MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC = "industria/+/+"

app = Flask(__name__)
CORS(app)  # permite chamadas vindas do frontend (outra origem)

# ---------------- Dados cadastrais (estáticos) ----------------
EQUIPAMENTOS = {
    "CNC-01": {
        "id": "CNC-01",
        "tipo": "Torno CNC",
        "setor": "Usinagem",
        "status": "operacional",
    }
}

# ---------------- Último valor de telemetria (em memória) ----------------
GRANDEZAS = ("temperatura", "vibracao", "status")
telemetria = {
    eid: {"temperatura": None, "vibracao": None,
          "status": "sem dados", "atualizacao": None}
    for eid in EQUIPAMENTOS
}
lock = threading.Lock()  # Flask e MQTT rodam em threads diferentes


# ---------------- MQTT ----------------
def on_connect(client, userdata, flags, reason_code, properties=None):
    print(f"[MQTT] Conectado ({reason_code}). Assinando {MQTT_TOPIC}")
    client.subscribe(MQTT_TOPIC)


def on_message(client, userdata, msg):
    partes = msg.topic.split("/")
    if len(partes) != 3:
        return
    _, eid, grandeza = partes
    if eid not in telemetria or grandeza not in GRANDEZAS:
        return

    valor = msg.payload.decode("utf-8", errors="ignore").strip()
    if grandeza in ("temperatura", "vibracao"):
        try:
            valor = float(valor)
        except ValueError:
            print(f"[MQTT] Valor inválido em {msg.topic}: {valor!r}")
            return

    with lock:
        telemetria[eid][grandeza] = valor
        telemetria[eid]["atualizacao"] = datetime.now().strftime("%H:%M:%S")
    print(f"[MQTT] {msg.topic} = {valor}")


def iniciar_mqtt():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    # connect_async + loop_start: se o broker estiver fora, a API continua
    # de pé e o cliente reconecta sozinho quando ele voltar.
    client.connect_async(MQTT_HOST, MQTT_PORT, keepalive=30)
    client.loop_start()
    return client


# ---------------- Rotas HTTP ----------------
@app.get("/api/health")
def health():
    return jsonify({"api": "ok"})


@app.get("/api/equipamentos/<eid>")
def identificacao(eid):
    equip = EQUIPAMENTOS.get(eid)
    if equip is None:
        return jsonify({"erro": "Equipamento não encontrado"}), 404
    return jsonify(equip)


@app.get("/api/equipamentos/<eid>/telemetria")
def obter_telemetria(eid):
    if eid not in telemetria:
        return jsonify({"erro": "Equipamento não encontrado"}), 404
    with lock:
        dados = dict(telemetria[eid])
    return jsonify(dados)


if __name__ == "__main__":
    iniciar_mqtt()
    app.run(host="0.0.0.0", port=5000)
