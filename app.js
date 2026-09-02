const CALCULATOR_API_URL = window.location.port === "5000"
    ? "/api"
    : "http://localhost:5000/api";

let currentOperand = "";
let previousOperand = null;
let selectedOperator = null;
let calculationInProgress = false;
let justCalculated = false;

async function readApiResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}.`);
    }

    return data;
}

async function calculateOnServer(num1, num2, operator) {
    const response = await fetch(`${CALCULATOR_API_URL}/calculate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ num1, num2, operator })
    });

    return readApiResponse(response);
}

function getScreen() {
    return document.getElementById("screen");
}

function renderDisplay() {
    const screen = getScreen();
    if (!screen) return;

    if (previousOperand !== null && selectedOperator) {
        const secondOperand = currentOperand ? ` ${currentOperand}` : "";
        screen.value = `${previousOperand} ${selectedOperator}${secondOperand}`;
        return;
    }

    screen.value = currentOperand || "0";
}

function appendDigitOrDecimal(value) {
    if (justCalculated) {
        currentOperand = "";
        justCalculated = false;
    }

    if (value === ".") {
        if (currentOperand.includes(".")) return;
        currentOperand = currentOperand || "0";
        currentOperand += ".";
        renderDisplay();
        return;
    }

    const decimalPart = currentOperand.split(".")[1];
    if (decimalPart && decimalPart.length >= 4) return;

    if (currentOperand === "0") {
        currentOperand = value;
    } else {
        currentOperand += value;
    }

    renderDisplay();
}

function chooseOperator(operator) {
    if (previousOperand !== null && currentOperand === "") {
        selectedOperator = operator;
        renderDisplay();
        return;
    }

    if (currentOperand === "") return;

    previousOperand = Number(currentOperand);
    selectedOperator = operator;
    currentOperand = "";
    justCalculated = false;
    renderDisplay();
}

function buttonclick(value) {
    if (calculationInProgress) return;

    const stringValue = String(value);
    if (["+", "-", "*", "/"].includes(stringValue)) {
        chooseOperator(stringValue);
        return;
    }

    appendDigitOrDecimal(stringValue);
}

function clearDisplay() {
    currentOperand = "";
    previousOperand = null;
    selectedOperator = null;
    calculationInProgress = false;
    justCalculated = false;
    renderDisplay();
}

async function equalClick() {
    if (
        calculationInProgress ||
        previousOperand === null ||
        !selectedOperator ||
        currentOperand === ""
    ) {
        return;
    }

    const num1 = previousOperand;
    const num2 = Number(currentOperand);
    const operator = selectedOperator;
    const screen = getScreen();

    calculationInProgress = true;
    screen.value = "Calculating...";

    try {
        const calculation = await calculateOnServer(num1, num2, operator);
        currentOperand = String(calculation.result);
        previousOperand = null;
        selectedOperator = null;
        justCalculated = true;
        renderDisplay();
    } catch (error) {
        currentOperand = "";
        previousOperand = null;
        selectedOperator = null;
        justCalculated = true;
        screen.value = `Error: ${error.message}`;
    } finally {
        calculationInProgress = false;
    }
}

document.addEventListener("DOMContentLoaded", renderDisplay);
