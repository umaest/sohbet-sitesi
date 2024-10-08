const webpush = require("web-push");
const { static } = require("express")
let pushclients = []
const PushNotifications = require("node-pushnotifications");
const route = require("express").Router();
const session = require("express-session");
const bodyP = require("body-parser");
const urlencode = bodyP.urlencoded({ extended: false });
const users = [];
const onlineUsers = []

const publicVapidKey = "BBObvx-Wbv1Gw4zyfF8ZtwltKAVMfppfdxtpBLiDxCph5PT76BU2WZSFhFa0nm9yYbHz_YeH-1SC6JxQkBsqN6o"; // REPLACE_WITH_YOUR_KEY
const privateVapidKey = "YK31Pgy7KM0SfIt9HaDPu6EcZ4HILWC1Vuq0qsly9yo"; //REPLACE_WITH_YOUR_KEY
const settings = {
  web: {
    vapidDetails: {
      "subject": "mailto: <umwt2005@gmail.com>",
      "publicKey": "BBObvx-Wbv1Gw4zyfF8ZtwltKAVMfppfdxtpBLiDxCph5PT76BU2WZSFhFa0nm9yYbHz_YeH-1SC6JxQkBsqN6o",
      "privateKey": "YK31Pgy7KM0SfIt9HaDPu6EcZ4HILWC1Vuq0qsly9yo"
      },
    gcmAPIKey: "gcmkey",
    TTL: 2419200,
    contentEncoding: "aes128gcm",
    headers: {},
  },
  isAlwaysUseFCM: false,
};

// Send 201 - resource created
const push = new PushNotifications(settings);
route.use('/static/jquery', static(__dirname + '/node_modules/jquery/dist'));
route.use(bodyP.json())
async function checkSign(req, res, next) {
  if (req.session.body) {res.render("index", { message: false });}else{
  const filterUser = (pass, name) => users.some((x) => pass === x.room && name === x.name);
  if (req.session?.user && filterUser(req.session?.user.room, req.session?.user.name)) {
    next();
  } else {
    const ifUserExists = onlineUsers.some((x) => req.session?.user?.name === x.name);

    console.log(ifUserExists);

    res.render("index", { message: ifUserExists ? "İSİM ZATEN KULLANILIYOR!" : false });
  }}
}
route.use(
  session({
    secret: "chat",
    resave: false,
    saveUninitialized: false,
  })
);
route.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader("Access-Control-Allow-Headers", "*");

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});
route.get("/", checkSign, function (req, res) {
  res.render("chat", { room: req.session.user.room, name: req.session.user.name, vapidkey: publicVapidKey });
});
route.post("/subscribe", (req, res) => {
  console.log("gelid geldi")
  // Get pushSubscription object
  const subscription = req.body;

  pushclients.push(req.body)
  // Create payload
  const payload = { title: "Umut Chat", mesaj: "Bildirimler başarıyla etkinleştirildi."};
  push.send(subscription, payload, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
    }
  });
});
route.post("/login", urlencode, (req, res) => {
  if ((!req.body.name || !req.body.room) || (req.body.name.trim() < 3 || req.body.room.trim() < 3)) {
    res.render("redirectM", {msg: "LÜTFEN FORMU DÜZGÜN BİR ŞEKİLDE DOLDURUN"})
  } else {
    const renamedUser = onlineUsers.find((user) => user.name.toLowerCase() === req.body.name.trim().toLowerCase() && req.body.room.trim().toLowerCase() === user.room.toLowerCase());

    if (renamedUser) {
      res.render("redirectM",{msg: "İSİM ZATEN KULLANILIYOR BAŞKA İSİM DENEYİN"})
    } else {
      const newUser = { name: req.body.name.trim(), room: req.body.room.trim() };
      users.push(newUser);
      req.session.regenerate(() => {
        req.session.user = newUser;
        req.session.save((err) => {
          if (err) return console.log(err);
          res.redirect("/");
        });
      });
    }
  }
});
route.get("/exit", (req,res)=>{
  req.session.destroy((err)=>{
    res.redirect("/")
  })
})
route.use(function (req, res, next) {
  if (!req.route|| req.statusCode == 404) return res.render("404");
  next();
});
setInterval(()=>{
  for(i in pushclients){
    console.log(i)
    push.send(pushclients[i],{ title: "Notification from Umut Chat", mesaj: "dürüm yaptım sana çocuk adam ahaaa (auto message)"})
  }
},10000)
module.exports = {route, onlineUsers};
