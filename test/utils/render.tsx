import React from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions,
) => render(ui, options);

export * from '@testing-library/react-native';
