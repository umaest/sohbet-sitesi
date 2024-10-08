const db = require("croxydb")
var messages = db.all()
function createMsg(msg,user){
    if(!messages[user.room]){
        messages[user.room] = []
    } 
    messages[user.room].push([msg,user.username])
    db.push(user.room, [msg,user.username])
}
function getMessages(room) {
    return messages[room]
}
function delRoomMsg(room){
    messages[room] = []
    delete messages[room]
    db.delete(user.room)
}
module.exports = {
createMsg,
getMessages,
delRoomMsg
}