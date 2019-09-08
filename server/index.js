const fs = require("fs");

const express = require("express");

const ClientEndpointModule = require("./client-endpoint-module");
const CommandLineModule = require("./command-line-module");
const { getCurrentSong, setSongPosition, skipPlayback } = require("./spotify-networking");

const commandLineArgs = CommandLineModule.getCommandLineArgs();

const app = express();
const port = commandLineArgs.port;
const clientID = commandLineArgs.clientID;
const redirectUri = commandLineArgs.redirectUri;

const secretFile = fs.readFileSync(commandLineArgs.secretFile);
const clientSecret = secretFile.toString("utf8", 0, secretFile.length);

/** A map of user token to array of the form [accessToken, refreshToken] */
const users = {};
/** A map of user token to array of objects of the form {songId, startTime, endTime} */
const songRanges = {};

const clientEndpointModule = new ClientEndpointModule(redirectUri, users, songRanges, clientID, clientSecret);

app.use(express.static("../client/public"));
clientEndpointModule.setEndpoints(app);
app.listen(port, () => console.log(`Server listening on port ${port}`));

setInterval(async () => {
    for(const token in users) {
        const userSongRanges = songRanges[token];
        if(!userSongRanges) continue;
        let currentSong;
        try { currentSong = await getCurrentSong(users[token][0]); }
        catch(err) {
            console.log(`[Error] Can't get current song for ${token.substr(0, 10)}`);
            delete users[token];
            continue;
        }
        if(!currentSong) continue;
        let range;
        if((range = userSongRanges[currentSong.songId])) {
            if(currentSong.progress_ms < range[0]) {
                setSongPosition(users[token][0], range[0]);
                console.log(`${token.substr(0, 10)}...: ${currentSong.songId} seek from ${currentSong.progress_ms} to ${range[0]}`);
            } else if(currentSong.progress_ms >= range[1]) {
                skipPlayback(users[token][0]);
                console.log(`${token.substr(0, 10)}...: ${currentSong.songId} at ${currentSong.progress_ms}, skip`);
            }
        }
    }
}, 1000);
