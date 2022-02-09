import {Body, Circuit, Color, Heater, Module, ObjectType, Panel} from './types';
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