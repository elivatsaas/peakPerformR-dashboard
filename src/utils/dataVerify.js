export const verifyDataStructure = (data) => {
  if (!data) {
    console.error("Data is null or undefined");
    return false;
  }

  const { fullData, pqiData, primesRawData, primesSplineData, cqiData } = data;
  let isValid = true;

  // Check if all datasets exist
  if (!fullData) {
    console.error("fullData is missing");
    isValid = false;
  }

  if (!pqiData) {
    console.error("pqiData is missing");
    isValid = false;
  }

  if (!primesRawData) {
    console.error("primesRawData is missing");
    isValid = false;
  }

  if (!primesSplineData) {
    console.error("primesSplineData is missing");
    isValid = false;
  }

  // Check for CQI data
  if (!cqiData) {
    console.error("cqiData is missing");
    isValid = false;
  }

  // Check if datasets have data
  if (fullData && fullData.length === 0) {
    console.error("fullData is empty");
    isValid = false;
  }

  if (pqiData && pqiData.length === 0) {
    console.error("pqiData is empty");
    isValid = false;
  }

  if (primesRawData && primesRawData.length === 0) {
    console.error("primesRawData is empty");
    isValid = false;
  }

  if (primesSplineData && primesSplineData.length === 0) {
    console.error("primesSplineData is empty");
    isValid = false;
  }

  if (cqiData && cqiData.length === 0) {
    console.error("cqiData is empty");
    isValid = false;
  }

  // Check for required fields in samples
  if (fullData && fullData.length > 0) {
    const requiredFields = [
      "id",
      "player_name",
      "league",
      "position",
      "value",
      "in_prime",
      "is_peak_age",
      "age",
    ];
    const missingFields = requiredFields.filter(
      (field) => fullData[0][field] === undefined
    );

    if (missingFields.length > 0) {
      console.error(
        `fullData is missing required fields: ${missingFields.join(", ")}`
      );
      console.log("Available fields:", Object.keys(fullData[0]).join(", "));
      isValid = false;
    }
  }

  if (pqiData && pqiData.length > 0) {
    const requiredFields = [
      "id",
      "player_name",
      "league",
      "position",
      "pqi_selected",
      "selected_tier",
    ];
    const missingFields = requiredFields.filter(
      (field) => pqiData[0][field] === undefined
    );

    if (missingFields.length > 0) {
      console.error(
        `pqiData is missing required fields: ${missingFields.join(", ")}`
      );
      console.log("Available fields:", Object.keys(pqiData[0]).join(", "));
      isValid = false;
    }
  }

  // Check CQI data fields
  if (cqiData && cqiData.length > 0) {
    const requiredFields = [
      "id",
      "player_name",
      "league",
      "position",
      "cqi_selected",
      "selected_tier",
    ];
    const missingFields = requiredFields.filter(
      (field) => cqiData[0][field] === undefined
    );

    if (missingFields.length > 0) {
      console.error(
        `cqiData is missing required fields: ${missingFields.join(", ")}`
      );
      console.log("Available fields:", Object.keys(cqiData[0]).join(", "));
      isValid = false;
    }
  }

  // Check for data integrity - make sure ids match between datasets
  if (pqiData && pqiData.length > 0 && fullData && fullData.length > 0) {
    const pqiIds = new Set(pqiData.map((item) => item.id));
    const fullDataIds = new Set(fullData.map((item) => item.id));

    if (pqiIds.size === 0) {
      console.error("pqiData contains no valid IDs");
      isValid = false;
    }

    if (fullDataIds.size === 0) {
      console.error("fullData contains no valid IDs");
      isValid = false;
    }

    // Check for at least some overlap
    let hasOverlap = false;
    for (const id of pqiIds) {
      if (fullDataIds.has(id)) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      console.error(
        "No overlap between pqiData and fullData IDs - they appear to be completely different datasets"
      );
      isValid = false;
    }
  }

  // Check CQI data integrity
  if (cqiData && cqiData.length > 0 && pqiData && pqiData.length > 0) {
    const cqiIds = new Set(cqiData.map((item) => item.id));
    const pqiIds = new Set(pqiData.map((item) => item.id));

    if (cqiIds.size === 0) {
      console.error("cqiData contains no valid IDs");
      isValid = false;
    }

    // Check for at least some overlap between CQI and PQI
    let hasOverlap = false;
    for (const id of cqiIds) {
      if (pqiIds.has(id)) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      console.error(
        "No overlap between cqiData and pqiData IDs - they appear to be completely different datasets"
      );
      isValid = false;
    }
  }

  return isValid;
};
