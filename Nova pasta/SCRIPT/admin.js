document.addEventListener('DOMContentLoaded', function() {
    const rawLoggedInUser = sessionStorage.getItem('usuarioLogado');
    let loggedInUser;

    if (!rawLoggedInUser) {
        alert("Você não está logado. Redirecionando para a página de login.");
        window.location.href = 'home.html';
        return;
    }

    try {
        loggedInUser = JSON.parse(rawLoggedInUser);
        if (!loggedInUser || typeof loggedInUser !== 'object' || typeof loggedInUser.permissao === 'undefined') {
             alert("Erro nos dados do usuário. Tente fazer login novamente.");
             sessionStorage.removeItem('usuarioLogado');
             window.location.href = 'home.html';
             return;
        }
    } catch (e) {
        alert("Erro ao carregar dados do usuário. Tente fazer login novamente.");
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'home.html';
        return;
    }

    if (loggedInUser.permissao !== 'admin' && loggedInUser.permissao !== 'viewer') {
        alert("Acesso negado. Você não tem permissão para acessar esta página.");
        window.location.href = 'home.html';
        return;
    }

    const adminUserNameSpan = document.getElementById('adminLoggedInUserName');
    const adminUserRoleSpan = document.getElementById('adminLoggedInUserRole');
    const adminLogoutBtn = document.getElementById('adminLogoutButton');

    if(adminUserNameSpan) adminUserNameSpan.textContent = loggedInUser.nome;
    if(adminUserRoleSpan) adminUserRoleSpan.textContent = loggedInUser.permissao;

    if(adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('usuarioLogado');
            alert('Você foi desconectado.');
            window.location.href = 'home.html';
        });
    }


    const tabelaUsuariosBody = document.getElementById('tabelaUsuarios');
    const buscaInput = document.getElementById('buscaInput');
    const formularioCriarDiv = document.getElementById('formularioCriar');
    const novoNomeInput = document.getElementById('novoNome');
    const novoEmailInput = document.getElementById('novoEmail');
    const novaSenhaInput = document.getElementById('novaSenha');
    const novaPermissaoSelect = document.getElementById('novaPermissao');
    const actionsHeaderCell = document.querySelector('table th.actions-header');

    function carregarTabela(termoBusca = '') {
        if (!tabelaUsuariosBody) return;
        tabelaUsuariosBody.innerHTML = '';
        let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

        if (termoBusca) {
            const termo = termoBusca.toLowerCase();
            usuarios = usuarios.filter(u => u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo));
        }

        if (actionsHeaderCell) {
            actionsHeaderCell.style.display = loggedInUser.permissao === 'admin' ? 'table-cell' : 'none';
        }


        usuarios.forEach(user => {
            const row = tabelaUsuariosBody.insertRow();
            row.insertCell().textContent = user.nome;
            row.insertCell().textContent = user.email;
            const senhaCell = row.insertCell();
            senhaCell.textContent = loggedInUser.permissao === 'admin' ? user.senha : '••••••••';
            row.insertCell().textContent = user.permissao;
            row.insertCell().textContent = user.status;

            const actionsCell = row.insertCell();
            actionsCell.classList.add('actions-column');

            if (loggedInUser.permissao === 'admin') {
                actionsCell.style.display = 'table-cell';

                if (user.status === 'pendente') {
                    const approveBtn = document.createElement('button');
                    approveBtn.textContent = 'Aprovar';
                    approveBtn.classList.add('approve-btn');
                    approveBtn.onclick = () => aprovarUsuario(user.email);
                    actionsCell.appendChild(approveBtn);

                    const rejectBtn = document.createElement('button');
                    rejectBtn.textContent = 'Rejeitar';
                    rejectBtn.classList.add('reject-btn');
                    rejectBtn.onclick = () => rejeitarUsuario(user.email);
                    actionsCell.appendChild(rejectBtn);
                }

                if (user.email !== loggedInUser.email) {
                    if (user.permissao !== 'admin') {
                        const makeAdminBtn = document.createElement('button');
                        makeAdminBtn.textContent = 'T. Admin';
                        makeAdminBtn.title = 'Tornar Admin';
                        makeAdminBtn.classList.add('make-admin-btn');
                        makeAdminBtn.onclick = () => mudarPermissao(user.email, 'admin');
                        actionsCell.appendChild(makeAdminBtn);
                    }
                     if (user.permissao !== 'viewer') {
                        const makeViewerBtn = document.createElement('button');
                        makeViewerBtn.textContent = 'T. Viewer';
                        makeViewerBtn.title = 'Tornar Viewer';
                        makeViewerBtn.classList.add('make-viewer-btn');
                        makeViewerBtn.onclick = () => mudarPermissao(user.email, 'viewer');
                        actionsCell.appendChild(makeViewerBtn);
                    }
                    if (user.permissao !== 'user') {
                        const makeUserBtn = document.createElement('button');
                        makeUserBtn.textContent = 'T. User';
                        makeUserBtn.title = 'Tornar Usuário';
                        makeUserBtn.classList.add('make-user-btn');
                        makeUserBtn.onclick = () => mudarPermissao(user.email, 'user');
                        actionsCell.appendChild(makeUserBtn);
                    }

                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Excluir';
                    deleteBtn.classList.add('delete-btn');
                    deleteBtn.onclick = () => excluirUsuario(user.email);
                    actionsCell.appendChild(deleteBtn);
                }
            } else { // Viewer
                actionsCell.style.display = 'none';
            }
        });
    }

    function mudarPermissao(email, novaPermissao) {
        if (loggedInUser.permissao !== 'admin') return;
         if (email === loggedInUser.email && novaPermissao !== 'admin') {
            alert("Um administrador não pode remover a própria permissão de admin desta forma.");
            return;
        }
        let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        usuarios = usuarios.map(u => u.email === email ? { ...u, permissao: novaPermissao } : u);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        carregarTabela(buscaInput ? buscaInput.value : '');
        alert(`Permissão do usuário ${email} alterada para ${novaPermissao}.`);
    }


    function aprovarUsuario(email) {
        if (loggedInUser.permissao !== 'admin') return;
        let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        usuarios = usuarios.map(u => u.email === email ? { ...u, status: 'aprovado' } : u);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        carregarTabela(buscaInput ? buscaInput.value : '');
        alert(`Usuário ${email} aprovado.`);
    }

    function rejeitarUsuario(email) {
        if (loggedInUser.permissao !== 'admin') return;
        let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        usuarios = usuarios.map(u => u.email === email ? { ...u, status: 'rejeitado' } : u);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        carregarTabela(buscaInput ? buscaInput.value : '');
        alert(`Usuário ${email} rejeitado.`);
    }

    function excluirUsuario(email) {
        if (loggedInUser.permissao !== 'admin') return;
        if (email === loggedInUser.email) {
            alert("Você não pode excluir sua própria conta de administrador.");
            return;
        }
        if (confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
            let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            usuarios = usuarios.filter(u => u.email !== email);
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            carregarTabela(buscaInput ? buscaInput.value : '');
            alert(`Usuário ${email} excluído.`);
        }
    }

    function mostrarFormularioCriar() {
        if (loggedInUser.permissao !== 'admin') {
            alert("Apenas administradores podem criar usuários.");
            return;
        }
        if(formularioCriarDiv) formularioCriarDiv.style.display = 'block';
    }

    function ocultarFormularioCriar() {
        if(formularioCriarDiv) {
            formularioCriarDiv.style.display = 'none';
            if(novoNomeInput) novoNomeInput.value = '';
            if(novoEmailInput) novoEmailInput.value = '';
            if(novaSenhaInput) novaSenhaInput.value = '';
            if(novaPermissaoSelect) novaPermissaoSelect.value = 'user';
        }
    }

    function criarUsuario() {
        if (loggedInUser.permissao !== 'admin') return;
        if (!novoNomeInput || !novoEmailInput || !novaSenhaInput || !novaPermissaoSelect) return;

        const nome = novoNomeInput.value.trim();
        const email = novoEmailInput.value.trim();
        const senha = novaSenhaInput.value;
        const permissao = novaPermissaoSelect.value;

        if (!nome || !email || !senha) {
            alert("Por favor, preencha todos os campos para o novo usuário.");
            return;
        }

        let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        if (usuarios.some(u => u.email === email)) {
            alert("Este email já está cadastrado.");
            return;
        }

        const novoUsuario = { nome, email, senha, permissao, status: 'aprovado' };
        usuarios.push(novoUsuario);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        alert("Novo usuário criado com sucesso!");
        ocultarFormularioCriar();
        carregarTabela(buscaInput ? buscaInput.value : '');
    }

    const btnVoltar = document.getElementById('btnVoltarAdminParaHome');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => { window.location.href = 'userhome.html'; });
    }

    const btnMostrarForm = document.getElementById('btnMostrarFormularioCriar');
    if(btnMostrarForm) btnMostrarForm.addEventListener('click', mostrarFormularioCriar);

    const btnSalvarNovo = document.getElementById('btnSalvarNovoUsuario');
    if(btnSalvarNovo) btnSalvarNovo.addEventListener('click', criarUsuario);

    const btnCancelarNovo = document.getElementById('btnCancelarNovoUsuario');
    if(btnCancelarNovo) btnCancelarNovo.addEventListener('click', ocultarFormularioCriar);

    if(buscaInput) buscaInput.addEventListener('input', () => carregarTabela(buscaInput.value));

    if(tabelaUsuariosBody) carregarTabela();
});

