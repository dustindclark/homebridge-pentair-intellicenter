import {Body, Circuit, Heater, IntelliCenterResponse, Module, ObjectType, Panel} from './types';
import {
  CIRCUITS_KEY,
  LAST_TEMP_KEY,
  OBJ_ID_KEY,
  OBJ_LIST_KEY,
  OBJ_NAME_KEY,
  OBJ_SUBTYPE_KEY,
  OBJ_TYPE_KEY,
  PARAMS_KEY,
} from './constants';

const transformHeaters = (heaters: never[]): ReadonlyArray<Heater> => {
  if (!heaters) {
    return [];
  }
  return heaters.filter(featureObj => featureObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Heater).map(heaterObj => {
    const params = heaterObj[PARAMS_KEY];
    return {
      id: heaterObj[OBJ_ID_KEY],
      name: params[OBJ_NAME_KEY],
      objectType: ObjectType.Heater,
      type: (params[OBJ_SUBTYPE_KEY] as string)?.toUpperCase(),
      bodyIds: (params[ObjectType.Body] as string)?.split(' ') || [],
    } as Heater;
  });
};

const bodyParams = new Map([
  ['temperature', LAST_TEMP_KEY],
  ['highTemperature', 'HITMP'],
  ['lowTemperature', 'LOTMP'],
  ['heaterId', 'HTSRC'],
  ['heatMode', 'HTMOD'],
  ['heatMode', 'MODE'],
]) as ReadonlyMap<string, string>;

export const updateBody = (body: Body, params: never): void => {
  bodyParams.forEach((value, key) => {
    if (params[value]) {
      body[key] = params[value];
    }
  });
};

const transformBodies = (circuits: never[]): ReadonlyArray<Body> => {
  if (!circuits) {
    return [];
  }
  return circuits.filter(featureObj => featureObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Body).map(bodyObj => {
    const params = bodyObj[PARAMS_KEY];
    const body = {
      id: bodyObj[OBJ_ID_KEY],
      name: params[OBJ_NAME_KEY],
      objectType: ObjectType.Body,
      type: (params[OBJ_SUBTYPE_KEY] as string)?.toUpperCase(),
    } as Body;
    updateBody(body, params);
    return body;
  });
};

const transformFeatures = (circuits: never[]): ReadonlyArray<Circuit> => {
  if (!circuits) {
    return [];
  }
  return circuits.filter(featureObj => {
    return featureObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Circuit && featureObj[PARAMS_KEY]['FEATR'] === 'ON';
  }).map(featureObj => {
    const params = featureObj[PARAMS_KEY];
    return {
      id: featureObj[OBJ_ID_KEY],
      name: params[OBJ_NAME_KEY],
      objectType: ObjectType.Circuit,
      type: (params[OBJ_SUBTYPE_KEY] as string)?.toUpperCase(),
    } as Circuit;
  });
};

const transformModules = (modules: never[]): ReadonlyArray<Module> => {
  if (!modules) {
    return [];
  }
  return modules.filter(moduleObj => moduleObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Module).map(moduleObj => {
    const params = moduleObj[PARAMS_KEY];
    const circuits = params[CIRCUITS_KEY];
    return {
      id: moduleObj[OBJ_ID_KEY],
      features: transformFeatures(circuits),
      bodies: transformBodies(circuits),
      heaters: transformHeaters(circuits),
      type: (params[OBJ_SUBTYPE_KEY] as string)?.toUpperCase(),
    } as Module;
  });
};

export const transformPanels = (response: IntelliCenterResponse): ReadonlyArray<Panel> => {
  return response.answer.filter(moduleObj => moduleObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Panel).map(panelObj => {
    return {
      id: panelObj[OBJ_ID_KEY],
      modules: transformModules(panelObj[PARAMS_KEY][OBJ_LIST_KEY]),
    } as Panel;
  });
};

export const fahrenheitToCelsius = (fValue: number): number => {
  return (fValue - 32) / 1.8;
};

export const celsiusToFahrenheit = (cValue: number): number => {
  return cValue * 1.8 + 32;
};