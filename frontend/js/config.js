/*
 * Configuração da aplicação.
 * API_BASE: endereço da API Flask.
 * ATENÇÃO: se o frontend estiver em HTTPS (GitHub Pages), a API também
 * precisa estar em HTTPS (ex.: túnel ngrok/cloudflared), senão o navegador
 * bloqueia a chamada (mixed content).
 */
window.APP_CONFIG = {
  API_BASE: "https://6bfg8s9z-5000.brs.devtunnels.ms",
  EQUIPAMENTO_ID: "CNC-01",
  TIMEOUT_MS: 5000
};
