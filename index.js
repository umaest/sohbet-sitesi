const express = require("express");
const ejs = require("ejs");
const app = express();
const http = require("http");
const server = http.createServer(app);
const servListener = server.listen(8080);
const { route, onlineUsers } = require("./route.js");
//const { join } = require("path")
const socketio = require("socket.io");
const { removeUser, getUser, addUser, getUsersInRoom, tauth, removeUserT } = require("./tall-scripts/room");
const { createMsg } = require("./tall-scripts/message");
app.engine("ejs", ejs.renderFile);
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(route);
function disconn(user, room, socket) {
    const onUsers = onlineUsers.filter((x) => x.name == user && x.room == room);
    if (onUsers.length > 1) {
        socket.emit("2auth");
        const index = onlineUsers.findIndex((x) => x.name == user && x.room == room);
        onlineUsers.splice(index, 1);
        return true;
    }
}

/*const listener = app.listen(8080, () =>
  console.log("Port ayarlandı: " + 8080)
);*/
const io = socketio(servListener);
const channels = {};
const sockets = {};
io.on("connection", (socket) => {
    console.time(socket)
    socket.channels = {};
    sockets[socket.id] = socket;
        socket.on("join", async (veri, callback) => {
            const channel = veri[0];

            if (channel in socket.channels) {
                //console.log("["+ socket.id + "] ERROR: already joined ", channel);
                return;
            }
        
            if (!(channel in channels)) {
                channels[channel] = {};
            }
        
            for (id in channels[channel]) {
                channels[channel][id].emit("addPeer", {
                    peer_id: socket.id,
                    should_create_offer: false
                });
                socket.emit("addPeer", { peer_id: id, should_create_offer: true });
            }
        
            channels[channel][socket.id] = socket;
            socket.channels[channel] = channel;
            onlineUsers.push({ name: veri[1], room: veri[0] });
            if (!disconn(veri[1], veri[0], socket)) {
                const addU = addUser({ id: socket.id, room: veri[0], username: veri[1], reid: veri[2] });
                let room = null;
                if (veri[2] != 1 && getUser(socket.id)) {
                    room = getUser(socket.id).room;
                }
                callback(addU, room);
                delete room;
                if (veri[2] != 1 && getUser(socket.id)) {
                    socket.join(getUser(socket.id).room);
                    socket.emit("users", getUsersInRoom(getUser(socket.id).room));
                    socket.broadcast.to(getUser(socket.id).room).emit("users", getUsersInRoom(getUser(socket.id).room));
                    console.timeEnd(socket);
                }
            } else {
                callback(tauth(socket.id, veri[1], veri[0]), veri[0]);
                socket.join(getUser(socket.id).room);
                socket.emit("users", getUsersInRoom(getUser(socket.id).room));
                socket.broadcast.to(getUser(socket.id).room).emit("users", getUsersInRoom(getUser(socket.id).room));
                console.timeEnd(socket);
            }
        });
    socket.on("message", (veri) => {
        socket.broadcast.to(getUser(socket.id).room).emit("message", [getUser(socket.id).username, veri, socket.id]);
        socket.emit("message", [getUser(socket.id).username, veri, socket.id]);
        createMsg(veri, getUser(socket.id));
    });
    socket.on("disconnect", () => {
        for (const channel in socket.channels) {
            part(channel);
          }
          //console.log("["+ socket.id + "] disconnected");
          delete sockets[socket.id];
        if (getUser(socket.id)?.id?.length == 1) {
            const room = getUser(socket.id).room;
            const index = onlineUsers.findIndex((usr) => usr.name == getUser(socket.id).username);
            if (index != -1) onlineUsers.splice(index, 1);
            removeUser(socket.id);
            socket.broadcast.to(room).emit("users", getUsersInRoom(room));
        } else if (getUser(socket.id)?.id?.length > 1) {
            removeUserT(socket.id);
        }
    });



    const part = channel => {
        //console.log("["+ socket.id + "] part ");
    
        if (!(channel in socket.channels)) {
          //console.log("["+ socket.id + "] ERROR: not in ", channel);
          return;
        }
    
        delete socket.channels[channel];
        delete channels[channel][socket.id];
    
        for (id in channels[channel]) {
          channels[channel][id].emit("removePeer", { peer_id: socket.id });
          socket.emit("removePeer", { peer_id: id });
        }
      };
      socket.on("part", part);
    
      socket.on("relayICECandidate", config => {
        let peer_id = config.peer_id;
        let ice_candidate = config.ice_candidate;
        //console.log("["+ socket.id + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);
    
        if (peer_id in sockets) {
          sockets[peer_id].emit("iceCandidate", {
            peer_id: socket.id,
            ice_candidate: ice_candidate
          });
        }
      });
    
      socket.on("relaySessionDescription", config => {
        let peer_id = config.peer_id;
        let session_description = config.session_description;
        //console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ", session_description);
    
        if (peer_id in sockets) {
          sockets[peer_id].emit("sessionDescription", {
            peer_id: socket.id,
            session_description: session_description
          });
        }
      });
});
module.exports = {
    router: require("./route.js")
};
