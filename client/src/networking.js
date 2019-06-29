import axios from "axios";

export const registerUser = (code) => {
    return new Promise((resolve, reject) => {
        axios.post("/register", { code })
            .then((res) => resolve(res));
    });
}

export const getSongs = (code) => {
    return new Promise((resolve, reject) => {
        axios.get("/songs", {
            headers: {
                "Authorization": `Bearer ${code}`
            }
        })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
}