document.addEventListener('DOMContentLoaded', function() {
    const loggedInUserRaw = sessionStorage.getItem('usuarioLogado');
    let loggedInUser;

    if (!loggedInUserRaw) {
        alert("Sessão não encontrada. Por favor, faça login novamente.");
        window.location.href = 'home.html';
        return;
    }

    try {
        loggedInUser = JSON.parse(loggedInUserRaw);
    } catch (e) {
        alert("Erro ao carregar dados da sessão. Por favor, faça login novamente.");
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'home.html';
        return;
    }

    const userNameSpan = document.getElementById('user-name');
    const userRoleSpan = document.getElementById('user-role');
    const adminAccessBtn = document.getElementById('admin-access-btn');
    const userLogoutBtn = document.getElementById('userLogoutButton');
    const createActivitySection = document.getElementById('create-activity');
    const activityForm = document.getElementById('activity-form');
    const activitiesContainer = document.getElementById('activities-container');

    if (userNameSpan) {
        userNameSpan.textContent = loggedInUser.nome || 'Usuário';
    }
    if (userRoleSpan) {
        userRoleSpan.textContent = `Permissão: ${loggedInUser.permissao}`;
    }
     if (userLogoutBtn) {
        userLogoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('usuarioLogado');
            alert('Você foi desconectado.');
            window.location.href = 'home.html';
        });
    }

    if (adminAccessBtn && (loggedInUser.permissao === 'admin' || loggedInUser.permissao === 'viewer')) {
        adminAccessBtn.style.display = 'inline-block';
        adminAccessBtn.addEventListener('click', function() {
            window.location.href = 'admin.html';
        });
    }

    // ALTERAÇÃO: Viewer também pode criar atividades
    if (createActivitySection && (loggedInUser.permissao === 'admin' || loggedInUser.permissao === 'viewer')) {
        createActivitySection.style.display = 'block';
         if(createActivitySection.style.getPropertyValue('--section-index') === '') {
            createActivitySection.style.setProperty('--section-index', '0');
        }
    }
    const listSection = document.getElementById('activities-list-section');
    if(listSection && listSection.style.getPropertyValue('--section-index') === '') {
        listSection.style.setProperty('--section-index', (loggedInUser.permissao === 'admin' || loggedInUser.permissao === 'viewer') ? '1' : '0');
    }

    function carregarAtividades() {
        if (!activitiesContainer) return;
        const atividades = JSON.parse(localStorage.getItem('atividadesAgendadas')) || [];
        activitiesContainer.innerHTML = '';

        if (atividades.length === 0) {
            activitiesContainer.innerHTML = '<p>Nenhuma atividade agendada encontrada.</p>';
            return;
        }

        atividades.sort((a, b) => new Date(a.agendamento) - new Date(b.agendamento));

        atividades.forEach((atividade, index) => {
            const card = document.createElement('div');
            card.classList.add('activity-card');
            card.style.setProperty('--card-index', index.toString());

            const dataAgendamento = new Date(atividade.agendamento);
            const dataFormatada = dataAgendamento.toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            let fileLinkHTML = '';
            if (atividade.arquivoNome && atividade.arquivoDados) {
                fileLinkHTML = `<p><strong>Arquivo Anexo:</strong> <a href="${atividade.arquivoDados}" download="${atividade.arquivoNome}" class="file-link">${atividade.arquivoNome}</a></p>`;
            }

            let imageHTML = ''; // NOVO: Para exibir a imagem
            if (atividade.imagemDados) {
                imageHTML = `<img src="${atividade.imagemDados}" alt="Imagem da atividade: ${atividade.titulo}" class="activity-image-display">`;
            }

            card.innerHTML = `
                <h3>${atividade.titulo}</h3>
                ${imageHTML}
                <p><strong>Descrição:</strong> ${atividade.descricao}</p>
                <p><strong>Agendado para:</strong> ${dataFormatada}</p>
                <p><strong>Criado por:</strong> ${atividade.criadoPorEmail}</p>
                ${fileLinkHTML}
                <div class="comentarios">
                    <h4>Comentários</h4>
                    <ul id="comentarios-lista-${atividade.id}"></ul>
                    <div class="comentario-form">
                        <input type="text" id="comentario-input-${atividade.id}" placeholder="Adicionar comentário...">
                        <button data-activity-id="${atividade.id}">Comentar</button>
                    </div>
                </div>
            `;
            activitiesContainer.appendChild(card);
            carregarComentarios(atividade.id);

            const commentButton = card.querySelector(`.comentarios button[data-activity-id="${atividade.id}"]`);
            if(commentButton) {
                commentButton.addEventListener('click', () => adicionarComentarioHandler(atividade.id));
            }
        });
    }

    // ALTERAÇÃO: Viewer também pode criar atividades
    if (activityForm && (loggedInUser.permissao === 'admin' || loggedInUser.permissao === 'viewer')) {
        activityForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const titulo = document.getElementById('activity-title').value;
            const descricao = document.getElementById('activity-description').value;
            const agendamento = document.getElementById('activity-schedule').value;
            const arquivoInput = document.getElementById('activity-file');
            const imagemInput = document.getElementById('activity-image'); // NOVO: Input da imagem
            const anexo = arquivoInput.files[0];
            const imagem = imagemInput.files[0]; // NOVO: Arquivo da imagem

            if (!titulo || !descricao || !agendamento) {
                alert("Por favor, preencha todos os campos obrigatórios da atividade.");
                return;
            }

            const novaAtividade = {
                id: Date.now().toString(),
                titulo,
                descricao,
                agendamento,
                criadoPorEmail: loggedInUser.email,
                arquivoNome: null,
                arquivoDados: null,
                imagemDados: null, // NOVO: Para dados da imagem
                comentarios: []
            };

            let anexoProcessado = false;
            let imagemProcessada = false;
            let anexoReader, imagemReader;

            const finalizarSalvamento = () => {
                if ((!anexo || anexoProcessado) && (!imagem || imagemProcessada)) {
                    salvarNovaAtividade(novaAtividade);
                }
            };

            if (imagem) {
                const tiposPermitidos = ['image/png', 'image/jpeg', 'image/gif', 'image/jpg'];
                if (!tiposPermitidos.includes(imagem.type)) {
                    alert("Formato de imagem inválido. Apenas PNG, JPG, JPEG e GIF são permitidos.");
                    imagemInput.value = ''; // Limpa o input
                    return; // Interrompe o processo
                }
                imagemReader = new FileReader();
                imagemReader.onload = function(e) {
                    novaAtividade.imagemDados = e.target.result;
                    imagemProcessada = true;
                    finalizarSalvamento();
                };
                imagemReader.onerror = function() {
                    alert("Erro ao ler o arquivo de imagem.");
                    imagemProcessada = true; // Marca como processado para não bloquear
                    finalizarSalvamento();
                }
                imagemReader.readAsDataURL(imagem);
            } else {
                imagemProcessada = true; // Não há imagem, considera processado
            }

            if (anexo) {
                anexoReader = new FileReader();
                anexoReader.onload = function(e) {
                    novaAtividade.arquivoNome = anexo.name;
                    novaAtividade.arquivoDados = e.target.result;
                    anexoProcessado = true;
                    finalizarSalvamento();
                };
                anexoReader.onerror = function() {
                    alert("Erro ao ler o arquivo anexo.");
                    anexoProcessado = true; // Marca como processado para não bloquear
                    finalizarSalvamento();
                }
                anexoReader.readAsDataURL(anexo);
            } else {
                anexoProcessado = true; // Não há anexo, considera processado
            }
            
            if (!anexo && !imagem) { // Se não houver nenhum arquivo, salva diretamente
                 finalizarSalvamento();
            }
        });
    }

    function salvarNovaAtividade(atividade) {
        const atividades = JSON.parse(localStorage.getItem('atividadesAgendadas')) || [];
        atividades.push(atividade);
        localStorage.setItem('atividadesAgendadas', JSON.stringify(atividades));
        alert("Atividade criada com sucesso!");
        if(activityForm) activityForm.reset();
        carregarAtividades();
    }

    function adicionarComentarioHandler(activityId) {
        const comentarioInput = document.getElementById(`comentario-input-${activityId}`);
        if(!comentarioInput) return;
        const textoComentario = comentarioInput.value.trim();

        if (!textoComentario) {
            alert("Por favor, escreva um comentário.");
            return;
        }

        const atividades = JSON.parse(localStorage.getItem('atividadesAgendadas')) || [];
        const atividadeIndex = atividades.findIndex(a => a.id === activityId);

        if (atividadeIndex > -1) {
            const novoComentario = {
                autor: loggedInUser.nome,
                emailAutor: loggedInUser.email,
                texto: textoComentario,
                data: new Date().toISOString()
            };
            if(!atividades[atividadeIndex].comentarios) {
                atividades[atividadeIndex].comentarios = [];
            }
            atividades[atividadeIndex].comentarios.push(novoComentario);
            localStorage.setItem('atividadesAgendadas', JSON.stringify(atividades));
            comentarioInput.value = '';
            carregarComentarios(activityId);
        }
    }

    function carregarComentarios(activityId) {
        const comentariosListaUl = document.getElementById(`comentarios-lista-${activityId}`);
        if (!comentariosListaUl) return;

        const atividades = JSON.parse(localStorage.getItem('atividadesAgendadas')) || [];
        const atividade = atividades.find(a => a.id === activityId);

        comentariosListaUl.innerHTML = '';
        if (atividade && atividade.comentarios && atividade.comentarios.length > 0) {
            atividade.comentarios.sort((a,b) => new Date(b.data) - new Date(a.data));
            atividade.comentarios.forEach(comentario => {
                const dataComentario = new Date(comentario.data);
                const dataFormatada = dataComentario.toLocaleString('pt-BR', {day:'2-digit', month:'short', year: 'numeric', hour:'2-digit', minute:'2-digit'});
                const li = document.createElement('li');
                li.innerHTML = `<strong>${comentario.autor || comentario.emailAutor}:</strong> ${comentario.texto} <em style="font-size:0.8em; color:#777;">(${dataFormatada})</em>`;
                comentariosListaUl.appendChild(li);
            });
        } else {
            comentariosListaUl.innerHTML = '<li>Nenhum comentário ainda.</li>';
        }
    }
    if(activitiesContainer) carregarAtividades();
});