const axios = require("axios");

const { uriEncodeParams } = require("./utils");

module.exports.getAccessToken = (code, redirectUri, clientID, clientSecret) => {
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

module.exports.getCurrentSong = async (token) => {
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

module.exports.setSongPosition = async (token, position_ms) => {
    await axios.put(`https://api.spotify.com/v1/me/player/seek?position_ms=${position_ms}`,
        null, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
};

module.exports.skipPlayback = async (token) => {
    await axios.post("https://api.spotify.com/v1/me/player/next", null, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};
