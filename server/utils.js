module.exports.buildUrl = (base, queryParams) => {
    const entries = Object.entries(queryParams);
    if(!entries.length) return base;
    let result = `${base}?${entries[0][0]}=${entries[0][1]}`;
    for(let i = 1; i < entries.length; i++) {
        result += `&${entries[i][0]}=${entries[i][1]}`;
    }
    return result;
};

module.exports.uriEncodeParams = (params) => {
    let string = "";
    for(let prop in params) {
        string += `${prop}=${params[prop]}&`;
    }
    string = string.slice(0, -1);
    return encodeURI(string);
};

module.exports.getJsonBody = (req) => {
    return new Promise((resolve) => {
        let data = "";
        req.on("data", (chunk) => {
            data += chunk;
        });
        req.on("end", () => {
            resolve(JSON.parse(data));
        });
    });
}
