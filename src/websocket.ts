import { io } from "./http";

interface RoomUser {
  socket_id: string;
  username: string;
  room: string;
}

interface Message {
  room: string;
  text: string;
  createdAt: Date;
  username: string;
}

let connectedUsers: RoomUser[] = [];
const messages: Message[] = [];

io.on("connection", (socket) => {
  socket.on("join-request", (data, callback) => {
    socket.join(data.room);

    connectedUsers.push({
      room: data.room,
      username: data.username,
      socket_id: socket.id,
    });

    const usersInRoom = connectedUsers.filter(user => user.room === data.room)

    io.to(data.room).emit("user-entered", usersInRoom)
  
    const messagesRoom = getMessagesRoom(data.room);
    callback(messagesRoom);
  });

  socket.on("message", (data) => {
    const message: Message = {
      room: data.room,
      username: data.username,
      text: data.message,
      createdAt: new Date(),
    };

    messages.push(message);

    io.to(data.room).emit("message", message);
  });

  socket.on("disconnect", () => {
    const me = connectedUsers.find(user => user.socket_id === socket.id)
    if (me) {
      connectedUsers = connectedUsers.filter(user => user.socket_id !== me.socket_id)

      io.to(me.room).emit("user-exited", me)
      socket.leave(me.room)
    }
  })
});

function getMessagesRoom(room: string) {
  const messagesRoom = messages.filter((message) => message.room === room);
  return messagesRoom;
}
