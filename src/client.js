import crypto from "crypto";
import generateName from "project-name-generator";

let id = generateName({ words: 2, number: true }).dashed;
let key = crypto.randomBytes(6).toString("hex");

const squadidel = document.getElementById("squadid");
squadidel.value = id;
squadidel.addEventListener("keyup", function(e) {
  id = e.target.value;
  updateUI();
});

const squadkeyel = document.getElementById("squadkey");
squadkeyel.value = key;
squadkeyel.addEventListener("keyup", function(e) {
  key = e.target.value;
  updateUI();
});

updateUI();

function makeUrl(path, params) {
  if (typeof path === "object") {
    [params,path] = [path,null];
  }

  if (typeof path !== "string") path = "";
  if (typeof params !== "object" || params == null) params = {};

  const baseUrl = [location.origin, "api", id, path].filter(Boolean).join("/");
  const query = Object.keys(params).map((k) => {
    if (typeof params[k] === "string") {
      return k + "=" + params[k];
    }
  }).filter(Boolean).join("&");

  return baseUrl + "?" + query;
}

function addCommand(cmd, msg) {
  return `!addcom ${cmd} -ul=moderator ${msg}`;
}

function command(name, tpl, join) {
  const cmdel = document.getElementById(name + "cmd");
  const tplel = document.getElementById(name + "tpl");

  tplel.value = tpl;
  cmdel.value = addCommand("!" + name, "$(touser) -> $(urlfetch " + makeUrl("list", {
    join,
    tpl: encodeURIComponent(tpl)
  }) + ")");
}

function updateUI() {
  const setsquad = document.getElementById("setsquadcmd");
  setsquad.value = addCommand("!setsquad", "$(urlfetch " + makeUrl("set", {
    data: "$(querystring)",
    key
  }) + ")");

  command("multi", `{#empty}
{channel.name} is not in a squad right now.
{:else}
http://www.multitwitch.tv/{channel.name}/{text}
{/empty}`, "/");

  command("squad", `{channel.name} is {#empty}
not currently playing with anyone.
{:else}
currently playing with {@join value=squad sep=", "}{.} ( https://twitch.tv/{.} ){/join}.
{/empty}`);

  const joininput = document.getElementById("joininput");
  const tplinput = document.getElementById("tplinput");
  const genurl = document.getElementById("genurl");
  const addcom = document.getElementById("addcom");
  let join, tpl;

  function updateCmdGen() {
    if (tpl || join) {
      const url = makeUrl("list", {
        join,
        tpl: tpl ? encodeURIComponent(tpl) : null
      });

      genurl.value = url;
      addcom.value = `!addcom !mycmd $(urlfetch ${url})`;
    } else {
      genurl.value = "";
      addcom.value = "";
    }
  }

  joininput.addEventListener("keyup", function(e) {
    join = e.target.value;
    updateCmdGen();
  });

  tplinput.addEventListener("keyup", function(e) {
    tpl = e.target.value;
    updateCmdGen();
  });
}
