import React from "react";

import "./SongCard.scss";

export const SongCard = ({ song }) => {
    return (
        <div className="song-card">
            <p>{song.name}</p>
            <p>{song.artists.reduce((accumulator, current, index) => {
                return `${accumulator}${index ? ", " : ""}${current}`;
            }, "")}</p>
            <p>{song.album.name}</p>
        </div>
    );
}