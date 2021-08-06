let usuario = null;

init = () => {
  usuario = consultarUsuario();
};

tentarEntrarChat = async (event) => {
  usuario = consultarUsuario();
  const formularioElementos = event.target.elements;

  defineDisabled(formularioElementos, true);

  fetch("/privado/" + formularioElementos["id"].value, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ senha: btoa(formularioElementos["senha"].value) }),
  })
    .then((resp) => {
      defineDisabled(formularioElementos, false);

      if (resp.status === 200) {
        usuario = consultarUsuario();

        const index = usuario.salas.findIndex(
          (sala) => sala.id == formularioElementos["id"].value
        );
        if (index === -1) {
          usuario.salas.push({
            id: formularioElementos["id"].value,
            hash: btoa(formularioElementos["senha"].value),
          });
        } else {
          usuario.salas[index] = {
            id: formularioElementos["id"].value,
            hash: btoa(formularioElementos["senha"].value),
          };
        }

        editarUsuario(usuario);

        window.open("/privado/" + formularioElementos["id"].value, "_self");
      } else {
        mostrarErro(resp.statusText);
      }
    })
    .catch((error) => {
      defineDisabled(formularioElementos, false);
      mostrarErro(error.message);
    });
};

criarSalaPrivada = (event) => {
  usuario = consultarUsuario();
  const formularioElementos = event.target.elements;
  const sala = gerarId(5);

  defineDisabled(formularioElementos, true);

  fetch("/privado", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: sala,
      senha: btoa(formularioElementos["senha"].value),
    }),
  })
    .then((resp) => {
      defineDisabled(formularioElementos, false);

      if (resp.status === 200) {
        usuario = consultarUsuario();

        usuario.salas.push({
          id: sala,
          hash: btoa(formularioElementos["senha"].value),
        });

        editarUsuario(usuario);

        window.open("/privado/" + sala, "_self");
      } else {
        mostrarErro(resp.statusText);
      }
    })
    .catch((error) => {
      defineDisabled(formularioElementos, false);

      mostrarErro(error.message);
    });
};
