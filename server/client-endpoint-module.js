const { getJsonBody } = require("./utils");
const UserModule = require("./user-module");
const { SpotifyRegistrationError, SpotifyInvalidTokenError } = require("./spotify-module");

class MalformedAuthorizationError extends Error {}

class ClientEndpointModule {
    /**
     * Constructs a new ClientEndpointModule.
     * @param {UserModule} userModule The instance of `UserModule` to use
     * @param {String} redirectUrl Where to redirect the user when they attempt to access the `/authorize` endpoint.
     */
    constructor(userModule, redirectUrl) {
        this.userModule = userModule;
        this.redirectUrl = redirectUrl;
    }

    /**
     * Checks if authorization was provided in `req`'s headers. If not, a `MalformedAuthorizationError` is thrown.
     * @param {Express.Request} req HTTP request.
     */
    _getUserToken(req) {
        let token, regexResult;
        if(!req.headers.authorization ||
           !(regexResult = /Bearer (.*)$/.exec(req.headers.authorization)) ||
           !(token = regexResult[1])) {
            throw new MalformedAuthorizationError();
        }

        return token;
    }

    _checkAuthorization(req, res, fn) {
        let token;
        try {
            token = this._getUserToken(req);
        } catch(err) {
            res.status(400);
            if(err instanceof MalformedAuthorizationError) {
                res.send("Authorization header is missing or malformed.");
            } else {
                res.send("Unknown error");
            }
            return;
        }
        fn(token);
    }

    // TODO: move these helpers to a submodule

    _songsHelper(res, token) {
        this.userModule.getSongs(token)
        .then((songs) => res.send(songs))
        .catch((err) => {
            if(err instanceof SpotifyInvalidTokenError) {
                res.status(401).send("Invalid Spotify access token");
            } else {
                res.status(400).send("Unknown error while getting songs");
            }
        });
    }

    _updateSongRangeHelper(req, res, token) {
        getJsonBody(req)
        .then((body) => {
            if(body.startTime_ms > body.endTime_ms ||
               body.startTime_ms < 0) {
                res.status(400).send("Invalid start time or end time");
                return;
            }
            this.userModule.updateSongRange(token, body.songId, body.startTime_ms, body.endTime_ms);
            res.status(200).send();
        });
    }

    _deleteSongRangeHelper(req, res, token) {
        getJsonBody(req)
        .then((body) => {
            this.userModule.deleteSongRange(token, body.songId);
            res.status(200).send();
        });
    }

    /**
     * Sets the client endpoints of the given Express app.
     * @param {Express} app Express app.
     */
    setEndpoints(app) {
        app.get("/authorize", (_req, res) => {
            res.redirect(this.redirectUrl);
        });
        
        app.post("/register", (req, res) => {
            getJsonBody(req)
            .then((body) => {
                this.userModule.registerUser(body.code)
                .then(() => res.status(200).send())
                .catch((err) => {
                    res.status(400);
                    if(err instanceof SpotifyRegistrationError) {
                        res.send(err.message);
                    } else {
                        res.send("Unknown error while registering with Spotify");
                    }
                });
            });
        });

        app.get("/songs", (req, res) => {
            this._checkAuthorization(req, res, (token) => this._songsHelper(res, token));
        });

        app.post("/updateSongRange", (req, res) => {
            this._checkAuthorization(req, res, (token) => this._updateSongRangeHelper(req, res, token));
        });

        app.post("/deleteSongRange", (req, res) => {
            this._checkAuthorization(req, res, (token) => this._deleteSongRangeHelper(req, res, token));
        });
    }
}

module.exports = ClientEndpointModule;
