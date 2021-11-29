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
}

export enum IntelliCenterQueryName {
  GetHardwareDefinition = 'GetHardwareDefinition',
}

type CircuitStatusSubscribeRequest = {
  objnam: string;
  keys: ReadonlyArray<string>;
};

export type CircuitStatusMessage = {
  objnam: string;
  params: never;
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

export type Circuit = {
  id: string;
  name: string;
};

export enum CircuitStatus {
  On = 'ON',
  Off = 'OFF'
}

export enum BodyType {
  Pool = 'POOL',
  Spa = 'SPA',
}

export type Body = {
  id: string;
  name: string;
  type: BodyType;
  highTemp: number;
  lowTemp: number;
  heaterId?: string;
};

export type Module = {
  id: string;
  features: ReadonlyArray<Circuit>;
  bodies: ReadonlyArray<Body>;
};

export type Panel = {
  id: string;
  modules: ReadonlyArray<Module>;
};