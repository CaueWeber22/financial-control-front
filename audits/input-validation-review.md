# Revisão de validação de entradas

Validação Angular melhora UX, mas pode ser removida pelo DevTools ou ignorada por chamadas diretas. Todos os controles financeiros abaixo exigem validação e autorização equivalentes no backend.

## Matriz de endpoints

| Endpoint | Validação no cliente | Estado |
|---|---|---|
| `POST /users` | required e formato de e-mail; sem limites; senha conhecida | Falha |
| `POST /auth/login` | required e e-mail | Parcial |
| `POST /auth/refresh` | nenhuma UI | Não verificável |
| `POST /auth/logout` | token lido do storage | Parcial |
| `GET /users/me` | sem entrada | N/A |
| `GET/POST /accounts` | moeda com 3 caracteres e saldo mínimo; nome sem limite | Parcial |
| `GET /accounts/{id}/balance` | ID vem da resposta, mas é interpolado na rota | Não verificável no servidor |
| `GET/POST /categories` | nome/tipo obrigatórios; nome sem limite | Parcial |
| `GET/POST /transactions` | campos obrigatórios e valor mínimo; descrição/data sem limites semânticos | Parcial |
| `POST /transfers` | campos obrigatórios e valor mínimo; não impede origem = destino | Falha |
| `POST /transfers/{id}/cancel` | `reason` sem validação no cliente | Falha |
| `GET /summary` | datas obrigatórias; não exige `from <= to` | Falha |
| `GET /actuator/health` | sem entrada | N/A |

## Achados

### VAL-01 — Restrições de tamanho e formato incompletas

- Severidade: Média
- CWE: CWE-20
- Evidência: `auth-page.ts:18-30`, `categories-page.ts:18-20`, `transactions-page.ts:18-25`, `transfers-page.ts:18-23`.
- Impacto: payloads enormes, datas inválidas e campos fora do domínio podem alcançar a API; o HTML não é fronteira de segurança.
- Correção: adicionar `maxLength`, `pattern`, validação de datas e DTOs tipados; espelhar regras com Bean Validation/Zod/etc. no servidor e limitar o corpo HTTP.

### VAL-02 — Regras cruzadas financeiras ausentes

- Severidade: Média
- CWE: CWE-20
- Evidência: `transfers-page.ts:18-36` não valida origem diferente do destino; `summary-page.ts:16-23` não valida ordem das datas.
- Impacto: operações sem sentido, desperdício de chamadas e possíveis inconsistências se o backend também omitir as regras.
- Correção: validators de grupo para `sourceAccountId !== destinationAccountId` e `from <= to`, além de regras autoritativas no servidor.

## Checklist

| Classe | Estado |
|---|---|
| SQL/NoSQL injection | Não verificável; sem banco no escopo |
| Command injection | N/A |
| XSS de template | Passa — interpolação Angular escapa texto; nenhum `innerHTML`/bypass encontrado |
| XXE | N/A |
| Path traversal/upload | N/A |
| Tipos, limites e regras de domínio | Falha |

Risco: **5/10 (Médio)**, condicionado à validação real do backend.
