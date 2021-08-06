# Chat de Socket.IO

Chat que utiliza websocket para conectar as pessoas em chats.

## Instalação

```sh
git clone https://github.com/giordanna/socket-chat.git
cd socket-chat
npm i
```

## Execução

```sh
npm run start

# ou se preferir subir com duas instâncias, se tiver pm2 instalado
# se não tiver, instale com npm i -g pm2
pm2 start ecosystem.config.js
```
## TODO
- Melhorar UI no geral
- Melhorar Página 404
- Melhorar mensagens de erro