const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const User = require("./models/User");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 4000;

// ----------------------Database Connection----------------------

const dbURI =
  "mongodb+srv://vamshivkb:VAmshi@cluster0.objas.mongodb.net/SmartIndiaHackathon";
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) =>
    app.listen(port, () => {
      console.log("Server running on port 4000");
    })
  )
  .catch((err) => console.log(err));

// ----------------------Middleware----------------------

app.use(express.json());
app.use(cookieParser());

app.use(function (req, res, next) {
  //   res.setHeader(
  //     "Access-Control-Allow-Origin",
  //     "https://wiseplay-teamsemicolon.web.app"
  //   );
  //test
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);
  // Pass to next layer of middleware
  next();
});

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  //check jwt token exists and verified
  if (token) {
    jwt.verify(token, "philanterfakadi", (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect("/login");
        next();
      } else {
        next();
      }
    });
  } else {
    res.redirect("/login");
  }
};

// ----------------------Auth Routes----------------------

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie("jwt", token, {
      maxAge: 1 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      //domain: "wiseplay-api.herokuapp.com",
      domain: "localhost",
      secure: true,
      sameSite: "none",
    });
    const testsData = user.tests;
    res.status(200).json({ user: user._id, token, testsData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  const tests = [];
  const difficulty = "medium";
  const flag = 0;

  try {
    const user = await User.create({
      email,
      password,
      name,
      tests,
      difficulty,
      flag,
    });
    const token = createToken(user._id);
    res.cookie("jwt", token, {
      maxAge: 1 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      //domain: "wiseplay-api.herokuapp.com",
      domain: "localhost",
      secure: true,
      sameSite: "none",
    });
    res.status(201).json({ user: user._id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
});

app.get("/logout", (req, res) => {
  res.cookie("jwt", "", {
    maxAge: 1,
    //domain: "wiseplay-api.herokuapp.com",
    domain: "localhost",
    secure: true,
    sameSite: "none",
  });
  res.json({ status: "logged out" });
});

app.get("/authenticate", requireAuth, (req, res) => {
  res.json({ status: "authenticated" });
});
