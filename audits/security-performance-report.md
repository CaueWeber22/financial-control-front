# Relatório consolidado de segurança e performance — Cointrol Frontend

Data: 2026-09-06  
Escopo: frontend Angular. O backend e a configuração real de hospedagem não estão disponíveis; controles dependentes deles estão marcados como **não verificáveis**.

## Resumo executivo

Postura geral: **risco Alto (7/10)** para uma aplicação financeira enquanto tokens persistirem no `localStorage` e o cadastro vier com uma senha conhecida. Não foi encontrada vulnerabilidade de dependência no `npm audit` (574 dependências, 0 avisos). O Angular também está usando interpolação segura; não foram encontrados `innerHTML`, bypass de sanitização, `eval`, uploads ou segredos de infraestrutura.

Contagem confirmada/condicional no frontend:

| Severidade | Quantidade |
|---|---:|
| Crítica | 0 |
| Alta | 2 |
| Média | 5 |
| Baixa | 2 |

Prioridades que mais reduzem risco:

1. Mover refresh token para cookie HttpOnly e manter access token curto apenas em memória.
2. Remover senha e PII pré-preenchidas; aplicar política de senha no backend.
3. Tornar lançamentos/transferências atomicamente idempotentes e bloquear reenvio no cliente.
4. Verificar no backend ownership, valores, datas e transições de status.
5. Publicar CSP e cabeçalhos anti-clickjacking; implementar refresh/401 centralizado.

## Achados de segurança

### Alta — SEC-01: access e refresh tokens em localStorage

- Fonte: `initial-security-analysis.md`, `authentication-flow-review.md`, `secrets-management-review.md`.
- CWE-922.
- Código: `src/app/core/services/session.ts:19,59-60,73,112-113`; `src/app/core/interceptors/auth-token.interceptor.ts:4-14`.
- Risco: roubo de sessão por qualquer execução de script na origem; o refresh token aumenta a janela de ataque.
- Correção: refresh cookie `HttpOnly; Secure; SameSite=Strict`, rotação/reuso no backend; access token em memória com TTL curto.

### Alta — SEC-02: senha conhecida no formulário de cadastro

- Fonte: `initial-security-analysis.md`, `authentication-flow-review.md`.
- CWE-521.
- Código: `src/app/features/auth/pages/auth-page/auth-page.ts:23-30`.
- Risco: criação acidental de contas com `Valid@123`, uma senha publicamente visível no código.
- Correção: valores iniciais vazios; política e lista de senhas comprometidas no servidor; feedback de força apenas como apoio no cliente.

### Média — BL-01: duplicidade de operações financeiras

- Fonte: `business-logic-review.md`.
- CWE-362.
- Código: `transactions-page.html:53`, `transfers-page.html:39`, `api-client.ts:144-179`.
- Risco: cliques concorrentes recebem chaves diferentes e podem criar registros duplicados.
- Correção: uma chave por intenção, reutilizada em retry; estado `saving`; idempotência transacional autoritativa no servidor.

### Média — SEC-03: cabeçalhos de segurança não comprovados

- Fonte: `initial-security-analysis.md`.
- CWE-1021 / CWE-693.
- Código: `src/index.html:3-9`; não há configuração de produção no repositório.
- Risco: clickjacking e impacto maior de uma injeção futura.
- Correção: CSP com `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`; `Referrer-Policy`, `Permissions-Policy`, HSTS e `X-Content-Type-Options` no edge/servidor.

### Média — VAL-01: limites e regras cruzadas incompletos

- Fonte: `input-validation-review.md`.
- CWE-20.
- Código: forms em `auth-page.ts:18-30`, `transactions-page.ts:18-25`, `transfers-page.ts:18-23`, `summary-page.ts:16-23`.
- Risco: strings enormes, intervalos invertidos, mesma conta em origem/destino e dados fora do domínio chegam à API.
- Correção: validadores de tamanho/formato/grupo no Angular e validação equivalente obrigatória no backend.

### Média — BL-02: autorização e workflow dependem do backend não auditado

- Fonte: `business-logic-review.md`.
- CWE-602 / CWE-639.
- Código: IDs e status enviados por `transactions-page.ts:18-38` e `transfers-page.ts:18-36`.
- Risco: cliente adulterado pode tentar usar recursos alheios e estados não permitidos.
- Correção: consulta sempre filtrada pelo usuário, deny-by-default e máquina de estados no servidor. **Não foi possível confirmar se o backend já faz isso.**

### Média — AUTH-03: refresh token implementado, mas fluxo não utilizado

- Fonte: `authentication-flow-review.md`.
- Código: `api-client.ts:102-104`; ausência de tratamento de `401` no interceptor.
- Risco: expiração abrupta, tempestade de refresh quando várias requisições falham e UX inconsistente.
- Correção: refresh single-flight, fila de requisições e logout em falha/reuso.

### Baixa — SEC-04: guard confia na presença do token

- Fonte: `initial-security-analysis.md`.
- CWE-602.
- Código: `session.ts:19`; `app.routes.ts:14-25`.
- Correção: estado `unknown/authenticated/anonymous` e restauração por `/users/me`.

### Baixa — BL-03: Math.random como fallback da chave idempotente

- Fonte: `business-logic-review.md`.
- CWE-330.
- Código: `api-client.ts:174-180`.
- Correção: UUID criptográfico obrigatório.

