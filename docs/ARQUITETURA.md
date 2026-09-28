# Arquitetura — Organizador de Trabalhos em Grupo

## 1. Visão geral

O projeto seguirá uma arquitetura web cliente-servidor simples:

```text
Navegador
HTML + CSS + JavaScript
        │
        │ HTTP + JSON
        ▼
Servidor Node.js + Express
Rotas, autenticação e regras de negócio
        │
        │ SQL
        ▼
Banco de dados SQLite
```

O navegador será responsável pela interface. O servidor será responsável por autenticação, autorização, validações e regras de negócio. O SQLite armazenará os dados de forma persistente.

## 2. Tecnologias

| Tecnologia | Uso | Justificativa |
|---|---|---|
| HTML | Estrutura das páginas | Recurso nativo da web |
| CSS | Aparência e responsividade | Evita framework visual desnecessário no MVP |
| JavaScript | Interação e chamadas à API | Funciona diretamente no navegador |
| Node.js 24 ou superior | Execução do back-end | Mesma linguagem no front-end e no back-end |
| Express | Servidor e rotas HTTP | Simplifica rotas, arquivos estáticos e JSON com uma única dependência |
| `node:sqlite` | Acesso ao SQLite | Módulo nativo do Node.js, sem pacote adicional |
| `node:crypto` | Senhas, tokens e códigos | Módulo nativo para recursos de segurança |
| SQLite | Persistência dos dados | Banco local, relacional e simples de executar |

## 3. Estrutura planejada

```text
app/
├── database/
│   ├── app.db                 # gerado localmente e ignorado pelo Git
│   ├── init-db.js             # cria o banco
│   ├── schema.sql             # tabelas, restrições e índices
│   └── test-db.js             # valida o esquema
├── docs/
│   └── ...                    # documentação acadêmica e técnica
├── public/
│   ├── index.html             # cadastro e login
│   ├── app.html               # grupos e tarefas
│   ├── styles.css             # estilos compartilhados
│   └── app.js                 # interface e chamadas à API
├── src/
│   ├── database.js            # conexão e consultas SQLite
│   └── server.js              # servidor, autenticação e rotas
├── .env.example               # configurações documentadas
├── .gitignore
├── package.json
└── README.md
```

A estrutura foi mantida pequena. Novos módulos somente serão criados caso `server.js` ou `app.js` se tornem difíceis de entender.

## 4. Responsabilidades

### 4.1 Front-end

- exibir formulários e dados;
- enviar requisições JSON para a API;
- mostrar mensagens de sucesso ou erro;
- atualizar a interface após as operações;
- redirecionar usuários não autenticados.

O front-end não decidirá se um usuário pode acessar um grupo. Essa verificação sempre será realizada novamente pelo back-end.

### 4.2 Back-end

- validar os dados recebidos;
- cadastrar e autenticar usuários;
- proteger senhas com `scrypt`;
- criar e validar sessões;
- gerar códigos de convite;
- verificar participação em grupos;
- aplicar as regras de negócio;
- executar consultas parametrizadas no SQLite;
- responder em JSON.

### 4.3 Banco de dados

- armazenar usuários, grupos, participantes, tarefas e sessões;
- impedir duplicidades;
- garantir relacionamentos válidos;
- manter os dados após reinicialização do servidor.

## 5. Autenticação

### 5.1 Cadastro

1. O servidor recebe nome de usuário e senha.
2. Valida tamanho e formato.
3. Gera um `salt` aleatório.
4. Processa a senha com `crypto.scrypt`.
5. Salva somente o resultado e o `salt` no campo `password_hash`.

### 5.2 Login

1. O servidor localiza o usuário.
2. Processa a senha informada com o mesmo `salt`.
3. Compara os resultados de forma segura.
4. Gera um token aleatório de sessão.
5. Salva somente o hash do token em `sessions`.
6. Envia o token original em cookie `HttpOnly`.

### 5.3 Cookie

O cookie de sessão terá:

- `HttpOnly`: impede leitura pelo JavaScript do navegador;
- `SameSite=Lax`: reduz requisições indevidas de outros sites;
- prazo de expiração;
- `Secure` quando a aplicação estiver em HTTPS.

### 5.4 Logout

O servidor remove a sessão do banco e apaga o cookie no navegador.

## 6. Padrão da API

- Prefixo das rotas: `/api`.
- Dados enviados e recebidos: JSON.
- Datas armazenadas: padrão do SQLite em UTC.
- Cookies enviados automaticamente pelo navegador.
- Consultas SQL sempre parametrizadas.

Resposta de erro:

```json
{
  "error": "Mensagem compreensível"
}
```

## 7. Rotas de autenticação

### `POST /api/auth/register`

Cria uma conta e inicia a sessão.

Entrada:

```json
{
  "username": "Isaac",
  "password": "senha-segura"
}
```

Resposta `201 Created`:

```json
{
  "user": {
    "id": 1,
    "username": "Isaac"
  }
}
```

Possíveis erros: `400` para dados inválidos e `409` para nome já utilizado.

### `POST /api/auth/login`

Autentica e cria uma sessão.

Entrada:

```json
{
  "username": "Isaac",
  "password": "senha-segura"
}
```

