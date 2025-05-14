//  usar um algoritmo de hash (ex: bcrypt, Argon2).

document.addEventListener('DOMContentLoaded', function() {
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const cadastroForm = document.getElementById("cadastro-form");

    if (cadastroForm) {
        cadastroForm.addEventListener("submit", function(event) {
            event.preventDefault();

            const nomeInput = document.getElementById("nome");
            const emailInput = document.getElementById("email");
            const senhaInput = document.getElementById("senha");

            const nome = nomeInput.value.trim();
            const email = emailInput.value.trim();
            const senha = senhaInput.value;

            if (!nome || !email || !senha) {
                alert("Por favor, preencha todos os campos.");
                return;
            }

            if (!isValidEmail(email)) {
                alert("Por favor, insira um endereço de e-mail válido.");
                return;
            }

            const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

            if (usuarios.some(u => u.email === email)) {
                alert("Este email já está cadastrado. Tente fazer login ou use outro email.");
                return;
            }

            const novoUsuario = {
                nome,
                email,
                senha,
                permissao: "user",
                status: "pendente"
            };

            usuarios.push(novoUsuario);
            localStorage.setItem("usuarios", JSON.stringify(usuarios));

            alert("Cadastro realizado com sucesso!\n\nSua conta foi criada e está aguardando aprovação de um administrador. Você será notificado quando ela for liberada.\n\nVocê será redirecionado para a página de login.");
            window.location.href = "home.html";
        });
    }
});