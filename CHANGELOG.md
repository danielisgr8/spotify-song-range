# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2019-10-2
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
