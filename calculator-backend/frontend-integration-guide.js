// Change this value if your backend runs on a different host or port.
const CALCULATOR_API_URL = "http://localhost:5000/api";

async function readApiResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}.`);
  }

  return data;
}

// Returns: { success: true, result: number, id: number }
async function calculateOnServer(num1, num2, operator) {
  const response = await fetch(`${CALCULATOR_API_URL}/calculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ num1, num2, operator }),
  });

  return readApiResponse(response);
}

// Returns an array containing the latest 20 calculations.
async function fetchCalculationHistory() {
  const response = await fetch(`${CALCULATOR_API_URL}/history`);
  return readApiResponse(response);
}

// Returns: { success: true, message: string, deletedCount: number }
async function clearCalculationHistory() {
  const response = await fetch(`${CALCULATOR_API_URL}/history`, {
    method: "DELETE",
  });

  return readApiResponse(response);
}

/*
Example usage inside your existing frontend:

try {
  const calculation = await calculateOnServer(12.5, 2, "*");
  document.querySelector("#screen").value = calculation.result;

  const history = await fetchCalculationHistory();
  console.log(history);

  // Call this from your clear-history button handler:
  // await clearCalculationHistory();
} catch (error) {
  console.error(error.message);
}
*/
