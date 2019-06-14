const bodyParser = require('body-parser');
const express = require('express');
const path = require("path");
const config = require("./config");
const app = express();
const http = require('http');
const appleSignin = require("apple-signin");

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'jade');
app.use(bodyParser.json());


app.get("/", (req, res) => {
  const authorizationUrl = appleSignin.getAuthorizationUrl({
    clientID: config.client_id,
    redirectUri: config.redirect_uri,
    state: "state",
    scope: "email"
  });

  res.render("./login", {authorizationUrl});
});

app.get('/auth/apple/callback', async (req, res) => {
  if (!req.query.code) return res.sendStatus(500);

  const clientSecret = appleSignin.getClientSecret({
    clientID: config.client_id,
    teamId: config.team_id,
    keyIdentifier: config.key_identifier,
    privateKeyPath: path.join(__dirname, "../AuthKey_APPLE_PRIVATE_KEY_ID.p8")
  });

  const tokens = await appleSignin.getAuthorizationToken(req.query.code, {
    clientID: config.client_id,
    clientSecret: clientSecret,
    redirectUri: config.redirect_uri
  });

  if (!tokens.id_token) return res.sendStatus(500);
  const data = await appleSignin.verifyIdToken(tokens.id_token);

  res.json({id: data.sub, accessToken: tokens.access_token, refreshToken: tokens.refresh_token});
});

app.use((req, res, next) => { res.sendStatus(404) })
app.use((err, req, res, next) => { 
  console.log(err)
  res.sendStatus(err.status || 500) 
})

app.set('port', 3000);

var server = http.createServer(app);
server.listen(3000);