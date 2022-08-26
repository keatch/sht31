# sht31
Kaluma library for SHT31 digital temperature and humidity sensor

## Credits
- This is a port of Alwin Arrasyid's excellent [sht31-node](https://github.com/alwint3r/sht31-node) library updated for compatibility with [Kaluma.js](https://kalumajs.org/). The code is basically the same. 

## Dependancies
- [Buffer](https://github.com/feross/buffer)

## Usage examples

```
// Include the library
const SHT31 = require('sht31-kaluma')
// Instantiate the class
const sht31 = new SHT31()

async function monitor() {
    // Read data and save to variable
    const data = await sht31.readSensorData() 
    // Temp in C
    const temp = Math.round(data.temperature);
    const humidity = Math.round(data.humidity);
    // Output temp to console
    console.log(`Temp is ${data.temp}, Humidity is ${data.humidity}`)
}
```