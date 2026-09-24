# Análise: dados, containers e modelos de serviço

## 1. Decisões de dados (interface x serviço)
| Dado | Onde fica | Justificativa |
|------|-----------|---------------|
| Nome, descrição e função dos componentes | Frontend | Conteúdo didático estável; não muda com a operação e evita chamada de rede. |
| Temperatura, vibração, status, última atualização | Serviço (API) | Mudam continuamente; devem ter uma fonte única e atualizada, não valores gravados no `app.js`. |
| Identificação do ativo (id, tipo, setor) | Serviço (API) | É dado cadastral que pode mudar/crescer para vários ativos sem republicar o frontend. |

## 2. Que problema o container resolve?
Empacota o código junto com o ambiente (versão do Python, bibliotecas, configuração), de modo que a API, o broker e o simulador rodam do mesmo jeito no notebook de qualquer integrante, na máquina do professor ou em um servidor. Elimina o "na minha máquina funciona", isola os serviços (cada um com suas dependências), permite subir e derrubar tudo com um comando (`docker compose up`) e facilita reproduzir e escalar cada serviço separadamente.

## 3. IaaS, PaaS e SaaS
| Cenário | Modelo | Justificativa |
|---------|--------|---------------|
| Empresa contrata uma VM Linux e instala Docker, Flask e MQTT | **IaaS** | O provedor entrega infraestrutura virtualizada (computação, rede, armazenamento). A empresa continua responsável por sistema operacional, atualizações e segurança da VM, Docker, Flask, broker, configuração e dados. |
| Equipe envia a aplicação a uma plataforma que administra infraestrutura e ambiente de execução | **PaaS** | O provedor cuida de servidores, SO, runtime e escala. A equipe deixa de administrar VM/SO/runtime e foca no código e na configuração da aplicação. |
| Técnico apenas acessa uma aplicação pronta pelo navegador | **SaaS** (na perspectiva do usuário) | O usuário consome o software como serviço, sem instalar nem administrar infraestrutura, plataforma ou código. A solução da equipe, se fosse oferecida assim, seria vista como SaaS pelo técnico. |

## 4. Respostas para a apresentação
- **Onde executa o Flask?** No container `ra-backend` (porta 5000), iniciado pelo Compose.
- **Função do broker MQTT?** Intermediar as mensagens publish/subscribe entre simulador (publisher) e API (subscriber), desacoplando quem produz de quem consome.
- **Por que a WebAR usa HTTP/JSON?** É simples, universal e suportado por `fetch()`; a API concentra o acesso e esconde o MQTT do navegador.
- **Serviço em cada container?** `ra-mqtt` = Mosquitto; `ra-backend` = Flask; `ra-simulator` = publicador.
- **Se o broker cair?** A API continua respondendo com o último valor guardado em memória (que fica desatualizado) e o cliente MQTT reconecta sozinho quando o broker voltar.
- **Onde está o último dado?** Em memória, no dicionário `telemetria` do `backend/app.py` (perdido ao reiniciar o container).
- **Como os hotspots acompanham o target?** Posição local (`data-x/y/z`) -> `localToWorld()` -> `project(camera)` -> pixels -> `left/top` do botão, a cada quadro.
- **Target físico x `.mind`?** O target é a imagem impressa/exibida; o `.mind` é o arquivo compilado com as características dessa imagem que o MindAR usa para reconhecê-la.
- **O que escalar com muitos usuários?** A API Flask (várias réplicas atrás de balanceador); o estado em memória teria de ir para um armazenamento compartilhado (ex.: Redis).
- **Cenário mais adequado ao IaaS?** O da VM Linux: o controle é da equipe.
- **O que muda no PaaS?** Sem administrar VM/SO/Docker; envia-se o código e a plataforma executa e escala; configura-se broker e variáveis de ambiente pelos recursos da plataforma.
- **Se a API parasse?** O reconhecimento do target, os hotspots e os textos estáticos (1 a 4) continuam funcionando; apenas o monitoramento mostra a mensagem de indisponibilidade.
