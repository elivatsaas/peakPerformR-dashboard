// dataLoader.js
import Papa from "papaparse";

// Unified path configuration
const CSV_PATHS = [
  process.env.PUBLIC_URL + "/data/", // GitHub Pages compatible path
  "/data/", // Local development fallback
  "data/", // Relative path fallback
];

// Enhanced path validator
const validateCSVPath = async (basePath) => {
  try {
    const testUrl = `${basePath}full_data.csv`;
    const response = await fetch(testUrl);

    // Check for valid response
    if (!response.ok) {
      console.debug(`Path ${basePath} invalid: HTTP ${response.status}`);
      return false;
    }

    // Verify content type
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/csv")) {
      console.debug(`Path ${basePath} invalid content type: ${contentType}`);
      return false;
    }

    // Quick content check
    const sampleText = (await response.text()).substring(0, 100);
    if (sampleText.includes("<html")) {
      console.debug(`Path ${basePath} returned HTML content`);
      return false;
    }

    return true;
  } catch (error) {
    console.debug(`Path ${basePath} validation failed:`, error.message);
    return false;
  }
};

// Core CSV loader with improved error handling
export const loadCSV = async (filePath) => {
  try {
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("text/csv")) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors?.length > 0) {
            console.warn(`CSV parse warnings for ${filePath}:`, results.errors);
          }
          resolve(results.data);
        },
        error: (error) =>
          reject(new Error(`CSV parse failed: ${error.message}`)),
      });
    });
  } catch (error) {
    throw new Error(`Failed to load ${filePath}: ${error.message}`);
  }
};

// Main data loader
export const loadAllData = async () => {
  try {
    console.log("Initializing data load...");

    // Find valid base path
    let basePath = null;
    for (const path of CSV_PATHS) {
      if (await validateCSVPath(path)) {
        basePath = path;
        break;
      }
    }

    if (!basePath) {
      throw new Error(
        "CSV files not found. Verify: \n" +
          "1. CSV files exist in public/data/ directory\n" +
          "2. Server configuration allows access to /data/ endpoints\n" +
          "3. Files have .csv extension and correct permissions"
      );
    }

    console.log(`Using base path: ${basePath}`);

    // Parallel loading for better performance
    const loaders = {
      fullData: loadCSV(`${basePath}full_data.csv`),
      pqiData: loadCSV(`${basePath}pqi.csv`),
      primesRawData: loadCSV(`${basePath}primes_raw.csv`),
      primesSplineData: loadCSV(`${basePath}primes_splines.csv`),
      playerPredictions: loadCSV(`${basePath}player_predictions.csv`),
      cqiData: loadCSV(`${basePath}cqi.csv`),
    };

    const results = await Promise.all(Object.values(loaders));

    // Map results to keys
    const data = Object.keys(loaders).reduce((acc, key, index) => {
      acc[key] = results[index];
      return acc;
    }, {});

    console.log("Data load complete. Summary:");
    Object.entries(data).forEach(([key, value]) => {
      console.log(`- ${key}: ${value.length} records`);
    });

    return data;
  } catch (error) {
    console.error("Data load critical error:", error);
    throw new Error(`Data initialization failed: ${error.message}`);
  }
};
