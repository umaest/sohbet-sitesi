var signaling_socket = null;   
  var local_media_stream = null; 
  var peers = {};                
  var peer_media_elements = {}; 
function init() {
  
const $ = query => document.querySelector(query)
const users = $("#users")
const messages =$("#msgbox")
const input = $("#msg")
const button = $("#send")
const socket = io()
let usersList = []
/*const peer = new Peer(room, {
    path: '/peerjs',
    host: '/',
    port: '443'
});*/
const setting = $("#settingsB")
var sonMesaj = ""
let div
const sleep = ms => new Promise(r => setTimeout(r, ms));
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
    usersList = []
    users.innerHTML = `<div id=\"ustkısım\"><text>Users - ${uses.length}</text></div>`
    uses.forEach(user => {
        const isit = user.username == username
        users.innerHTML += `
        <ul>
            <div>
                <img src="./img/photo.jpg" title="Profil resmi" alt="Profil resmi" style = "background-color: #ff0; ${isit? "padding: 1% 1% 1% 1%": ""}" title=\"profil resmi\">
                <text>${user.username}</text>
                ${isit? "<button id=\"call-button\" class=\"fa-solid fa-microphone\">": ""}
            </div>
        </ul>`
        
        if(!isit) usersList.push(user.username+room)
    });
    users.innerHTML += `<button onclick="settings(true)" id="settingsB" class="fa-solid fa-gear"></button>`
    $('#call-button').addEventListener('click', () => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then((stream) => {
                
            }).catch((err) => {
                console.error('Failed to get local stream', err);
            });
    });
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
            messages.scrollTo({top: messages.scrollHeight,right:0})
        },5)
    }
}
function exit(){
    window.location.href = window.location.href + "exit"
}
let registered = false
navigator.serviceWorker?.getRegistrations().then(r=>{
    if(r) {
        registered = true
        $(".bildirim").style = "background-color: #2f5"
        $(".bildirim").active = false
    }
})
/*peer.on('call', (call) => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then((stream) => {
            call.answer(stream);
            call.on('stream', (remoteStream) => {
                const audioElement = $('#remote-audio');
                audioElement.srcObject = remoteStream;
                audioElement.play();
            });
        }).catch((err) => {
            console.error('Failed to get local stream', err);
        });
});*/
function openNot(){
        
    if ("serviceWorker" in navigator) {
        sendsw().catch((err) => console.error(err));

    }
  navigator.serviceWorker.getRegistrations().then(r=>{
        if(r) {
            registered = true
            $(".bildirim").style = "background-color: 2f5"
            $(".bildirim").active = false
    }
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


  signaling_socket = socket

			signaling_socket.on('connect', function() {
			
				setup_local_media(function() {

					join_chat_channel(ROOM_ID, {});
				});
			});
			signaling_socket.on('disconnect', function() {

				for (peer_id in peer_media_elements) {
					document.body.removeChild(peer_media_elements[peer_id].parentNode);
					resizeVideos();
				}
				for (peer_id in peers) {
					peers[peer_id].close();
				}

				peers = {};
				peer_media_elements = {};
			});
			function join_chat_channel(channel, userdata) {
				
			}
			function part_chat_channel(channel) {
				signaling_socket.emit('part', channel);
			}


			signaling_socket.on('addPeer', function(config) {

				var peer_id = config.peer_id;
				if (peer_id in peers) {

				}
				var peer_connection = new RTCPeerConnection(
					{"iceServers": ICE_SERVERS},
					{"optional": [{"DtlsSrtpKeyAgreement": true}]} 
				);
				peers[peer_id] = peer_connection;

				peer_connection.onicecandidate = function(event) {
					if (event.candidate) {
						signaling_socket.emit('relayICECandidate', {
							'peer_id': peer_id, 
							'ice_candidate': {
								'sdpMLineIndex': event.candidate.sdpMLineIndex,
								'candidate': event.candidate.candidate
							}
						});
					}
				}
				peer_connection.onaddstream = function(event) {
					
					const videoWrap = document.createElement('div');
					videoWrap.className = 'video';
					const remote_media = document.createElement('video');
					videoWrap.appendChild(remote_media);
					remote_media.setAttribute('playsinline', true);
					remote_media.mediaGroup = 'remotevideo';
					remote_media.autoplay = true;
					remote_media.controls = false;
					peer_media_elements[peer_id] = remote_media;
					document.body.appendChild(videoWrap);
					attachMediaStream(remote_media, event.stream);
					resizeVideos();
					checkParticipantsCount();
				}

			
				peer_connection.addStream(local_media_stream);

			
				if (config.should_create_offer) {
				
					peer_connection.createOffer(
						function (local_description) { 
				
							peer_connection.setLocalDescription(local_description,
								function() { 
									signaling_socket.emit('relaySessionDescription', 
										{'peer_id': peer_id, 'session_description': local_description});
								
								},
								function() { Alert("Offer setLocalDescription failed!"); }
							);
						},
						function (error) {
							console.log("Error sending offer: ", error);
						});
				}
			});


			signaling_socket.on('sessionDescription', function(config) {

				var peer_id = config.peer_id;
				var peer = peers[peer_id];
				var remote_description = config.session_description;


				var desc = new RTCSessionDescription(remote_description);
				var stuff = peer.setRemoteDescription(desc, 
					function() {

						if (remote_description.type == "offer") {

							peer.createAnswer(
								function(local_description) {
		
									peer.setLocalDescription(local_description,
										function() { 
											signaling_socket.emit('relaySessionDescription', 
												{'peer_id': peer_id, 'session_description': local_description});

										},
										function() { Alert("Answer setLocalDescription failed!"); }
									);
								},
								function(error) {
									console.log("Error creating answer: ", error);
									// console.log(peer);
								});
						}
					},
					function(error) {
						console.log("setRemoteDescription error: ", error);
					}
				);

			});


			signaling_socket.on('iceCandidate', function(config) {
				var peer = peers[config.peer_id];
				var ice_candidate = config.ice_candidate;
				peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
			});

			signaling_socket.on('removePeer', function(config) {

				var peer_id = config.peer_id;
				if (peer_id in peer_media_elements) {
					document.body.removeChild(peer_media_elements[peer_id].parentNode);
					resizeVideos();
				}
				if (peer_id in peers) {
					peers[peer_id].close();
				}

				delete peers[peer_id];
				delete peer_media_elements[config.peer_id];
			});

		}
		function setup_local_media(callback, errorback) {
			if (local_media_stream != null) { 
				if (callback) callback();
				return; 
			}
			attachMediaStream = function(element, stream) {

				element.srcObject = stream;
			};
			navigator.mediaDevices.getUserMedia({"audio":USE_AUDIO, "video":USE_VIDEO}).then((stream) => {
				local_media_stream = stream;
				const videoWrap = document.createElement('div');
				videoWrap.className = 'video';
				videoWrap.setAttribute('id', 'selfVideoWrap');
				const btnWrap = document.createElement('div');
				btnWrap.setAttribute('id', 'btnWrap');
				const muteBtn = document.createElement('button');
				muteBtn.setAttribute('id', 'mutebtn');
				muteBtn.className = 'fas fa-microphone';
				muteBtn.addEventListener('click', (e) => {
					local_media_stream.getAudioTracks()[0].enabled = !(local_media_stream.getAudioTracks()[0].enabled);
					e.target.className = 'fas fa-microphone'+(local_media_stream.getAudioTracks()[0].enabled ? '' : '-slash');
				});
				btnWrap.appendChild(muteBtn);
				const videoMuteBtn = document.createElement('button');
				videoMuteBtn.setAttribute('id', 'videomutebtn');
				videoMuteBtn.className = 'fas fa-video';
				videoMuteBtn.addEventListener('click', (e) => {
					local_media_stream.getVideoTracks()[0].enabled = !(local_media_stream.getVideoTracks()[0].enabled);
					e.target.className = 'fas fa-video'+(local_media_stream.getVideoTracks()[0].enabled ? '' : '-slash');
				});
				btnWrap.appendChild(videoMuteBtn);
				videoWrap.appendChild(btnWrap);
				const local_media = document.createElement('video');
				videoWrap.appendChild(local_media);
				local_media.setAttribute('id', 'selfVideo');
				local_media.setAttribute('playsinline', true);
				local_media.autoplay = true;
				local_media.muted = true;
				local_media.volume = 0
				local_media.controls = false;
				document.body.appendChild(videoWrap);
				attachMediaStream(local_media, stream);
				resizeVideos();
				if (callback) callback();
			}).catch(() => { 
				alert("Enable the microphone and camera permission for joining rooms.");
				if (errorback) errorback();
			});
		}
		const resizeVideos = () => {
			const numToString = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
			const videos = document.querySelectorAll('.video');
			document.querySelectorAll('.video').forEach(v => {
				v.className = 'video '+numToString[videos.length];
			});
		};
		const checkParticipantsCount = () => {
			const videos = document.querySelectorAll('.video');
			if(videos.length > 4){
				document.getElementById('tooManyParticipants').style.display = 'block';
				setTimeout(() => {
					document.getElementById('tooManyParticipants').style.display = 'none';
				}, 3000);
			}
			if(videos.length > 1) {
				document.getElementById('intro').style.display = 'none';
			}
		}