# Athlete Prime Performance Dashboard

An interactive React dashboard to visualize athlete prime performance data across multiple sports leagues. The dashboard analyzes when athletes reach their performance primes, how long these primes last, and compares these patterns across different sports, leagues, and positions.

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Place your CSV data files in the `public/data` directory:

   - full_data.csv
   - pqi.csv
   - primes_raw.csv
   - primes_splines.csv

4. Start the development server:

```bash
npm start
```

## Dependencies

This project uses the following dependencies:

- React
- Recharts for visualizations
- Papaparse for CSV parsing
- Lodash for data manipulation
- Bootstrap for styling (optional)

peakPerformR-dashboard/
├── node_modules/
├── public/
│ ├── index.html
│ ├── data/ <-- This folder is critical
│ │ ├── full_data.csv
│ │ ├── pqi.csv
│ │ ├── primes_raw.csv
│ │ └── primes_splines.csv
│ └── ...
├── src/
│ ├── App.js
│ ├── index.js
│ ├── components/
│ ├── utils/
│ └── styles/
└── package.json
