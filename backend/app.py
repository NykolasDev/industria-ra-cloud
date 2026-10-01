import os
import json
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
import paho.mqtt.client as mqtt

app = Flask(__name__)
CORS(app)

latest_telemetry = {
    "status": "operando",
    "temperatura": 38.5,
    "vibracao": 1.8,
    "atualizacao": datetime.now().strftime("%H:%M:%S")
}

MQTT_BROKER = os.getenv("MQTT_BROKER", "broker_mqtt")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC = "industria/FUR-01/telemetria"

def on_connect(client, userdata, flags, rc):
    print(f"[MQTT] Conectado ao Broker Mosquitto (Código: {rc})")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    global latest_telemetry
    try:
        data = json.loads(msg.payload.decode())
        latest_telemetry["status"] = data.get("status", latest_telemetry["status"])
        latest_telemetry["temperatura"] = data.get("temperatura", latest_telemetry["temperatura"])
        latest_telemetry["vibracao"] = data.get("vibracao", latest_telemetry["vibracao"])
        latest_telemetry["atualizacao"] = datetime.now().strftime("%H:%M:%S")
        print(f"[MQTT] Telemetria FUR-01 Atualizada: {latest_telemetry}")
    except Exception as e:
        print(f"[MQTT Error] Falha ao processar mensagem: {e}")

mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()
except Exception as e:
    print(f"[MQTT Warning] Falha na conexão com o Broker: {e}")

@app.route("/api/equipamentos/FUR-01/telemetria", methods=["GET"])
def get_telemetria():
    return jsonify(latest_telemetry), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)