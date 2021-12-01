import {getIntelliBriteColor} from '../src/util';
import {Color} from '../dist/types';

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