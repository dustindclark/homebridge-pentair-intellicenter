import {getIntelliBriteColor} from '../src/util';
import {Color} from '../src/types';
import {transformPanels} from '../src/util';
import {mergeResponse} from '../src/util';

import beforeTransform from './resources/beforeTransform.json';
import afterTransform from './resources/afterTransform.json';

import chemResponse from './resources/chemResponse.json';
import circuitResponse from './resources/circuitResponse.json';
import groupResponse from './resources/groupResponse.json';
import heaterResponse from './resources/heaterResponse.json';
import pumpResponse from './resources/pumpResponse.json';
import sensorResponse from './resources/sensorResponse.json';
import valveResponse from './resources/valveResponse.json';
import mergeResult from './resources/mergeResult.json';


describe('Test IntellBrite Colors', () => {
  it('Test White', () => {
    expect(getIntelliBriteColor(0, 0)).toEqual(Color.White);
    expect(getIntelliBriteColor(100, 49)).toEqual(Color.White);
    expect(getIntelliBriteColor(300, 49)).toEqual(Color.White);
  });
  it('Test Red', () => {
    expect(getIntelliBriteColor(0, 100)).toEqual(Color.Red);
    expect(getIntelliBriteColor(59, 51)).toEqual(Color.Red);
    expect(getIntelliBriteColor(0, 100)).toEqual(Color.Red);
  });
  it('Test Green', () => {
    expect(getIntelliBriteColor(120, 100)).toEqual(Color.Green);
    expect(getIntelliBriteColor(60, 100)).toEqual(Color.Green);
    expect(getIntelliBriteColor(179, 100)).toEqual(Color.Green);
  });
  it('Test Blue', () => {
    expect(getIntelliBriteColor(240, 100)).toEqual(Color.Blue);
    expect(getIntelliBriteColor(180, 100)).toEqual(Color.Blue);
    expect(getIntelliBriteColor(269, 100)).toEqual(Color.Blue);
  });
  it('Test Magenta', () => {
    expect(getIntelliBriteColor(300, 100)).toEqual(Color.Magenta);
    expect(getIntelliBriteColor(270, 100)).toEqual(Color.Magenta);
    expect(getIntelliBriteColor(400, 100)).toEqual(Color.Magenta);
  });
});

describe('Test transform panels', () => {
  it('Test transform', () => {
    expect(transformPanels(beforeTransform as never)).toEqual(afterTransform);
  });
});

describe('Test merge response', () => {
  it('Test merge', () => {
    const response = Object.assign([], circuitResponse as never);
    //mergeResponse(response, pumpResponse as never);
    //mergeResponse(response, chemResponse as never);
    //mergeResponse(response, valveResponse as never);
    mergeResponse(response, heaterResponse as never);
    //mergeResponse(response, sensorResponse as never);
    //mergeResponse(response, groupResponse as never);
    expect(response).toEqual(mergeResult);
  });
});