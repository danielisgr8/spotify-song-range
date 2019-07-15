import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from "react-toastify";

import { registerUser, getSongs, updateSongRange } from "./networking";
import { SongCard } from "./SongCard";

import './App.scss';
import { getArtistsString } from "./utils";

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

const SongRangeForm = ({ song }) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(song.duration_ms);

  const setSongRange = (event) => {
    event.preventDefault();

    updateSongRange(song.id, startTime, endTime)
      .then(() => toast.success("Song range successfully updated"));
  }

  useEffect(() => {
    setStartTime(0);
    setEndTime(song.duration_ms);
  }, [song]);

  return (
    <div>
      <h3>{song.name}</h3>
      <h4>{getArtistsString(song.artists)}</h4>
      <form onSubmit={setSongRange}>
        <label>
          Start time:
          <input type="number" value={startTime} onChange={(e) => setStartTime(e.target.value)} />  
        </label>
        <label>
          End time:
          <input type="number" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </label>
        <input type="submit" value="Set song range" />
      </form>
    </div>
  );
}

const SpotifyDisplay = ({ authCode }) => {
  const [message, setMessage] = useState("No message yet!");
  const [songs, setSongs] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);

  useEffect(() => {
    registerUser(authCode)
    .then((res) => {
      setMessage(`Data: ${JSON.stringify(res)}`);
      getSongs()
      .then((res) => setSongs(res.data))
      .catch((err) => setMessage(`Error: ${JSON.stringify(err)}`));
    })
    .catch((err) => setMessage(`Error: ${JSON.stringify(err)}`));
  }, []);

  return (
    <div>
      <ToastContainer />
      <div className="song-cards">
        {songs
        ? <div className="song-card-holder">{songs.map((song) => <SongCard key={song.id} {...{ song, setCurrentSong }} />)}</div>
        : <p>{message}</p>}
      </div>
      {currentSong && <SongRangeForm song={currentSong} />}
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
