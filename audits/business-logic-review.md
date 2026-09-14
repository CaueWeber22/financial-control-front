# Revisão de lógica de negócio financeira

## Modelo de ameaça

- Ativos: integridade de saldos, lançamentos, transferências e relatórios.
- Atores: usuário legítimo com duplo clique/rede lenta, cliente adulterado, atacante com sessão roubada.
- Fronteira: navegador não é confiável; API precisa autorizar conta/categoria por proprietário e validar toda transição.

## Achados

### BL-01 — Envios financeiros concorrentes usam chaves de idempotência diferentes

- Severidade: Média (Alta se o backend não possuir deduplicação transacional)
- CWE: CWE-362
- Evidência: botões permanecem ativos em `transactions-page.html:53` e `transfers-page.html:39`; cada chamada gera uma nova chave em `api-client.ts:144-179`.
- Exploração/reprodução: em rede lenta, clicar duas vezes em “Salvar lançamento” dispara dois POSTs, cada um com `Idempotency-Key` distinto. A chave não identifica a intenção do usuário.
- Correção no cliente: criar uma chave quando a ação começa, reutilizá-la em retry, expor `saving` e bloquear o formulário até finalizar.
- Correção autoritativa: backend com tabela de idempotência vinculada a usuário + endpoint + chave, resposta persistida e restrição única dentro da transação.

### BL-02 — Status e identificadores são controlados pelo cliente

- Severidade: Média, condicionada ao backend
- CWE: CWE-602 / CWE-639
- Evidência: `transactions-page.ts:18-38` envia `accountId`, `categoryId`, `type` e `status`; `transfers-page.ts:18-36` envia ambas as contas.
- Impacto: um cliente modificado pode tentar usar IDs de outro usuário, status não oferecidos pela UI ou transferir entre contas não autorizadas.
- Correção: backend deve carregar recursos pelo usuário autenticado, usar allowlists de status/transições e nunca confiar em ownership informado pelo cliente.

### BL-03 — Fallback de idempotência usa `Math.random`

- Severidade: Baixa
- CWE: CWE-330
- Evidência: `api-client.ts:174-180`.
- Impacto: ambientes sem `crypto.randomUUID` recebem chaves de menor qualidade. Não é segredo, mas colisões tornam deduplicação menos confiável.
- Correção: exigir `crypto.randomUUID()` ou usar UUID criptográfico compatível; falhar explicitamente se indisponível.

## Checklist

| Controle | Estado |
|---|---|
| Proteção contra repetição/duplo clique | Falha |
| Idempotência de retries | Parcial |
| Ownership de recursos | Não verificável no backend |
| Status e workflow | Não verificável no backend |
| Valores negativos | Passa na UI; backend não verificável |
| Origem diferente do destino | Falha |
| Manipulação de moeda | Não verificável no backend |

Risco: **6/10**, podendo subir para Alto conforme a implementação do backend.
