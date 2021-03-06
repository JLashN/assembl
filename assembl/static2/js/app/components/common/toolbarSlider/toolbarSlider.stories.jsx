// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { color, number, withKnobs } from '@storybook/addon-knobs';
/* eslint-enable */

import ToolbarSlider from './toolbarSlider';

export const defaultToolbarSliderProps = {
  defaultValue: 50,
  onSliderChange: action('onSliderChange')
};

const playground = {
  color: '#000',
  defaultValue: 30,
  maxValue: 90,
  minValue: 0,
  onSliderChange: action('onSliderChange')
};

storiesOf('Semantic Analysis|ToolbarSlider', module)
  .addDecorator(withKnobs)
  .add('default', () => (
    <ToolbarSlider
      defaultValue={defaultToolbarSliderProps.defaultValue}
      onSliderChange={defaultToolbarSliderProps.onSliderChange}
    />
  ))
  .add('playground', () => (
    <ToolbarSlider
      color={color('color', playground.color)}
      defaultValue={number('defaultValue', playground.defaultValue)}
      maxValue={number('maxValue', playground.maxValue)}
      minValue={number('minValue', playground.minValue)}
      onSliderChange={playground.onSliderChange}
    />
  ));