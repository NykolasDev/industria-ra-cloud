# Matriz de Testes — FUR-01

Dispositivo: ____________  Navegador: ____________  Data: ____________

| ID | Ação | Procedimento | Resultado esperado | Resultado obtido | OK? | Evidência |
|----|------|--------------|--------------------|------------------|-----|-----------|
| T01 | Abrir WebAR | Abrir o link HTTPS no celular e permitir a câmera | Câmera disponível; navegador solicita permissão | | | |
| T02 | Apontar para o target | Mirar na foto impressa da furadeira | Estado "RA ATIVA" e 4 botões numerados surgem sobre a imagem | | | |
| T03 | Movimentar celular/target | Mover o celular ou o papel | Hotspots acompanham o ativo | | | |
| T04 | Tocar hotspot técnico | Tocar nos botões 1, 2 ou 3 | Painel abre com informação estática e botão de fechar | | | |
| T05 | Tocar Monitoramento | Tocar no botão 4 com a API ativa | API consultada; status, temperatura, vibração e hora exibidos | | | |
| T06 | Publicar novo valor MQTT | `docker compose stop simulator` e depois `docker compose exec mqtt mosquitto_pub -t industria/FUR-01/temperatura -m 55.5` | API recebe e atualiza o dado (`curl http://localhost:5000/api/equipamentos/FUR-01/telemetria` mostra 55.5) | | | |
| T07 | Consultar novamente | Tocar em "↻ Atualizar" no painel | Novo valor (55.5) apresentado na RA | | | |
| T08 | Parar a API | `docker compose stop api` e tocar em "↻ Atualizar" | Mensagem: "⚠ Não foi possível consultar os dados do equipamento. Verifique a disponibilidade do serviço e tente novamente." | | | |
| T09 | Restaurar a API | `docker compose start api` e tocar em "↻ Atualizar" | Consulta volta a funcionar | | | |

Observações:
- Os valores de telemetria são simulados e didáticos.
- Para voltar ao normal após o T06: `docker compose start simulator`.
- Evidência: print de tela, foto ou trecho de log.