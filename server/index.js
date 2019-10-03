const fs = require("fs");

const express = require("express");

const CommandLineModule = require("./command-line-module");
const { SpotifyModule } = require("./spotify-module");
const UserModule = require("./user-module");
const ClientEndpointModule = require("./client-endpoint-module");

const commandLineArgs = CommandLineModule.getCommandLineArgs();

const app = express();
const port = commandLineArgs.port;
const clientID = commandLineArgs.clientID;
const redirectUri = commandLineArgs.redirectUri;

const secretFile = fs.readFileSync(commandLineArgs.secretFile);
const clientSecret = secretFile.toString("utf8", 0, secretFile.length);

const spotifyModule = new SpotifyModule(clientID, clientSecret, redirectUri);
const userModule = new UserModule(spotifyModule);
const clientEndpointModule = new ClientEndpointModule(userModule, spotifyModule.getRedirectUrl());

app.use(express.static("../client/public"));
clientEndpointModule.setEndpoints(app);
app.listen(port, () => console.log(`Server listening on port ${port}`));
