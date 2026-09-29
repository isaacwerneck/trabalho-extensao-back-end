# Organiza — Organizador de Trabalhos em Grupo

Projeto de extensão da disciplina de Web Back-End. O Organiza é uma aplicação web simples para universitários e pequenas equipes criarem grupos, compartilharem tarefas e acompanharem o que já foi concluído.

## Problema e objetivo

Trabalhos em grupo costumam ficar espalhados entre mensagens e anotações. O Organiza reúne membros e tarefas em um único lugar, com uma experiência rápida e direta.

## Funcionalidades do MVP

- cadastro, login persistente no navegador e logout;
- criação de grupo com código de convite;
- entrada em um grupo usando o código;
- visualização dos membros do grupo;
- criação de tarefas;
- marcação de tarefas como pendentes ou concluídas;
- controle de acesso às informações de cada grupo.

## Tecnologias

- HTML, CSS e JavaScript no front-end;
- Node.js e Express no back-end;
- SQLite local pelo módulo nativo `node:sqlite`;
- testes com o módulo nativo `node:test`.

## Requisitos

- Node.js 24 ou superior;
- npm.

## Instalação

```bash
git clone https://github.com/isaacwerneck/trabalho-extensao-back-end.git
cd trabalho-extensao-back-end
npm install
npm run init-db
```

O repositório já inclui um `database/app.db` vazio e pronto para avaliação. O comando `npm run init-db` também cria ou atualiza sua estrutura a partir de `database/schema.sql`.

## Execução

```bash
npm start
```

Abra `http://localhost:3000` no navegador. Durante o desenvolvimento, também é possível usar `npm run dev`.

## Como usar

1. Crie uma conta ou entre com usuário e senha.
2. Crie um grupo e copie o código exibido.
3. Compartilhe o código com outro usuário.
4. O outro usuário entra no grupo pelo código.
5. Os membros criam tarefas e alteram seu status.

## Testes

```bash
npm test
```

Os testes verificam a criação do banco e o fluxo completo da API: usuários, autenticação, grupos, tarefas, permissões e logout.

## Estrutura

```text
app/
├── database/   # banco SQLite, esquema SQL e inicialização
├── docs/       # requisitos, BPMN, banco, arquitetura e evidências
├── public/     # páginas, estilos e JavaScript do navegador
├── src/        # servidor, API e acesso ao banco
└── test/       # testes automatizados
```

## Principais rotas da API

| Método | Rota | Função |
|---|---|---|
| POST | `/api/auth/register` | Criar usuário |
| POST | `/api/auth/login` | Entrar |
| POST | `/api/auth/logout` | Sair |
| GET | `/api/auth/me` | Consultar sessão |
| GET/POST | `/api/groups` | Listar ou criar grupos |
| POST | `/api/groups/join` | Entrar com código |
| GET | `/api/groups/:id` | Consultar grupo, membros e tarefas |
| POST | `/api/groups/:id/tasks` | Criar tarefa |
| PATCH | `/api/groups/:groupId/tasks/:taskId` | Alterar status |

## Segurança aplicada

As senhas são protegidas com `scrypt` e salt aleatório. A sessão usa token aleatório em cookie `HttpOnly` e o banco guarda apenas seu hash. As consultas SQL são parametrizadas e as rotas verificam se o usuário pertence ao grupo.

## Documentação

- [Definição do projeto](docs/DEFINICAO_DO_PROJETO.md)
- [Análise de requisitos](docs/ANALISE_DE_REQUISITOS.md)
- [BPMN](docs/BPMN.md)
- [Banco de dados](docs/BANCO_DE_DADOS.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Evidências](docs/EVIDENCIAS.md)
- [Checklist](docs/CHECKLIST.md)
- [PDF da primeira entrega](output/pdf/Organiza_Primeira_Entrega.pdf)

## Integrantes

- Isaac Azevedo Werneck
- Tassia Carolina de Mello Costa

Os integrantes dividem igualmente as atividades do projeto.

## Estado do projeto

O MVP está implementado e testado. Recursos como responsáveis, prazos e recuperação de senha poderão ser adicionados depois da primeira avaliação.
