const { SpotifyModule, SpotifyExpiredTokenError } = require("./spotify-module");
const { tokenLog } = require("./utils");

class UserUnauthorizedError extends Error{}

/**
 * Tracks users and song ranges set by those users.
 * 
 * Interfaces with `SpotifyModule` to make requests on behalf of its users.
 */
class UserModule {
    /**
     * 
     * @param {SpotifyModule} spotifyModule The instance of `SpotifyModule` to use
     */
    constructor(spotifyModule) {
        /** A map of user token to array of the form [accessToken, refreshToken] */
        this.users = {};
        /** A map of user token to array of objects of the form {songId, startTime, endTime} */
        this.songRanges = {};
        this.spotifyModule = spotifyModule;
        /** `true` if the next song range to be added is the very first. `false` otherwise. */
        this.firstRange = true;
    }

    _authorize(userToken) {
        const user = this.users[userToken];
        if(!user) throw new UserUnauthorizedError();
        else return user;
    }

    async _spotifyRequest(userToken, user, fn) {
    // TODO: document
        try {
            return await fn(user);
        } catch(err) {
            if(err instanceof SpotifyExpiredTokenError) {
                tokenLog(userToken, "Attempting access token refresh");
                user[0] = this.spotifyModule.refreshAccessToken(user[1]);
                tokenLog(userToken, "Refreshed access token");
                return await fn(user);
            } else {
                throw err;
            }
        }
    }

    /**
     * Attempts to authorize the user using `userToken`. If they are not authorize, a `UserUnauthorizedError` will be thrown.
     * Then attempts to run `fn`, providing the user. If the user's access token is expired, attempts to refresh it and run `fn` again.
     * If the access token cannot be refreshed or if running `fn` throws an error, these errors will be thrown.
     * @param {string} userToken 
     * @param {function} fn A function that calls a method within `SpotifyModule`. Takes in a user object.
     */
    async _authrorizedSpotifyRequest(userToken, fn) {
        const user = this._authorize(userToken);
        return await this._spotifyRequest(userToken, user, fn);
    }

    _initCurrentSongCheck() {
        setInterval(async () => {
            for(const token in this.users) {
                const userSongRanges = this.songRanges[token];
                const user = this.users[token];
                if(!userSongRanges) continue;
                this._spotifyRequest(token, user, async () => {
                    const currentSong = await this.spotifyModule.getCurrentSong(user[0]);
                    if(!currentSong) return;
                    let range;
                    if((range = userSongRanges[currentSong.songId])) {
                        if(currentSong.progress_ms < range[0]) {
                            this.spotifyModule.setSongPosition(user[0], range[0]);
                            tokenLog(token, `${currentSong.songId} seek from ${currentSong.progress_ms} to ${range[0]}`);
                        } else if(currentSong.progress_ms >= range[1]) {
                            this.spotifyModule.skipPlayback(user[0]);
                            tokenLog(token, `${currentSong.songId} at ${currentSong.progress_ms}, skip`);
                        }
                    }
                });
            }
        }, 1000);
    }

    async registerUser(userToken) {
        const tokens = await this.spotifyModule.getAccessToken(userToken);
        this.users[userToken] = tokens;
    }

    // TODO: move this helper to a submodule
    async _getSongsHelper(user) {
        const songs = await this.spotifyModule.getSongs(user[0]);
        return songs.map((item) => {
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

    async getSongs(userToken) {
        return await this._authrorizedSpotifyRequest(userToken, async (user) => await this._getSongsHelper(user));
    }

    updateSongRange(userToken, songId, startTime, endTime) {
        this._authorize(userToken);
        if(!this.songRanges[userToken]) this.songRanges[userToken] = {};
        this.songRanges[userToken][songId] = [startTime, endTime];

        // don't start the current song check until the first song range is added
        if(this.firstRange) {
            this._initCurrentSongCheck();
            this.firstRange = false;
        }

        tokenLog(userToken, `${songId} => [ ${startTime}, ${endTime} ]`);
    }

    deleteSongRange(userToken, songId) {
        if(!this.songRanges[userToken]) return;
        delete this.songRanges[userToken][songId];

        tokenLog(userToken, `${songId} => []`);
    }
}

module.exports = UserModule;