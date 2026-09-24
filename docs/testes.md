# Matriz de testes

Preencha a coluna "Resultado" (OK/Falhou) e "Evidência" (print, vídeo, log).

| ID | Ação | Resultado esperado | Resultado | Evidência |
|----|------|--------------------|-----------|-----------|
| T01 | Abrir a WebAR | Câmera disponível | | |
| T02 | Apontar para o target | Estado "RA ATIVA" | | |
| T03 | Movimentar celular/target | Hotspots acompanham o ativo | | |
| T04 | Tocar hotspot técnico (1 a 4) | Informação estática apresentada | | |
| T05 | Tocar hotspot 5 (Monitoramento) | API consultada e JSON apresentado | | |
| T06 | Publicar novo valor MQTT (`docker exec ra-mqtt mosquitto_pub -t industria/CNC-01/temperatura -m 47.2`, com o simulador parado) | Serviço recebe/atualiza o dado (ver `docker compose logs backend`) | | |
| T07 | Tocar em "Consultar novamente" | Novo valor (47.2) apresentado na RA | | |
| T08 | Parar a API (`docker compose stop backend`) e consultar | Mensagem de indisponibilidade, RA continua funcional | | |
| T09 | Restaurar a API (`docker compose start backend`) e consultar | Consulta volta a funcionar | | |

Observação: após reiniciar o backend, o valor em memória some até o simulador publicar de novo (o simulador usa `retain`, então o broker reenvia o último valor assim que a API reassina).
