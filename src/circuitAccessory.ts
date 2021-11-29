import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';

import {PentairPlatform} from './platform';
import {
  Circuit,
  CircuitStatus,
  CircuitStatusMessage,
  IntelliCenterRequest,
  IntelliCenterRequestCommand,
  Module,
  Panel,
} from './types';
import {v4 as uuidv4} from 'uuid';
import {MANUFACTURER} from './settings';
import {STATUS_KEY} from './constants';

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
  private module: Module;
  private status: CircuitStatusMessage;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    On: false,
    Brightness: 100,
  };

  constructor(
    private readonly platform: PentairPlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    this.module = accessory.context.module as Module;
    this.panel = accessory.context.panel as Panel;
    this.circuit = accessory.context.circuit as Circuit;
    this.status = accessory.context.status as CircuitStatusMessage;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.platform.Characteristic.Model, MODEL)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, `${this.panel.id}.${this.module.id}.${this.circuit.id}`);

    this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.circuit.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // TODO
    this.platform.log.info(`Setting ${this.circuit.name} to ${value}`);
    const command = {
      command: IntelliCenterRequestCommand.SetParamList,
      messageID: uuidv4(),
      objectList: [{
        objnam: this.circuit.id,
        params: {[STATUS_KEY]: value ? CircuitStatus.On : CircuitStatus.Off},
      } as CircuitStatusMessage],
    } as IntelliCenterRequest;
    this.platform.sendCommandNoWait(command);
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
    return this.accessory.context!.status!.params && this.accessory.context.status.params[STATUS_KEY] === CircuitStatus.On;
  }
}
