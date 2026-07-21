# GLPI REST API Integration Backend

Este é o backend intermediário desenvolvido em **Python (FastAPI)** com banco de dados **SQLAlchemy/SQLite** para integrar de forma segura e eficiente a aplicação frontend (Next.js) com a **API REST nativa do GLPI**.

Este projeto substitui a automação legada por Selenium, trazendo escalabilidade, segurança e confiabilidade para a equipe de técnicos.

---

## 🔒 Arquitetura de Segurança (Prevenção de Session/User Token Leak)

Para impedir o envio de Session Tokens ou User Tokens confidenciais do GLPI ao frontend, implementamos o padrão **Intermediate API Gateway (BFF - Backend for Frontend)**:

1. **Separação de Tokens**:
   - O Frontend Next.js comunica-se exclusivamente com este backend intermediário usando tokens **JWT (JSON Web Token)** de curta/média duração assinados com algoritmo robusto.
   - O frontend **nunca** tem acesso ao `App-Token`, `User-Token` ou `Session-Token` do GLPI.
2. **Gerenciamento Centralizado de Sessão**:
   - O `GLPIClient` neste backend mantém um estado centralizado e em memória do `Session-Token`.
   - Se o token expirar, o backend intercepta o erro de sessão inválida (`ERROR_SESSION_TOKEN_INVALID`), refaz a reautenticação silenciosa com o GLPI via `initSession` e reenvia a requisição original de forma transparente para o técnico.
3. **Mapeamento de IDs**:
   - Os IDs das entidades e categorias internas do GLPI são mapeados no banco de dados local. O frontend envia apenas siglas textuais amigáveis (ex: `client_abbreviation: "SMS"`, `catalog_shortcut: "SISTEMA INDISPONÍVEL"`), evitando que a topologia interna do GLPI seja exposta na interface do usuário.
4. **Associação do Técnico Requerente**:
   - Para abrir o chamado no nome do técnico logado (evitando que fique no nome do usuário de serviço da API), o backend busca a associação do usuário local (`glpi_user_id`) no banco de dados.
   - Logo após a criação do ticket, o backend faz uma chamada secundária ao endpoint `/Ticket_User` com o `glpi_ticket_id` e o `glpi_user_id` do técnico com tipo `1` (Requerente), associando-o devidamente.
   - Caso o técnico logado não possua um `glpi_user_id` cadastrado localmente, a API bloqueia preventivamente o envio com erro `400 Bad Request` para garantir a integridade dos dados e autoria dos chamados.

---

## 🛠️ Banco de Dados e Tabelas

Utilizamos um banco de dados relacional para estruturar os logs de envios, mappings e autenticação local. O esquema de tabelas estruturado inclui:

### 1. `users` (Técnicos do Sistema)
Armazena a conta local dos técnicos que usam o portal de abertura de chamados.
* `id` (INTEGER, PK): Identificador autoincremento.
* `username` (VARCHAR, Unique): Login do técnico.
* `password_hash` (VARCHAR): Hash bcrypt da senha de acesso.
* `role` (VARCHAR): Nível de acesso (`admin` para gerenciar mappings, `technician` para operação padrão).
* `glpi_user_id` (INTEGER, Nullable): ID equivalente do usuário no GLPI.
* `is_active` (BOOLEAN): Status ativo/inativo.

### 2. `client_mappings` (Entidades do GLPI)
Substitui o arquivo estático `clientes.json`, mapeando siglas enviadas pelo frontend aos IDs das entidades do GLPI.
* `id` (INTEGER, PK): Identificador único.
* `abbreviation` (VARCHAR, Unique): Sigla pesquisada pelo frontend (ex: `SMS`, `FCECON`).
* `glpi_entity_id` (INTEGER): ID real correspondente em `entities_id` no GLPI.
* `name` (VARCHAR): Nome completo do cliente.

### 3. `catalog_mappings` (Categorias do GLPI)
Substitui o mapeamento antigo `CATALOGO_MAP`/`CATALOGO_HINT`, vinculando atalhos de chamado à árvore de categorias ITIL do GLPI.
* `id` (INTEGER, PK): Identificador único.
* `shortcut` (VARCHAR, Unique): Texto correspondente no catálogo do frontend (ex: `RESERVA DE COMPUTADOR`).
* `glpi_category_id` (INTEGER): ID real correspondente em `itilcategories_id` no GLPI.
* `description` (VARCHAR): Descrição detalhada do catálogo.

