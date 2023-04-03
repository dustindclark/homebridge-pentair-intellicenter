export const PARAMS_KEY = 'params';
export const OBJ_TYPE_KEY = 'OBJTYP';
export const OBJ_ID_KEY = 'objnam';
export const OBJ_NAME_KEY = 'SNAME';
export const OBJ_SUBTYPE_KEY = 'SUBTYP';
export const OBJ_LIST_KEY = 'OBJLIST';
export const OBJ_MIN_KEY = 'MIN';
export const OBJ_MAX_KEY = 'MAX';
export const OBJ_MIN_FLOW_KEY = 'MINF';
export const OBJ_MAX_FLOW_KEY = 'MAXF';
export const CIRCUITS_KEY = 'CIRCUITS';
export const STATUS_KEY = 'STATUS';
export const ACT_KEY = 'ACT';
export const LAST_TEMP_KEY = 'LSTTMP';
export const HEAT_SOURCE_KEY = 'HTSRC';
export const HEATER_KEY = 'HEATER';
export const MODE_KEY = 'MODE';
export const LOW_TEMP_KEY = 'LOTMP';
export const SPEED_KEY = 'SPEED';
export const SELECT_KEY = 'SELECT';
export const PARENT_KEY = 'PARENT';

export const THERMOSTAT_STEP_VALUE = 0.5;
export const NO_HEATER_ID = '00000';
export const DEFAULT_COLOR_TEMPERATURE = 140;
export const DEFAULT_BRIGHTNESS = 100;

export const CURRENT_TEMP_MIN_C = -100;
export const CURRENT_TEMP_MAX_C = 100;

export const DISCOVER_COMMANDS: ReadonlyArray<string> = ['CIRCUITS', 'PUMPS', 'CHEMS', 'VALVES', 'HEATERS', 'SENSORS', 'GROUPS'];
export const VARIABLE_SPEED_PUMP_SUBTYPES = new Set(['SPEED', 'VSF']) as ReadonlySet<string>;