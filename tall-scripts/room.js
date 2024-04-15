const {getMessages} = require("./message")
var users = []
const addUser = ({ id, username, room, reid }) => {
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    if (!username&& !room) {
        return 101
    }
    
    const user = {id: [id], username, room, reid}
    users.push(user)
    console.log(users)
    return [username,getMessages(room)]}


const getUser = (id) => {
    return users.find((user) => user.id.findIndex((x) => x == id) != -1)
}
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id.findIndex((x)=> x == id) != -1)
    if (index !== -1) {
        return users.splice(index,1)
    }}
const removeUserT = (id) => {
    const index = users.findIndex((user) => user.id.findIndex((x)=> x == id) != -1)
    if (index !== -1) {
        const indx2 = users[index]["id"].findIndex((x)=> x == id)
        return users[index]["id"].splice(indx2,1)
    }}
const getUsersInRoom = (room) => {
    room = room.toLowerCase()
    return users.filter((user) => user.room === room)
}
const tauth = (id,user,room)=>{
    const index = users.findIndex((x)=> x.room == room&& x.username == user)
    users[index].id.push(id)
    return [user,getMessages(room)]
}
module.exports = {
    addUser,
    tauth,
    removeUser,
    getUser,
    getUsersInRoom,
    removeUserT,
    users
}