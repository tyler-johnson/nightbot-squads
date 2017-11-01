import Router from "express-promise-router";
import redis from "redis";
import pifall from "pifall";
import dust from "dustjs-helpers";
import qs from "querystring";

pifall(redis.RedisClient.prototype);
pifall(redis.Multi.prototype);
pifall(dust);

dust.helpers.join = function(chunk, context, bodies, params) {
  const values = [].concat(params.value).filter(Boolean);

  values.forEach((v, i, l) => {
    if (bodies.block) {
      chunk.render(bodies.block, context.push(v));
    } else {
      chunk.write(v);
    }

    if (i < l.length - 1) chunk.write(params.sep || " ");
  });
};

const ID_KEY = "nbsquads::";
const SQUAD_KEY = "::squad";
const SECRET_KEY = "::secret";

function error(msg, status) {
  const err = new Error(msg);
  err.status = status || 500;
  return err;
}

function fetchSquad(db, id) {
  return db.smembersAsync(ID_KEY + id + SQUAD_KEY);
}

async function checkKey(db, id, key) {
  const secret = await db.getAsync(ID_KEY + id + SECRET_KEY);
  return secret == null ? null : secret === key;
}

async function updateSquad(db, id, key, data) {
  if (!key || typeof key !== "string") {
    throw error("Missing key.", 500);
  }

  const valid = await checkKey(db, id, key);

  if (valid === false) {
    throw error("Invalid key.", 400);
  }

  if (typeof data !== "string") data = "";

  const squads = data.split(" ").map(s => {
    s = s.trim();
    if (s[0] === "@") s = s.substr(1);
    return s;
  }).filter(Boolean);

  const save = db.multi();
  save.del(ID_KEY + id + SQUAD_KEY);
  if (squads.length) save.sadd(ID_KEY + id + SQUAD_KEY, squads);
  if (valid == null) save.set(ID_KEY + id + SECRET_KEY, key);
  await save.exec();
}

async function removeSquad(db, id, key) {
  if (!key || typeof key !== "string") {
    throw error("Missing key.", 400);
  }

  const valid = await checkKey(db, id, key);

  if (valid === false) {
    throw new Error("Invalid key.");
  }

  if (valid == null) return;

  const save = db.multi();
  save.del(ID_KEY + id + SQUAD_KEY);
  save.del(ID_KEY + id + SECRET_KEY);
  await save.exec();
}

export default function(opts) {
  opts = opts || {};
  const router = new Router();
  const db = redis.createClient(opts.redis);

  router.use("/:id", async (req, res, next) => {
    req.squad = await fetchSquad(db, req.params.id);
    next();
  });

  router.get("/:id/list", async (req, res) => {
    let {join,tpl} = req.query;
    if (typeof join !== "string") join = " ";
    let text = req.squad.join(join);

    if (typeof tpl === "string") {
      let user = req.get("Nightbot-User");
      user = typeof user === "string" ? qs.parse(user) : {};
      let channel = req.get("Nightbot-Channel");
      channel = typeof channel === "string" ? qs.parse(channel) : {};

      const tplfn = dust.loadSource(dust.compile(tpl));
      text = await dust.renderAsync(tplfn, {
        id: req.params.id,
        squad: req.squad,
        empty() { return !this.squad.length; },
        text, user, channel
      });
    }

    res.type("text");
    res.end(text);
  });

  router.get("/:id/set", async (req, res) => {
    let {data,key} = req.query;
    await updateSquad(db, req.params.id, key, data);
    res.type("text");
    res.end("Successfully updated the squad.");
  });

  router.get("/:id/remove", async (req, res) => {
    let {key} = req.query;
    await removeSquad(db, req.params.id, key);
    res.type("text");
    res.end("Successfully removed this squad entry.");
  });

  router.use(function(err, req, res, next) {
    if (!err) return next();
    res.status(err.status || 500);
    res.end(err.message);
  });

  return router;
}
