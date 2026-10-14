const API_URL = "/vehicles";

document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("vehicleTableBody");
    if (tableBody) {
        loadVehicles();
        document.getElementById("refreshVehiclesBtn")?.addEventListener("click", loadVehicles);
    }

    loadVehicleDropdown("searchVehId");
    loadVehicleDropdown("updateVehId");
    loadVehicleDropdown("deleteVehId");

    document.getElementById("searchVehicleForm")?.addEventListener("submit", searchVehicle);
    document.getElementById("insertVehicleForm")?.addEventListener("submit", insertVehicle);
    document.getElementById("selectUpdateVehicleForm")?.addEventListener("submit", loadVehicleForUpdate);
    document.getElementById("updateVehicleForm")?.addEventListener("submit", updateVehicle);
    document.getElementById("deleteVehicleForm")?.addEventListener("submit", deleteVehicle);
});

function showMessage(id, message, type = "") {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = message;
    element.className = `message ${type}`.trim();
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.details || data.error || data.message || `Request failed (${response.status})`);
    }
    return data;
}

async function loadVehicles() {
    const body = document.getElementById("vehicleTableBody");
    if (!body) return;

    body.innerHTML = "<tr><td colspan='6'>Loading vehicles...</td></tr>";
    showMessage("listMessage", "Loading vehicle records...");

    try {
        const vehicles = await apiRequest(API_URL);
        body.innerHTML = "";

        if (!Array.isArray(vehicles) || vehicles.length === 0) {
            body.innerHTML = "<tr><td colspan='6'>No vehicles found in the database.</td></tr>";
            showMessage("listMessage", "No vehicle records found. Add a vehicle or check your MySQL table.");
            await refreshVehicleDropdowns();
            return;
        }

        vehicles.forEach(vehicle => {
            const row = document.createElement("tr");
            [
                vehicle.veh_id,
                vehicle.veh_no,
                vehicle.veh_type,
                vehicle.veh_model,
                vehicle.veh_rent_per_day,
                vehicle.veh_status
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });
            body.appendChild(row);
        });

        showMessage("listMessage", `${vehicles.length} vehicle record(s) loaded successfully.`, "success");
        await refreshVehicleDropdowns(vehicles);
    } catch (error) {
        console.error("Unable to load vehicles:", error);
        body.innerHTML = "<tr><td colspan='6'>Unable to load records. Check the terminal and /vehicles API.</td></tr>";
        showMessage("listMessage", `Error: ${error.message}`, "error");
    }
}

async function refreshVehicleDropdowns(knownVehicles) {
    try {
        const vehicles = knownVehicles || await apiRequest(API_URL);
        ["searchVehId", "updateVehId", "deleteVehId"].forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;
            const previousValue = select.value;
            select.innerHTML = '<option value="">Select Vehicle ID</option>';
            vehicles.forEach(vehicle => {
                const option = document.createElement("option");
                option.value = vehicle.veh_id;
                option.textContent = vehicle.veh_id;
                select.appendChild(option);
            });
            if (vehicles.some(vehicle => String(vehicle.veh_id) === previousValue)) {
                select.value = previousValue;
            }
        });
    } catch (error) {
        console.error("Unable to load vehicle ID dropdowns:", error);
        ["searchVehId", "updateVehId", "deleteVehId"].forEach(id => {
            const select = document.getElementById(id);
            if (select) select.innerHTML = '<option value="">Could not load IDs</option>';
        });
    }
}

async function loadVehicleDropdown(id) {
    const select = document.getElementById(id);
    if (!select) return;
    try {
        const vehicles = await apiRequest(API_URL);
        select.innerHTML = '<option value="">Select Vehicle ID</option>';
        vehicles.forEach(vehicle => {
            const option = document.createElement("option");
            option.value = vehicle.veh_id;
            option.textContent = vehicle.veh_id;
            select.appendChild(option);
        });
    } catch (error) {
        console.error(`Unable to load ${id}:`, error);
        select.innerHTML = '<option value="">Could not load IDs</option>';
    }
}

async function searchVehicle(event) {
    event.preventDefault();
    const id = document.getElementById("searchVehId").value;
    if (!id) return showMessage("searchResult", "Please select a Vehicle ID.", "error");

    try {
        const v = await apiRequest(`${API_URL}/${encodeURIComponent(id)}`);
        showMessage("searchResult",
            `Vehicle ID: ${v.veh_id} | Number: ${v.veh_no} | Type: ${v.veh_type} | Model: ${v.veh_model} | Rent/day: ₹${v.veh_rent_per_day} | Status: ${v.veh_status}`,
            "success");
    } catch (error) {
        showMessage("searchResult", `Error: ${error.message}`, "error");
    }
}

async function insertVehicle(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
        veh_no: form.veh_no.value.trim(),
        veh_type: form.veh_type.value,
        veh_model: form.veh_model.value.trim(),
        veh_rent_per_day: form.veh_rent_per_day.value,
        veh_status: form.veh_status.value
    };

    try {
        const result = await apiRequest(API_URL, { method: "POST", body: JSON.stringify(payload) });
        showMessage("insertMessage", `${result.message}. New Vehicle ID: ${result.veh_id}`, "success");
        form.reset();
        await refreshVehicleDropdowns();
    } catch (error) {
        showMessage("insertMessage", `Error: ${error.message}`, "error");
    }
}

async function loadVehicleForUpdate(event) {
    event.preventDefault();
    const id = document.getElementById("updateVehId").value;
    if (!id) return showMessage("updateMessage", "Please select a Vehicle ID.", "error");

    try {
        const v = await apiRequest(`${API_URL}/${encodeURIComponent(id)}`);
        document.getElementById("updateVehNo").value = v.veh_no ?? "";
        document.getElementById("updateVehType").value = v.veh_type ?? "Car";
        document.getElementById("updateVehModel").value = v.veh_model ?? "";
        document.getElementById("updateVehRent").value = v.veh_rent_per_day ?? "";
        document.getElementById("updateVehStatus").value = v.veh_status ?? "Available";
        document.getElementById("updateVehicleForm").hidden = false;
        showMessage("updateMessage", `Loaded details for Vehicle ID ${v.veh_id}.`, "success");
    } catch (error) {
        showMessage("updateMessage", `Error: ${error.message}`, "error");
    }
}

async function updateVehicle(event) {
    event.preventDefault();
    const id = document.getElementById("updateVehId").value;
    const payload = {
        veh_no: document.getElementById("updateVehNo").value.trim(),
        veh_type: document.getElementById("updateVehType").value,
        veh_model: document.getElementById("updateVehModel").value.trim(),
        veh_rent_per_day: document.getElementById("updateVehRent").value,
        veh_status: document.getElementById("updateVehStatus").value
    };

    try {
        const result = await apiRequest(`${API_URL}/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        showMessage("updateMessage", result.message, "success");
        await refreshVehicleDropdowns();
    } catch (error) {
        showMessage("updateMessage", `Error: ${error.message}`, "error");
    }
}

async function deleteVehicle(event) {
    event.preventDefault();
    const id = document.getElementById("deleteVehId").value;
    if (!id) return showMessage("deleteMessage", "Please select a Vehicle ID.", "error");
    if (!confirm(`Are you sure you want to delete Vehicle ID ${id}?`)) return;

    try {
        const result = await apiRequest(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
        showMessage("deleteMessage", result.message, "success");
        await refreshVehicleDropdowns();
    } catch (error) {
        showMessage("deleteMessage", `Error: ${error.message}`, "error");
    }
}
