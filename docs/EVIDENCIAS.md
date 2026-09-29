# Evidências de funcionamento

## Identificação

- **Projeto:** Organiza — Organizador de Trabalhos em Grupo
- **Integrantes:** Isaac Azevedo Werneck e Tassia Carolina de Mello Costa
- **Data da verificação:** 28/09/2026
- **Repositório:** https://github.com/isaacwerneck/trabalho-extensao-back-end

## 1. Documentação e processo

A definição do projeto, a análise de requisitos, as regras de negócio e os critérios de aceite foram registrados em arquivos próprios. O processo principal também foi modelado em BPMN e conferido no editor bpmn.io.

## 2. Banco de dados

O banco SQLite foi criado a partir de `database/schema.sql`, com as tabelas `users`, `groups`, `group_members`, `tasks` e `sessions`. A verificação automática confirmou integridade `ok` e chaves estrangeiras habilitadas.

## 3. Teste automatizado da API

O comando `npm test` executa a verificação do esquema e um fluxo integrado com os seguintes passos:

1. Isaac cria uma conta e permanece autenticado.
2. Uma tentativa de cadastro duplicado é recusada.
3. Isaac cria um grupo e uma tarefa.
4. Tassia cria outra conta e entra pelo código de convite.
5. Tassia visualiza o grupo e conclui a tarefa compartilhada.
6. Um usuário que não pertence ao grupo recebe resposta `403` ao tentar acessá-lo.
7. O logout encerra a sessão e impede novas operações autenticadas.

Resultado obtido: **2 testes aprovados e 0 falhas**.

## 4. Validação no navegador

O fluxo principal também foi percorrido manualmente na interface:

1. cadastro do usuário `TesteVisual`;
2. criação do grupo `Projeto de Extensão`;
3. geração e exibição do código de convite;
4. criação da tarefa `Finalizar documentação`;
5. conclusão da tarefa, atualizando o progresso para `1/1`;
6. logout e cadastro de `OutroUsuario`;
7. entrada no mesmo grupo pelo código;
8. visualização dos dois membros e da tarefa concluída.

Durante essa validação foram corrigidos dois comportamentos da interface: a exibição de elementos com o atributo `hidden` e a leitura dos campos dos formulários antes de desabilitá-los durante o envio.

## 5. Segurança e autorização

- senhas derivadas com `scrypt` e salt individual;
- token de sessão aleatório enviado em cookie `HttpOnly` e `SameSite=Lax`;
- apenas o hash do token é armazenado;
- comandos SQL parametrizados;
- acesso a grupos e tarefas condicionado à participação do usuário.

## 6. Histórico de versões

As etapas principais foram registradas no Git:

- `primeiros docs` — definição, requisitos e BPMN;
- `documenta banco e arquitetura` — modelo de dados e arquitetura;
- `implementa MVP` — aplicação completa e testes.

## Resultado

O MVP atende ao critério de sucesso definido: dois usuários distintos conseguem compartilhar um grupo e acompanhar a mesma tarefa, com persistência no banco local e proteção básica das operações.
