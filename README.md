# servicedesk-frontend

Interface do usuário do sistema ServiceDesk — consome a API REST do backend para exibir e gerenciar chamados de suporte.

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Framework | [React 18](https://react.dev/) (ou Vue / Next.js — ajuste conforme o projeto) |
| Linguagem | TypeScript |
| Estilização | [Tailwind CSS](https://tailwindcss.com/) (ou Bootstrap — ajuste conforme o projeto) |
| Gerenciamento de estado | Context API / Zustand |
| Requisições HTTP | Axios |
| Roteamento | React Router v6 |

> Ajuste a tabela acima para refletir as tecnologias reais utilizadas no repositório.

---

## Conexão com o backend

A interface se comunica exclusivamente via API REST do backend (ver [servicedesk-backend](../servicedesk-backend)).  
Configure a URL base da API no arquivo de variáveis de ambiente:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

A autenticação é feita por **JWT**: o token de acesso é armazenado em memória e o refresh token em cookie HttpOnly.

---

## Configuração e instalação

**Pré-requisitos:** Node.js 18+

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd servicedesk-frontend

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher VITE_API_BASE_URL com a URL do backend

# 4. Iniciar em modo desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` por padrão.

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
