

function init(){
  console.log("Connecting to signaling server");
setup_local_media(function() {
            /* once the user has given us access to their
                * microphone/camcorder, join the channel and start peering up */
            join_chat_channel(DEFAULT_CHANNEL, { 'name': username });
        });
    socket.on('connect', function() {
        console.log("Connected to signaling server");
        
    });
    socket.on('disconnect', function() {
        console.log("Disconnected from signaling server");
        /* Tear down all of our peer connections and remove all the
            * media divs when we disconnect */
        for (peer_id in peer_media_elements) {
            removeMediaFromBody(peer_media_elements[peer_id]);
        }
        for (peer_id in peers) {
            peers[peer_id].close();
        }

        peers = {};
        peer_media_elements = {};
    });
    function join_chat_channel(channel, userdata) {
        socket.emit('joinvoice', {"channel": channel, "userdata": userdata});
    }
    function part_chat_channel(channel) {
        socket.emit('part', channel);
    }


    /** 
    * When we join a group, our signaling server will send out 'addPeer' events to each pair
    * of users in the group (creating a fully-connected graph of users, ie if there are 6 people
    * in the channel you will connect directly to the other 5, so there will be a total of 15 
    * connections in the network). 
    */
    socket.on('addPeer', function(config) {
        console.log('Signaling server said to add peer:', config);
        var peer_id = config.peer_id;
        if (peer_id in peers) {
            /* This could happen if the user joins multiple channels where the other peer is also in. */
            console.log("Already connected to peer ", peer_id);
            return;
        }
        var peer_connection = new RTCPeerConnection(
            {"iceServers": ICE_SERVERS},
            {"optional": [{"DtlsSrtpKeyAgreement": true}]} /* this will no longer be needed by chrome
                                                            * eventually (supposedly), but is necessary 
                                                            * for now to get firefox to talk to chrome */
        );
        peers[peer_id] = peer_connection;

        peer_connection.onicecandidate = function(event) {
            if (event.candidate) {
                socket.emit('relayICECandidate', {
                    'peer_id': peer_id, 
                    'ice_candidate': {
                        'sdpMLineIndex': event.candidate.sdpMLineIndex,
                        'candidate': event.candidate.candidate
                    }
                });
            }
        }
        peer_connection.onaddstream = function(event) {
            console.log("onAddStream", event);
            var remote_media = USE_VIDEO ? $("<video>") : $("<audio>");
            appendMediaToBody(remote_media, true, peer_id)
                remote_media.attr("autoplay", "autoplay");
                peer_media_elements[peer_id] = remote_media;
                attachMediaStream(remote_media[0], event.stream);
            
        }

        /* Add our local stream */
        peer_connection.addStream(local_media_stream);

        /* Only one side of the peer connection should create the
            * offer, the signaling server picks one to be the offerer. 
            * The other user will get a 'sessionDescription' event and will
            * create an offer, then send back an answer 'sessionDescription' to us
            */
        if (config.should_create_offer) {
            console.log("Creating RTC offer to ", peer_id);
            peer_connection.createOffer(
                function (local_description) { 
                    console.log("Local offer description is: ", local_description);
                    peer_connection.setLocalDescription(local_description,
                        function() { 
                            socket.emit('relaySessionDescription', 
                                {'peer_id': peer_id, 'session_description': local_description});
                            console.log("Offer setLocalDescription succeeded"); 
                        },
                        function() { Alert("Offer setLocalDescription failed!"); }
                    );
                },
                function (error) {
                    console.log("Error sending offer: ", error);
                });
        }
    });


    /** 
     * Peers exchange session descriptions which contains information
     * about their audio / video settings and that sort of stuff. First
     * the 'offerer' sends a description to the 'answerer' (with type
     * "offer"), then the answerer sends one back (with type "answer").  
     */
    socket.on('sessionDescription', function(config) {
        console.log('Remote description received: ', config);
        var peer_id = config.peer_id;
        var peer = peers[peer_id];
        var remote_description = config.session_description;
        console.log(config.session_description);

        var desc = new RTCSessionDescription(remote_description);
        var stuff = peer.setRemoteDescription(desc, 
            function() {
                console.log("setRemoteDescription succeeded");
                if (remote_description.type == "offer") {
                    console.log("Creating answer");
                    peer.createAnswer(
                        function(local_description) {
                            console.log("Answer description is: ", local_description);
                            peer.setLocalDescription(local_description,
                                function() { 
                                    socket.emit('relaySessionDescription', 
                                        {'peer_id': peer_id, 'session_description': local_description});
                                    console.log("Answer setLocalDescription succeeded");
                                },
                                function() { Alert("Answer setLocalDescription failed!"); }
                            );
                        },
                        function(error) {
                            console.log("Error creating answer: ", error);
                            console.log(peer);
                        });
                }
            },
            function(error) {
                console.log("setRemoteDescription error: ", error);
            }
        );
        console.log("Description Object: ", desc);

    });

    /**
     * The offerer will send a number of ICE Candidate blobs to the answerer so they 
     * can begin trying to find the best path to one another on the net.
     */
    socket.on('iceCandidate', function(config) {
        console.log(idSearch.get(config.peer_id))
        var peer = peers[config.peer_id];
        var ice_candidate = config.ice_candidate;
        peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
    });


    /**
     * When a user leaves a channel (or is disconnected from the
     * signaling server) everyone will recieve a 'removePeer' message
     * telling them to trash the media channels they have open for those
     * that peer. If it was this client that left a channel, they'll also
     * receive the removePeers. If this client was disconnected, they
     * wont receive removePeers, but rather the
     * socket.on('disconnect') code will kick in and tear down
     * all the peer sessions.
     */
    socket.on('removePeer', function(config) {
        console.log('Signaling server said to remove peer:', config);
        var peer_id = config.peer_id;
        if (peer_id in peer_media_elements) {
            removeMediaFromBody(peer_media_elements[peer_id]);
        }
        if (peer_id in peers) {
            peers[peer_id].close();
        }

        delete peers[peer_id];
        delete peer_media_elements[config.peer_id];
    });

    function setup_local_media(callback, errorback) {
	if (local_media_stream != null) {  /* ie, if we've already been initialized */
	    if (callback) callback();
	    return; 
	}
	/* Ask user for permission to use the computers microphone and/or camera, 
	    * attach it to an <audio> or <video> tag if they give us access. */
	console.log("Requesting access to local audio / video inputs");
  
  
	navigator.getUserMedia = ( navigator.getUserMedia ||
		  navigator.webkitGetUserMedia ||
		  navigator.mozGetUserMedia ||
		  navigator.msGetUserMedia);
  
	attachMediaStream = function(element, stream) {
	    console.log('DEPRECATED, attachMediaStream will soon be removed.');
	    element.srcObject = stream;
	};
  
	navigator.getUserMedia({ "audio": USE_AUDIO, "video": USE_VIDEO },
	    function(stream) { /* user accepted access to a/v */
		  console.log("Access granted to audio/video");
		  local_media_stream = stream;
		  var local_media = USE_VIDEO ? $("<video>") : $("<audio>");
		  local_media.attr("autoplay", "autoplay");
  
		  appendMediaToBody(local_media, false, "Me");
		  attachMediaStream(local_media[0], stream);
  
		  if (callback) callback();
	    },
	    function() { /* user denied access to a/v */
		  console.log("Access denied for audio/video");
		  alert("You chose not to provide access to the camera/microphone, demo will not work.");
		  if (errorback) errorback();
	    });
  }
  
  function appendMediaToBody(media, volumeSlider, nickname) {
	/*if (volumeSlider) {
	    var div = $(`<div class="client">
				  <div class="controlbox">
					<button onclick="changeMuted(this)"><img src="static/imgs/icons/sound.png" /></button>
					<input onchange="changeVolume(this)" type="range" min="0" max="100" value="100" class="volume" />
				  </div>
			    </div>`);
	} else {
	    var div = $('<div class="client"><div class="controlbox"></div></div>');
	}*/
    const isit = nickname == "Me"
    const peerNickname = isit? username:idSearch.get(nickname)
    if(peerNickname){
        var div = $(`
            <ul id="userul">
                <div>
                    <img src="./img/photo.jpg" title="Profil resmi" alt="Profil resmi" style = "background-color: #ff0; ${isit? "padding: 1% 1% 1% 1%": ""}" title=\"profil resmi\">
                    <text>${peerNickname}</text>
                    ${isit? "<button id=\"call-button\" class=\"fa-solid fa-microphone\">": "<button onclick=\"changeMuted(this)\"id=\"call-button\"class=\"fas fa-volume-high\">"}
                </div>
            </ul>`)
        $("#users").append(div)
	    div.prepend(media);
        
	    //div.prepend($('<div class="client-header"><h4 class="nickname">' + nickname + '</h4></div>'));
        
	    $("audio")[0].muted = true;
        return false
    }else{
        return true
    }
  }
  
  function removeMediaFromBody(media) {
	media.parent().remove();
  }
  
  }
  function changeVolume(slider) {
	$(slider).parent().prev()[0].volume = slider.value / 100;
  }
  
  function changeMuted(button) {
	$(button).parent().prev()[0].muted = !$(button).parent().prev()[0].muted;
	if (!$(button).parent().prev()[0].muted) {
        $(button).addClass("fa-volume-high");
	    $(button).removeClass("fa-volume-mute");
	} else {
        $(button).addClass("fa-volume-mute")
	    $(button).removeClass("fa-volume-high");
	}
  }