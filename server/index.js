const express = require("express");

const app = express();
const port = 80;

function buildUrl(base, queryParams) {
    const entries = Object.entries(queryParams);
    if(!entries.length) return base;
    let result = `${base}?${entries[0][0]}=${entries[0][1]}`;
    for(let i = 1; i < entries.length; i++) {
        result += `&${entries[i][0]}=${entries[i][1]}`;
    }
    return result;
}

const redirectUrl = buildUrl("https://accounts.spotify.com/authorize", {
    "client_id": "ff9c6369ea014cf389ff15aa8c1bc2c7",
    "response_type": "code",
    "redirect_uri": "http://localhost",
    "scope": "user-read-private%20user-library-read"
});

app.use(express.static("../client/public"));

app.get("/authorize", (req, res) => {
    res.redirect(redirectUrl);
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
