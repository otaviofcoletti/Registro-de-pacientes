// Configuração da API que detecta automaticamente o hostname
// Isso permite que funcione tanto em localhost quanto no IP da rede

// Função que retorna a URL da API baseada no hostname atual
// Esta função sempre calcula em runtime, nunca em build time
// IGNORA a variável de ambiente VITE_API_URL para permitir detecção dinâmica
export function getApiUrl() {
  // Detecta o hostname atual (localhost ou IP da rede)
  // Sempre verifica em runtime - IGNORA VITE_API_URL do build
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const origin = window.location.origin;
    
    console.log('[getApiUrl] Detected:', { hostname, protocol, origin });
    
    // Se for localhost, usa localhost:5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const url = 'http://localhost:5000';
      console.log('[getApiUrl] Returning:', url);
      return url;
    }
    
    // Caso contrário, usa o mesmo hostname na porta 5000
    const url = `${protocol}//${hostname}:5000`;
    console.log('[getApiUrl] Returning:', url);
    return url;
  }
  
  // Fallback apenas se window não existir (não deveria acontecer no navegador)
  // Se window não existir, tenta usar a variável de ambiente como último recurso
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== 'undefined' && envUrl !== '') {
    console.warn('[getApiUrl] Window not available, using VITE_API_URL:', envUrl);
    return envUrl;
  }
  
  console.warn('[getApiUrl] Window not available, using fallback');
  return 'http://localhost:5000';
}
