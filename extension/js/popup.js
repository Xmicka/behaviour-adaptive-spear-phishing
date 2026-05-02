// Extension popup logic for employee onboarding

document.addEventListener('DOMContentLoaded', async () => {
    const formState = document.getElementById('registration-form');
    const onboardedState = document.getElementById('onboarded-state');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const empIdInput = document.getElementById('empId');
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('message');
    const registeredNameEl = document.getElementById('registered-name');

    // Check if already registered
    const storage = await chrome.storage.local.get(['employeeData', 'deviceId']);

    if (storage.employeeData) {
        showOnboardedState(storage.employeeData);
    } else {
        // Fill in default values if available from config overrides
        const syncStorage = await chrome.storage.sync.get(['employee_name', 'employee_email']);
        if (syncStorage.employee_name) nameInput.value = syncStorage.employee_name;
        if (syncStorage.employee_email) emailInput.value = syncStorage.employee_email;
    }

    submitBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const empId = empIdInput.value.trim();

        if (!name || !email) {
            showMessage('Please provide your name and work email.', 'error');
            return;
        }

        if (!email.includes('@')) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';
        showMessage('', '');

        try {
            // Ensure we have a device ID
            let deviceId = storage.deviceId;
            if (!deviceId) {
                deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
                await chrome.storage.local.set({ deviceId });
            }

            // Load config dynamically
            const override = await chrome.storage.sync.get(['collector_url', 'api_key']);
            const baseUrlString = override.collector_url ||
                (typeof EXTENSION_CONFIG !== 'undefined' ? EXTENSION_CONFIG.COLLECTOR_URL : 'https://behaviour-adaptive-spear-phishing.onrender.com/api/collect');

            // Extract the base origin (e.g. https://behaviour-adaptive-spear-phishing.onrender.com)
            const urlObj = new URL(baseUrlString);
            const baseUrl = urlObj.origin;

            const endpoint = `${baseUrl}/api/employees/register`;

            const payload = {
                employee_name: name,
                employee_email: email,
                employee_id: empId,
                device_id: deviceId
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': override.api_key || (typeof EXTENSION_CONFIG !== 'undefined' ? EXTENSION_CONFIG.API_KEY : '')
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();

            const employeeData = {
                userId: data.user_id || payload.employee_email,
                name: data.name,
                email: data.email,
                empId: payload.employee_id
            };

            // Save locally
            await chrome.storage.local.set({ employeeData });

            // Also save to sync storage so background script picks it up easily 
            // alongside existing config overrides
            await chrome.storage.sync.set({
                user_id: employeeData.userId,
                employee_name: employeeData.name,
                employee_email: employeeData.email
            });

            showOnboardedState(employeeData);

            // Let background script know to send an initial event
            chrome.runtime.sendMessage({ type: "EMPLOYEE_ONBOARDED", data: employeeData });

        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Registration failed. Please try again or contact IT.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register Device';
        }
    });

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = type;
    }

    function showOnboardedState(data) {
        formState.style.display = 'none';
        onboardedState.style.display = 'block';
        registeredNameEl.textContent = data.name || data.email;
    }
});
