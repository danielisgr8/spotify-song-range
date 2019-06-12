import React from 'react';
import './App.css';

function AuthorizeComponent() {
  return (
    <a href="/authorize">Login to Spotify</a> 
  );
}

function ErrorDisplay({ error }) {
  return (
    <h4 style={{color: "red"}}>{error}</h4>
  )
}

function SpotifyDisplay({ authCode }) {
  return (
    <p>Authorization code: {authCode}</p>
  )
}

function App() {
  let body, val;
  console.log(window.location.search);
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
