const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const getUserQuery = `INSERT INTO user (username,name,password,gender,location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );`;
      await db.run(getUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newHashPassword = await bcrypt.hash(newPassword, 10);
  const selectQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectQuery);
  const comparePassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (comparePassword === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `UPDATE user SET password = '${newHashPassword}';`;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
