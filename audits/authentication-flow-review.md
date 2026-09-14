# Revisão do fluxo de autenticação

## Achados específicos

1. **Alta — refresh e access tokens em `localStorage` (CWE-922).** Evidência: `src/app/core/services/session.ts:19,59-60,73,112-113`. Migrar refresh token para cookie HttpOnly e access token para memória.
2. **Alta — senha pública pré-preenchida no cadastro (CWE-521).** Evidência: `src/app/features/auth/pages/auth-page/auth-page.ts:23-30`. Inicializar todos os dados pessoais e a senha vazios e validar força no servidor.
3. **Média — método de refresh existe, mas não é usado.** Evidência: `api-client.ts:102-104`; não há interceptor de `401`. Sessões expiram abruptamente e requisições concorrentes podem falhar em cascata. Implementar um único refresh em curso, fila de requisições e encerramento em falha/reuso.
4. **Baixa — guard considera qualquer token como autenticação.** Evidência: `session.ts:19`; `app.routes.ts:14-25`. Restaurar sessão consultando o servidor.

## Checklist de autenticação

| Item | Estado | Evidência/limite |
|---|---|---|
| Hash de senha | Não verificável | Backend ausente. |
| Chaves JWT e algoritmo | Não verificável | Backend ausente. |
| TTL e claims | Não verificável | O cliente recebe `expiresIn`, mas não o usa. |
| Rotação/reuso de refresh | Não verificável | Backend ausente; cliente não coordena refresh. |
| Invalidação de sessão | Parcial | Logout limpa o cliente; invalidação no servidor não foi verificada. |
| Brute force e enumeração | Não verificável | Backend ausente. |
| Reset e verificação de e-mail | N/A | Fluxos não existem neste frontend. |
| Cookie/CSRF | Falha | Tokens não usam cookie; refresh fica em storage. |
| Validação de login | Parcial | `required` + `email`; sem limites. |
| Redirecionamento aberto | Passa | Rotas são constantes. |
| Vazamento de token em logs | Passa | Não foram encontrados logs de token/senha. |
| Transporte/CORS | Não verificável | Proxy HTTP é de desenvolvimento; produção não está configurada aqui. |

Risco: **7/10**. Prioridade: storage de token, senha padrão, refresh coordenado e controles do backend.
