const route = require("express").Router();
const session = require("express-session");
const bodyP = require("body-parser");
const urlencode = bodyP.urlencoded({ extended: false });
const users = [];
const onlineUsers = []

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

route.get("/", checkSign, function (req, res) {
  res.render("chat", { room: req.session.user.room, name: req.session.user.name });
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

module.exports = {route, onlineUsers};
