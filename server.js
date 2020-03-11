const express = require("express");
const responseTime = require("response-time");
const redis = require("redis");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

//Import puppeteer function
const weatherCall = require("./weatherCall");
const getLocation = require("./getLocation");

// use cors as a middleware
app.use(cors());

// use response-time as a middleware
app.use(responseTime());

// create and connect redis client to local instance.
const client = redis.createClient(REDIS_PORT);

// Print redis errors to the console
client.on("error", err => {
  console.log("Error " + err);
});

//Catches requests made to localhost:5000/
app.get("/", (req, res) => res.send("Hello World!"));

//Catches requests made to localhost:5000/search
app.get("/search", cache, getWeather);

//Cache middleware
async function cache(req, res, next) {
  const searchQuery = req.query.searchquery;
  try {
    const response = await getLocation(searchQuery);
    //Checks if current location response exists in REDIS
    await client.get(response, (err, redisData) => {
      if (err) throw err;
      if (redisData !== null) {
        res.send(JSON.parse(redisData));
      } else {
        next();
      }
    });
  } catch (error) {
    res.status(500);
    console.log(error);
  }
}

//Creates new location to store in REDIS and returns it
async function getWeather(req, res, next) {
  const searchQuery = req.query.searchquery;
  try {
    console.log("Fetching Weather Data...");
    const response = await weatherCall(searchQuery);
    await client.setex(
      response.weatherLocation,
      900,
      JSON.stringify(response.weatherData)
    );
    //Returns a 200 Status OK with Results JSON back to the client.
    res.status(200);
    res.json(fullData);
  } catch (error) {
    res.status(500);
    console.log(error);
  }
}

//Initialises the express server on the port 5000
app.listen(PORT, () => console.log(`Weather App listening on port ${PORT}!`));
