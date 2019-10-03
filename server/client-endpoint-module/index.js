const { buildUrl, getJsonBody } = require("../utils");
const { getAccessToken, getUpdatedAccessToken } = require("../spotify-networking");
const { getSongs } = require("./accessors");

class MalformedAuthorizationError extends Error {}
class ClientUnauthorizedError extends Error {}

class ClientEndpointModule {
    /**
     * Constructs a new ClientEndpointModule.
     * @param {String} redirectUri Where to redirect the user when they attempt to access the `/authorize` endpoint.
     * @param {Object} users A map of user token to array of the form [accessToken, refreshToken].
     * @param {Object} songRanges A map of user token to array of objects of the form {songId, startTime, endTime}.
     * @param {String} clientID Spotify developer client ID.
     * @param {String} clientSecret Spotify developer client secret.
     */
    constructor(redirectUri, users, songRanges, clientID, clientSecret) {
        this.redirectUri = redirectUri;
        this.users = users;
        this.songRanges = songRanges;
        this.clientID = clientID;
        this.clientSecret = clientSecret;
    }

    /**
     * Uses the authorization from the given request to get its user token.
     * Throws relevant errors.
     * @param {Express.Request} req HTTP request.
     */
    _getUserToken(req) {
        let regexResult;
        if(!req.headers.authorization ||
           !(regexResult = /Bearer (.*)$/.exec(req.headers.authorization))) {
            throw new MalformedAuthorizationError();
        }
    
        const token = regexResult[1];
        const user = this.users[token];
        if(!user) {
            throw new ClientUnauthorizedError();
        }
    
        return token;
    }

    /**
     * Checks the authorization of the given request. Returns a promise.
     * 
     * Upon successful authorization, the promise is resolved with the user's token.
     * 
     * If there is an error with the authorization, relevent response data is set and the promise is rejected.
     * The response is not sent.
     * @param {Express.Request} req HTTP request.
     * @param {Express.Response} res HTTP response.
     */
    _checkAuthorization(req, res) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this._getUserToken(req));
            } catch(err) {
                if(err instanceof MalformedAuthorizationError) {
                    res.status(400).write("Authorization header is missing or malformed.", () => reject());
                } else if(err instanceof ClientUnauthorizedError) {
                    res.status(401).write("Client is unauthorized.", () => reject());
                }
            }
        });
    }

    /**
     * Handles an error, `err`, received from a Spotify API request. Returns a promise.
     * 
     * If the error is from unauthorization, the function will attempt to use the user's refresh token
     * to obtain a new access token. If a new access token is obtained, `user` will be updated and
     * the promise will be resolved.
     * 
     * If the user cannot be re-authorized, the promise will be rejected and `res` will have its status code
     * and body updated accordingly.
     * 
     * If the error is unknown, the promise will be rejected and `res` will have its status code and body
     * updated accordingly.
     * @param {Object} err Axios error received from Spotify API call.
     * @param {Express.Response} res Client response object.
     * @param {Object} user The user object associated with the original request.
     */
    _handleSpotifyError(err, res, user) {
        return new Promise((resolve, reject) => {
            if(err.response.status === 400 || err.response.status === 401) {
                getUpdatedAccessToken(user[1], this.clientID, this.clientSecret)
                .then((accessToken) => {
                    user[0] = accessToken;
                    resolve();
                })
                .catch(() => {
                    res.status(401).write("Cannot re-authorize user.", () => reject());
                });
            } else {
                res.status(400).write(err.response, () => reject());
            }
        });
    }

    /**
     * Sets the client endpoints of the given Express app.
     * @param {Express} app Express app.
     */
    setEndpoints(app) {
        app.get("/authorize", (_req, res) => {
            const redirectUrl = buildUrl("https://accounts.spotify.com/authorize", {
                "client_id": this.clientID,
                "response_type": "code",
                "redirect_uri": this.redirectUri,
                "scope": "user-read-playback-state%20user-modify-playback-state%20user-library-read"
            });
            res.redirect(redirectUrl);
        });
        
        app.post("/register", (req, res) => {
            getJsonBody(req)
            .then((body) => {
                getAccessToken(body.code, this.redirectUri, this.clientID, this.clientSecret)
                .then((tokens) => {
                    this.users[body.code] = tokens;
                    res.status(200).send();
                })
                .catch((err) => {
                    console.error(err && err.response);
                    res.status(400).send();
                });
            });
        });

        app.get("/songs", (req, res) => {
            this._checkAuthorization(req, res)
            .then((token) => {
                const user = this.users[token];
                getSongs(res, user)
                .then((songs) => res.send(songs))
                .catch((err) => {
                    try {
                        console.log(`${token.substr(0, 10)}...: Attempting access token refresh`);
                        this._handleSpotifyError(err, res, user)
                        .then(() => {
                            console.log(`${token.substr(0, 10)}...: Refreshed access token`);
                            getSongs(res, user)
                            .then((songs) => res.send(songs))
                            .catch((err) => res.send(err));
                        })
                        .catch(() => res.send());
                    } catch(err) {
                        res.send();
                    }
                })
            })
            .catch(() => res.send());
        });

        app.post("/updateSongRange", (req, res) => {
            this._checkAuthorization(req, res)
            .then((token) => {
                getJsonBody(req)
                .then((body) => {
                    // TODO: error checking for starTime > endTime
                    if(!this.songRanges[token]) this.songRanges[token] = {};
                    this.songRanges[token][body.songId] = [body.startTime_ms, body.endTime_ms];
            
                    console.log(`${token.substr(0, 10)}...: ${body.songId} => [ ${body.startTime_ms}, ${body.endTime_ms} ]`);
            
                    res.status(200).send();
                });
            })
            .catch(() => res.send());
        });

        app.post("/deleteSongRange", (req, res) => {
            this._checkAuthorization(req, res)
            .then((token) => {
                getJsonBody(req)
                .then((body) => {
                    if(!this.songRanges[token]) this.songRanges[token] = {};
                    this.songRanges[token][body.songId] = null;
            
                    console.log(`${token.substr(0, 10)}...: ${body.songId} => []`);
            
                    res.status(200).send();
                });
            })
            .catch(() => res.send());
        });
    }
}

module.exports = ClientEndpointModule;
