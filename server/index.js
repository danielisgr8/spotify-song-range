const fs = require("fs");

const express = require("express");
const axios = require("axios");
const commandLineArgs = require("command-line-args");

const optionDefinitions = [
    { name: "redirectUri", alias: "r", type: String, defaultValue: "http://localhost" },
    { name: "port", alias: "p", type: Number, defaultValue: 80 },
    { name: "secretFile", alias: "s", type: String, defaultValue: "./CLIENT_SECRET" }
];
const options = commandLineArgs(optionDefinitions);

const app = express();
const port = options.port;
const clientID = "ff9c6369ea014cf389ff15aa8c1bc2c7";
const redirectUri = options.redirectUri;

const secretFile = fs.readFileSync(options.secretFile);
const clientSecret = secretFile.toString("utf8", 0, secretFile.length);

/** A map of user token to array of the form [accessToken, refreshToken] */
const users = {};
/** A map of user token to array of objects of the form {songId, startTime, endTime} */
const songRanges = {};

const buildUrl = (base, queryParams) => {
    const entries = Object.entries(queryParams);
    if(!entries.length) return base;
    let result = `${base}?${entries[0][0]}=${entries[0][1]}`;
    for(let i = 1; i < entries.length; i++) {
        result += `&${entries[i][0]}=${entries[i][1]}`;
    }
    return result;
}

const uriEncodeParams = (params) => {
    let string = "";
    for(let prop in params) {
        string += `${prop}=${params[prop]}&`;
    }
    string = string.slice(0, -1);
    return encodeURI(string);
}

const redirectUrl = buildUrl("https://accounts.spotify.com/authorize", {
    "client_id": clientID,
    "response_type": "code",
    "redirect_uri": redirectUri,
    "scope": "user-read-playback-state%20user-modify-playback-state%20user-library-read"
});

const getAccessToken = (code) => {
    return new Promise((resolve, reject) => {
        const bodyParams = uriEncodeParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: clientID,
            client_secret: clientSecret
        });
        axios.post("https://accounts.spotify.com/api/token", bodyParams, {
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            }
        })
        .then((res) => resolve([res.data.access_token, res.data.refresh_token]))
        .catch((err) => reject(err));
    })
}

const getCurrentSong = async (token) => {
    const response = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if(response.status !== 200) {
        return null;
    }

    return {
        progress_ms: response.data.progress_ms,
        songId: response.data.item.id
    };
};

const setSongPosition = async (token, position_ms) => {
    await axios.put(`https://api.spotify.com/v1/me/player/seek?position_ms=${position_ms}`,
        null, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
};

const skipPlayback = async (token) => {
    await axios.post("https://api.spotify.com/v1/me/player/next", null, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

app.use(express.static("../client/public"));

app.get("/authorize", (req, res) => {
    res.redirect(redirectUrl);
});

app.post("/register", (req, res) => {
    let data = "";
    req.on("data", (chunk) => {
        data += chunk;
    });
    req.on("end", () => {
        const body = JSON.parse(data);
        getAccessToken(body.code)
            .then((tokens) => {
                users[body.code] = tokens;
                res.statusCode = 200;
                res.send();
            })
            .catch((err) => {
                console.error(err && err.response);
                res.statusCode = 400;
                res.send();
            });
    });
});

app.get("/songs", (req, res) => {
    const token = /Bearer (.*)$/.exec(req.headers.authorization)[1];
    if(!token || !users[token]) {
        res.statusCode = 400;
        res.send();
        return;
    }
    axios.get("https://api.spotify.com/v1/me/tracks", {
        headers: {
            "Authorization": `Bearer ${users[token][0]}`
        }
    })
    .then((songsRes) => {
        res.send(songsRes.data.items.map((item) => {
            try {
                return {
                    album: {
                        artists: item.track.album.artists.map((artist) => artist.name),
                        name: item.track.album.name
                    },
                    artists: item.track.artists.map((artist) => artist.name),
                    duration_ms: item.track.duration_ms,
                    name: item.track.name,
                    id: item.track.id
                }
            } catch(err) { console.log(err); res.send("bad") }
        }));
    })
    .catch((err) => {
        console.error(err && err.response);
        res.statusCode = 404;
        res.send();
    });
});

app.post("/updateSongRange", (req, res) => {
    const token = /Bearer (.*)$/.exec(req.headers.authorization)[1];
    if(!users[token]) {
        res.statusCode = 400;
        res.send();
        return;
    }

    let data = "";
    req.on("data", (chunk) => {
        data += chunk;
    });
    req.on("end", () => {
        data = JSON.parse(data);
        if(!songRanges[token]) songRanges[token] = {};
        songRanges[token][data.songId] = [data.startTime_ms, data.endTime_ms];

        console.log(`${token.substr(0, 10)}...: ${data.songId} => [ ${data.startTime_ms}, ${data.endTime_ms} ]`);

        res.statusCode = 200;
        res.send();
    });
});

app.listen(port, () => console.log(`Server listening on port ${port}`));

setInterval(async () => {
    for(const token in users) {
        const userSongRanges = songRanges[token];
        if(!userSongRanges) continue;
        const currentSong = await getCurrentSong(users[token][0]);
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
