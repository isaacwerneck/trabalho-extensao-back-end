# Análise de Requisitos — Organizador de Trabalhos em Grupo

## 1. Visão geral

O sistema será uma aplicação web para organização de trabalhos e tarefas em grupo. Usuários poderão criar uma conta, criar grupos, entrar em grupos por meio de um código de convite e acompanhar tarefas compartilhadas.

O foco do MVP é oferecer um fluxo rápido e simples, adequado principalmente a estudantes universitários e, secundariamente, a pequenas equipes de empresas.

## 2. Problema identificado

Trabalhos em grupo são frequentemente organizados por mensagens, conversas informais e anotações separadas. Isso dificulta acompanhar as tarefas existentes, identificar o que já foi concluído e manter todos os participantes com as mesmas informações.

## 3. Objetivo do sistema

Centralizar grupos e tarefas em uma aplicação simples, permitindo que diferentes usuários colaborem no mesmo trabalho por meio de um código de convite.

## 4. Escopo do MVP

O MVP incluirá:

- cadastro e autenticação de usuários;
- sessão persistente no navegador;
- criação de grupos;
- geração de código de convite;
- entrada em grupos por código;
- listagem dos grupos do usuário;
- criação e listagem de tarefas;
- alteração do estado de uma tarefa entre pendente e concluída;
- encerramento da sessão.

## 5. Atores

### 5.1 Visitante

Pessoa que ainda não está autenticada.

Pode:

- criar uma conta;
- entrar com nome de usuário e senha.

### 5.2 Usuário autenticado

Pessoa que realizou login e possui uma sessão válida.

Pode:

- visualizar os grupos dos quais participa;
- criar um grupo;
- entrar em um grupo por código;
- abrir um grupo do qual participa;
- encerrar a sessão.

### 5.3 Membro do grupo

Usuário autenticado que participa de determinado grupo.

Pode:

- visualizar o grupo e seu código de convite;
- visualizar os demais integrantes;
- criar tarefas;
- visualizar as tarefas;
- marcar tarefas como pendentes ou concluídas.

No MVP, todos os membros possuem as mesmas permissões dentro do grupo.

## 6. Requisitos funcionais

### RF01 — Cadastrar usuário

O sistema deve permitir o cadastro por meio de nome de usuário e senha.

### RF02 — Autenticar usuário

O sistema deve permitir que um usuário cadastrado entre com suas credenciais.

### RF03 — Manter sessão

O sistema deve reconhecer novamente o usuário autenticado ao reabrir o navegador enquanto sua sessão persistente ainda for válida.

### RF04 — Encerrar sessão

O sistema deve permitir que o usuário saia da conta e invalide sua sessão atual.

### RF05 — Listar grupos

O sistema deve exibir os grupos dos quais o usuário autenticado participa.

### RF06 — Criar grupo

O sistema deve permitir que um usuário autenticado crie um grupo informando seu nome.

### RF07 — Gerar código de convite

Ao criar um grupo, o sistema deve gerar e associar a ele um código de convite único.

### RF08 — Entrar em grupo

O sistema deve permitir que um usuário autenticado entre em um grupo existente informando seu código de convite.

### RF09 — Exibir grupo

O sistema deve mostrar o nome, o código de convite, os participantes e as tarefas do grupo selecionado.

### RF10 — Criar tarefa

O sistema deve permitir que um membro crie uma tarefa informando um título.

### RF11 — Listar tarefas

O sistema deve exibir as tarefas pertencentes ao grupo selecionado e seus respectivos estados.

### RF12 — Alterar estado da tarefa

O sistema deve permitir que um membro altere uma tarefa de pendente para concluída ou de concluída para pendente.

## 7. Requisitos não funcionais

### RNF01 — Segurança das senhas

As senhas devem ser armazenadas no banco somente após aplicação de hash seguro, nunca em texto puro.

### RNF02 — Proteção da sessão

A sessão persistente não deve armazenar a senha no navegador. O identificador da sessão deve ser enviado por cookie protegido contra acesso pelo JavaScript do front-end.

### RNF03 — Autorização

O back-end deve verificar a autenticação e a participação no grupo antes de liberar informações ou alterações.

### RNF04 — Validação

O back-end deve validar todos os dados recebidos e responder com uma mensagem compreensível quando houver erro.

### RNF05 — Usabilidade

As ações principais devem ser acessíveis com poucos passos e apresentar mensagens claras de sucesso ou erro.

### RNF06 — Compatibilidade

A interface deve funcionar nas versões atuais dos principais navegadores de computador e celular.

### RNF07 — Persistência

Usuários, grupos, participantes, tarefas e sessões devem permanecer armazenados após o encerramento do servidor.

### RNF08 — Manutenibilidade

O código deve manter separadas, de forma simples, a interface, as rotas do servidor e o acesso ao banco de dados.

## 8. Regras de negócio

### RN01 — Nome de usuário único

Não pode existir mais de uma conta com o mesmo nome de usuário.

### RN02 — Credenciais obrigatórias

Nome de usuário e senha são obrigatórios no cadastro e no login.

