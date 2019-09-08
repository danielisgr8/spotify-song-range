const commandLineArgs = require("command-line-args");

const optionDefinitions = [
    { name: "redirectUri", alias: "r", type: String, defaultValue: "http://localhost" },
    { name: "port", alias: "p", type: Number, defaultValue: 80 },
    { name: "clientID", alias: "c", type: String, defaultValue: "ff9c6369ea014cf389ff15aa8c1bc2c7"},
    { name: "secretFile", alias: "s", type: String, defaultValue: "./CLIENT_SECRET" }
];

module.exports.getCommandLineArgs = () => {
    return commandLineArgs(optionDefinitions);
}