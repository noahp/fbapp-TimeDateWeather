import Weather from '../common/weather/phone.js';
import { outbox } from "file-transfer";
import { encode } from "cbor"
import { me } from "companion"

// wake every 15 minutes and refresh weather
me.wakeInterval = 15 * 60 * 1000

console.log("Started companion!");

let weather = new Weather();

weather.setProvider("yahoo"); // only support yahoo for now
weather.setApiKey("mykey");
weather.setFeelsLike(true);

weather.onsuccess = (data) => {
  let weatherdata = JSON.stringify(data);
  console.log("Weather is " + weatherdata);
  
  // transmit the data over ft
  let filename = "weather.cbor";
  outbox.enqueue(filename, encode(data)).then((ft) => {
    console.log("Transfer of " + ft.name + " successfully queued.");
  }).catch((error) => {
    console.log("Failed to queue: " + filename +  ". Error: " + error);
  })
}

weather.onerror = (error) => {
  console.log("Weather error " + JSON.stringify(error));
}

weather.fetch();
// Close the companion and wait to be awoken
me.yield()
