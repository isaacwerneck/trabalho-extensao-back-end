const page = document.body.dataset.page;

async function request(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    });

    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) {
        if (response.status === 401 && page === 'dashboard') location.href = '/';
        throw new Error(data?.error || 'Não foi possível concluir a operação.');
    }
    return data;
}

function setMessage(element, text = '', success = false) {
    element.textContent = text;
    element.classList.toggle('success', success);
}

function setFormBusy(form, busy) {
    for (const element of form.elements) element.disabled = busy;
}

async function initAuth() {
    try {
        await request('/api/auth/me');
        location.href = '/app.html';
        return;
    } catch {
        // Sem sessão: permanece na página de acesso.
    }

    const message = document.querySelector('#auth-message');
    const loginForm = document.querySelector('#login-form');
    const registerForm = document.querySelector('#register-form');
    const tabs = document.querySelectorAll('[data-auth-tab]');

    for (const tab of tabs) {
        tab.addEventListener('click', () => {
            const registerMode = tab.dataset.authTab === 'register';
            loginForm.hidden = registerMode;
            registerForm.hidden = !registerMode;
            for (const item of tabs) {
                const active = item === tab;
                item.classList.toggle('active', active);
                item.setAttribute('aria-selected', String(active));
            }
            setMessage(message);
        });
    }

    async function submitAuth(form, endpoint) {
        const values = new FormData(form);
        setFormBusy(form, true);
        setMessage(message);
        try {
            await request(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    username: values.get('username'),
                    password: values.get('password')
                })
            });
            location.href = '/app.html';
        } catch (error) {
            setMessage(message, error.message);
            setFormBusy(form, false);
        }
    }

    loginForm.addEventListener('submit', event => {
        event.preventDefault();
        submitAuth(loginForm, '/api/auth/login');
    });
    registerForm.addEventListener('submit', event => {
        event.preventDefault();
        submitAuth(registerForm, '/api/auth/register');
    });
}

async function initDashboard() {
    const message = document.querySelector('#app-message');
    const groupsList = document.querySelector('#groups-list');
    const emptyWorkspace = document.querySelector('#empty-workspace');
    const groupWorkspace = document.querySelector('#group-workspace');
    const tasksList = document.querySelector('#tasks-list');
    let groups = [];
    let activeGroup = null;

    function showError(error) {
        setMessage(message, error.message);
    }

    function renderGroups() {
        groupsList.replaceChildren();
        if (!groups.length) {
            const empty = document.createElement('p');
            empty.className = 'muted';
            empty.textContent = 'Você ainda não participa de grupos.';
            groupsList.append(empty);
            return;
        }

        for (const group of groups) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'group-link';
            button.classList.toggle('active', activeGroup?.id === group.id);
            const name = document.createElement('strong');
            name.textContent = group.name;
            const code = document.createElement('small');
            code.textContent = group.inviteCode;
            button.append(name, code);
            button.addEventListener('click', () => loadGroup(group.id));
            groupsList.append(button);
        }
    }

    function renderTasks(tasks) {
        tasksList.replaceChildren();
        const completed = tasks.filter(task => task.isCompleted).length;
        document.querySelector('#tasks-summary').textContent = `${completed}/${tasks.length} concluídas`;

        if (!tasks.length) {
            const empty = document.createElement('p');
            empty.className = 'no-tasks';
            empty.textContent = 'Nenhuma tarefa ainda. Adicione a primeira.';
            tasksList.append(empty);
            return;
        }

        for (const task of tasks) {
            const item = document.createElement('label');
            item.className = 'task-item';
            item.classList.toggle('completed', task.isCompleted);

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.isCompleted;
            checkbox.setAttribute('aria-label', `Marcar ${task.title} como concluída`);
            checkbox.addEventListener('change', async () => {
                checkbox.disabled = true;
                try {
                    await request(`/api/groups/${activeGroup.id}/tasks/${task.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ isCompleted: checkbox.checked })
                    });
                    await loadGroup(activeGroup.id);
                } catch (error) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.disabled = false;
                    showError(error);
                }
            });

            const content = document.createElement('div');
            content.className = 'task-content';
            const title = document.createElement('p');
            title.className = 'task-title';
            title.textContent = task.title;
            const meta = document.createElement('span');
            meta.className = 'task-meta';
            meta.textContent = `Criada por ${task.createdBy}`;
            content.append(title, meta);
            item.append(checkbox, content);
            tasksList.append(item);
        }
    }

    async function loadGroups(selectId) {
        const data = await request('/api/groups');
        groups = data.groups;
        renderGroups();
        if (selectId) await loadGroup(selectId);
    }

    async function loadGroup(groupId) {
        setMessage(message);
        try {
            const data = await request(`/api/groups/${groupId}`);
            activeGroup = data.group;
            emptyWorkspace.hidden = true;
            groupWorkspace.hidden = false;
            document.querySelector('#group-name').textContent = activeGroup.name;
            document.querySelector('#invite-code').textContent = activeGroup.inviteCode;
            document.querySelector('#group-members').textContent = activeGroup.members
                .map(member => member.username)
                .join(', ');
            renderGroups();
            renderTasks(activeGroup.tasks);
        } catch (error) {
            showError(error);
        }
    }

    try {
        const auth = await request('/api/auth/me');
        document.querySelector('#current-user').textContent = auth.user.username;
        await loadGroups();
    } catch (error) {
        showError(error);
        return;
    }

    document.querySelector('#create-group-form').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const name = new FormData(form).get('name');
        setFormBusy(form, true);
        try {
            const data = await request('/api/groups', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            form.reset();
            form.closest('details').open = false;
            await loadGroups(data.group.id);
            setMessage(message, 'Grupo criado com sucesso.', true);
        } catch (error) {
            showError(error);
        } finally {
            setFormBusy(form, false);
        }
    });

    document.querySelector('#join-group-form').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const inviteCode = new FormData(form).get('inviteCode');
        setFormBusy(form, true);
        try {
            const data = await request('/api/groups/join', {
                method: 'POST',
                body: JSON.stringify({ inviteCode })
            });
            form.reset();
            form.closest('details').open = false;
            await loadGroups(data.group.id);
            setMessage(message, 'Você entrou no grupo.', true);
        } catch (error) {
            showError(error);
        } finally {
            setFormBusy(form, false);
        }
    });

    document.querySelector('#create-task-form').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!activeGroup) return;
        const title = new FormData(form).get('title');
        setFormBusy(form, true);
        try {
            await request(`/api/groups/${activeGroup.id}/tasks`, {
                method: 'POST',
                body: JSON.stringify({ title })
            });
            form.reset();
            await loadGroup(activeGroup.id);
        } catch (error) {
            showError(error);
        } finally {
            setFormBusy(form, false);
        }
    });

    document.querySelector('#copy-code-button').addEventListener('click', async () => {
        if (!activeGroup) return;
        await navigator.clipboard.writeText(activeGroup.inviteCode);
        setMessage(message, 'Código copiado.', true);
    });

    document.querySelector('#logout-button').addEventListener('click', async () => {
        try {
            await request('/api/auth/logout', { method: 'POST' });
        } finally {
            location.href = '/';
        }
    });
}

if (page === 'auth') initAuth();
if (page === 'dashboard') initDashboard();
