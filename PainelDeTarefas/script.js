const formulario = document.getElementById("formulario");
const listaTarefas = document.getElementById("listaTarefas");
const contagem = document.getElementById("contagem");
const buscaInput = document.getElementById("busca");
const filtros = document.querySelectorAll(".filtros button[data-filter]");

let tarefas = [];
let filtroAtual = "todos";
let termoBusca = "";

// Inicialização do i18next
i18next.init({
    resources,
    lng: 'pt',
    fallbackLng: 'pt',
    interpolation: {
        escapeValue: false
    }
});

// Função para formatar a data no formato dd/mm/aaaa
function formatarData(data) {
  const dataObj = new Date(data);
  const dia = String(dataObj.getDate()).padStart(2, '0');
  const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Mês começa do 0
  const ano = dataObj.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Função para atualizar os textos na página
function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = i18next.t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = i18next.t(key);
    });
}

// Função para trocar o idioma
function changeLanguage(lng) {
    i18next.changeLanguage(lng).then(() => {
        updateContent();
        // Atualiza a bandeira
        const flagButton = document.querySelector('.language-button img');
        flagButton.src = lng === 'pt' ? 'https://flagcdn.com/w40/us.png' : 'https://flagcdn.com/w40/br.png';
        flagButton.alt = lng === 'pt' ? 'Português' : 'English';
    });
}

// Configura o botão de idioma
const languageButton = document.querySelector('.language-button');
languageButton.onclick = () => {
    const currentLang = i18next.language;
    changeLanguage(currentLang === 'pt' ? 'en' : 'pt');
};

// Atualiza o conteúdo inicial
updateContent();

formulario.addEventListener("submit", function (e) {
  e.preventDefault();

  const titulo = document.getElementById("tituloTarefa").value;
  const descricao = document.getElementById("descricaoTarefa").value;
  const data = document.getElementById("dataTarefa").value;

  const novaTarefa = {
    id: Date.now(),
    titulo,
    descricao,
    data,
    concluida: false,
    subtarefas: [],
  };

  tarefas.push(novaTarefa);
  renderizarTarefas();
  e.target.reset();
});

function renderizarTarefas() {
  listaTarefas.innerHTML = "";

  let tarefasFiltradas = tarefas.filter(t => {
    if (termoBusca && !t.titulo.toLowerCase().includes(termoBusca.toLowerCase())) return false;
    return true;
  });

  if (filtroAtual === 'pendentes') {
    tarefasFiltradas = tarefasFiltradas.filter(t => !t.concluida);
  } else if (filtroAtual === 'concluidas') {
    tarefasFiltradas = tarefasFiltradas.filter(t => t.concluida);
  }

  tarefasFiltradas.forEach((tarefa) => {
    const li = document.createElement("li");
    li.className = "tarefa";
    li.dataset.index = tarefa.id;
    li.setAttribute("draggable", "true");

    const dataAtual = new Date();
    const dataEntrega = new Date(tarefa.data);

    // Verifica se a tarefa está atrasada e não concluída
    if (dataEntrega < dataAtual && !tarefa.concluida) {
      li.classList.add("atrasada");
    }

    // Exibe a tarefa com a data formatada
    li.innerHTML = `
      <strong>${tarefa.titulo}</strong><br />
      ${tarefa.descricao}<br />
      Entrega: ${tarefa.data ? formatarData(tarefa.data) : "Sem data"}<br />
      <div class="subtarefas">
        <input type="text" placeholder="Adicionar subtarefa..." onkeypress="adicionarSubtarefa(event, ${tarefa.id})">
        ${tarefa.subtarefas.map((s, i) => 
          `<label><input type="checkbox" ${s.feita ? "checked" : ""} onclick="alternarSub(${tarefa.id}, ${i})"> ${s.texto}</label>`
        ).join("")}
      </div>
      <div class="botoes">
        <button onclick="concluirTarefa(${tarefa.id})">${tarefa.concluida ? "Pendente" : "Concluir"}</button>
        <button onclick="removerTarefa(${tarefa.id})">Remover</button>
      </div>
    `;

    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      atualizarTarefas();
    });

    listaTarefas.appendChild(li);
  });

  atualizarContagem();
}

function atualizarContagem() {
  const pendentes = tarefas.filter((t) => !t.concluida).length;
  const concluidas = tarefas.filter((t) => t.concluida).length;
  contagem.textContent = `${pendentes} pendentes, ${concluidas} concluídas`;
}

filtros.forEach((btn) => {
  btn.addEventListener("click", () => {
    filtroAtual = btn.getAttribute("data-filter");
    renderizarTarefas();
  });
});

buscaInput.addEventListener("input", () => {
  termoBusca = buscaInput.value;
  renderizarTarefas();
});

function concluirTarefa(id) {
  const tarefa = tarefas.find((t) => t.id === id);
  tarefa.concluida = !tarefa.concluida;

  // Alternar a classe de cores ao marcar como concluída ou não
  const tarefaLi = document.querySelector(`[data-index='${tarefa.id}']`);
  if (tarefa.concluida) {
    tarefaLi.classList.add("concluida");
  } else {
    tarefaLi.classList.remove("concluida");
  }

  renderizarTarefas();
}

function removerTarefa(id) {
  tarefas = tarefas.filter((t) => t.id !== id);
  renderizarTarefas();
}

function adicionarSubtarefa(e, id) {
  if (e.key === "Enter") {
    const tarefa = tarefas.find((t) => t.id === id);
    if (e.target.value.trim()) {
      tarefa.subtarefas.push({ texto: e.target.value, feita: false });
    }
    e.target.value = "";
    renderizarTarefas();
  }
}

function alternarSub(tarefaId, subIndex) {
  const tarefa = tarefas.find((t) => t.id === tarefaId);
  tarefa.subtarefas[subIndex].feita = !tarefa.subtarefas[subIndex].feita;
  renderizarTarefas();
}

listaTarefas.addEventListener("dragover", (e) => {
  e.preventDefault();
  const dragging = document.querySelector(".dragging");
  const siblings = [...listaTarefas.querySelectorAll(".tarefa:not(.dragging)")];
  const afterElement = siblings.find(el => e.clientY < el.offsetTop + el.offsetHeight / 2);
  if (afterElement) {
    listaTarefas.insertBefore(dragging, afterElement);
  } else {
    listaTarefas.appendChild(dragging);
  }
});

function atualizarTarefas() {
  const novasTarefas = [];
  listaTarefas.querySelectorAll(".tarefa").forEach(t => {
    const index = t.dataset.index;
    novasTarefas.push(tarefas.find(tarefa => tarefa.id == index));
  });
  tarefas = novasTarefas;
  renderizarTarefas();
}

renderizarTarefas();