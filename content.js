(function () {
    // Prevent re-initialization if script is injected multiple times
    if (window.ticketAutofillInitialized) return;
    window.ticketAutofillInitialized = true;

    console.log("Ticket Autofill Content Script Loaded");

    const SEMANTIC_KEYS = {
        LAST_NAME: "vkanjiSimeiSei",
        FIRST_NAME: "vkanjiSimeiMei",
        PHONE: "vdenwaBangoJitakuOrKeitai",
        EMAIL: "vmailAddressPc",
        EMAIL_CONFIRM: "vkakuninyoMailAddressPc",

        CC_NUMBER: "vcreditCardNo",
        CC_HOLDER: "vcreditCardHolder",
        CC_EXP_MONTH: "vcardYukoKigenTuki",
        CC_EXP_YEAR: "vcardYukoKigenNen",
        CC_SECURITY_CODE: "vsecurityCode",

        BIRTH_MONTH: "vseinengappiTuki",
        BIRTH_DAY: "vseinengappiHi",

        PASSPORT: "passportIssueAreaBox",
        RESIDENTIAL: "residentialAreaBox"
    };

    function findInputBySemanticKey(semanticKey) {
        const allHiddenInputs = document.querySelectorAll('input[type="hidden"]');
        let dynamicNameBase = null;

        for (const hidden of allHiddenInputs) {
            // Check for ";keyName" suffix or just containment
            if (hidden.value && (hidden.value.endsWith(";" + semanticKey) || hidden.value.includes(";" + semanticKey))) {
                dynamicNameBase = hidden.name;
                break;
            }
        }

        if (!dynamicNameBase) {
            console.warn(`Could not resolve dynamic name for key: ${semanticKey}`);
            return null;
        }

        const candidates = [
            dynamicNameBase + ".value",
            dynamicNameBase + ".combo"
        ];

        for (const candidateName of candidates) {
            const element = document.getElementsByName(candidateName)[0];
            if (element) return element;
        }

        return null;
    }

    function setNativeValue(element, value) {
        if (!element || !value) return;

        // console.log(`Setting value to field '${element.name}'`);
        element.value = value;

        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    function autofillForm(userData) {
        console.log("Starting semantic autofill process...");

        // 1. Radio Button Triggers
        // Select Receiving Method (QR Ticket) - ID 'i11'
        const radioReceive = document.getElementById('i11');
        if (radioReceive) radioReceive.click();

        // Select Payment Method (Credit Card) - ID 'i6'
        const radioPayment = document.getElementById('i6');
        if (radioPayment) radioPayment.click();

        // 2. Fill Fields
        const map = SEMANTIC_KEYS;

        // Personal
        setNativeValue(findInputBySemanticKey(map.LAST_NAME), userData.LAST_NAME);
        setNativeValue(findInputBySemanticKey(map.FIRST_NAME), userData.FIRST_NAME);
        setNativeValue(findInputBySemanticKey(map.PHONE), userData.PHONE);
        setNativeValue(findInputBySemanticKey(map.EMAIL), userData.EMAIL);
        // Script assumes email confirm is same as email
        setNativeValue(findInputBySemanticKey(map.EMAIL_CONFIRM), userData.EMAIL);

        // Credit Card
        setNativeValue(findInputBySemanticKey(map.CC_NUMBER), userData.CC_NUMBER);
        setNativeValue(findInputBySemanticKey(map.CC_HOLDER), userData.CC_HOLDER.toUpperCase());
        setNativeValue(findInputBySemanticKey(map.CC_EXP_MONTH), userData.CC_EXP_MONTH);
        setNativeValue(findInputBySemanticKey(map.CC_EXP_YEAR), userData.CC_EXP_YEAR);
        setNativeValue(findInputBySemanticKey(map.CC_SECURITY_CODE), userData.CC_SECURITY_CODE);

        // Other
        setNativeValue(findInputBySemanticKey(map.BIRTH_MONTH), userData.BIRTH_MONTH);
        setNativeValue(findInputBySemanticKey(map.BIRTH_DAY), userData.BIRTH_DAY);
        setNativeValue(findInputBySemanticKey(map.PASSPORT), userData.PASSPORT_ISSUE_COUNTRY);
        setNativeValue(findInputBySemanticKey(map.RESIDENTIAL), userData.RESIDENTIAL_AREA);

        console.log("Autofill complete.");
    }

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "fill_form") {
            autofillForm(request.data);
            sendResponse({ status: "success" });
        }
    });

})();
