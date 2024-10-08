const q = query => document.querySelector(query)
  var signaling_socket = null;
  var local_media_stream = null; 
  var peers = {};                
  var peer_media_elements = {}; 
  const sleep = ms => new Promise(r => setTimeout(r, ms));
function settings(open){
	if(open){
	    q(".header").style.display = "block"
	}else{
	    q(".header").style.display = "none"
	}
	
  }

  function openNot(){
        
	if ("serviceWorker" in navigator) {
	    sendsw().catch((err) => {
            showAlert("Bir hata  oluştu. Detaylı bilgi için konsola bakın")
            console.error(err)
        });
  
	}
	navigator.serviceWorker.ready
    .then(registration => {
    registration.pushManager.getSubscription().then(r=>{
	    if(!r) {
		  registered = true
		  q(".bildirim").style = "background-color: #2f5"
		  q(".bildirim").active = false
	}
  })
})
  }
  // Check for service worker
  
    
    // Register SW, Register Push, Send Push
    async function sendsw() {
	// Register Service Worker
	console.log("Registering service worker...");
	const register = await navigator.serviceWorker.register("./sw.js", {
	  scope: "/",
	})
	console.log("Service Worker Registered...");
	await sleep(1000)
	// Register Push
	console.log("Registering Push...");
	const subscription = await register.pushManager.subscribe({
	  userVisibleOnly: true,
	  applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
	});
	console.log("Push Registered...");
    
	// Send Push Notification
	console.log("Sending Push...");
	await fetch(window.location.href + "subscribe", {
	  method: "POST",
	  body: JSON.stringify(subscription),
	  headers: {
	    "content-type": "application/json",
	  },
	});
	console.log("Push Sent...");
    }
    
    function urlBase64ToUint8Array(base64String) {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding)
	  .replace(/\-/g, "+")
	  .replace(/_/g, "/");
    
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
    
	for (let i = 0; i < rawData.length; ++i) {
	  outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
    }
const users = q("#users")
const messages =q("#msgbox")
const input = q("#msg")
const button = q("#send")

let usersList = []
/*const peer = new Peer(room, {
    path: '/peerjs',
    host: '/',
    port: '443'
});*/
const setting = q("#settingsB")
var sonMesaj = ""
let div

async function addMsg(user,msg){
    const scro = messages.scrollHeight - messages.clientHeight >= messages.scrollTop + 90
    sonmu = user == sonMesaj
    if (user == username) {
        if(!sonmu){
            const ul = messages.appendChild(document.createElement("ul"))
            ul.id = "myul"
            div = ul.appendChild(document.createElement("div"))
            div.id = "usermsg"
            div.innerHTML += `<text>${user}</text><br>`
            div.appendChild(document.createElement("p")).innerText = msg
            //ul.innerHTML += "<img alt=\"Profil resmi\"style=\"margin-left= 4px;\" src=\"./img/photo.jpg\"></img>"
            var img = ul.appendChild(document.createElement("img"))
            img.alt = "Profil Resmi"
            img.style = "margin-left= 4px"
            img.src = "./img/photo.jpg"
        }else{
            div.innerHTML += "<br>"
            div.appendChild(document.createElement("p")).innerText = msg
        }
    }
    else {
        if(!sonmu){
            const ul = messages.appendChild(document.createElement("ul"))
            ul.innerHTML = "<img alt=\"Profil resmi\" style=\"margin-right= 4px;\" title=\"profil resmi\"; src=\"./img/photo.jpg\"></img>"
            div = ul.appendChild(document.createElement("div"))
            div.id = "usermsg"
            div.innerHTML += `<text>${user}</text><br>`
            div.appendChild(document.createElement("p")).innerText = msg
        }else{
            div.innerHTML += "<br>"
            div.appendChild(document.createElement("p")).innerText = msg
        }
    }
    sonMesaj = user
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
    idSearch = new FormData()
    uses.forEach(user => {
    idSearch.append(user.id,user.username)

    });
})


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

let registered = false
navigator.serviceWorker.ready
    .then(registration => {
    registration.pushManager.getSubscription().then(r=>{
	    if(!r) {
		  registered = true
		  q(".bildirim").style = "background-color: #2f5"
		  q(".bildirim").active = false
	}
  })
})
/*peer.on('call', (call) => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then((stream) => {
            call.answer(stream);
            call.on('stream', (remoteStream) => {
                const audioElement = q('#remote-audio');
                audioElement.srcObject = remoteStream;
                audioElement.play();
            });
        }).catch((err) => {
            console.error('Failed to get local stream', err);
        });
});*/

function sendMsg(){
	if(input.value.trim() != ""){
	    socket.emit("message",input.value)
	    input.value = ""
	    setTimeout(()=>{
		  messages.scrollTo({top: messages.scrollHeight,right:0})
	    },5)
	}
  }
  function exit(){
	window.location.href = window.location.href + "exit"
  }
  