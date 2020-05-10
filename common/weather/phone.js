import { peerSocket } from "messaging";
import { geolocation } from "geolocation";

import { WEATHER_MESSAGE_KEY, Conditions } from "./common.js";

export default class Weather {
  constructor() {
    this._apiKey = "";
    this._provider = "owm";
    this._feelsLike = true;
    this._weather = undefined;
    this._maximumAge = 0;

    this.onerror = undefined;
    this.onsuccess = undefined;

    peerSocket.addEventListener("message", (evt) => {
      // We are receiving a request from the app
      if (
        evt.data !== undefined &&
        evt.data[WEATHER_MESSAGE_KEY] !== undefined
      ) {
        let message = evt.data[WEATHER_MESSAGE_KEY];
        prv_fetchRemote(message.provider, message.apiKey, message.feelsLike);
      }
    });
  }

  setApiKey(apiKey) {
    this._apiKey = apiKey;
  }

  setProvider(provider) {
    this._provider = provider;
  }

  setFeelsLike(feelsLike) {
    this._feelsLike = feelsLike;
  }

  setMaximumAge(maximumAge) {
    this._maximumAge = maximumAge;
  }

  fetch() {
    // let now = new Date().getTime();
    // if(this._weather !== undefined && this._weather.timestamp !== undefined && (now - this._weather.timestamp < this._maximumAge)) {
    //   // return previous weather if the maximu age is not reached
    //   if(this.onsuccess) this.onsuccess(this._weather);
    //   return;
    // }

    geolocation.getCurrentPosition(
      (position) => {
        //console.log("Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude);
        prv_fetch(
          this._provider,
          this._apiKey,
          this._feelsLike,
          position.coords.latitude,
          position.coords.longitude,
          (data) => {
            this._weather = data;
            if (this.onsuccess) this.onsuccess(data);
          },
          this.onerror
        );
      },
      (error) => {
        if (this.onerror) this.onerror(error);
      },
      { enableHighAccuracy: false, maximumAge: 1000 * 1800 }
    );
  }
}

/*******************************************/
/*********** PRIVATE FUNCTIONS  ************/
/*******************************************/

function prv_fetchRemote(provider, apiKey, feelsLike) {
  geolocation.getCurrentPosition(
    (position) => {
      prv_fetch(
        provider,
        apiKey,
        feelsLike,
        position.coords.latitude,
        position.coords.longitude,
        (data) => {
          if (peerSocket.readyState === peerSocket.OPEN) {
            let answer = {};
            answer[WEATHER_MESSAGE_KEY] = data;
            peerSocket.send(answer);
          } else {
            console.error("Error: Connection is not open with the device");
          }
        },
        (error) => {
          if (peerSocket.readyState === peerSocket.OPEN) {
            let answer = {};
            answer[WEATHER_MESSAGE_KEY] = { error: error };
            peerSocket.send(answer);
          }
          else {
            console.error("Error : " + JSON.stringify(error) + " " + error);
          }
        }
      );
    },
    (error) => {
      if (peerSocket.readyState === peerSocket.OPEN) {
        let answer = {};
        answer[WEATHER_MESSAGE_KEY] = { error: error };
        peerSocket.send(answer);
      }
      else {
        console.error("Location Error : " + error.message);
      }
    },
    { "enableHighAccuracy": false, "maximumAge": 1000 * 1800 });
}

function prv_fetch(provider, apiKey, feelsLike, latitude, longitude, success, error) {
  // console.info("Latitude: " + latitude + " Longitude: " + longitude);
  if (provider === "owm") {
    prv_queryOWMWeather(apiKey, latitude, longitude, success, error);
  }
  else {
    console.error("Error : unsupported provider " + provider);
  }
}

function prv_owm_condition_to_forecast(condition) {
  // see here for codes:
  // https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
  if (condition < 600) {
    return "Rain";
  } else if (condition < 700) {
    return "Snow";
  } else if (condition < 800) {
    return "Fog";
  } else if (condition === 800) {
    return "Clear";
  } else {
    return "Clouds";
  }
}

function prv_queryOWMWeather(apiKey, latitude, longitude, success, error) {
  // fetch forecast. see example resonse in owm-one-api-example.json
  var url =
    'https://api.openweathermap.org/data/2.5/onecall?appid=' + apiKey +
    '&lat=' + latitude +
    '&lon=' + longitude +
    '&exclude=minutely';
  var forecast = "";

  fetch(url)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.info("Fetched " + url);

      // check for icky weather! first rain/snow etc type is used. check the
      // next 6 hrs
      // Dumb that I can't seem to use for (var x in data.list) below >_<, x is
      // undefined for some reason
      for (let index = 0; index < 6; index++) {
        let condition = parseInt(data.hourly[index].weather[0].id);

        forecast = prv_owm_condition_to_forecast(condition);

        if (condition < 800) {
          break;
        }
      }

      // get current weather
      var condition = parseInt(data.current.weather[0].icon.substring(0, 2), 10);
      switch (condition) {
        case 1: condition = Conditions.ClearSky; break;
        case 2: condition = Conditions.FewClouds; break;
        case 3: condition = Conditions.ScatteredClouds; break;
        case 4: condition = Conditions.BrokenClouds; break;
        case 9: condition = Conditions.ShowerRain; break;
        case 10: condition = Conditions.Rain; break;
        case 11: condition = Conditions.Thunderstorm; break;
        case 13: condition = Conditions.Snow; break;
        case 50: condition = Conditions.Mist; break;
        default: condition = Conditions.Unknown; break;
      }

      let isDay = (
        data.current.dt > data.current.sunrise && data.current.dt < data.current.sunset
      );

      let weather = {
        //temperatureK : data.current.temp.toFixed(1),
        temperatureC: data.current.temp - 273.15,
        temperatureF: (data.current.temp - 273.15) * 9 / 5 + 32,
        description: data.current.weather[0].description,
        isDay: isDay,
        conditionCode: condition,
        sunrise: data.current.sunrise * 1000,
        sunset: data.current.sunset * 1000,
        timestamp: new Date().getTime(),
        forecast: forecast
      };
      // Send the weather data to the device
      if (success) {
        success(weather);
      }
    })
    .catch((err) => {
      console.error(err);
      return forecast;
    });
}
