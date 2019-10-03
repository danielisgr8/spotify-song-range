const axios = require("axios");

const { uriEncodeParams, buildUrl } = require("./utils");

class SpotifyRegistrationError extends Error {}
class SpotifyInvalidTokenError extends Error {}
class SpotifyExpiredTokenError extends Error {}

/**
 * A module to make requests with the Spotify API.
 * 
 * An instance of `SpotifyModule` is associated with a given Spotify app's client ID and secret.
 */
class SpotifyModule {
    constructor(clientID, clientSecret, redirectUri) {
        this.clientID = clientID;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }

    /**
     * Handles an error from an axios request sent to the Spotify API
     * @param {axios.Error} err Error received from axios request
     */
    _handleError(err) {
        if(err.response.status === 401) {
            const data = err.response.data;
            if(data && data.error && data.error.message === "Invalid access token") {
                throw new SpotifyInvalidTokenError();
            } else {
                throw new SpotifyExpiredTokenError();
            }
        } else {
            throw new Error();
        }
    }

    getRedirectUrl() {
        return buildUrl("https://accounts.spotify.com/authorize", {
            "client_id": this.clientID,
            "response_type": "code",
            "redirect_uri": this.redirectUri,
            "scope": "user-read-playback-state%20user-modify-playback-state%20user-library-read"
        });
    }

    /**
     * Gets the access token (and refresh token) for a given user code.
     * This user code is received after a user authorizes through Spotify.
     * @param {string} code Code to get an access token for
     * @returns {Promise} If successful, resolves to `[accessToken, refreshToken]`. Otherwise, rejects to a `SpotifyRegistrationError`.
     */
    async getAccessToken(code) {
        const authString = `Basic ${Buffer.from(`${this.clientID}:${this.clientSecret}`).toString("base64")}`;
        const bodyParams = uriEncodeParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: this.redirectUri
        });
    
        try {
            const res = await axios.post("https://accounts.spotify.com/api/token", bodyParams, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": authString
                }
            });
            return [res.data.access_token, res.data.refresh_token];
        } catch(err) {
            console.log(err);
            throw new SpotifyRegistrationError({ status: err.response.status, data: err.response.data });
        }
    }
    
    async refreshAccessToken(refreshToken) {
        const authString = `Basic ${Buffer.from(`${this.clientID}:${this.clientSecret}`).toString("base64")}`;
        const bodyParams = uriEncodeParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken
        });
        try {
            const res = await axios.post("https://accounts.spotify.com/api/token", bodyParams, {
                headers: {
                    "Authorization": authString
                }
            })
            return res.data.access_token;
        } catch(err) {
            throw new SpotifyRegistrationError({ status: err.response.status, data: err.response.data });
        }
    }
    
    async getCurrentSong(token) {
        try {
            const response = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        
            if(response.status === 204) {
                return null;
            }
        
            return {
                progress_ms: response.data.progress_ms,
                songId: response.data.item.id
            };
        } catch(err) { this._handleError(err) }
    }
    
    async setSongPosition(token, position_ms) {
        await axios.put(`https://api.spotify.com/v1/me/player/seek?position_ms=${position_ms}`,
            null, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    }
    
    async skipPlayback(token) {
        await axios.post("https://api.spotify.com/v1/me/player/next", null, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }
    
    async getSongs(token) {
        try {
            const songsRes = await axios.get("https://api.spotify.com/v1/me/tracks", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            return songsRes.data.items;
        } catch(err) { this._handleError(err) }
    }
}

module.exports = { SpotifyModule, SpotifyRegistrationError, SpotifyInvalidTokenError, SpotifyExpiredTokenError };
