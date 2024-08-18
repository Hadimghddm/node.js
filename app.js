const express = require("express");
const app = express();
const fs = require("fs");
const morgan = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const config = require("./config/app");
const routes = require("./routes");
const limiter = require('express-rate-limit');
const busboy = require('connect-busboy');

//const { setHeaders } = require("./middlewares/headers");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));
require("./swagger-setup")(app);
app.use(busboy());

// Set static folder for 'uploads' explicitly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// You can also serve the 'public' folder as static content
app.use(express.static(path.join(__dirname, "public")));

// Apply rate limiting middleware
app.use(
  limiter({
    windowMs: 1000, // 1 second window
    max: 20, // limit each IP to 20 requests per windowMs
    lookup: ["connection.remoteAddress"],
    message: {
      code: 429,
      message: "could not response due limitation policy",
    },
  })
);

// Logging setup for file-based logging (commented out)
// const accessLogStream = fs.createWriteStream(
//   path.join(__dirname, "logs/access.log"),
//   { flags: "a" }
// );
// app.use(morgan("combined", { stream: accessLogStream }));

//app.use(setHeaders);

app.use("/", routes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log("Server started. Open the browser at http://localhost:" + port);
});
