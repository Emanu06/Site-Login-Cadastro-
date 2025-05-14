document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form-container');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const emailInput = document.getElementById('email');
            const senhaInput = document.getElementById('senha');

            if (!emailInput || !senhaInput) {
                alert("Erro interno: Campos de login não encontrados.");
                return;
            }

            const email = emailInput.value.trim();
            const senha = senhaInput.value;

            if (!email || !senha) {
                alert("Por favor, preencha o email e a senha.");
                return;
            }

            const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            const usuarioEncontrado = usuarios.find(u => u.email === email && u.senha === senha);

            if (usuarioEncontrado) {
                if (usuarioEncontrado.status === 'pendente') {
                    alert('Sua conta ainda está pendente de aprovação.');
                    return;
                }
                if (usuarioEncontrado.status === 'rejeitado') {
                    alert('Sua conta foi rejeitada.');
                    return;
                }
                if (usuarioEncontrado.status !== 'aprovado') {
                    alert('O status da sua conta não permite login: ' + usuarioEncontrado.status);
                    return;
                }

                sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioEncontrado));
                alert('Login bem-sucedido! Você será direcionado para sua página inicial.');

    
                window.location.href = 'userhome.html';

            } else {
                alert('Email ou senha incorretos.');
            }
        });
    }

    const linkCadastro = document.getElementById('link-para-cadastro');
    if (linkCadastro) {
        linkCadastro.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = "cadastro.html";
        });
    }
});

