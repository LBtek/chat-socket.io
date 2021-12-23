const socket = io();

const urlSearch = new URLSearchParams(window.location.search);
const username = urlSearch.get('username');
const room = urlSearch.get('select_room');

if (!username && !room) {
  window.location.href = 'index.html'
} else {
  document.title = 'Chat - ' + room
}

const messagesUl = document.querySelector(".messages-list");

let usersList = []

function renderUsersList() {
  let ul = document.querySelector('.users-list')
  ul.innerHTML = ''

  usersList.forEach((user, idx) => {
    ul.innerHTML += `
      <li>
        <strong${idx === 0 && user.username === username ? ' class="me"' : ''}>
          ${user.username}
        </strong>
      </li>
    `
  })
}

function addMessage(type, msg) {
  switch(type) {
    case 'status':
      messagesUl.innerHTML +=`<li class="msg-status">${msg}</li>`
    break

    case 'msg':
      messagesUl.innerHTML +=`
        <li class="new-message">
          <label class="msg-txt">
            <strong${msg.username === username ? ' class="me"' : ''}>${msg.username}</strong>
            <span>${msg.text} - ${dayjs(msg.createdAt).format("DD/MM HH:mm")}</span>
          </label>
        </li>
      `
    break

    default:
    break
  }
  messagesUl.scrollTop = messagesUl.scrollHeight
}

socket.on('connect', () => {
  messagesUl.innerHTML = `
    <li class="msg-status" id="welcome_user">
      Olá <strong class="me">${username}</strong> - Você está na sala <strong>${room}</strong>, seja bem vindo(a)!
    </li>
  `
  addMessage('status', 'Conectado com sucesso!')

  socket.emit("join-request", {
    username,
    room
  }, messages => {
    messages.forEach(message => addMessage('msg', message));
  })
})

socket.on("user-entered", (users) => {
  let userEntered = users.reverse()[0]

  const me = users.find(user => user.socket_id === socket.id)
  usersList = users.filter(user => user.socket_id !== me.socket_id)
  usersList.unshift(me)

  renderUsersList()

  if (userEntered.socket_id !== me.socket_id) {
    addMessage('status', `${userEntered.username} entrou na sala.`)
  }
})

socket.on("user-exited", userExited => {
  usersList = usersList.filter(user => user.socket_id !== userExited.socket_id)
  renderUsersList()
  addMessage('status', `${userExited.username} saiu da sala.`)
})

document.getElementById("message_input").addEventListener("keypress", (event) => {
  if(event.key === 'Enter') {
    const message = event.target.value.trim();

    if (message) {
      const data = {
        room,
        message,
        username
      }
      socket.emit("message", data);
    }

    event.target.value = "";
  }
})

socket.on("message", msg => {
  if (msg.username) addMessage('msg', msg)
})

socket.on('disconnect', () => {
  addMessage('status', 'Conexão perdida! Você foi desconectado.')
  usersList = []
  renderUsersList()
})

socket.on('connect_error', () => {
  addMessage('status', 'Tentando reconectar...')
})

document.getElementById("logout").addEventListener("click", (event) => {
  window.location.href = "index.html";
})
