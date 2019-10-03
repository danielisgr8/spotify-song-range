const axios = require("axios");

module.exports.getSongs = async (res, user) => {
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
}