import os
import time
import json
import random
import paho.mqtt.client as mqtt

MQTT_BROKER = os.getenv("MQTT_BROKER", "broker_mqtt")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC = "industria/FUR-01/telemetria"

client = mqtt.Client()

while True:
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        print(f"[Simulador] Conectado ao Broker MQTT na porta {MQTT_PORT}")
        break
    except Exception:
        print("[Simulador] Aguardando o Broker MQTT iniciar...")
        time.sleep(3)

statuses = ["operando", "operando", "operando", "alerta"]

while True:
    telemetry = {
        "status": random.choice(statuses),
        "temperatura": round(random.uniform(35.0, 52.0), 1),
        "vibracao": round(random.uniform(1.2, 4.5), 1)
    }
    
    client.publish(MQTT_TOPIC, json.dumps(telemetry))
    print(f"[Simulador FUR-01 Enviado] -> {telemetry}")
    
    time.sleep(10)