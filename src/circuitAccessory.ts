import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';

import {PentairPlatform} from './platform';
import {
  Circuit,
  CircuitStatus,
  CircuitStatusMessage, CircuitType, Color,
  IntelliCenterRequest,
  IntelliCenterRequestCommand,
  Module,
  Panel,
} from './types';
import {v4 as uuidv4} from 'uuid';
import {MANUFACTURER} from './settings';
import {ACT_KEY, DEFAULT_BRIGHTNESS, DEFAULT_COLOR_TEMPERATURE, STATUS_KEY} from './constants';
import {getIntelliBriteColor} from './util';

const MODEL = 'Circuit';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class CircuitAccessory {
  private service: Service;
  private circuit: Circuit;
  private panel: Panel;
  private module: Module | null;
  private color = Color.White;

  constructor(
    private readonly platform: PentairPlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.module = accessory.context.module as Module;
    this.panel = accessory.context.panel as Panel;
    this.circuit = accessory.context.circuit as Circuit;

    const serial = this.module ? `${this.panel.id}.${this.module.id}.${this.circuit.id}` :
      `${this.panel.id}.${this.circuit.id}`;
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.platform.Characteristic.Model, MODEL)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, serial);

    if (CircuitType.IntelliBrite === this.circuit.type) {
      this.service = this.accessory.getService(this.platform.Service.Lightbulb)
        || this.accessory.addService(this.platform.Service.Lightbulb);

      this.service.getCharacteristic(this.platform.Characteristic.Hue)
        .onSet(this.setColorHue.bind(this))
        .onGet(this.getColorHue.bind(this));

      this.service.getCharacteristic(this.platform.Characteristic.Saturation)
        .onSet(this.setColorSaturation.bind(this))
        .onGet(this.getColorSaturation.bind(this));

      this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature)
        .onSet(this.setColorTemperature.bind(this))
        .onGet(this.getColorTemperature.bind(this));

      this.service.getCharacteristic(this.platform.Characteristic.Brightness)
        .onSet(this.setBrightness.bind(this))
        .onGet(this.getBrightness.bind(this));
    } else {
      this.service = this.accessory.getService(this.platform.Service.Switch)
        || this.accessory.addService(this.platform.Service.Switch);
    }

    this.service.setCharacteristic(this.platform.Characteristic.Name, this.circuit.name);

    this.service.updateCharacteristic(this.platform.Characteristic.On, this.getCircuitStatus());

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    this.platform.log.info(`Setting ${this.circuit.name} to ${value}`);
    const command = {
      command: IntelliCenterRequestCommand.SetParamList,
      messageID: uuidv4(),
      objectList: [{
        objnam: this.circuit.id,
        params: {[STATUS_KEY]: value ? CircuitStatus.On : CircuitStatus.Off} as never,
      } as CircuitStatusMessage],
    } as IntelliCenterRequest;
    this.platform.sendCommandNoWait(command);
  }

  async setColorHue(value: CharacteristicValue) {
    // Wait for saturation first. 10ms chosen arbitrarily.
    await this.platform.delay(10);
    const saturation = this.accessory.context.saturation;
    this.platform.log.info(`Setting ${this.circuit.name} hue to ${value}. Saturation is ${saturation}`);
    const color = getIntelliBriteColor(value as number, saturation);
    const command = {
      command: IntelliCenterRequestCommand.SetParamList,
      messageID: uuidv4(),
      objectList: [{
        objnam: this.circuit.id,
        params: {[ACT_KEY]: color.intellicenterCode} as never,
      } as CircuitStatusMessage],
    } as IntelliCenterRequest;
    this.platform.sendCommandNoWait(command);
    this.accessory.context.saturation = color.saturation;
    this.service.updateCharacteristic(this.platform.Characteristic.Hue, color.hue);
    this.service.updateCharacteristic(this.platform.Characteristic.Saturation, color.saturation);
  }

  async setColorSaturation(value: CharacteristicValue) {
    this.platform.log.info(`Setting ${this.circuit.name} saturation to ${value}`);
    this.accessory.context.saturation = value as number;
  }

  async setColorTemperature(value: CharacteristicValue) {
    this.platform.log.warn(`Ignoring color temperature on ${this.circuit.name} to ${value}`);
    this.service.updateCharacteristic(this.platform.Characteristic.ColorTemperature, DEFAULT_COLOR_TEMPERATURE);
  }

  async setBrightness(value: CharacteristicValue) {
    this.platform.log.warn(`Ignoring brightness value on ${this.circuit.name} to ${value}`);
    this.service.updateCharacteristic(this.platform.Characteristic.Brightness, DEFAULT_BRIGHTNESS);
  }

  async getColorHue(): Promise<CharacteristicValue> {
    return this.color.hue;
  }

  async getColorSaturation(): Promise<CharacteristicValue> {
    return this.color.saturation;
  }

  async getBrightness(): Promise<CharacteristicValue> {
    return DEFAULT_BRIGHTNESS;
  }

  async getColorTemperature(): Promise<CharacteristicValue> {
    return DEFAULT_COLOR_TEMPERATURE;
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    return this.getCircuitStatus();
  }

  getCircuitStatus(): boolean {
    if (this.accessory.context?.circuit?.status) {
      this.platform.log.debug(`Circuit ${this.circuit.name} status is ${this.accessory.context.circuit.status }`);
      return this.accessory.context.circuit.status === CircuitStatus.On;
    }
    return false;
  }
}
