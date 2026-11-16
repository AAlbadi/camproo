import React from 'react';
import { LeafletInteractiveMap, LeafletInteractiveMapProps, MapBounds, MapTileTheme } from './LeafletInteractiveMap';
import { GoogleInteractiveMapProps } from './GoogleInteractiveMap';

export type { MapBounds, MapTileTheme, LeafletInteractiveMapProps, GoogleInteractiveMapProps };

export const InteractiveMap: React.FC<LeafletInteractiveMapProps> = (props) => {
  return <LeafletInteractiveMap {...props} />;
};

export default InteractiveMap;
