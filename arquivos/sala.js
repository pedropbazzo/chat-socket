let socket = null;
let usuario = null;
let idSala = null;
let carregandoDom = null;
let sucessoDom = null;
let erroDom = null;
let listaMensagens = null;
let listaPessoas = null;
let nomeSala = null;

init = () => {
  carregandoDom = document.getElementById("carregando");
  sucessoDom = document.getElementById("sucesso");
  erroDom = document.getElementById("erro");
  listaMensagens = document.getElementById("lista-mensagens");
  listaPessoas = document.getElementById("lista-pessoas");
  nomeSala = document.getElementById("nome-sala");

  let pathName = window.location.pathname.split("/");
  idSala = pathName[pathName.length - 1];

  nomeSala.innerText = " - Sala ID#" + idSala;

  usuario = consultarUsuario();

  const sala = usuario.salas.find((sala) => sala.id === idSala);

  if (sala) {
    try {
      socket = io({
        transports: ["websocket"],
        query: {
          usuario: usuario.nick,
          sala: sala.id,
          senha: sala.hash,
        },
      });

      socket.on("connect", () => {
        carregandoDom.classList.add("hidden");
        sucessoDom.classList.remove("hidden");
        adicionarListeners();
        socket.emit("user-login", idSala, usuario.nick);
      });

      socket.on("error", (error) => {
        carregandoDom.classList.add("hidden");
        erroDom.innerText = error;
        erroDom.classList.remove("hidden");
        console.error(error);
        socket.disconnect(true);
      });
    } catch (error) {
      console.error(error);
    }
  } else {
    carregandoDom.classList.add("hidden");
    erroDom.innerText = "Seu usuário não possui informação desta sala.";
    erroDom.classList.remove("hidden");
  }
};

adicionarListeners = () => {
  socket.on("mensagem", (mensagem, usuarioNick) => {
    adicionarMensagemNaLista(mensagem, usuarioNick + " diz:");
  });

  socket.on("user-login", (usuarioNick, roster) => {
    adicionarMensagemNaLista(usuarioNick + " entrou na sala", null, "aviso");
    atualizarLista(roster);
  });

  socket.on("user-logout", (usuarioNick, roster) => {
    adicionarMensagemNaLista(usuarioNick + " saiu da sala", null, "aviso");
    atualizarLista(roster);
  });

  socket.on("trocar-nick", (usuarioOld, usuarioNew, roster) => {
    adicionarMensagemNaLista(
      usuarioOld + " trocou o nick para " + usuarioNew,
      null,
      "aviso"
    );
    atualizarLista(roster);
  });

  window.addEventListener("beforeunload", (event) => {
    socket.emit("user-logout", idSala, usuario.nick);
  });
};

enviarMensagem = (event) => {
  const formularioElementos = event.target.elements;

  if (
    formularioElementos["mensagem"].value &&
    formularioElementos["mensagem"].value != ""
  ) {
    socket.emit(
      "mensagem",
      idSala,
      formularioElementos["mensagem"].value,
      usuario.nick
    );

    adicionarMensagemNaLista(
      formularioElementos["mensagem"].value,
      "Você diz:",
      "propria-mensagem"
    );

    formularioElementos["mensagem"].value = "";
  }
};

atualizarLista = (usuarios) => {
  usuario = consultarUsuario();
  
  listaPessoas.innerHTML = "";
  usuarios.map((usuarioNick) => {
    const newListItem = document.createElement("li");

    if (usuario.nick === usuarioNick) {
      const textonewListItem = document.createTextNode(usuarioNick + " (você)");
      const buttonTrocarNick = document.createElement("button");

      buttonTrocarNick.setAttribute("type", "button");
      buttonTrocarNick.addEventListener("click", fecharAbrirModal);
      buttonTrocarNick.innerText = "Trocar Nick";
      buttonTrocarNick.classList.add("acao");

      newListItem.appendChild(textonewListItem);
      newListItem.appendChild(buttonTrocarNick);

      listaPessoas.appendChild(newListItem);
    } else {
      const textonewListItem = document.createTextNode(usuarioNick);

      newListItem.appendChild(textonewListItem);
    }
    listaPessoas.appendChild(newListItem);
  });
};

sair = () => {
  window.open(window.location.origin, "_self");
};

limparChat = () => {
  listaMensagens.innerHTML = "";
};

// TODO: criar troca de nick, lembrando de tratar conflitos
trocarNick = (event) => {
  usuario = consultarUsuario();

  const formularioElementos = event.target.elements;
  defineDisabled(formularioElementos, true);

  console.log(formularioElementos["nick"].value);

  fetch("/usuario/" + usuario.nick, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nickNovo: formularioElementos["nick"].value,
      sala: usuario.salas.find((sala) => sala.id === idSala), // para garantir que ninguém chame a API externamente
    }),
  })
    .then((resp) => {
      defineDisabled(formularioElementos, false);

      if (resp.status === 200) {
        usuario = consultarUsuario();
        const nickOld = usuario.nick;
        usuario.nick = formularioElementos["nick"].value;
        editarUsuario(usuario);
        socket.emit("trocar-nick", nickOld, usuario.nick);
        fecharAbrirModal();
      } else {
        mostrarErro(resp.statusText);
      }
    })
    .catch((error) => {
      defineDisabled(formularioElementos, false);

      mostrarErro(error.message);
    });

  //socket.emit("trocar-nick", idSala, nickAntigo, "teste");
};

adicionarMensagemNaLista = (textoLi, textoDiv, classe) => {
  const newListItem = document.createElement("li");
  const textonewListItem = document.createTextNode(textoLi);

  if (classe) {
    newListItem.classList.add(classe);
  }

  if (textoDiv) {
    const newDiv = document.createElement("div");
    const textoNewDiv = document.createTextNode(textoDiv);

    newDiv.appendChild(textoNewDiv);
    newListItem.appendChild(newDiv);
  }

  newListItem.appendChild(textonewListItem);

  listaMensagens.appendChild(newListItem);

  listaMensagens.scrollTop = listaMensagens.scrollHeight;
};

fecharAbrirModal = () => {
  const modalDom = document.getElementById("modal-nick");
  const backdropDom = document.getElementById("backdrop-modal");
  const inputNick = document.getElementById("nick");
  const nickAntigoDom = document.getElementById("nick-antigo");

  nickAntigoDom.innerText = usuario.nick;

  if (modalDom.className.includes("aparecer")) {
    inputNick.blur();

    const errorDiv = document.getElementById("erro-form-nick");
    errorDiv.innerHTML = "&nbsp;";

    modalDom.classList.remove("aparecer");
    backdropDom.classList.remove("aparecer");
  } else {
    inputNick.value = "";
    modalDom.classList.add("aparecer");
    backdropDom.classList.add("aparecer");
    inputNick.focus();
  }
};

validarSeEhMesmoNick = (event, id) => {
  const dom = document.getElementById(id);

  if (dom.innerHTML === "&nbsp;") {
    let disableButton = false;

    if (event.target.value === usuario.nick) {
      dom.innerText = "* Não deve ser o mesmo nick antigo";
      disableButton = true;
    } else {
      dom.innerHTML = "&nbsp;";
    }

    if (event.target.form) {
      for (let i = 0; i < event.target.form.elements.length; i++) {
        if (event.target.form.elements[i].localName === "button") {
          event.target.form.elements[i].disabled = disableButton;
        }
      }
    }
  }
};
