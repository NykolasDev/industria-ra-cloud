"""
Simulador de telemetria: publica valores FICTÍCIOS no broker MQTT.

Tópicos:
  industria/CNC-01/temperatura
  industria/CNC-01/vibracao
  industria/CNC-01/status
"""
import os
import random
import time

import paho.mqtt.client as mqtt

MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
EQUIP_ID = os.getenv("EQUIP_ID", "CNC-01")
INTERVALO = float(os.getenv("SIM_INTERVALO", "5"))  # segundos

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)


def conectar():
    while True:
        try:
            client.connect(MQTT_HOST, MQTT_PORT, keepalive=30)
            client.loop_start()
            print(f"[SIM] Conectado a {MQTT_HOST}:{MQTT_PORT}")
            return
        except OSError as erro:
            print(f"[SIM] Broker indisponível ({erro}). Nova tentativa em 3 s...")
            time.sleep(3)


def publicar(grandeza, valor):
    topico = f"industria/{EQUIP_ID}/{grandeza}"
    # retain=True: quem se conectar depois recebe o último valor
    client.publish(topico, str(valor), retain=True)
    print(f"[SIM] {topico} = {valor}")


conectar()
temperatura = 42.0
vibracao = 2.3

while True:
    # "Passeio aleatório" simples, dentro de uma faixa fictícia
    temperatura = min(60.0, max(30.0, temperatura + random.uniform(-1.2, 1.2)))
    vibracao = min(5.0, max(0.5, vibracao + random.uniform(-0.3, 0.3)))
    status = "operando" if random.random() > 0.05 else "parado"

    publicar("temperatura", round(temperatura, 1))
    publicar("vibracao", round(vibracao, 1))
    publicar("status", status)
    time.sleep(INTERVALO)
