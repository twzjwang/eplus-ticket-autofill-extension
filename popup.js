document.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status');
    const saveBtn = document.getElementById('saveBtn');
    const autofillBtn = document.getElementById('autofillBtn');

    // Field mapping: ID -> Storage Key
    const fields = {
        lastName: 'LAST_NAME',
        firstName: 'FIRST_NAME',
        phone: 'PHONE',
        email: 'EMAIL',
        ccNumber: 'CC_NUMBER',
        ccHolder: 'CC_HOLDER',
        ccExpMonth: 'CC_EXP_MONTH',
        ccExpYear: 'CC_EXP_YEAR',
        ccSecurityCode: 'CC_SECURITY_CODE',
        birthMonth: 'BIRTH_MONTH',
        birthDay: 'BIRTH_DAY',
        passport: 'PASSPORT_ISSUE_COUNTRY',
        residential: 'RESIDENTIAL_AREA'
    };

    // 1. Load saved settings
    chrome.storage.local.get(Object.values(fields), (data) => {
        for (const [elementId, storageKey] of Object.entries(fields)) {
            if (data[storageKey]) {
                document.getElementById(elementId).value = data[storageKey];
            }
        }
    });

    // 2. Save settings
    saveBtn.addEventListener('click', () => {
        const dataToSave = {};
        for (const [elementId, storageKey] of Object.entries(fields)) {
            dataToSave[storageKey] = document.getElementById(elementId).value.trim();
        }

        chrome.storage.local.set(dataToSave, () => {
            statusDiv.textContent = 'Settings Saved!';
            setTimeout(() => { statusDiv.textContent = ''; }, 2000);
        });
    });

    // 3. Trigger Autofill
    autofillBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
            statusDiv.textContent = 'No active tab!';
            return;
        }

        // Construct USER_DATA object on the fly
        const userData = {};
        for (const [elementId, storageKey] of Object.entries(fields)) {
            userData[storageKey] = document.getElementById(elementId).value.trim();
        }

        // Inject content script if not already there, or just send message?
        // Safest is to execute script that triggers logic.
        // But with Manifest V3, we usually just send message if content script is statically declared.
        // Let's assume content.js is registered in manifest (we haven't added it to manifest yet! check manifest content).
        // Wait, the manifest I wrote did NOT include content_scripts.
        // It had "scripting" permission.

        // Strategy A: Use scripting.executeScript to inject the function + arguments.
        // Strategy B: Use messaging (requires content_scripts in manifest).

        // I will use Strategy A (scripting.executeScript) because it's cleaner for "click to run"
        // and doesn't require the script to run on every page load.

        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            // Send the data AFTER script execution ensures it's listening? 
            // Or better: Pass the data via the message flow.
            // Actually, if I execute content.js, it runs immediately.
            // If content.js is just a function, I can pass args.
            // But content.js is usually a file.

            // Better approach: 
            // 1. Send message.
            chrome.tabs.sendMessage(tab.id, { action: "fill_form", data: userData }, (response) => {
                if (chrome.runtime.lastError) {
                    // Content script might not be loaded.
                    // Inject it now.
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    }).then(() => {
                        // Retry message
                        chrome.tabs.sendMessage(tab.id, { action: "fill_form", data: userData });
                    });
                } else {
                    statusDiv.textContent = 'Autofill sent!';
                }
            });
        } catch (err) {
            console.error(err);
            statusDiv.textContent = 'Error: ' + err.message;
        }
    });
});
