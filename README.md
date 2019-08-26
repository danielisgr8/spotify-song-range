A project that allows Spotify users to set time ranges for their song.

## Purpose
Sometimes, there are parts of a song a person wants to skip. These are typically intros or outros. However, it is inconvenient to skip them manually. This project allows this to be done automatically.

## Parts

### Server
The server handles both making API calls (from the client and to Spotify) and serving the client HTML, CSS, and JavaScript. Run it as follows:  
`cd server && npm start [-- <CLIs>]`

#### Command-line arguments
| Name                 | Alias | Type   | Default                            | Description                                                              |
|----------------------|-------|--------|------------------------------------|--------------------------------------------------------------------------|
| Redirect URI         | r     | string | `http://localhost`                 | Where Spotify should redirect the user after authorization.              |
| Port                 | p     | number | `80`                               | The port to run the server on.                                           |
| Client ID            | c     | string | `ff9c6369ea014cf389ff15aa8c1bc2c7` | The client ID of the Spotify app. Defaults to my client ID.              |
| Secret file location | s     | string | `./CLIENT_SECRET`                  | The location of a file containing the client secret for the Spotify app. |

### Client
The client provides the UI for a user to set their song ranges. To build and watch the client, run the following command:  
`cd client && npm run build`  
(replace `build` with `watch` to continuously watch and rebuild code)
