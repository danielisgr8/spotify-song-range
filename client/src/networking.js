import axios from "axios";

let authCode = "";

export const registerUser = (code) => {
    authCode = code;
    return new Promise((resolve) => {
        axios.post("/register", { code })
            .then((res) => resolve(res));
    });
}

export const getSongs = () => {
    return new Promise((resolve, reject) => {
        axios.get("/songs", {
            headers: {
                "Authorization": `Bearer ${authCode}`
            }
        })
            .then((res) => resolve(res))
            .catch((err) => reject(err));
    });
}

/**
 * Update a song range.
 * @param {string} songId Song ID of the song to update the range of
 * @param {number} startTime Start time of the new range in milliseconds
 * @param {number} endTime End time of the new range in milliseconds
 */
export const updateSongRange = (songId, startTime, endTime) => {
    return new Promise((resolve) => {
        axios.post("/updateSongRange", {
            songId,
            startTime_ms: startTime,
            endTime_ms: endTime
        }, {
            headers: {
                "Authorization": `Bearer ${authCode}`
            }
        })
            .then(() => resolve());
    });
}