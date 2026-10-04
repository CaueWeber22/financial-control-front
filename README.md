# Front-end Control

Aplicacao Angular 21 LTS para consumir o backend Cointrol.

## Requisitos

- Node.js compativel com Angular 21 (`^20.19.0`, `^22.12.0` ou `^24.0.0`).
- Acesso ao backend Cointrol.

## Como rodar

```bash
npm install
npm start
```

O build padrao de producao chama o backend Render diretamente (`https://cointrol-backend.onrender.com`). Em desenvolvimento local, o Angular usa `src/environments/environment.development.ts` com URLs relativas (`/api/v1` e `/actuator/health`), encaminhadas pelo `proxy.conf.json` para `http://localhost:8080`.

## Docker

A partir da raiz que contem `cointrol` e `front-end-control`:

```bash
docker compose up --build
```

O frontend fica em `http://localhost:4200`. A imagem Docker usa a configuracao `docker`, que mantem URLs relativas para o Nginx do container encaminhar `/api` e `/actuator` para o servico `api`.

O backend precisa permitir a origem do frontend via CORS, incluindo os headers `Authorization`, `Content-Type`, `X-CSRF-TOKEN` e `Idempotency-Key`.

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
