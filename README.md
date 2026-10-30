# servicedesk-frontend

Interface do usuário do sistema ServiceDesk — consome a API REST do backend para exibir e gerenciar chamados de suporte.

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | HTML, CSS, JavaScript |
| Framework UI | [Bootstrap 5.3](https://getbootstrap.com/) (via CDN) |
| Ícones | Bootstrap Icons 1.11 (via CDN) |
| Requisições HTTP | Fetch API (nativa) |

---

## Conexão com o backend

A interface se comunica exclusivamente via API REST do backend (ver [servicedesk-backend](../servicedesk-backend)).  
A URL base da API está configurada diretamente em `assets/js/api.js`.

A autenticação é feita por **JWT**: o token de acesso é armazenado em memória e o refresh token em cookie HttpOnly.

---

## Configuração e instalação

Projeto estático — sem dependências de instalação.

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd servicedesk-frontend
```

Abra qualquer página em `pages/` diretamente no navegador, ou use um servidor local (ex: extensão **Live Server** no VS Code).

Antes de usar, configure a URL do backend em `assets/js/api.js`.

---

## Telas principais

| Tela | Rota | Descrição |
|------|------|-----------|
| Login | `/login` | Autenticação por usuário/senha ou Google |
| Cadastro | `/cadastro` | Criação de conta de cliente |
| Painel | `/` | Home do cliente (últimos chamados) ou painel do técnico (todos os chamados) |
| Novo chamado | `/chamados/novo` | Formulário de abertura de chamado |
| Histórico | `/chamados` | Lista completa dos chamados do cliente |
| Detalhe (cliente) | `/chamados/:id` | Conversa entre cliente e equipe técnica |
| Detalhe (admin) | `/admin/chamados/:id` | Visão operacional do técnico com controles de status |

---

## Perfis de acesso

| Perfil | Rota de entrada | Capacidades na interface |
|--------|----------------|--------------------------|
| Cliente | `/login` | Abrir chamados, acompanhar status, enviar mensagens |
| Staff / Admin | `/login` | Painel completo, atualizar status e prioridade, responder chamados |
