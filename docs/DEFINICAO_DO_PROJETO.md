# Definição do Projeto — Organizador de Trabalhos em Grupo

## Integrantes

- Tassia Carolina de Mello Costa
- Isaac Azevedo Werneck

Os dois integrantes participarão igualmente das atividades de análise, documentação, front-end, back-end, banco de dados, testes e apresentação.

## Tema

Desenvolvimento de uma aplicação web para organização de trabalhos e tarefas em grupo.

## Problema

Estudantes universitários frequentemente organizam trabalhos em grupo por meio de mensagens dispersas, anotações ou conversas informais. Isso dificulta saber quais tarefas ainda precisam ser realizadas, acompanhar o andamento do trabalho e manter todos os integrantes alinhados.

Equipes de pequenas empresas também podem precisar de uma solução rápida e simples para organizar atividades sem depender de ferramentas mais complexas.

## Público-alvo

### Público principal

Estudantes universitários que realizam trabalhos acadêmicos em grupo.

### Público secundário

Pequenas equipes de empresas que precisam organizar tarefas de maneira rápida e direta.

## Objetivo geral

Criar uma aplicação web prática e rápida para organizar grupos e tarefas, permitindo que diferentes usuários acessem o mesmo grupo por meio de um código de convite e acompanhem a conclusão das atividades.

## Objetivos específicos

- oferecer cadastro e login compactos;
- manter o usuário conectado no navegador de forma segura;
- permitir a criação de grupos;
- gerar um código único para cada grupo;
- permitir a entrada de outros usuários por meio do código;
- permitir a criação de tarefas dentro do grupo;
- permitir marcar tarefas como pendentes ou concluídas;
- manter as informações compartilhadas entre os participantes do grupo.

## Escopo do MVP

A primeira versão funcional terá:

1. cadastro de usuário com nome de usuário e senha;
2. login e encerramento de sessão;
3. sessão persistente no navegador, sem armazenar a senha em texto puro;
4. criação de grupo;
5. geração automática de código único para o grupo;
6. exibição do código na página do grupo;
7. entrada em um grupo existente por meio do código;
8. listagem dos grupos dos quais o usuário participa;
9. criação de tarefas dentro de um grupo;
10. listagem das tarefas do grupo;
11. alteração do estado de uma tarefa entre pendente e concluída;
12. compartilhamento das alterações com os demais integrantes do grupo por meio do banco de dados.

## Regras iniciais do MVP

- cada nome de usuário deve ser único;
- senhas não podem ser armazenadas em texto puro;
- cada grupo deve possuir um código de convite único;
- somente usuários autenticados podem criar ou acessar grupos;
- um usuário precisa participar do grupo para consultar ou alterar suas tarefas;
- uma tarefa deve pertencer a um grupo;
- o estado inicial de uma tarefa é pendente;
- uma tarefa pode ser alternada entre pendente e concluída;
- o usuário pode encerrar sua sessão quando desejar.

## Fora do escopo inicial

As funcionalidades abaixo poderão ser avaliadas depois do MVP:

- recuperação de senha por e-mail;
- diferentes níveis de permissão dentro do grupo;
- comentários e anexos nas tarefas;
- notificações;
- chat em tempo real;
- integração com serviços externos;
- aplicativo para celular;
- relatórios avançados.

## Critério de sucesso do MVP

O MVP estará funcional quando dois usuários diferentes conseguirem se cadastrar, entrar no sistema, participar do mesmo grupo por meio do código, criar tarefas e visualizar a atualização do estado dessas tarefas.
