const express = require("express")
const ejs = require("ejs")
const app = express()
const {route, onlineUsers} = require("./route.js")
//const { join } = require("path")
const socketio = require("socket.io")
const {removeUser, getUser, addUser, getUsersInRoom, tauth,removeUserT} = require("./tall-scripts/room")
const {createMsg} = require("./tall-scripts/message")
app.engine("ejs", ejs.renderFile)
app.set("view engine", "ejs")
app.use(express.static("public"))
app.use(route)

function disconn(user,room,socket){
    
      const onUsers = onlineUsers.filter((x)=> x.name == user && x.room == room)
    if(onUsers.length > 1) {
      socket.emit("2auth")
      const index = onlineUsers.findIndex((x)=> x.name== user&& x.room == room)
      onlineUsers.splice(index,1)
      return true
    }
}

const listener = app.listen(8080, () =>
  console.log("Port ayarlandı: " + 8080)
);
const io = socketio(listener)
io.on("connection", (socket)=> {
  console.time(socket)
  socket.on("join", async (veri,callback)=>{
    onlineUsers.push({name: veri[1], room: veri[0]})
    if(!disconn(veri[1], veri[0],socket)){
    const addU = addUser({id: socket.id,room: veri[0],username: veri[1],reid: veri[2]})
    let room = null
    if (veri[2] != 1 && getUser(socket.id)) {room = getUser(socket.id).room}
      callback(addU,room)
      delete room
      if (veri[2] != 1 && getUser(socket.id)) {
        socket.join(getUser(socket.id).room)
        socket.emit("users",getUsersInRoom(getUser(socket.id).room))
        socket.broadcast.to(getUser(socket.id).room).emit("users",getUsersInRoom(getUser(socket.id).room))
        console.timeEnd(socket)
    }}else{
      callback(tauth(socket.id,veri[1],veri[0]),veri[0])
      socket.join(getUser(socket.id).room)
        socket.emit("users",getUsersInRoom(getUser(socket.id).room))
        socket.broadcast.to(getUser(socket.id).room).emit("users",getUsersInRoom(getUser(socket.id).room))
        console.timeEnd(socket)
    }
  })  
  socket.on("message",(veri)=>{
socket.broadcast.to(getUser(socket.id).room).emit("message",[getUser(socket.id).username,veri,socket.id])
socket.emit("message",[getUser(socket.id).username,veri,socket.id])
createMsg(veri,getUser(socket.id))
  })
  socket.on("disconnect", () => {
    if(getUser(socket.id)?.id?.length ==1){
      const room = getUser(socket.id).room
      const index = onlineUsers.findIndex((usr)=> usr.name == getUser(socket.id).username)
      if(index != -1) onlineUsers.splice(index,1)
      removeUser(socket.id)
      socket.broadcast.to(room).emit("users", getUsersInRoom(room))


  }else if(getUser(socket.id)?.id?.length > 1){
    removeUserT(socket.id)
  }
  })
})
console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaon>31</button>".length)
io.emit()
module.exports = {
  router: require("./route.js")
}