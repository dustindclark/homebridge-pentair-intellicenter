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
  answer: never | never[];
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

export type Circuit = {
  id: string;
  name: string;
  objectType: ObjectType;
  type: CircuitType | BodyType;
};

export enum CircuitStatus {
  On = 'ON',
  Off = 'OFF',
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