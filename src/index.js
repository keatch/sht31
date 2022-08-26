const { I2C } = require('i2c')
const Buffer = require('buffer/').Buffer
// const i2c0 = new I2C(0)

const constants = require('./constants')
const utilities = require('./utilities')


class SHT31 {
    constructor() {
        this.sensor = new I2C(0)
        this.sensorData = Buffer.alloc(6) // Returns 6 bytes [temp,temp,checksum,humidity,humidity,checksum]
        this.statusData = Buffer.alloc(3) // Returns 3 bytes [data,data,checksum]
    }

    async sendCommand(command) {
        // Commands are 16 bits, >> 8 will return the first 8 bits (left shift 8 bits), & 0xFF will get the last 8 bits.
        const cmd = Buffer.from([command >> 8, command & 0xFF])
        const data = this.sensor.write(cmd, 0x44)
        // this.sensor.close()
        return data
    }

    async readData() {
        const data = this.sensor.read(6, 0x44)
        this.sensorData = data
        return data
    }

    async readSensorData() {
        return this.sendCommand(constants.CMD_READ_SENSOR)
            .then(() => utilities.delay(55))
            .then(() => this.readData())
            .then(() => {
                const data = [...this.sensorData]
                // check integrity

                const rawTemperature = {
                    data: data.slice(0, 2),
                    checksum: data[2]
                }
                const rawHumidity = {
                    data: data.slice(3, 5),
                    checksum: data[5]
                }

                return new Promise((resolve, reject) => {
                    if (rawTemperature.checksum != utilities.checksum(rawTemperature.data)){
                        reject('Temperature integrity check failed.')
                    }
            
                    if (rawHumidity.checksum != utilities.checksum(rawHumidity.data)){
                        reject('Humidity integrity check failed.')
                    }
            
                    const temperature = utilities.formatTemperature((rawTemperature.data[0] << 8) + rawTemperature.data[1])
                    const humidity = utilities.formatHumidity((rawHumidity.data[0] << 8) + rawHumidity.data[1])
            
                    resolve({
                        temperature,
                        humidity
                    })
                }).catch(err => (console.error('Checksum err: ', err)))
            }).catch(err => console.error('Read sensor data: ', err))
    }

    async getStatus() {
        return this.sendCommand(constants.CMD_GET_STATUS)
            .then(() => this.readData(this.statusData))
            .then(_ => {
                const data = [...this.statusData]

                return new Promise((resolve, reject) => {
                    if (data[2] != utilities.checksum(data.slice(0,2))) {
                        reject('Temperature integrity check failed.')
                    }

                    // See documentation Page 13, Table 17.
                    resolve({
                        WriteStatus: !(data[1] & 0x01),
                        CommandStatus: !(data[1] & 0x02),
                        ResetDetected: !!(data[1] & 0x10),
                        TempTrackingAlert: !!(data[0] & 0x04),
                        RHTrackingAlert: !!(data[0] & 0x08),
                        HeaterEnabled: !!(data[0] & 0x20),
                        AlertPending: !!(data[0] & 0x80)
                    })
                }).catch(err => console.error('Get status checksum err: ', err))
            }).catch(err => console.error("Get SHT31 status: ", err))
    }

    async reset() {
        return this.sendCommand(commands.CMD_RESET)
    }
}

module.exports = SHT31
