# Análise inicial de segurança — frontend Cointrol

Data: 2026-09-06  
Escopo: aplicação Angular em `src/`, configuração e dependências. O backend não está neste repositório.

## Superfície de ataque

- Entrada: `src/main.ts`; Angular 21, RxJS 7.8, npm.
- Rotas: `/auth`, `/`, `/accounts`, `/categories`, `/transactions`, `/transfers`, `/summary` em `src/app/app.routes.ts`.
- API: cliente HTTP centralizado em `src/app/core/services/api-client.ts`, usando `/api/v1` e `/actuator/health`.
- Autenticação: bearer tokens em `localStorage`, adicionados pelo interceptor apenas a URLs iniciadas por `/api`.
- Dados sensíveis: tokens, perfil e dados financeiros. Não há banco, upload ou execução de comandos no frontend.
- Dependências: `npm audit --json` em 2026-09-06 retornou 0 vulnerabilidades conhecidas.

## Achados

### SEC-01 — Tokens persistentes acessíveis a JavaScript

- Severidade: Alta
- CWE: CWE-922
- Evidência: `session.ts:19,59-60,73,112-113`; `auth-token.interceptor.ts:4-14`.
- Impacto: uma falha XSS, extensão maliciosa ou script comprometido pode extrair access e refresh tokens. O refresh token amplia a duração do comprometimento.
- Reprodução segura: no console da mesma origem, `localStorage.getItem('cointrol.refreshToken')` retorna o token após login.
- Correção: refresh token em cookie `HttpOnly; Secure; SameSite=Strict` emitido pelo servidor; access token curto somente em memória. Remover o refresh token do corpo das chamadas do navegador.
- Defesa adicional: CSP estrita e rotação/reuso de refresh token no backend.

### SEC-02 — Cadastro oferece senha conhecida pré-preenchida

- Severidade: Alta
- CWE: CWE-521
- Evidência: `auth-page.ts:23-30`; o controle `password` inicia com `Valid@123`. A UI também mostra esse padrão em `auth-page.html:89`.
- Impacto: um usuário pode criar uma conta financeira com uma senha pública e previsível sem perceber.
- Reprodução segura: abrir `/auth` e inspecionar o valor inicial do campo de cadastro.
- Correção: iniciar senha e PII como strings vazias; exigir pelo menos comprimento e medidor de força no cliente, mantendo a regra autoritativa no servidor.

### SEC-03 — Ausência de política de segurança de conteúdo e anti-frame verificável

- Severidade: Média
- CWE: CWE-1021 / CWE-693
- Evidência: `src/index.html:3-9` não declara CSP; não há configuração de hospedagem neste repositório que prove `Content-Security-Policy`, `frame-ancestors`, `Referrer-Policy` ou `Permissions-Policy`.
- Impacto: clickjacking e maior impacto de injeções futuras, especialmente porque tokens ficam no `localStorage`.
- Correção: definir cabeçalhos no servidor/CDN. Base recomendada: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`.

### SEC-04 — Guard de rota confia apenas na presença de uma string

- Severidade: Baixa
- CWE: CWE-602
- Evidência: `session.ts:19`; `app.routes.ts:14-25`.
- Impacto: qualquer pessoa pode abrir a UI protegida definindo uma chave arbitrária no storage. Isso não concede acesso se o backend autorizar cada recurso corretamente, mas o estado do cliente é enganoso.
- Correção: validar/restaurar a sessão via `/users/me` antes de liberar o shell; tratar `401` centralmente. Autorização real deve permanecer no backend.

## Checklist inicial

| Controle | Estado | Observação |
|---|---|---|
| Entrada, rotas e integrações mapeadas | Passa | Todos centralizados e pequenos. |
| Middleware/interceptor | Passa parcialmente | Restrição de URL é boa; falta fluxo de `401`/refresh. |
| Autenticação/autorização | Falha | Storage inseguro; backend não auditável neste escopo. |
| Uploads e filesystem | N/A | Não existem no frontend. |
| Banco e injeção SQL | N/A | Backend ausente. |
| Rate limiting | Não verificável | Requer configuração do backend. |
| Dependências conhecidamente vulneráveis | Passa | `npm audit`: 0. |

Risco inicial: **7/10 (Alto)**, reduzido de forma importante ao corrigir SEC-01 e SEC-02.
