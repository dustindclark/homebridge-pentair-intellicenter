import {API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {CircuitAccessory} from './circuitAccessory';
import Telnet, {SendOptions} from 'telnet-client';
import {
  Body,
  Circuit, CircuitStatusMessage,
  CircuitTypes,
  Heater,
  IntelliCenterQueryName,
  IntelliCenterRequest,
  IntelliCenterRequestCommand,
  IntelliCenterResponse,
  IntelliCenterResponseCommand,
  Module,
  ObjectType,
  Panel,
  TemperatureUnits,
} from './types';
import {v4 as uuidv4} from 'uuid';
import {transformPanels, updateBody} from './util';
import {HEAT_SOURCE_KEY, HEATER_KEY, LAST_TEMP_KEY, MODE_KEY, STATUS_KEY} from './constants';
import {HeaterAccessory} from './heaterAccessory';

type PentairConfig = {
  ipAddress: string;
  username: string;
  password: string;
  maxBufferSize: number;
  temperatureUnits: TemperatureUnits;
  minimumTemperature: number;
  maximumTemperature: number;

} & PlatformConfig;

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class PentairPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessoryMap: Map<string, PlatformAccessory> = new Map();
  public readonly heaters: Map<string, PlatformAccessory> = new Map();

  private readonly connection: Telnet;
  private readonly maxBufferSize: number;
  private buffer = '';

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this.connection = new Telnet();
    this.setupSocketEventHandlers();
    const co = this.getConfig();
    this.maxBufferSize = co.maxBufferSize || 1048576; // Default to 1MB

    if (!co.ipAddress) {
      this.log.error('IP address is not configured. Cannot connect to Intellicenter');
      return;
    }

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {
      await this.connectToIntellicenter();
      try {
        await this.discoverDevices();
      } catch (error) {
        this.log.error('IntelliCenter device discovery failed.', error);
      }
    });
  }

  async connectToIntellicenter() {
    const co = this.getConfig();
    const telnetParams = {
      host: co.ipAddress,
      port: 6681, //doesn't look like there's any reason to make configurable.
      negotiationMandatory: false,
      timeout: 1500,
      debug: true,
      username: co.username,
      password: co.password,
    };
    try {
      await this.connection.connect(telnetParams);
    } catch (error) {
      this.log.error(`Connection to IntelliCenter failed. Check config: ${this.json(telnetParams)}`, error);
    }
  }

  setupSocketEventHandlers() {
    this.connection.on('data', async (chunk) => {
      if (chunk.length > 0 && chunk[chunk.length - 1] === 10) {
        const bufferedData = this.buffer + chunk;
        this.buffer = '';
        const lines = bufferedData.split(/\n/);
        for (const line of lines) {
          try {
            if (line) {
              const response = JSON.parse(line) as IntelliCenterResponse;
              await this.handleUpdate(response);
            }
          } catch (error) {
            this.log.error(`Failed to parse line in response from IntelliCenter. Response will not be handled: ${line}`, error);
          }
        }
      } else if (this.buffer.length > this.maxBufferSize) {
        this.log.error(`Exceeded max buffer size ${this.maxBufferSize} without a newline. Discarding buffer.`);
        this.buffer = '';
      } else {
        this.log.debug('Received incomplete data in data handler.');
        this.buffer += chunk;
      }
    });

    this.connection.on('connect', () => {
      this.log.debug('IntelliCenter socket connection has been established.');
    });

    this.connection.on('ready', () => {
      this.log.debug('IntelliCenter socket connection is ready.');
    });

    this.connection.on('failedlogin', (data) => {
      this.log.error(`IntelliCenter login failed. Check configured username/password. ${data}`);
    });

    this.connection.on('close', () => {
      this.log.error('IntelliCenter socket has been closed. Check for error in logs above.');
    });

    this.connection.on('error', (data) => {
      this.log.error(`IntelliCenter socket error has been detected. Socket will be closed. ${data}`);
    });

    this.connection.on('end', (data) => {
      this.log.error(`IntelliCenter socket connection has ended. ${data}`);
    });

    this.connection.on('responseready', (data) => {
      this.log.error(`IntelliCenter responseready. ${data}`);
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessoryMap.set(accessory.UUID, accessory);
    if (accessory.context.heater) {
      this.heaters.set(accessory.UUID, accessory.context.heater);
    }
  }

  async handleUpdate(response: IntelliCenterResponse) {
    this.log.debug(`Handling IntelliCenter ${response.response} response to` +
      `${response.command}.${response.queryName} for message ID ${response.messageID}`);
    if (response.command === IntelliCenterResponseCommand.NotifyList || response.command === IntelliCenterResponseCommand.WriteParamList) {
      if (!response.objectList) {
        this.log.error('Object list missing in NotifyList response.');
        return;
      }
      response.objectList.forEach((objListResponse) => {
        const changes = (objListResponse.changes || [objListResponse]) as ReadonlyArray<CircuitStatusMessage>;
        changes.forEach((change) => {
          if (change.objnam && change.params) {
            const uuid = this.api.hap.uuid.generate(change.objnam);
            const existingAccessory = this.accessoryMap.get(uuid);
            if (existingAccessory) {
              existingAccessory.context.status = change;

              if (CircuitTypes.has(existingAccessory.context.circuit.objectType)) {
                this.updateCircuit(existingAccessory, change.params);
              }
            }
          }
        });
      });

    } else {
      this.log.debug(`Unhandled command in handleUpdate: ${this.json(response)}`);
    }
  }

  updateCircuit(accessory: PlatformAccessory, params: never) {
    if (accessory.context.circuit.objectType === ObjectType.Body) {
      const body = accessory.context.circuit as Body;
      updateBody(body, params);
      this.updateHeaterStatuses(body);
    }
    this.api.updatePlatformAccessories([accessory]);
    new CircuitAccessory(this, accessory);
  }

  updateHeaterStatuses(body: Body) {
    this.heaters.forEach(((heaterAccessory) => {
      if (heaterAccessory.context.body.id === body.id) {
        heaterAccessory.context.body = body;
        this.api.updatePlatformAccessories([heaterAccessory]);
        new HeaterAccessory(this, heaterAccessory);
      }
    }));
  }


  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    const command = {
      command: IntelliCenterRequestCommand.GetQuery,
      queryName: IntelliCenterQueryName.GetHardwareDefinition,
      arguments: '',
      messageID: uuidv4(),
    } as IntelliCenterRequest;
    let response;
    try {
      response = await this.sendCommand(command);
    } catch (error) {
      this.log.error(`Failed to send command to IntelliCenter: ${this.json(command)}`, error);
      return;
    }
    const panels = transformPanels(response);
    this.log.debug(`Transformed panels from IntelliCenter: ${this.json(panels)}`);

    const bodyIdMap = new Map<string, Body>();
    let heaters = [] as ReadonlyArray<Heater>;
    for (const panel of panels) {
      for (const module of panel.modules) {
        for (const body of module.bodies) {
          this.discoverCircuit(panel, module, body);
          this.subscribeForUpdates(body, [STATUS_KEY, LAST_TEMP_KEY, HEAT_SOURCE_KEY, HEATER_KEY, MODE_KEY]);
          bodyIdMap.set(body.id, body);
        }
        for (const feature of module.features) {
          this.discoverCircuit(panel, module, feature);
          this.subscribeForUpdates(feature, [STATUS_KEY]);
        }
        heaters = heaters.concat(module.heaters);
      }
    }
    for (const heater of heaters) {
      this.discoverHeater(heater, bodyIdMap);
    }
  }

  discoverHeater(heater: Heater, bodyMap: ReadonlyMap<string, Body>) {
    heater.bodyIds.forEach((bodyId) => {
      const body = bodyMap.get(bodyId);

      if (body) {
        const uuid = this.api.hap.uuid.generate(`${heater.id}.${bodyId}`);

        let accessory = this.accessoryMap.get(uuid);
        const name = `${body.name} ${heater.name}`;
        if (accessory) {
          this.log.debug(`Restoring existing heater from cache: ${accessory.displayName}`);
          accessory.context.body = body;
          accessory.context.heater = heater;
          this.api.updatePlatformAccessories([accessory]);
          new HeaterAccessory(this, accessory);
        } else {
          this.log.debug(`Adding new heater: ${heater.name}`);
          accessory = new this.api.platformAccessory(name, uuid);
          accessory.context.body = body;
          accessory.context.heater = heater;
          new HeaterAccessory(this, accessory);
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
        this.heaters.set(uuid, accessory);
      } else {
        this.log.error(`Body not in bodyMap for ID ${bodyId}. Map: ${this.json(bodyMap)}`);
      }
    });
  }

  discoverCircuit(panel: Panel, module: Module, circuit: Circuit) {
    const uuid = this.api.hap.uuid.generate(circuit.id);

    const existingAccessory = this.accessoryMap.get(uuid);

    if (existingAccessory) {
      this.log.debug(`Restoring existing circuit from cache: ${existingAccessory.displayName}`);
      existingAccessory.context.circuit = circuit;
      existingAccessory.context.module = module;
      existingAccessory.context.panel = panel;
      this.api.updatePlatformAccessories([existingAccessory]);
      new CircuitAccessory(this, existingAccessory);
    } else {
      this.log.debug(`Adding new circuit: ${circuit.name}`);
      const accessory = new this.api.platformAccessory(circuit.name, uuid);
      accessory.context.circuit = circuit;
      accessory.context.module = module;
      accessory.context.panel = panel;
      new CircuitAccessory(this, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }

  subscribeForUpdates(circuit: Circuit, keys: ReadonlyArray<string>) {
    const command = {
      command: IntelliCenterRequestCommand.RequestParamList,
      messageID: uuidv4(),
      objectList: [
        {
          objnam: circuit.id,
          keys: keys,
        },
      ],
    } as IntelliCenterRequest;
    // No need to await. We'll handle in the update handler.
    this.sendCommandNoWait(command);
  }

  getConfig(): PentairConfig {
    return this.config as PentairConfig;
  }

  json(data) {
    return JSON.stringify(data, null, 2);
  }

  async sendCommand(command: IntelliCenterRequest): Promise<IntelliCenterResponse> {
    const commandString = JSON.stringify(command);
    this.log.debug(`Sending command to IntelliCenter: ${commandString}`);
    const options = {
      waitFor: command.messageID,
    } as SendOptions;
    const result = await this.connection.send(commandString, options);
    this.log.debug(`Command sent successfully. Result: ${result}`);
    // hack. Sometimes responses include other data.
    const lines = result.split(/\n/);
    for (const line of lines) {
      if (line) {
        try {
          const response = JSON.parse(line) as IntelliCenterResponse;
          if (response.messageID === command.messageID) {
            return response;
          }
        } catch (error) {
          this.log.error(`Caught unexpected error parsing result line: ${line}`, error);
        }
      }
    }
    throw new Error(`Received response without correct message ID from IntelliCenter: ${result}`);
  }

  sendCommandNoWait(command: IntelliCenterRequest): void {
    const commandString = JSON.stringify(command);
    this.log.debug(`Sending fire and forget command to IntelliCenter: ${commandString}`);
    this.connection.send(commandString);
  }
}
