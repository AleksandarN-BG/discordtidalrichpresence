export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseUUID(uuid) {
    return uuid ? uuid.replace(/-/g, '/') : null;
}

export function formatArtists(artists) {
    return artists.length > 1
        ? artists.map(artist => artist.name).join(", ")
        : artists[0].name;
}

export function formatTitle(title, version, displayVersions) {
    return version && displayVersions
        ? `${title} (${version})`
        : title;
}

export function createExponentialDelay(attempt, baseDelay = 1000, multiplier = 1.5) {
    return baseDelay * Math.pow(multiplier, attempt - 1);
}
