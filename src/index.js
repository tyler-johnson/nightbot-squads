import express from "express";
import api from "./api";

export default function(opts) {
  const app = express();
  app.use("/api", api(opts));
  app.use(express.static(__dirname + "/public"));
  return app;
}
