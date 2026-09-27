# Front-end Control

Aplicacao Angular 21 LTS para consumir o backend Cointrol em `https://cointrol-backend.onrender.com`.

## Requisitos

- Node.js compativel com Angular 21 (`^20.19.0`, `^22.12.0` ou `^24.0.0`).
- Acesso ao backend em `https://cointrol-backend.onrender.com`.

## Como rodar

```bash
npm install
npm start
```

As chamadas usam diretamente `https://cointrol-backend.onrender.com/api/v1`, e o health check usa `/actuator/health` no mesmo backend. A URL base fica em `src/environments/environment.ts` e vale para desenvolvimento e build de producao.

O backend precisa permitir a origem do frontend via CORS, incluindo os headers `Authorization`, `Content-Type` e `Idempotency-Key`. O proxy de desenvolvimento tambem aponta para o Render caso sejam usadas rotas relativas `/api` ou `/actuator`.

## Funcionalidades iniciais

- Cadastro e login com JWT.
- Interceptor para enviar `Authorization: Bearer <token>`.
- Consulta de perfil autenticado.
- Criacao e listagem de contas.
- Criacao e listagem de categorias.
- Criacao e listagem de lancamentos.
- Criacao de transferencias com `Idempotency-Key`.
- Consulta de resumo financeiro por periodo.
- Health check visual do backend.

## Organizacao do codigo

```text
src/app
├── core
│   ├── interceptors
│   └── services
├── features
│   ├── accounts
│   ├── auth
│   ├── categories
│   ├── dashboard
│   ├── summaries
│   ├── transactions
│   └── transfers
├── layout
└── shared
```

As telas ficam em `features/<subdominio>/pages`, componentes reutilizaveis ficam em `shared/components`, a casca autenticada fica em `layout/shell`, e servicos de estado/infra ficam em `core/services`.

## Direcao visual

A interface usa um visual de dashboard moderno, com paleta clara, alto contraste e verde meio agua como cor secundaria (`#28d7bd`).
