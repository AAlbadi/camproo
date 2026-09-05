import React from 'react';
import { GoogleInteractiveMap, GoogleInteractiveMapProps } from './GoogleInteractiveMap';
import { MapBounds, MapTileTheme, LeafletInteractiveMapProps } from './LeafletInteractiveMap';

export type { MapBounds, MapTileTheme, LeafletInteractiveMapProps, GoogleInteractiveMapProps };

export const InteractiveMap: React.FC<GoogleInteractiveMapProps> = (props) => {
  return <GoogleInteractiveMap {...props} />;
};

export default InteractiveMap;