Resposta `200 OK`: mesmo formato de usuário da rota de cadastro.

Possível erro: `401` para credenciais inválidas.

### `GET /api/auth/me`

Retorna o usuário da sessão atual.

Resposta `200 OK`:

```json
{
  "user": {
    "id": 1,
    "username": "Isaac"
  }
}
```

Possível erro: `401` quando não houver sessão válida.

### `POST /api/auth/logout`

Invalida a sessão atual.

Resposta: `204 No Content`.

## 8. Rotas de grupos

Todas as rotas desta seção exigem autenticação.

### `GET /api/groups`

Lista os grupos dos quais o usuário participa.

Resposta `200 OK`:

```json
{
  "groups": [
    {
      "id": 1,
      "name": "Projeto de Extensão",
      "inviteCode": "ABC12345"
    }
  ]
}
```

### `POST /api/groups`

Cria um grupo, gera um código e registra o criador como membro.

Entrada:

```json
{
  "name": "Projeto de Extensão"
}
```

Resposta `201 Created`:

```json
{
  "group": {
    "id": 1,
    "name": "Projeto de Extensão",
    "inviteCode": "ABC12345"
  }
}
```

Possível erro: `400` para nome inválido.

### `POST /api/groups/join`

Adiciona o usuário a um grupo pelo código.

Entrada:

```json
{
  "inviteCode": "ABC12345"
}
```

Resposta `200 OK`: grupo encontrado no mesmo formato da criação.

Possíveis erros: `404` para código inexistente e `409` quando o usuário já participa.

### `GET /api/groups/:groupId`

Retorna o grupo, os participantes e as tarefas.

Resposta `200 OK`:

```json
{
  "group": {
    "id": 1,
    "name": "Projeto de Extensão",
    "inviteCode": "ABC12345",
    "members": [
      { "id": 1, "username": "Isaac" },
      { "id": 2, "username": "Tassia" }
    ],
    "tasks": [
      {
        "id": 1,
        "title": "Documentar a API",
        "isCompleted": false,
        "createdBy": "Isaac",
        "createdAt": "2026-09-28 18:00:00",
        "completedAt": null
      }
    ]
  }
}
```

Possíveis erros: `403` para usuário que não participa e `404` para grupo inexistente.

## 9. Rotas de tarefas

Estas rotas exigem autenticação e participação no grupo.

### `POST /api/groups/:groupId/tasks`

Cria uma tarefa pendente.

Entrada:

```json
{
  "title": "Documentar a API"
}
```

Resposta `201 Created`:

```json
{
  "task": {
    "id": 1,
    "title": "Documentar a API",
    "isCompleted": false,
    "createdBy": "Isaac",
    "createdAt": "2026-09-28 18:00:00",
    "completedAt": null
  }
}
```

Possíveis erros: `400` para título inválido, `403` para não membro e `404` para grupo inexistente.

### `PATCH /api/groups/:groupId/tasks/:taskId`

Altera somente o estado da tarefa.

Entrada:

```json
{
  "isCompleted": true
}
```

Resposta `200 OK`: tarefa atualizada no mesmo formato da criação.

Possíveis erros: `400` para estado inválido, `403` para não membro e `404` para grupo ou tarefa inexistente.

## 10. Códigos HTTP utilizados

| Código | Significado no projeto |
|---:|---|
| `200` | Consulta ou alteração realizada |
| `201` | Conta, grupo ou tarefa criada |
| `204` | Logout realizado sem conteúdo de resposta |
| `400` | Dados de entrada inválidos |
| `401` | Usuário não autenticado |
| `403` | Usuário autenticado sem acesso ao grupo |
| `404` | Recurso inexistente |
| `409` | Duplicidade ou conflito de estado |
| `500` | Erro interno inesperado |

## 11. Regras aplicadas pelo servidor

- normalizar espaços dos textos antes de validar;
- não retornar `password_hash` ou tokens em respostas;
- não revelar se foi o usuário ou a senha que falhou no login;
- criar grupo e participação do criador na mesma transação;
- gerar novamente o código se houver uma colisão rara;
- verificar participação antes de retornar grupo ou tarefa;
- atualizar `completed_at` junto com `is_completed`;
- remover sessões expiradas durante o uso da autenticação.

## 12. Fluxos entre as camadas

### Criar grupo

```text
Interface → POST /api/groups → validar sessão e nome
          → inserir grupo + participante em transação
          → SQLite → responder grupo criado → Interface
```

### Entrar por código

```text
Interface → POST /api/groups/join → validar sessão e código
          → localizar grupo → verificar duplicidade
          → inserir participante → SQLite → responder grupo
```

### Concluir tarefa

```text
Interface → PATCH /api/groups/:groupId/tasks/:taskId
          → validar sessão, participação e estado
          → atualizar tarefa → SQLite → responder tarefa atualizada
```

## 13. Limites da arquitetura do MVP

Não serão incluídos nesta versão:

- framework de front-end;
- ORM;
- arquitetura de microsserviços;
- WebSocket;
- API externa;
- envio de e-mail;
- upload de arquivos;
- diferentes permissões dentro do grupo.

Esses recursos somente devem ser considerados caso surja uma necessidade comprovada depois do funcionamento do MVP.
