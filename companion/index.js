import Weather from "../common/weather/phone.js";
import { outbox } from "file-transfer";
import { encode } from "cbor";
import { me } from "companion";
import { settingsStorage } from "settings";

// wake every 5 minutes and refresh weather
me.wakeInterval = 5 * 60 * 1000;

console.log("Started companion!");

let weather = new Weather();

weather.setProvider("owm"); // only support owm for now
let settings_api_key = JSON.parse(settingsStorage.getItem("owm_apikey")).name;
weather.setApiKey(
  settings_api_key
    ? settings_api_key
    : "76fa7dd2f60e6e7eb5421f1512b9dbc3"
);
weather.setFeelsLike(true);

weather.onsuccess = (data) => {
  // set celsius/fahrenheit setting
  let is_celsius = settingsStorage.getItem("CelsiusOrFahrenheit")
    ? JSON.parse(settingsStorage.getItem("CelsiusOrFahrenheit"))["values"][0][
    "name"
    ] == "Celsius"
    : null;
  if (is_celsius) {
    data["is_celsius"] = true;
  } else {
    data["is_celsius"] = false;
  }
  let weatherdata = JSON.stringify(data);
  console.log("Weather is " + weatherdata);

  // transmit the data over ft
  let filename = "weather.cbor";
  outbox
    .enqueue(filename, encode(data))
    .then((ft) => {
      console.log("Transfer of " + ft.name + " successfully queued.");
    })
    .catch((error) => {
      console.log("Failed to queue: " + filename + ". Error: " + error);
    });
};

weather.onerror = (error) => {
  console.log("Weather error " + JSON.stringify(error));
};

// Update weather at least every 10 minutes when running
// TODO this doesn't work, y tho >_<
setInterval(weather.fetch, 10 * 60 * 1000);

me.onwakeinterval = () => {
  console.log("Wakeup interval");
  weather.fetch();
};

// refresh weather on settings change
settingsStorage.onchange = function () {
  weather.fetch();
};

// Freshen up weather data on launch
weather.fetch();
