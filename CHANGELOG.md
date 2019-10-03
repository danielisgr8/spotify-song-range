# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2019-10-02
This is a huge architectural overhaul. Mainly, functiosn were moved around to improve separation of concerns.

### Changed
- `ClientEndpointModule`
  - Exclusively handles responding to HTTP requests, including:
    - Checking for the `Authorization` header
    - Checking for invalid requests (e.g. song range start time < 0)
    - Writing appropriate HTTP responses when errors in further down modules are encountered
  - `_checkAuthorization` decreases error handling repetition between endpoints
  - All other responsibilites are passed down to `UserModule` (see below)
- `UserModule`
  - Has complete ownership over users and song ranges
  - Logs all relevant user/song range changes
  - Provides an interface to `ClientEndpointModule`
  - Uses the interface of `SpotifyModule`
  - Handles attempting to refresh access tokens
  - Starts the interval of checking current songs of users
  - `_spotifyRequest` and `__authrorizedSpotifyRequest` decrease error handling and token refresh repetition between functions
- `SpotifyModule` (FKA `spotify-networking.js`)
  - Handles all interfacing with the Spotify API
  - Accessed only by `UserModule`
  - Has no concept of this app's users itself, just access tokens
  - Provides a lot of error detection that is typically passed up to other modules

### Added
- `tokenLog` in `utils.js`
  - Modularized way to print the actions of a given user token
  - Used exclusively by `UserModule`

## [1.1.0] - 2019-10-02
### Added
- Automatic reauthorization: if an access token timed out, the server will attempt to use user's refresh token to refresh it

## [1.0.0] - 2019-10-02
Clarification: 1.0.0 in reality was released roughly a month ago, but a changelog was not implemented until 2019-10-02.

### Added
- Client
  - Base functionality
    - Authorize through Spotify
    - Show list of songs (currently 20 most recent songs added to one's library)
    - Set start and end times for songs
- Server
  - Base functionality
    - Handle client endpoints using Express (`ClientEndpointModule`)
    - Make requests to the Spotify API (`spotify-networking.js`)
    - Periodically check if a song should seek/skip (`index.js`)
    - Command line arguments (`CommandLineModule`)