## Performance

Build de produção observado: **335,63 kB bruto / 85,80 kB estimado transferido**, abaixo do budget de 500 kB. Não há dependências visuais pesadas ou fontes remotas.

### PERF-01 — Rotas carregadas de forma eager

- Prioridade: Média.
- Evidência: todos os componentes são imports estáticos em `src/app/app.routes.ts:5-12,28-63`.
- Efeito: autenticação baixa também dashboard, contas, categorias, transações, transferências e relatórios.
- Correção: `loadComponent: () => import(...).then(m => m.AccountsPage)` para cada feature. Manter shell e auth em chunks próprios.

### PERF-02 — `/users/me` é solicitado duas vezes após login

- Prioridade: Média.
- Evidência: `session.ts:63` chama `loadProfile()` antes de navegar; ao criar o shell, `finance-store.ts:22-27` chama novamente.
- Efeito: uma chamada duplicada em cada login, além de possíveis mensagens de erro concorrentes.
- Correção: remover uma das chamadas ou tornar `loadProfile()` idempotente com cache/single-flight.

### PERF-03 — filtros podem produzir requisições concorrentes e respostas fora de ordem

- Prioridade: Média.
- Evidência: `summary-page.html:7,10-19` pode disparar `loadSummary()` repetidamente; `finance-store.ts:101-105` faz subscribe independente.
- Efeito: desperdício de rede e resultado antigo sobrescrevendo o mais recente.
- Correção: stream de filtros com `debounceTime`, `distinctUntilChanged` e `switchMap`, ou cancelar a assinatura anterior.

### PERF-04 — formatadores são recriados durante change detection

- Prioridade: Baixa.
- Evidência: `transactions-page.ts:41-45`, `summary-page.ts:26-30`, `dashboard-page.ts` criam `Intl.NumberFormat`/`Intl.DateTimeFormat`; os métodos são chamados dentro de loops de template.
- Efeito: alocações repetidas. Hoje a lista de transações é limitada a 8, então o impacto atual é pequeno.
- Correção: `CurrencyPipe`/`DatePipe` puros ou instâncias de `Intl` estáticas/cacheadas por moeda.

### PERF-05 — CSS legado e novo são enviados juntos

- Prioridade: Baixa.
- Evidência: `angular.json:33` inclui `styles.scss` e `design.scss`; o segundo sobrescreve parte relevante do primeiro.
- Efeito: CSS duplicado, maior custo de manutenção e regras mortas. O bundle atual ainda é pequeno (15,79 kB minificado).
- Correção: consolidar tokens e remover regras substituídas de `styles.scss`.

### PERF-06 — ChangeDetection padrão em todos os componentes

- Prioridade: Baixa agora; aumenta com volume.
- Evidência: componentes não declaram `changeDetection: ChangeDetectionStrategy.OnPush`.
- Correção: adotar OnPush, manter signals e evitar funções alocadoras no template.

Boas práticas já presentes: `@for` usa `track` estável; requisições HTTP completam automaticamente; dados de referência ficam no store; build tem budgets; API usa URLs relativas; chave idempotente usa `crypto.randomUUID` em navegadores atuais.

## Compliance

| Área | Cobertura |
|---|---|
| OWASP A01 Broken Access Control | Não verificável sem backend; risco de IDOR explicitado |
| OWASP A02 Cryptographic Failures | Falha no armazenamento de tokens no navegador |
| OWASP A03 Injection | Templates passam; validação do backend não verificável |
| OWASP A05 Security Misconfiguration | Cabeçalhos de produção ausentes do escopo |
| OWASP A06 Vulnerable Components | Passa no `npm audit` atual |
| OWASP A07 Authentication Failures | Falha em token storage/senha padrão; backend não verificável |
| OWASP A08 Integrity Failures | Idempotência precisa ser confirmada no backend |
| PCI DSS | N/A se não processa cartões; confirmar escopo do produto |
| LGPD/GDPR | Há PII no cadastro; retenção, consentimento e direitos não são verificáveis no frontend |
| SOC 2 | Logging, alertas, mudança e disponibilidade exigem evidência operacional ausente |

## Guia de testes após correções

1. **Token:** após login, `localStorage.getItem('cointrol.refreshToken')` deve retornar `null`; JavaScript não deve conseguir ler o cookie HttpOnly.
2. **Senha:** cadastro com `password` vazio, curta ou presente em denylist deve retornar `400` genérico.
3. **Idempotência:** enviar o mesmo POST duas vezes com a mesma chave deve retornar a mesma operação; duas chaves para o mesmo duplo clique devem ser impedidas pela UI.
4. **Ownership:** trocar `accountId` por ID de outro usuário deve retornar `404` ou `403`, sem revelar metadados.
5. **Workflow:** status não permitido, origem=destino, valor zero/negativo, moeda desconhecida e `from > to` devem retornar `400`.
6. **Headers:** verificar com `curl -I https://host/` a presença de CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`.
7. **Performance:** comparar chunks antes/depois de lazy loading e confirmar apenas auth + runtime no carregamento de `/auth`.

## Limites da auditoria

Não foi possível avaliar hash de senha, claims/algoritmos JWT, expiração, rotação/reuso, rate limiting, CORS, autorização por proprietário, validação de DTOs, persistência idempotente, logs ou cabeçalhos reais sem o repositório/configuração do backend e da hospedagem.
