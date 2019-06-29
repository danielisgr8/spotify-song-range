import React, { useState, useEffect } from 'react';

import { registerUser, getSongs } from "./networking";
import { SongCard } from "./SongCard";

import './App.css';

const AuthorizeComponent = () => {
  return (
    <a href="/authorize">Login to Spotify</a> 
  );
}

const ErrorDisplay = ({ error }) => {
  return (
    <h4 style={{color: "red"}}>{error}</h4>
  )
}

const SpotifyDisplay = ({ authCode }) => {
  const [message, setMessage] = useState("No message yet!");
  const [songs, setSongs] = useState(null);

  useEffect(() => {
    registerUser(authCode)
    .then((res) => {
      setMessage(`Data: ${JSON.stringify(res)}`);
      getSongs(authCode)
      .then((res) => setSongs(res.data))
      .catch((err) => setMessage(`Error: ${JSON.stringify(err)}`));
    })
    .catch((err) => setMessage(`Error: ${JSON.stringify(err)}`));
  }, []);

  return (
    <div>
      <p>Authorization code: {authCode}</p>
      {songs
      ? <div className="song-card-holder">{songs.map((song) => <SongCard song={song} />)}</div>
      : <p>{message}</p>}
    </div>
  )
}

const App = () => {
  let body, val;
  const params = new URLSearchParams(window.location.search);
  if((val = params.get("error"))) {
    body = <ErrorDisplay error={val} />
  } else if((val = params.get("code"))) {
    body = <SpotifyDisplay authCode={val} />
  } else {
    body = <AuthorizeComponent />
  }
  return (
    <div className="App">
      {body}
    </div>
  );
}

export default App;
