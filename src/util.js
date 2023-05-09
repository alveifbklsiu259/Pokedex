export const getIdFromURL = (url) => {
    return Number(url.slice(url.lastIndexOf('/', url.lastIndexOf('/') - 1) + 1, url.lastIndexOf('/')))
}