var messages = {}
function createMsg(msg,user){
    if(messages[user.room]){
        messages[user.room].push([msg,user.username])
    }
    else{
        messages[user.room] = []
        messages[user.room].push([msg,user.username])
    }
}
function getMessages(room) {
    return messages[room]
}
function delRoomMsg(room){
    messages[room] = []
    delete messages[room]
}
module.exports = {
createMsg,
getMessages,
delRoomMsg
}