### RN03 — Código único

Cada grupo deve possuir um código de convite único, gerado automaticamente e não escolhido pelo usuário.

### RN04 — Criador como membro

O usuário que criar um grupo deve ser incluído automaticamente como membro.

### RN05 — Participação sem duplicidade

Um usuário não pode participar mais de uma vez do mesmo grupo.

### RN06 — Código válido

A entrada em um grupo somente deve ocorrer quando o código informado corresponder a um grupo existente.

### RN07 — Acesso restrito ao grupo

Somente membros podem visualizar os participantes e as tarefas de um grupo.

### RN08 — Tarefa vinculada ao grupo

Toda tarefa deve pertencer a exatamente um grupo.

### RN09 — Título obrigatório

Toda tarefa deve possuir um título não vazio.

### RN10 — Estado inicial

Uma nova tarefa deve ser criada no estado pendente.

### RN11 — Alteração por membro

Qualquer membro do grupo pode criar tarefas e alterar seus estados no MVP.

## 9. Casos de uso resumidos

### UC01 — Criar conta

1. O visitante informa nome de usuário e senha.
2. O sistema valida os dados.
3. O sistema verifica se o nome já existe.
4. O sistema protege a senha e cria a conta.
5. O usuário recebe confirmação do cadastro.

**Fluxo alternativo:** se o nome já existir ou os dados forem inválidos, o sistema não cria a conta e informa o problema.

### UC02 — Entrar no sistema

1. O visitante informa nome de usuário e senha.
2. O sistema localiza a conta e verifica a senha.
3. O sistema cria uma sessão persistente.
4. O usuário é direcionado para seus grupos.

**Fluxo alternativo:** se as credenciais forem inválidas, o sistema nega o acesso sem informar qual campo está incorreto.

### UC03 — Criar grupo

1. O usuário autenticado solicita a criação de um grupo.
2. O usuário informa o nome do grupo.
3. O sistema valida o nome.
4. O sistema cria o grupo e gera um código único.
5. O sistema adiciona o criador como membro.
6. O grupo aparece na lista do usuário.

### UC04 — Entrar em grupo

1. O usuário autenticado seleciona a opção de entrar em um grupo.
2. O usuário informa o código de convite.
3. O sistema procura o grupo correspondente.
4. O sistema verifica se o usuário já participa dele.
5. O sistema adiciona o usuário ao grupo.
6. O grupo aparece na lista do usuário.

**Fluxo alternativo:** se o código não existir, o sistema informa que ele é inválido. Se o usuário já for membro, nenhuma participação duplicada será criada.

### UC05 — Criar tarefa

1. O membro abre um grupo.
2. O membro informa o título da tarefa.
3. O sistema valida o título e a participação do usuário.
4. O sistema cria a tarefa como pendente.
5. A tarefa aparece na lista compartilhada do grupo.

### UC06 — Alterar estado da tarefa

1. O membro abre um grupo.
2. O membro seleciona uma tarefa.
3. O sistema confirma que o usuário participa do grupo.
4. O sistema alterna o estado entre pendente e concluída.
5. A lista exibe o novo estado.

## 10. Critérios de aceite do MVP

### CA01 — Cadastro e login

- dois usuários com nomes diferentes conseguem criar contas;
- não é possível cadastrar duas contas com o mesmo nome;
- credenciais válidas permitem o acesso;
- credenciais inválidas são rejeitadas;
- a senha não aparece em texto puro no banco;
- a sessão pode ser encerrada pelo usuário.

### CA02 — Criação de grupo

- um usuário autenticado consegue criar um grupo;
- o sistema gera um código único;
- o criador passa a participar do grupo;
- o grupo aparece em sua lista.

### CA03 — Entrada por código

- outro usuário consegue entrar usando o código correto;
- código inexistente é rejeitado;
- o mesmo usuário não é incluído duas vezes;
- o novo grupo aparece na lista do participante.

### CA04 — Tarefas compartilhadas

- um membro consegue criar uma tarefa;
- a tarefa começa como pendente;
- outro membro do mesmo grupo consegue visualizá-la;
- qualquer membro consegue marcá-la como concluída;
- a alteração permanece salva após recarregar a página;
- usuários que não pertencem ao grupo não conseguem consultar nem alterar suas tarefas.

## 11. Limites desta versão

O MVP não incluirá recuperação de senha, permissões diferentes entre membros, responsáveis individuais por tarefa, datas de entrega, comentários, anexos, notificações, chat ou integrações externas.

Essas funções somente serão consideradas depois que o fluxo principal estiver implementado e validado.

## 12. Processos que serão modelados em BPMN

O diagrama BPMN será criado a partir dos seguintes processos:

1. cadastro ou login do usuário;
2. criação de um novo grupo com geração do código;
3. entrada de outro usuário no grupo por código;
4. criação de uma tarefa;
5. alteração do estado da tarefa;
6. encerramento da sessão.

O fluxo principal deverá representar a interação entre usuário, aplicação web e banco de dados, incluindo os caminhos alternativos de credenciais inválidas, código inexistente e acesso não autorizado.
