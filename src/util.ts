import {Body, Circuit, IntelliCenterResponse, Module, Panel} from './types';
import {CIRCUITS_KEY, OBJ_ID_KEY, OBJ_LIST_KEY, OBJ_NAME_KEY, OBJ_SUBTYPE_KEY, OBJ_TYPE_KEY, PARAMS_KEY} from './constants';

enum ObjectType {
  Circuit = 'CIRCUIT',
  Module = 'MODULE',
  Panel = 'PANEL',
  Body = 'BODY'
}

const transformBodies = (circuits: never[]): ReadonlyArray<Body> => {
  if (!circuits) {
    return [];
  }
  return circuits.filter(featureObj => featureObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Body).map(bodyObj => {
    const params = bodyObj[PARAMS_KEY];
    return {
      id: bodyObj[OBJ_ID_KEY],
      name: params[OBJ_NAME_KEY],
      type: params[OBJ_SUBTYPE_KEY],
      highTemp: params['HITMP'],
      lowTemp: params['LOTMP'],
      heaterId: params['HTSRC'],
    } as Body;
  });
};

const transformFeatures = (circuits: never[]): ReadonlyArray<Circuit> => {
  if (!circuits) {
    return [];
  }
  return circuits.filter(featureObj => featureObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Circuit && featureObj[PARAMS_KEY]['FEATR'] === 'ON').map(featureObj => {
    const params = featureObj[PARAMS_KEY];
    return {
      id: featureObj[OBJ_ID_KEY],
      name: params[OBJ_NAME_KEY],
    } as Circuit;
  });
};

const transformModules = (modules: never[]): ReadonlyArray<Module> => {
  if (!modules) {
    return [];
  }
  return modules.filter(moduleObj => moduleObj[PARAMS_KEY][OBJ_TYPE_KEY] === ObjectType.Module).map(moduleObj => {
    const circuits = moduleObj[PARAMS_KEY][CIRCUITS_KEY];
    return {
      id: moduleObj[OBJ_ID_KEY],
      features: transformFeatures(circuits),
      bodies: transformBodies(circuits),
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