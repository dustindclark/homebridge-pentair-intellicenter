export enum IntelliCenterResponseStatus {
  Ok = '200'
}

export enum IntelliCenterRequestCommand {
  GetQuery = 'GetQuery',
  RequestParamList = 'RequestParamList',
  SetParamList = 'SetParamList'
}

export enum IntelliCenterResponseCommand {
  SendQuery = 'SendQuery',
  NotifyList = 'NotifyList',
  WriteParamList = 'WriteParamList'
}

export enum IntelliCenterQueryName {
  GetHardwareDefinition = 'GetHardwareDefinition',
}

type CircuitStatusSubscribeRequest = {
  objnam: string;
  keys: ReadonlyArray<string>;
};

export type CircuitStatusMessage = {
  objnam?: string;
  params?: never;
  changes?: ReadonlyArray<CircuitStatusMessage>;
};

type IntelliCenterMessage = {
  queryName?: IntelliCenterQueryName;
  messageID: string;
};

export type IntelliCenterRequest = {
  command: IntelliCenterRequestCommand;
  arguments?: string;
  objectList?: ReadonlyArray<CircuitStatusSubscribeRequest | CircuitStatusMessage>;
} & IntelliCenterMessage;

export type IntelliCenterResponse = {
  command: IntelliCenterResponseCommand;
  description: string;
  response: IntelliCenterResponseStatus;
  answer: never;
  objectList?: ReadonlyArray<CircuitStatusMessage>;
} & IntelliCenterMessage;

export enum CircuitType {
  IntelliBrite = 'INTELLI',
  Generic = 'GENERIC'
}

export enum BodyType {
  Pool = 'POOL',
  Spa = 'SPA',
}

export type BaseCircuit = {
  id: string;
};

export type Circuit = {
  id: string;
  name: string;
  objectType: ObjectType;
  type: CircuitType | BodyType;
  status?: CircuitStatus;
} & BaseCircuit;

export type Pump = {
  minRpm: number;
  maxRpm: number;
  minFlow: number;
  maxFlow: number;
  circuits?: ReadonlyArray<PumpCircuit>;
} & Circuit;

export type PumpCircuit = {
  id: string;
  pump: Pump;
  circuitId: string;
  speed: number;
  speedType: string;
} & BaseCircuit;

export enum CircuitStatus {
  On = 'ON',
  Off = 'OFF',
}

export enum PumpSpeedType {
  RPM= 'RPM',
  GPM = 'GPM',
}

export enum HeatMode {
  On = 2,
  Off = 1
}

export type Body = {
  temperature?: number;
  highTemperature?: number;
  lowTemperature?: number;
  heaterId?: string;
  heatMode?: HeatMode;
} & Circuit;

export type Heater = {
  bodyIds: ReadonlyArray<string>;
} & Circuit;

export type Module = {
  id: string;
  features: ReadonlyArray<Circuit>;
  bodies: ReadonlyArray<Body>;
  heaters: ReadonlyArray<Heater>;
};

export type Panel = {
  id: string;
  modules: ReadonlyArray<Module>;
  features: ReadonlyArray<Circuit>;
  pumps: ReadonlyArray<Pump>;
};

export enum ObjectType {
  Circuit = 'CIRCUIT',
  Module = 'MODULE',
  Panel = 'PANEL',
  Body = 'BODY',
  Heater = 'HEATER',
  CircuitGroup = 'CIRCGRP',
  Pump = 'PUMP',
  Sensor = 'SENSE',
}

export const CircuitTypes = new Set([ObjectType.Circuit, ObjectType.Body]) as ReadonlySet<ObjectType>;

export enum TemperatureUnits {
  C = 'C',
  F = 'F',
}

export class Color {
  public static readonly White = new Color( 'WHITER', 0, 0);
  public static readonly Red = new Color( 'REDR', 0, 100);
  public static readonly Green = new Color( 'GREENR', 120, 100);
  public static readonly Blue = new Color( 'BLUER', 240, 100);
  public static readonly Magenta = new Color( 'MAGNTAR', 300, 100);

  private constructor(
    public readonly intellicenterCode: string,
    public readonly hue: number,
    public readonly saturation: number) {
  }
}