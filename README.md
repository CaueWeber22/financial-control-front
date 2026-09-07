# Front-end Control

Aplicacao Angular 21 LTS para consumir o backend Cointrol em `http://localhost:8080`.

## Requisitos

- Node.js compativel com Angular 21 (`^20.19.0`, `^22.12.0` ou `^24.0.0`).
- Backend rodando em `http://localhost:8080`.

## Como rodar

```bash
npm install
npm start
```

O script `npm start` usa `proxy.conf.json`, entao o front chama `/api/v1` e o Angular encaminha para `http://localhost:8080`.

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
