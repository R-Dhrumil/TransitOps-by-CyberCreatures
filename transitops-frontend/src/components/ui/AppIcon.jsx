import React from 'react';

const ICON_PATHS = {
  alert: ['M12 9v4', 'M12 17h.01', 'M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  refresh: ['M21 2v6h-6', 'M3 22v-6h6', 'M20.49 9A9 9 0 0 0 5 5.5L3 8', 'M3.51 15A9 9 0 0 0 19 18.5L21 16'],
  bus: ['M8 6h8', 'M7 10h10', 'M7 14h10', 'M8 18h.01', 'M16 18h.01', 'M6 3h12a2 2 0 0 1 2 2v11H4V5a2 2 0 0 1 2-2Z', 'M6 16v3', 'M18 16v3'],
  dashboard: ['M3 3h8v8H3z', 'M13 3h8v5h-8z', 'M13 10h8v11h-8z', 'M3 13h8v8H3z'],
  vehicle: ['M3 13h18', 'M5 13V8l2-2h10l2 2v5', 'M7 17h.01', 'M17 17h.01', 'M6 17v2', 'M18 17v2'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  route: ['M6 19a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z', 'M18 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z', 'M8 17h4a2 2 0 0 0 2-2v-2a2 2 0 0 1 2-2h2'],
  maintenance: ['M14.7 6.3 17.7 3.3a2.1 2.1 0 0 1 3 3l-3 3-3-3Z', 'M13.3 7.7 4 17v3h3l9.3-9.3'],
  fuel: ['M7 18V5a2 2 0 0 1 2-2h3v15', 'M14 8h4l2 2v8a2 2 0 0 1-2 2h-4', 'M7 18h7'],
  reports: ['M4 19V5', 'M10 19V9', 'M16 19V13', 'M22 19V3'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  arrowRight: ['M5 12h14', 'm13-7 7 7-7 7'],
  arrowLeft: ['M19 12H5', 'm11-7-7 7 7 7'],
  check: ['M20 6 9 17l-5-5'],
  checkCircle: ['M22 11.08V12a10 10 0 1 1-5.93-9.14', 'm9 3-9 9-3-3'],
  xCircle: ['M15 9 9 15', 'M9 9l6 6', 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z'],
  bolt: ['m13 2-8 10h6l-1 10 8-10h-6l1-10Z'],
  clock: ['M12 6v6l4 2', 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z'],
  moon: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z'],
  sun: ['M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z', 'M12 1v2', 'M12 21v2', 'M4.22 4.22l1.42 1.42', 'M18.36 18.36l1.42 1.42', 'M1 12h2', 'M21 12h2', 'M4.22 19.78l1.42-1.42', 'M18.36 5.64l1.42-1.42'],
  userCheck: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'm16 11 2 2 4-4'],
  userX: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'm17 8 4 4', 'm21 8-4 4'],
  building: ['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 11h.01', 'M15 11h.01', 'M9 15h.01', 'M15 15h.01'],
  trend: ['M3 17l6-6 4 4 8-8'],
  dollar: ['M12 2v20', 'M17 6c0-2.2-2.2-4-5-4s-5 1.8-5 4 2.2 4 5 4 5 1.8 5 4-2.2 4-5 4-5-1.8-5-4'],
  rocket: ['M4.5 16.5 3 21l4.5-1.5', 'M14 10 5 19', 'M15 9 6 18', 'M12 3a13 13 0 0 1 9 9l-6 6a13 13 0 0 1-9-9Z'],
  factory: ['M2 21h20', 'M5 21V11l6-3v3l6-3v13', 'M9 21v-4', 'M13 21v-4', 'M17 21v-4'],
  download: ['M12 3v12', 'm7-5-7 7-7-7', 'M5 21h14'],
  filter: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z'],
};

const AppIcon = ({ name, size = 18, className = '', strokeWidth = 1.8 }) => {
  const paths = ICON_PATHS[name] || ICON_PATHS.alert;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
};

export default AppIcon;