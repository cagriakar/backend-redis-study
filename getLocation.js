const axios = require("axios");
const cheerio = require("cheerio");

// Make a request for the location info with a given url populated from "long, lat" values
async function getLocation(searcQuery) {
    try {
        const coords = {
            latitude: searcQuery.substr(0, searcQuery.indexOf(",")),
            longitude: searcQuery.substr(searcQuery.indexOf(",") + 1).trim()
        };
        const url = `https://www.accuweather.com/tr/search-locations?query=${coords.latitude},${coords.longitude}`;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const res = $('link[rel="canonical"]')
            .attr("href")
            .substr(34);
        const location = res.substring(0, res.indexOf("/"));
        return location;
    } catch (error) {
        console.log("cannot catch location info from your coordinates!");
    }
}

module.exports = getLocation;
