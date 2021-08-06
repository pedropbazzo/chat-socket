const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

app.use(express.json()); // to support JSON-encoded bodies

const salas = {
  all: {
    senha: "",
    usuarios: [],
  },
};

// middleware
io.use((socket, next) => {
  let query = socket.handshake.query;

  if (salas[query.sala] && salas[query.sala].senha === query.senha) {
    const index = salas[query.sala].usuarios.findIndex(
      (id) => id === query.usuario
    );

    if (index === -1) {
      next();
    } else {
      next(new Error("Usuário já está conectado"));
    }
  } else {
    if (!salas[query.sala]) {
      next(new Error("A sala requisitada não existe"));
    } else if (
      salas[query.sala].senha ===
      Buffer.from(query.senha, "base64").toString("binary")
    ) {
      next(new Error("A senha está incorreta"));
    } else {
      next(new Error("Erro de autenticação"));
    }
  }
});

io.on("connection", (socket) => {
  console.log("user connected", socket.id, socket.handshake.query);

  configuraListeners(socket);
});

configuraListeners = (socket) => {
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id, socket.handshake.query);
  });

  socket.on("user-login", (sala, usuario) => {
    socket.join(sala, () => {
      salas[sala].usuarios.push(usuario);
      io.to(sala).emit(
        "user-login",
        usuario,
        Object.values(salas[sala].usuarios)
      );
    });
  });

  socket.on("user-logout", (sala, usuario) => {
    socket.leave(sala, () => {
      const index = salas[sala].usuarios.findIndex((id) => id === usuario);
      if (index !== -1) {
        salas[sala].usuarios.splice(index, 1);

        io.to(sala).emit(
          "user-logout",
          usuario,
          Object.values(salas[sala].usuarios)
        );
      }
    });
  });

  socket.on("trocar-nick", (usuarioOld, usuarioNew) => {
    // atualiza nick em todas as salas que ele existe
    const salasKeys = Object.keys(salas);
    salasKeys.map((salaKey) => {
      const index = salas[salaKey].usuarios.findIndex(
        (id) => id === usuarioOld
      );
      if (index !== -1) {
        salas[salaKey].usuarios[index] = usuarioNew;

        io.to(salaKey).emit(
          "trocar-nick",
          usuarioOld,
          usuarioNew,
          Object.values(salas[salaKey].usuarios)
        );
      }
    });
  });

  socket.on("mensagem", (sala, mensagem, usuario) => {
    socket.to(sala).emit("mensagem", mensagem, usuario);
  });
};

// servindo os arquivos estáticos
app.use("/static", express.static("arquivos"));

app.get("/", (req, res) => {
  return res.sendFile(__dirname + "/arquivos/index.html");
});

// chat público
app.get("/all", (req, res) => {
  return res.sendFile(__dirname + "/arquivos/sala.html");
});

// chat público
app.get("/privado/:sala", (req, res) => {
  if (salas[req.params.sala]) {
    // faz verificação de senha
    return res.sendFile(__dirname + "/arquivos/sala.html");
  }
  return res.sendFile(__dirname + "/arquivos/404.html");
});

app.post("/privado", (req, res) => {
  if (req.body) {
    // faz verificação se sala não existe
    if (!salas[req.body.id]) {
      salas[req.body.id] = {
        senha: req.body.senha,
        usuarios: [],
      };

      return res.sendStatus(200);
    }
    return res.sendStatus(409);
  }
  return res.sendStatus(400);
});

app.post("/privado/:sala", (req, res) => {
  if (req.body) {
    // faz verificação se sala existe
    if (salas[req.params.sala]) {
      // faz verificação de senha
      if (salas[req.params.sala].senha === req.body.senha) {
        return res.sendStatus(200);
      }
      return res.sendStatus(403);
    }
    return res.sendStatus(404);
  }
  return res.sendStatus(400);
});

app.put("/usuario/:nick", (req, res) => {
  if (req.body) {
    // faz verificação se sala existe
    if (salas[req.body.sala.id]) {
      // faz verificação de senha
      if (salas[req.body.sala.id].senha === req.body.sala.hash) {
        // faz primeira verificação, pra ver se usuário existe na sala
        const indexVerificacao = salas[req.body.sala.id].usuarios.findIndex(
          (id) => id === req.params.nick
        );

        // usuário existe na sala
        if (indexVerificacao !== -1) {
          return res.sendStatus(200);
        }
        return res.sendStatus(403);
      }
      return res.sendStatus(403);
    }
    return res.sendStatus(404);
  }
  return res.sendStatus(400);
});

http.listen(PORT, () => {
  console.log(`Servidor escutando na porta ${PORT}`);
  console.log(`Acesse pelo link: http://localhost:${PORT}/`);
  console.log(`Caso deseje parar o processo pressione CTRL+C`);
});
