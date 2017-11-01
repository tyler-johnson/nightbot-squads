import express from "express";
import minimist from "minimist";
import {format} from "url";

const argv = minimist(process.argv.slice(1));
const app = express();

app.use(require("./")(argv));

const server = app.listen(process.env.PORT || 8080, "0.0.0.0", () => {
  const {address,port} = server.address();
  console.log("HTTP server listening at %s", format({
    protocol: "http:",
    hostname: address,
    port
  }));
});
