const fs = require("fs");

const express = require("express");
const axios = require("axios");

const app = express();
const port = 80;
const clientID = "ff9c6369ea014cf389ff15aa8c1bc2c7";
const redirectUri = "http://localhost";

const secretFile = fs.readFileSync("./CLIENT_SECRET");
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
    "scope": "user-read-private%20user-library-read"
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
                songRanges[body.code] = {};
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
        songRanges[token][data.songId] = [data.startTime_ms, data.endTime_ms];

        console.log(songRanges);

        res.statusCode = 200;
        res.send();
    });
});

app.listen(port, () => console.log(`Server listening on port ${port}`));

setInterval(() => {
    for(token in users) {
        const userSongRanges = songRanges[token];
        if(userSongRanges) continue;
        // get current song id
        // see if current song id matches any in songRanges[token]
        // if so,
            // if current time is less than start time, seek to star time
            // if current time is greater than end time, skip to next song
    }
}, 1000);
