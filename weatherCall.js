const puppeteer = require("puppeteer");
// const { performance } = require("perf_hooks");

async function weatherCall(searchQuery) {
    try {
        //Creates a Headless Browser Instance in the Background
        const browser = await puppeteer.launch();

        //Creates a Page Instance, similar to creating a new Tab
        const page = await browser.newPage();

        //Sets User-Agent Header in order to "Headless Mode ==> Headed Mode" to let website to let us visit
        await page.setUserAgent(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604"
        );

        ////////////////////////---Optimization---//////////////////////////
        // turns request interceptor on
        await page.setRequestInterception(true);
        // if the page makes a  request to a resource type of image or stylesheet then abort that request
        page.on("request", (request) => {
            if (
                request.resourceType() === "image" ||
                request.resourceType() === "stylesheet" ||
                request.resourceType() === "font"
            ) {
                request.abort();
            } else {
                request.continue();
            }
        });
        ////////////////////////---Optimization---//////////////////////////

        //Navigates the page to url and wait until DOM contents are loaded
        // const { coords } = await getCurrentPosition();
        const coords = {
            latitude: searchQuery.substr(0, searchQuery.indexOf(",")),
            longitude: searchQuery.substr(searchQuery.indexOf(",") + 1).trim()
        };
        const url = `https://www.accuweather.com/tr/search-locations?query=${coords.latitude},${coords.longitude}`;
        await page.goto(url, {waitUntil: "domcontentloaded"});
        await page.screenshot({path: "sample.png"});
        //Waits until the first a item with classname "recent-location-display" loads
        await page.waitForSelector("a.recent-location-display");
        //Finds the a item with classname "recent-location-display" and returns its href attribute to populate location const
        const locationData = await page.$eval(
            "a.recent-location-display",
            (item) => item.href
        );
        const trimmedValue = await locationData.substr(34);
        const location = await trimmedValue.substring(
            0,
            trimmedValue.indexOf("/")
        );

        //Waits until the first 'a' element with prop data-gaid daily loads
        await page.waitForSelector("a[data-gaid='hourly']");
        //Finds the 'a' element with prop data-gaid hourly, after so it executes .click() DOM Method
        await page.$eval("a[data-gaid='hourly']", (button) => button.click());

        //Waits until the first div with class 'hourly-wrapper' loads
        await page.waitForSelector("div.hourly-forecast-card");
        //Finds all the divs with class 'hourly-forecast-card' and returns it
        const searchResults = await page.$$eval(
            "div.hourly-forecast-card",
            (results) => {
                let data = [];
                results.map((result) => {
                    const date = result
                        .querySelector(
                            "div.accordion-item-header-container > div > div > div.date >  p.sub"
                        )
                        .innerText.trim()
                        .replace("\t", "");
                    const hour = result
                        .querySelector(
                            "div.accordion-item-header-container > div > div > div.date >  p:first-child"
                        )
                        .innerText.trim()
                        .replace("\t", "");
                    const image = result.querySelector(
                        "div.accordion-item-header-container > div > div > img"
                    ).src;
                    const temp = result
                        .querySelector(
                            "div.accordion-item-header-container > div > div > div.temp"
                        )
                        .innerText.trim()
                        .replace("\t", "");
                    const description = result
                        .querySelector(
                            "div.accordion-item-header-container > div > div > span.phrase"
                        )
                        .innerText.trim()
                        .replace("\t", "");
                    const precip = result
                        .querySelector(
                            "div.accordion-item-header-container > div > div > div.precip"
                        )
                        .innerText.trim()
                        .replace("\t", "")
                        .replace("\t\t", "");
                    const realFeel = result
                        .querySelector(
                            "div.accordion-item-content > div > div.left > p:first-child"
                        )
                        .innerText.trim()
                        .replace("\t", "")
                        .replace("\t\t", "");
                    const wind = result
                        .querySelector(
                            "div.accordion-item-content > div > div.left > p:nth-child(2)"
                        )
                        .innerText.trim()
                        .replace("\t", "")
                        .replace("\t\t", "");
                    const windGusts = result
                        .querySelector(
                            "div.accordion-item-content > div > div.left > p:nth-child(3)"
                        )
                        .innerText.trim()
                        .replace("\t", "")
                        .replace("\t\t", "");
                    const humidity = result
                        .querySelector(
                            "div.accordion-item-content > div > div.left > p:nth-child(4)"
                        )
                        .innerText.trim()
                        .replace("\t", "")
                        .replace("\t\t", "");
                    const cloudCover = result
                        .querySelector(
                            "div.accordion-item-content > div > div:nth-child(2) > p:first-child"
                        )
                        .innerText.trim()
                        .replace("\t", "")
                        .replace("\t\t", "");
                    const rain = result
                        .querySelector(
                            "div.accordion-item-content > div > div:nth-child(2) > p:nth-child(2)"
                        )
                        .innerText.trim()
                        .replace("\t", "")
                        .replace("\t\t", "");
                    const snow = result
                        .querySelector(
                            "div.accordion-item-content > div > div:nth-child(2) > p:nth-child(3)"
                        )
                        .innerText.trim()
                        .replace("\t", "")
                        .replace("\t\t", "");

                    data.push({
                        date,
                        hour,
                        image,
                        temp,
                        description,
                        precip,
                        realFeel,
                        wind,
                        windGusts,
                        humidity,
                        cloudCover,
                        rain,
                        snow
                    });
                });
                return data;
            }
        );

        //Closes the Browser Instance
        await browser.close();

        //Sets fullData based on fetched outputs
        const fullData = {
            weatherLocation: location,
            weatherData: searchResults
        };
        return fullData;
    } catch (error) {
        console.log("cannot get weather info");
    }
}

// ////////////////////////////////////////////////////
// //calculates average time by executing searchGoogle 20 times asynchronously
// const averageTime = async () => {
//   try {
//     const averageList = [];

//     for (let i = 0; i < 10; i++) {
//       console.log(i);
//       const t0 = performance.now();

//       //wait for our function to execute
//       await weatherCall("40.200546,29.211979");

//       const t1 = performance.now();

//       //push the difference in performance time instance
//       averageList.push(t1 - t0);
//     }

//     //adds all the values in averageList and divides by length
//     const average = averageList.reduce((a, b) => a + b) / averageList.length;

//     console.log(`Average Time: ${average / 1000} s`);
//   } catch (error) {
//     console.log(error);
//   }
// };

// //executing the average time function so we can run the file in node runtime.
// averageTime();

// ////////////////////////////////////////////////////

module.exports = weatherCall;
