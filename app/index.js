import clock from "clock";
import document from "document";
import * as messaging from "messaging";
import { preferences } from "user-settings";
import { inbox } from "file-transfer";
import * as fs from "fs";
import userActivity from "user-activity";
import { HeartRateSensor } from "heart-rate";

// Tick fires every minute
clock.granularity = "minutes";

// These are modified at runtime, save initial values
const steps_fontSize = document.getElementById("steps").style.fontSize;
const weather_forecast_fontSize = document.getElementById("weather_forecast").style.fontSize;

// Detect screen size
import { me as device } from "device";
if (!device.screen) device.screen = { width: 348, height: 250 };

// Update hr every reading
var hrm = new HeartRateSensor();

hrm.onreading = function () {
  document.getElementById("hr").text = ( hrm.heartRate > 0 ) ? hrm.heartRate : "--";
}
hrm.start();

// Refresh weather, steps, and time/date each clock tick
clock.ontick = (evt) => {
  let today = evt.date;
  let hours = today.getHours();
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  }
  let mins = today.getMinutes();
  if (mins < 10) {
    // zero pad
    mins = "0" + mins
  }
  document.getElementById("time").text = `${hours}:${mins}`;

  // Set date
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
  "July", "Aug", "Sept", "Oct", "Nov", "Dec"
  ];
  const dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];

  // use shortened month form if we overflow the buffer
  let dayofweek = today.getDay();
  let month = today.getMonth();
  let month_date = today.getDate();
  let date = `${dayOfWeekNames[dayofweek]}, ${monthNames[month]} ${month_date}`;
  if (date.length > 20) {  // TODO get from stylesheet?
    date = `${dayOfWeekNames[dayofweek]}, ${shortMonthNames[month]} ${month_date}`
  }
  document.getElementById("date").text = date;

  // Refresh weather
  weatherFromFile();

  // Steps
  let steps = userActivity.today.adjusted["steps"] || 0;
  let step_fontsize = steps_fontSize;

  // If device is 300 pixels high (versa), don't scale down steps
  if ((device.screen.height < 300) && (steps > 99999)) {
    step_fontsize = steps_fontSize - 6;
  }
  document.getElementById("steps").style.fontSize = step_fontsize;
  document.getElementById("steps").text = steps;
}

function weatherFromFile() {
  // Refresh weather data from current file
  let now = new Date().getTime();
  let stale = false;
  try {
    let weatherjson  = fs.readFileSync("weather.cbor", "cbor");
  } catch(e) {
    console.log("Error " + e);
    let weatherjson = {
      temperatureF : "NA",
      location : "<unknown>",
      forecast : "",
      conditionCode : 1000,
      timestamp : now - 30 * 60 * 1000 + 1,
    };
    stale = true;
  }

  // staleness check
  let minutes_to_stale = 60;
  if (now - weatherjson.timestamp > minutes_to_stale * 60 * 1000) {
    stale = true;
    weatherjson.location = "<unknown>";
    weatherjson.forecast = "";
    weatherjson.conditionCode = 1000;
  }
  else {
    console.log("Weather data read: " + JSON.stringify(weatherjson));
  }

  let temp_text = "";
  let temp_suffix = "";
  let is_celsius = weatherjson.is_celsius;
  if (!stale) {
    if (is_celsius) {
      temp_text = weatherjson.temperatureC.toFixed(0);
      temp_suffix = "°C";
    }
    else {
      // fahrenheit
      temp_text = weatherjson.temperatureF.toFixed(0);
      temp_suffix = "°F";
    }
  }

  document.getElementById("weather_temperature").text = temp_text + temp_suffix;

  let forecast_fontsize = weather_forecast_fontSize;
  if (weatherjson.forecast.length > 5) {
    forecast_fontsize = weather_forecast_fontSize - 4;
  }
  document.getElementById("weather_forecast").style.fontSize = forecast_fontsize;
  document.getElementById("weather_forecast").text = weatherjson.forecast;
  document.getElementById("weather_location").text = weatherjson.location.substring(0, 16);

  // update icon. TODO add night variants
  // icons from here: https://www.flaticon.com/packs/weather-97
  const conditionToIcon = {
    0 : "0_sun.png",
    1 : "1_sunny.png",
    2 : "2_cloudy-night.png",
    3 : "3_cloud.png",
    4 : "4_sprinkle.png",
    5 : "5_raindrop.png",
    6 : "6_storm.png",
    7 : "7_snowy.png",
    8 : "8_haze.png",
    9 : "3_cloud.png",
    1000 : "1000_question.png",
  }
  document.getElementById("weather_icon").href = `weather/${conditionToIcon[weatherjson.conditionCode]}`
}

document.getElementById("myRect");

document.getElementById("weather_forecast").onclick = function(e) {
  console.log("click");
}

// always check for new files on launch
function handleNewFiles() {
  var fileName;
  do {
    // If there is a file, move it from staging into the application folder
    fileName = inbox.nextFile();
    if (fileName) {
      console.log("/private/data/" + fileName + " is now available");
      // refresh weather now
      weatherFromFile();
    }
  } while (fileName);
}
handleNewFiles();

inbox.onnewfile = (evt) => {
  handleNewFiles();
}
