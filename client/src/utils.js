export const getArtistsString = (artists) => {
    return artists.reduce((accumulator, current, index) => {
        return `${accumulator}${index ? ", " : ""}${current}`;
    }, "");
}