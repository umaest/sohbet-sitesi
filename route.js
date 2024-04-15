const route = require("express").Router();
const session = require("express-session");
const bodyP = require("body-parser");
const urlencode = bodyP.urlencoded({ extended: false });
const users = [];
const onlineUsers = []

async function checkSign(req, res, next) {
  if (res.statusCode == 304) {res.render("index", { message: "İSİM ZATEN KULLANILIYOR!" });}else{
  const filterUser = (pass, name) => users.some((x) => pass === x.room && name === x.name);
  if (req.session?.user && filterUser(req.session?.user.room, req.session?.user.name) /*&& !filt2(req.session.user.name)*/) {
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
    saveUninitialized: true,
  })
);

route.get("/", checkSign, function (req, res) {
  res.render("chat", { room: req.session.user.room, name: req.session.user.name });
});

route.post("/login", urlencode, (req, res) => {
  if ((!req.body.name || !req.body.room) && (req.body.name.trim() < 3 || req.body.room.trim() < 3)) {
    res.render("redirectM", {msg: "LÜTFEN FORMU DÜZGÜN BİR ŞEKİLDE DOLDURUN"})
  } else {
    const renamedUser = onlineUsers.find((user) => user.name === req.body.name.trim() && req.body.room.trim() === user.room);

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

route.use(function (req, res, next) {
  if (!req.route|| req.statusCode == 404) return res.render("404");
  next();
});

module.exports = {route, onlineUsers};
