

const $ = query => document.querySelector(query)
const users = $("#users")
const messages =$("#msgbox")
const input = $("#msg")
const button = $("#send")
const socket = io()
const setting = $("#settingsB")

function addMsg(user,msg){
    const scro = messages.scrollHeight - messages.clientHeight >= messages.scrollTop + 90
    if (user == username) {
        const ul = messages.appendChild(document.createElement("ul"))
        ul.id = "myul"
        const div = ul.appendChild(document.createElement("div"))
        div.id = "usermsg"
        div.innerHTML = `<text>${user}</text><br>`
        
        div.appendChild(document.createElement("p")).innerText = msg
        ul.innerHTML += "<img alt=\"Profil resmi\"style=\"margin-left= 4px;\" src=\"./img/photo.jpg\"></img>"
    }
    else {
        const ul = $("#msgbox").appendChild(document.createElement("ul"))
        ul.innerHTML = "<img alt=\"Profil resmi\" style=\"margin-right= 4px;\" title=\"profil resmi\"; src=\"./img/photo.jpg\"></img>"
        const div = ul.appendChild(document.createElement("div"))
        div.id = "usermsg"
        div.innerHTML = `<text>${user}</text><br>`
        div.appendChild(document.createElement("p")).innerText = msg
    }
    if(!scro) messages.scrollTo(!isNaN(messages.scrollHeight)? {top: 999999,right: 0}:messages.scrollHeight)
}

socket.emit("join", [room, username, socket.id], (eror)=> {

    if (eror == 101){
        window.location.reload()
    }
    else{
        if(eror[1]){
            eror[1].forEach((mesaj)=>{
                addMsg(mesaj[1],mesaj[0],1)
            })
            messages.scrollTo({top:messages.scrollHeight, right: 0,behavior:"smooth"})

    }
    }
})
socket.on("disconnect",()=>{
    location.reload()
})
socket.on("2auth",()=>{
    console.log("diğer sekme")
})
socket.on("users", (uses)=>{
    users.innerHTML = `<div id=\"ustkısım\"><text>Users - ${uses.length}</text></div>`
    uses.forEach(user => {
        const isit = user.username == username
        users.innerHTML += `
        <ul>
                <div>
                <img src="./img/photo.jpg" title="Profil resmi" alt="Profil resmi" style = "background-color: #ff0; ${isit? "padding: 1% 1% 1% 1%": ""}" title=\"profil resmi\">
                <text>${user.username}</text></div>
            </ul>`
    });
    users.innerHTML += `<button onclick="settings(true)" id="settingsB" class="fa-solid fa-gear"></button>`
})
function settings(open){
    if(open){
        $(".header").style.display = "block"
    }else{
        $(".header").style.display = "none"
    }
    
}

socket.on("message",(veri)=>{
    addMsg(veri[0],veri[1],veri[2])
})
input.addEventListener("keydown" ,(event)=>{
    if(event.shiftKey&& event.keyCode == 13){
        this.value += '\n'
    }
    else if(event.key == "Enter"){
        button.click()
        event.preventDefault()
    }
})
function sendMsg(){
    if(input.value.trim() != ""){
        socket.emit("message",input.value)
        input.value = ""
        setTimeout(()=>{
            messages.scrollTo({top: 9999999,right:0})

        },5)
    }
}
