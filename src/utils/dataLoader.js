import Papa from "papaparse";

// Helper to check if content is HTML
const isHtmlContent = (text) => {
  return (
    text.trim().toLowerCase().startsWith("<!doctype html") ||
    text.trim().toLowerCase().startsWith("<html")
  );
};

export const loadCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    console.log(`Attempting to load file: ${filePath}`);

    fetch(filePath)
      .then((response) => {
        if (!response.ok) {
          console.error(
            `File not accessible: ${filePath} (${response.status})`
          );
          reject(
            new Error(`File not accessible: ${filePath} (${response.status})`)
          );
          return null;
        }
        return response.text();
      })
      .then((text) => {
        if (!text) return;

        // Check if we got HTML instead of CSV data
        if (isHtmlContent(text)) {
          console.error(`Received HTML instead of CSV data for ${filePath}`);
          reject(
            new Error(
              `Received HTML instead of CSV data. The file '${filePath}' likely doesn't exist.`
            )
          );
          return;
        }

        console.log(
          `File content preview (${filePath}): ${text.substring(0, 100)}...`
        );

        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors && results.errors.length > 0) {
              console.warn(`Parse warnings for ${filePath}:`, results.errors);
            }

            console.log(
              `Successfully parsed ${filePath}: ${results.data.length} rows`
            );

            if (results.data.length > 0) {
              console.log(
                `First row sample: ${JSON.stringify(results.data[0])}`
              );
            }

            resolve(results.data);
          },
          error: (error) => {
            console.error(`Error parsing ${filePath}:`, error);
            reject(error);
          },
        });
      })
      .catch((error) => {
        console.error(`Error loading file ${filePath}:`, error);
        reject(error);
      });
  });
};

export const loadAllData = async () => {
  try {
    console.log("Starting data loading process...");

    // Define all possible paths to check in order of likelihood
    const pathsToTry = [
      "../../public/data/", // public/data/ in development
      "data/", // data/ in the root
      "/data/", // /data/ absolute path
      "./data/", // ./data/ relative path
      "../data/", // ../data/ up one directory
      "../../data/", // ../../data/ up two directories
      "/public/data/", // /public/data/ absolute
      "", // root directory
      "assets/data/", // assets/data/ common pattern
      "static/data/", // static/data/ common pattern
    ];

    // For each path, try the most important file first (full_data.csv)
    let workingPath = null;
    for (const path of pathsToTry) {
      try {
        console.log(`Trying path: ${path}`);
        const testResponse = await fetch(`${path}full_data.csv`);
        const text = await testResponse.text();

        // If we got HTML instead of CSV, this path doesn't work
        if (isHtmlContent(text)) {
          console.log(`Path ${path} returned HTML, not CSV`);
          continue;
        }

        // If we get here, we found a working path!
        console.log(`Found working path: ${path}`);
        workingPath = path;
        break;
      } catch (error) {
        console.log(`Path ${path} failed: ${error.message}`);
      }
    }

    if (!workingPath) {
      console.error("Could not find a working path for CSV files");
      throw new Error(
        "Could not locate your CSV files. Please ensure they exist and are accessible."
      );
    }

    console.log(`Using path: ${workingPath}`);

    // Now load all the data using the working path
    const fullData = await loadCSV(`${workingPath}full_data.csv`);
    const pqiData = await loadCSV(`${workingPath}pqi.csv`);
    const primesRawData = await loadCSV(`${workingPath}primes_raw.csv`);
    const primesSplineData = await loadCSV(`${workingPath}primes_splines.csv`);
    const playerPredictions = await loadCSV(
      `${workingPath}player_predictions.csv`
    );
    // New: Load CQI data
    const cqiData = await loadCSV(`${workingPath}cqi.csv`);

    console.log("All data loaded successfully!");
    console.log(`Data summary:
      - Full data: ${fullData.length} rows
      - PQI data: ${pqiData.length} rows
      - Primes raw data: ${primesRawData.length} rows
      - Primes spline data: ${primesSplineData.length} rows
      - Player predictions: ${playerPredictions.length} rows
      - CQI data: ${cqiData.length} rows
    `);

    return {
      fullData,
      pqiData,
      primesRawData,
      primesSplineData,
      playerPredictions,
      cqiData, // Add CQI data to returned object
    };
  } catch (error) {
    console.error("Error in loadAllData:", error);
    throw error;
  }
};
