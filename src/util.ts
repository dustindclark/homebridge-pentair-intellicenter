import {Body, Circuit, Color, Heater, Module, ObjectType, Panel, Pump} from './types';
import {
  CIRCUITS_KEY,
  LAST_TEMP_KEY,
  OBJ_ID_KEY,
  OBJ_LIST_KEY, OBJ_MAX_FLOW_KEY,
  OBJ_MAX_KEY, OBJ_MIN_FLOW_KEY,
  OBJ_MIN_KEY,
  OBJ_NAME_KEY,
  OBJ_SUBTYPE_KEY,
  OBJ_TYPE_KEY,
  PARAMS_KEY,
  SELECT_KEY,
  SPEED_KEY,
  VARIABLE_SPEED_PUMP_SUBTYPES,
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

const circuitParams = new Map([
  ['status', 'STATUS'],
]) as ReadonlyMap<string, string>;

const bodyParams = new Map([
  ['temperature', LAST_TEMP_KEY],
  ['highTemperature', 'HITMP'],
  ['lowTemperature', 'LOTMP'],
  ['heaterId', 'HTSRC'],
  ['heatMode', 'HTMOD'],
  ['heatMode', 'MODE'],
]) as ReadonlyMap<string, string>;

const pumpParams = new Map([
  ['speedType', SELECT_KEY],
  ['speed', SPEED_KEY],
]) as ReadonlyMap<string, string>;

export const updateCircuit = (circuit: Body, params: never): void => {
  circuitParams.forEach((value, key) => {
    if (params[value]) {
      circuit[key] = params[value];
    }
  });
};

export const updateBody = (body: Body, params: never): void => {
  bodyParams.forEach((value, key) => {
    if (params[value]) {
      body[key] = params[value];
    }
  });
};

export const updatePump = (pump: Pump, params: never): void => {
  pumpParams.forEach((value, key) => {
    if (params[value]) {
      pump[key] = params[value];
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
    return featureObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Circuit && featureObj[PARAMS_KEY]['FEATR'] === 'ON'
      && (featureObj[PARAMS_KEY][OBJ_SUBTYPE_KEY] as string)?.toUpperCase() !== 'LEGACY';
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

const transformPumps = (pumps: never[]): ReadonlyArray<Pump> => {
  if (!pumps) {
    return [];
  }
  return pumps.filter(pumpObj => {
    return pumpObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Pump
      && VARIABLE_SPEED_PUMP_SUBTYPES.has((pumpObj[PARAMS_KEY][OBJ_SUBTYPE_KEY] as string)?.toUpperCase());
  }).map(pumpObj => {
    const params = pumpObj[PARAMS_KEY];
    const objList = params[OBJ_LIST_KEY];
    const pumpSubObj = objList[0];
    return {
      id: pumpSubObj[OBJ_ID_KEY],
      parentId: pumpObj[OBJ_ID_KEY],
      name: params[OBJ_NAME_KEY],
      objectType: ObjectType.Pump,
      type: (params[OBJ_SUBTYPE_KEY] as string)?.toUpperCase(),
      minRpm: +params[OBJ_MIN_KEY],
      maxRpm: +params[OBJ_MAX_KEY],
      minFlow: +params[OBJ_MIN_FLOW_KEY],
      maxFlow: +params[OBJ_MAX_FLOW_KEY],
      speed: +pumpSubObj[PARAMS_KEY][SPEED_KEY],
      speedType: (pumpSubObj[PARAMS_KEY][SELECT_KEY] as string)?.toUpperCase(),
    } as Pump;
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

export const transformPanels = (response: never | never[]): ReadonlyArray<Panel> => {
  return response.filter(moduleObj => moduleObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Panel).map(panelObj => {
    const objList = panelObj[PARAMS_KEY][OBJ_LIST_KEY];
    return {
      id: panelObj[OBJ_ID_KEY],
      modules: transformModules(objList),
      features: transformFeatures(objList), // Some features are directly on panel.
      pumps: transformPumps(objList),
    } as Panel;
  });
};

export const fahrenheitToCelsius = (fValue: number): number => {
  return (fValue - 32) / 1.8;
};

export const celsiusToFahrenheit = (cValue: number): number => {
  return cValue * 1.8 + 32;
};

export const getIntelliBriteColor = (hue: number, saturation: number): Color => {
  let color = Color.White;
  // All other IntelliBrite colors have a saturation of 100.
  if (saturation > ((Color.Red.saturation - Color.White.saturation) / 2)) {
    if (hue < ((Color.Green.hue - Color.Red.hue) / 2 + Color.Red.hue)) {
      color = Color.Red;
    } else if (hue < ((Color.Blue.hue - Color.Green.hue) / 2 + Color.Green.hue)) {
      color = Color.Green;
    } else if (hue < ((Color.Magenta.hue - Color.Blue.hue) / 2 + Color.Blue.hue)) {
      color = Color.Blue;
    } else {
      color = Color.Magenta;
    }
  }
  return color;
};

export const isObject = (object: Record<string, unknown>) => {
  if (typeof object === 'object') {
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        return true;
      }
    }
  }
  return false;
};

export const mergeResponseArray = (target: never[], responseToAdd: never[]): void => {
  responseToAdd.forEach((itemToAdd) => {
    const targetObject = target.find(targetItem => targetItem[OBJ_ID_KEY] === itemToAdd[OBJ_ID_KEY]);
    if (targetObject) {
      mergeResponse(targetObject, itemToAdd);
    } else {
      target.push(itemToAdd);
    }
  });
};

export const mergeResponse = (target: never | never[], responseToAdd: never): void => {
  for (const key in responseToAdd as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(responseToAdd, key)) {
      if (target[key] && isObject(target[key]) && isObject(responseToAdd[key])) {
        if (Array.isArray(target[key]) && Array.isArray(responseToAdd[key])) {
          mergeResponseArray(target[key], responseToAdd[key]);
        } else {
          mergeResponse(target[key], responseToAdd[key]);
        }
      } else {
        target[key] = responseToAdd[key];
      }
    }
  }
};