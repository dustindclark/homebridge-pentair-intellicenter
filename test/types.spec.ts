import {Color} from '../dist/types';

describe('Test Colors', () => {
  it('Red', () => {
    expect(Color.Red.hue).toEqual(0);
    expect(Color.Red.saturation).toEqual(100);
  });
  it('Magenta', () => {
    expect(Color.Magenta.hue).toEqual(300);
    expect(Color.Magenta.saturation).toEqual(100);
  });
});