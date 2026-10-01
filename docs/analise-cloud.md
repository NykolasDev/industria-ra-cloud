# Análise de Cenários: IaaS, PaaS e SaaS

A classificação depende de **quem é responsável por cada camada**: o provedor ou o consumidor.

## Cenário 1 — VM Linux com Docker, Flask e MQTT instalados pela empresa → **IaaS**

- **Provedor:** hardware, rede física, virtualização e a máquina virtual em si.
- **Empresa (consumidora):** sistema operacional e atualizações, Docker, Flask, Mosquitto, código, dados,
  firewall e portas, certificado HTTPS, backups e monitoramento.
- **Por que é IaaS:** o provedor entrega apenas infraestrutura. Tudo acima dela é da empresa.
- **Adequação ao projeto:** é o cenário mais adequado ao nosso protótipo, porque dá controle total
  (porta 1883 aberta, broker próprio, Docker Compose).

## Cenário 2 — Envio da aplicação para uma plataforma que administra infraestrutura e ambiente de execução → **PaaS**

- **Provedor:** servidores, sistema operacional, runtime, parte da rede, escalabilidade e, geralmente, o HTTPS.
- **Equipe (consumidora):** código da aplicação, configurações e dados.
- **O que deixa de ser responsabilidade da equipe:** instalar e manter servidores, SO e ambiente de execução.
- **Exemplo no projeto:** a API Flask poderia ir para uma plataforma como Render ou Heroku. O broker MQTT
  provavelmente exigiria um serviço gerenciado separado, e o simulador viraria um job ou outro serviço.
- **Trade-off:** mais praticidade, menos controle.

## Cenário 3 — O técnico apenas acessa uma aplicação pronta pelo navegador → **SaaS**

- **Provedor:** tudo, da infraestrutura à aplicação, incluindo atualizações e disponibilidade.
- **Usuário (consumidor):** apenas usa o software. Não instala, não atualiza e não administra servidores.
- **Relação com o projeto:** se a empresa hospedasse a solução completa e a oferecesse aos técnicos por
  uma URL, para eles seria SaaS.
- **Observação:** a mesma solução pode ser IaaS ou PaaS para quem a constrói e SaaS para quem a usa.

## Resumo

| Modelo | Provedor cuida de | Consumidor cuida de |
|---|---|---|
| IaaS | Hardware, rede e virtualização | SO, Docker, aplicação, dados e segurança |
| PaaS | Infraestrutura, SO e runtime | Código, configuração e dados |
| SaaS | Tudo | Apenas o uso do software |