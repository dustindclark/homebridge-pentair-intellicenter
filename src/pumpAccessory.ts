import {CharacteristicValue, Nullable, PlatformAccessory, Service} from 'homebridge';

import {PentairPlatform} from './platform';
import {
  CircuitStatusMessage,
  IntelliCenterRequest,
  IntelliCenterRequestCommand,
  Panel,
  Pump,
  PumpSpeedType,
  TemperatureUnits,
} from './types';
import {MANUFACTURER} from './settings';
import {SPEED_KEY} from './constants';
import {v4 as uuidv4} from 'uuid';

export class PumpAccessory {
  private service: Service;
  public pump: Pump;
  public panel: Panel;

  constructor(
    private readonly platform: PentairPlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.pump = this.accessory.context.pump;
    this.panel = this.accessory.context.panel;

    this.platform.log.debug(`Setting accessory details for pump: ${JSON.stringify(this.pump, null, 2)}`);

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.platform.Characteristic.Model, this.pump.type)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.pump.id);

    this.service = this.accessory.getService(this.platform.Service.Fan)
      || this.accessory.addService(this.platform.Service.Fan);
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.pump.name);

    this.bindStaticValues();
    this.bindPump();
  }

  bindPump() {
    this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .onSet(this.setSpeed.bind(this))
      .onGet(this.getSpeed.bind(this))
      .updateValue(this.convertSpeedToPowerLevel());
  }

  bindStaticValues() {
    this.service.updateCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits,
      this.platform.getConfig().temperatureUnits === TemperatureUnits.F
        ? this.platform.Characteristic.TemperatureDisplayUnits.FAHRENHEIT
        : this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS);
    this.service.updateCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState,
      this.platform.Characteristic.CurrentHeatingCoolingState.HEAT);
  }

  async setSpeed(value: CharacteristicValue) {
    const convertedValue = this.convertPowerLevelToSpeed(value as number);

    this.platform.log.info(`Setting speed for ${this.pump.name} to ${value} converted/rounded to: ${convertedValue} ` +
      `${this.pump.speedType}`);
    const command = {
      command: IntelliCenterRequestCommand.SetParamList, //Weirdly required.
      messageID: uuidv4(),
      objectList: [{
        objnam: this.pump.id,
        params: {[SPEED_KEY]: `${convertedValue}`} as never,
      } as CircuitStatusMessage],
    } as IntelliCenterRequest;
    this.platform.sendCommandNoWait(command);

  }

  async getSpeed(): Promise<Nullable<CharacteristicValue>> {
    return this.convertSpeedToPowerLevel();
  }

  convertSpeedToPowerLevel(): number {
    if (!this.pump?.speed) {
      return 0;
    }
    const min = this.pump.speedType === PumpSpeedType.GPM ? this.pump.minFlow : this.pump.minRpm;
    const max = this.pump.speedType === PumpSpeedType.GPM ? this.pump.maxFlow : this.pump.maxRpm;
    const range = max - min;
    const current = (this.pump.speed ?? min) - min;
    const value = current / range * 100;
    const result = Math.round(value);
    this.platform.log.info(`Converted speed value from ${this.pump.speed} ${this.pump.speedType} to ${result}`);
    return result;
  }

  convertPowerLevelToSpeed(powerLevel: number): number {
    const min = this.pump.speedType === PumpSpeedType.GPM ? this.pump.minFlow : this.pump.minRpm;
    const max = this.pump.speedType === PumpSpeedType.GPM ? this.pump.maxFlow : this.pump.maxRpm;
    const range: number = max - min;
    const fromMin: number = powerLevel / 100 * range;
    const value = min + fromMin;
    const result = this.pump.speedType === PumpSpeedType.GPM ? Math.round(value) :
      Math.round(value / 50) * 50;
    this.platform.log.info(`Converted power level from ${powerLevel} to ${result} ${this.pump.speedType}`);
    return result;
  }
}
