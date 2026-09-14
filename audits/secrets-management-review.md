# Auditoria de segredos

## Resultado

Não foram encontrados API keys, senhas de infraestrutura, chaves JWT, certificados ou `.env` versionados. `environment.ts` contém somente caminhos relativos públicos. `npm` lockfile contém URLs e hashes normais do registro.

## Achado

### SEC-STORE-01 — Tokens de sessão tratados como dados persistentes do navegador

- Severidade: Alta
- CWE: CWE-922
- Evidência: `src/app/core/services/session.ts:59-60` e `auth-token.interceptor.ts:4`.
- Motivo: tokens são credenciais; `localStorage` não oferece `HttpOnly` nem isolamento contra scripts na origem.
- Correção: cookie HttpOnly para refresh token, access token curto em memória e rotação/reuso no servidor.

O valor `Valid@123` em `auth-page.ts:30` não é um segredo de infraestrutura, mas é uma credencial de exemplo perigosa e foi reportada na revisão de autenticação.

## Checklist

| Controle | Estado |
|---|---|
| Segredos hardcoded | Passa |
| `.env` versionado | Passa no estado observado |
| URLs públicas separadas de segredos | Passa |
| Armazenamento de credenciais de sessão | Falha |
| Rotação de chaves/certificados | N/A no frontend; verificar backend |

Risco: **6/10**, concentrado no storage de tokens.
