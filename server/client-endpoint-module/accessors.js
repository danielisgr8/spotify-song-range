const axios = require("axios");

const { getUpdatedAccessToken } = require("../spotify-networking");

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
function handleSpotifyError(err, res, user) {
    return new Promise((resolve, reject) => {
        if(err.response.status === 401) {
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

module.exports.getSongs = async (res, user) => {
    try {
        // TODO: move this request into spotify-networking
        const songsRes = await axios.get("https://api.spotify.com/v1/me/tracks", {
            headers: {
                "Authorization": `Bearer ${user[0]}`
            }
        });
        return songsRes.data.items.map((item) => {
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
            } catch(err) { return null; }
        });
    } catch(err) {
        console.log(err);
        try {
            handleSpotifyError(err, res, user);
            return getSongs(res, user);
        } catch(err) {
            throw new Exception();
        }
    };
}