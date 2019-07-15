import React from "react";

import { getArtistsString } from "./utils";

import "./SongCard.scss";

export const SongCard = ({ song, setCurrentSong }) => {
    return (
        <div className="song-card" onClick={() => setCurrentSong(song)} >
            <p>{song.name}</p>
            <p>{getArtistsString(song.artists)}</p>
            <p>{song.album.name}</p>
        </div>
    );
}