### 4. `sent_tickets` (Controle de Duplicidade)
Substitui o arquivo estático `chamados_enviados.log`. Registra os chamados enviados com sucesso para prevenir abertura concorrente ou acidental de duplicatas.
* `id` (INTEGER, PK): Identificador único.
* `glpi_ticket_id` (INTEGER, Unique): ID de confirmação retornado pelo GLPI.
* `client_abbreviation` (VARCHAR): Sigla utilizada no envio.
* `glpi_entity_id` (INTEGER) / `glpi_category_id` (INTEGER): Chaves mapeadas enviadas ao GLPI.
* `title` (VARCHAR): Título do chamado enviado.
* `created_by_user_id` (INTEGER, FK): Usuário/técnico que abriu o chamado.
* `content_hash` (VARCHAR): Hash SHA-256 gerado a partir de (`client_abbrev|catalog_shortcut|title|content`).
* `created_at` (DATETIME): Data e hora da submissão.

> [!TIP]
> **Prevenção de Duplicados**: Antes de enviar o chamado para o GLPI, o backend gera o `content_hash` do payload e verifica se já existe registro idêntico nos últimos `DUPLICATE_CHECK_WINDOW_SECONDS` (padrão de 5 minutos). Caso positivo, rejeita com erro `409 Conflict`.

---

## 🚀 Endpoints da API (Rotas Mapeadas)

Todas as rotas possuem prefixo padrão `/api` e exigem autenticação via token portador (Bearer JWT), exceto a rota de login.

### Autenticação (`/api/auth`)
* `POST /auth/login` -> Autentica com `username` e `password` via JSON. Retorna JWT.
* `POST /auth/login-form` -> Rota auxiliar compatível com padrão `OAuth2PasswordRequestForm` (usada pelo Swagger UI).
* `POST /auth/register` -> Cria um novo usuário/técnico (pode ser restrito).
* `GET /auth/me` -> Retorna as informações do técnico atualmente autenticado.

### Chamados (`/api/tickets`)
* `POST /tickets` -> Abre um novo chamado no GLPI.
  - **Payload**: `{"client_abbreviation": "SMS", "catalog_shortcut": "ACESSO", "title": "...", "content": "...", "urgency": 3}`
  - Executa a resolução de IDs locais e validação de duplicidade.
* `GET /tickets` -> Retorna a lista de chamados direto do GLPI (paginação via Query params `page` e `size` controlada por headers `Range`).
* `GET /tickets/{glpi_ticket_id}` -> Detalha um chamado com informações adicionais, mesclando dados e histórico de comentários (`followups`).
* `PUT /tickets/{glpi_ticket_id}` -> Atualiza campos do chamado (ex: status, urgência) e registra solução (ITILSolution) se aplicável.
* `POST /tickets/{glpi_ticket_id}/followups` -> Adiciona um acompanhamento (comentário) ao chamado.

### Mapeamentos (`/api/mappings`) (Administração - Requer role de `admin`)
* `GET /mappings/clients` e `POST /mappings/clients` -> Listar/criar mapeamento de clientes.
* `PUT /mappings/clients/{id}` e `DELETE /mappings/clients/{id}` -> Atualizar/remover mapeamento de clientes.
* `GET /mappings/catalog` e `POST /mappings/catalog` -> Listar/criar mapeamento de categorias do catálogo.
* `PUT /mappings/catalog/{id}` e `DELETE /mappings/catalog/{id}` -> Atualizar/remover mapeamento do catálogo.

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Python 3.10 ou superior instalado.

### Passo 1: Clonar o Repositório e Instalar Dependências
```bash
# Crie e ative um ambiente virtual
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/macOS

# Instalar dependências
pip install -r requirements.txt
```

### Passo 2: Configurar o Arquivo de Ambiente `.env`
Copie o exemplo do `.env.example` para `.env` e ajuste com as credenciais do GLPI:
```bash
copy .env.example .env
```
Abra o `.env` e preencha as variáveis de acesso à API do GLPI (`GLPI_BASE_URL`, `GLPI_APP_TOKEN`, `GLPI_USER_TOKEN`).

### Passo 3: Executar a Aplicação
```bash
uvicorn app.main:app --reload
```
A API iniciará no endereço `http://127.0.0.1:8000`.

* Acesse a documentação interativa (Swagger UI): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* Credenciais de administrador inicial (geradas automaticamente caso a tabela esteja vazia):
  - **Login**: `admin`
  - **Senha**: `admin_glpi_api`

> [!WARNING]
> Altere a senha padrão do administrador no primeiro acesso ou desative o usuário `admin` padrão após criar sua conta de serviço específica.
