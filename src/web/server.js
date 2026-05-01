const express = require("express");
const session = require("express-session");
const path = require("path");
const { config } = require("../utils/env.js");

class WebDashboard {
  constructor(bot) {
    this.bot = bot;
    this.app = express();
    this.port = config.webPort;

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.set("view engine", "ejs");
    this.app.set("views", path.join(__dirname, "views"));
    this.app.use(express.static(path.join(__dirname, "public")));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());

    this.app.use(
      session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: { 
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        },
      })
    );
  }

  setupRoutes() {
    const isAuthenticated = (req, res, next) => {
      if (req.session.authenticated) {
        return next();
      }
      res.redirect("/login");
    };

    this.app.get("/login", (req, res) => {
      if (req.session.authenticated) return res.redirect("/");
      res.render("login", { error: null });
    });

    this.app.post("/login", (req, res) => {
      const { username, password } = req.body;
      if (username === "thm.dsu" && password === "Thomas49") {
        req.session.authenticated = true;
        return res.redirect("/");
      }
      res.render("login", { error: "Identifiants invalides" });
    });

    this.app.get("/logout", (req, res) => {
      req.session.destroy();
      res.redirect("/login");
    });

    this.app.get("/", isAuthenticated, (req, res) => {
      res.render("index", { bot: this.bot });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🌐 Web Dashboard running on http://localhost:${this.port}`);
    });
  }
}

module.exports = WebDashboard;
