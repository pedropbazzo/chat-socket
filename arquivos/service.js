gerarId = (tamanho) => {
  let codigo = "";
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const total = caracteres.length;
  for (let i = 0; i < tamanho; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * total));
  }
  return codigo;
};

consultarUsuario = () => {
  let usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) {
    usuario = {
      nick: "anonimo_" + gerarId(5),
      salas: [
        {
          id: "all",
          hash: "",
        },
      ],
    };

    localStorage.setItem("usuario", JSON.stringify(usuario));
  }

  return usuario;
};

editarUsuario = (usuario) => {
  localStorage.setItem("usuario", JSON.stringify(usuario));
};

validarCampo = (event, id) => {
  const dom = document.getElementById(id);

  let disableButton = false;

  if (event.target.value === "") {
    dom.innerText = "* Campo Obrigatório";
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
};

defineDisabled = (elements, disabled) => {
  for (let i = 0; i < elements.length; i++) {
    elements[i].disabled = disabled;
  }
};

fecharToast = () => {
  const toastDom = document.getElementById("toast-aviso");

  toastDom.classList.remove("aparecer");
};

mostrarErro = (mensagem) => {
  const toastDom = document.getElementById("toast-aviso");
  const toastTextDom = document.getElementById("toast-aviso-texto");

  toastTextDom.innerText = mensagem;
  toastDom.classList.add("aparecer");

  setTimeout(() => {
    toastDom.classList.remove("aparecer");
  }, 5000);
};
