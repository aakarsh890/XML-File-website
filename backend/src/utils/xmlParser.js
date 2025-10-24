import { parseStringPromise, processors } from "xml2js";

const stripPrefix = processors.stripPrefix;

const toNumber = (v) => {
  if (v == null) return null;
  const raw = typeof v === "object" ? (v._ ?? v.$?.value ?? "") : String(v);
  const cleaned = String(raw).trim().replace(/[,\s₹$]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const toStringVal = (v) => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v).trim();
  return String(v._ ?? v.$?.value ?? v.$?.Value ?? "").trim();
};

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] != null) return obj[k];
    const match = Object.keys(obj).find((x) => x.toLowerCase() === String(k).toLowerCase());
    if (match) return obj[match];
  }
  return undefined;
};

const mapPortfolioToType = (portfolio, acctTypeCode) => {
  const p = String(portfolio || "").toLowerCase();
  const code = String(acctTypeCode || "").trim();
  if (p.includes("r") || p.includes("revolv") || code === "10" || code === "11" || code === "12") return "Credit Card";
  if (p.includes("i") || p.includes("instal") || code === "51" || code === "52" || code === "53") return "Loan";
  if (p.includes("m") || p.includes("mort")) return "Mortgage";
  return "Other";
};

const mapStatusCodeToStatus = (s) => {
  const v = String(s || "").trim();
  if (!v) return "Unknown";
  if (["1", "11", "13", "12"].includes(v) || /active/i.test(v)) return "Active";
  if (["53", "52"].includes(v) || /closed/i.test(v)) return "Closed";
  if (["71", "72", "73", "75"].includes(v) || /delinquent|default|deli/i.test(v)) return "Delinquent";
  return "Unknown";
};

export const parseExperianXML = async (xmlData) => {
  const json = await parseStringPromise(xmlData, {
    explicitArray: false,
    trim: true,
    mergeAttrs: true,
    tagNameProcessors: [stripPrefix],
    explicitRoot: false,
  });

  const root =
    json?.INProfileResponse ??
    json?.ExperianReport ??
    json?.Report ??
    json?.CreditReport ??
    json ??
    {};

  // Basic details
  const basicNode = pick(root, "BasicDetails", "Header", "Customer", "CustomerDetails");
  const currentApp = pick(root, "Current_Application", "CurrentApplication", "Application");
  const currentAppDetails = currentApp ? pick(currentApp, "Current_Application_Details", "CurrentApplicationDetails") : null;
  const currentApplicant = currentAppDetails ? pick(currentAppDetails, "Current_Applicant_Details", "CurrentApplicantDetails") : null;
  const caisHolder = pick(root, "CAIS_Holder_Details", "CAIS_Holder") ?? null;
  const caisHolderId = pick(root, "CAIS_Holder_ID_Details", "CAIS_Holder_ID_Details") ?? null;

  let name = "";
  if (currentApplicant) {
    const first = toStringVal(pick(currentApplicant, "First_Name", "FirstName", "First_Name_Non_Normalized"));
    const last = toStringVal(pick(currentApplicant, "Last_Name", "LastName", "Surname", "Surname_Non_Normalized"));
    if (first || last) name = `${first} ${last}`.trim();
  }
  if (!name && basicNode) name = toStringVal(pick(basicNode, "Name", "FullName", "CustomerName"));
  if (!name && caisHolder) {
    const f = toStringVal(pick(caisHolder, "First_Name_Non_Normalized", "First_Name"));
    const l = toStringVal(pick(caisHolder, "Surname_Non_Normalized", "Surname"));
    if (f || l) name = `${f} ${l}`.trim();
  }

  let mobile = "";
  if (currentApplicant) mobile = toStringVal(pick(currentApplicant, "MobilePhoneNumber", "Telephone_Number_Applicant_1st", "Telephone_Number"));
  if (!mobile && caisHolder) mobile = toStringVal(pick(caisHolder, "Telephone_Number", "Mobile_Telephone_Number"));
  if (!mobile && basicNode) mobile = toStringVal(pick(basicNode, "Mobile", "Phone", "Contact"));

  let pan = "";
  if (caisHolderId) pan = toStringVal(pick(caisHolderId, "Income_TAX_PAN", "PAN", "IncomeTaxPan"));
  if (!pan && caisHolder) pan = toStringVal(pick(caisHolder, "Income_TAX_PAN", "Income_TAX_PAN", "PAN"));
  if (!pan && basicNode) pan = toStringVal(pick(basicNode, "PAN", "Pan"));

  // Score
  const scoreNode = pick(root, "SCORE", "Score", "BureauScoreNode") ?? null;
  let creditScore = null;
  if (scoreNode) creditScore = toNumber(pick(scoreNode, "BureauScore", "Score", "BureauScore"));
  if (creditScore == null) creditScore = toNumber(pick(basicNode ?? {}, "CreditScore", "Score"));

  // Summary
  const caisSummary = pick(root, "CAIS_Summary", "CAISSummary") ?? null;
  const reportSummary = pick(root, "ReportSummary", "Summary", "Overview") ?? null;

  const totalAccounts =
    toNumber(pick(reportSummary ?? caisSummary ?? {}, "TotalAccounts", "Total", "CreditAccountTotal")) ??
    toNumber(pick(caisSummary ?? {}, "Credit_Account", "CreditAccountTotal")) ??
    0;

  const activeAccounts =
    toNumber(pick(reportSummary ?? caisSummary ?? {}, "ActiveAccounts", "Active", "CreditAccountActive")) ?? 0;

  const closedAccounts =
    toNumber(pick(reportSummary ?? caisSummary ?? {}, "ClosedAccounts", "Closed", "CreditAccountClosed")) ?? 0;

  const securedAmount =
    toNumber(pick(reportSummary ?? {}, "SecuredAmount", "Secured")) ??
    toNumber(pick(root, "Total_Outstanding_Balance")?.Outstanding_Balance_Secured) ??
    0;

  const unsecuredAmount =
    toNumber(pick(reportSummary ?? {}, "UnsecuredAmount", "Unsecured")) ??
    toNumber(pick(root, "Total_Outstanding_Balance")?.Outstanding_Balance_UnSecured) ??
    0;

  const currentBalance =
    toNumber(pick(reportSummary ?? {}, "CurrentBalance", "Balance")) ??
    toNumber(pick(root, "Total_Outstanding_Balance")?.Outstanding_Balance_All) ??
    0;

  const enquiriesLast7Days =
    toNumber(pick(reportSummary ?? {}, "EnquiriesLast7Days", "Enquiries7Days", "Enquiries")) ??
    toNumber(pick(root, "TotalCAPS_Summary")?.TotalCAPSLast7Days) ??
    0;

  // Accounts: gather CAIS_Account_DETAILS (many repeated)
  const candidates = [
    pick(root, "CAIS_Account_DETAILS"),
    pick(root, "CAIS_Account")?.CAIS_Account_DETAILS,
    pick(root, "CAIS_Account")?.CAIS_Account_DETAILS?.CAIS_Account_DETAILS,
    pick(root, "CreditAccounts", "Accounts", "AccountList"),
    pick(root, "Account", "Accounts"),
  ].filter(Boolean);

  let accNodes = [];
  for (const cand of candidates) {
    if (!cand) continue;
    if (Array.isArray(cand)) accNodes = accNodes.concat(cand);
    else if (typeof cand === "object") {
      // flatten nested arrays/objects that may contain account items
      const values = Object.values(cand);
      for (const v of values) {
        if (Array.isArray(v)) accNodes = accNodes.concat(v);
        else if (v && typeof v === "object") accNodes.push(v);
      }
      accNodes.push(cand);
    }
  }

  if (accNodes.length === 0) {
    for (const k of Object.keys(root)) {
      if (k && k.toLowerCase().includes("cais_account_details")) {
        const v = root[k];
        if (Array.isArray(v)) accNodes = accNodes.concat(v);
        else accNodes.push(v);
      }
    }
  }

  accNodes = accNodes.filter(Boolean);

  const accounts = accNodes
    .map((acc) => {
      const provider = toStringVal(pick(acc, "Subscriber_Name", "SubscriberName", "Bank", "Provider", "Lender"));
      const accountNumber = toStringVal(pick(acc, "Account_Number", "AccountNumber", "Account_No", "AccountNo", "AccountNumber"));
      const amountOverdue = toNumber(pick(acc, "Amount_Past_Due", "AmountPastDue", "PastDue")) ?? 0;
      const currentBal = toNumber(pick(acc, "Current_Balance", "CurrentBalance", "Outstanding")) ?? 0;
      const statusRaw = pick(acc, "Account_Status", "AccountStatus", "Account_Status");
      const portfolio = pick(acc, "Portfolio_Type", "PortfolioType", "Portfolio_Type") ?? "";
      const acctTypeCode = pick(acc, "Account_Type", "AccountType", "Account_Type") ?? "";

      return {
        type: mapPortfolioToType(toStringVal(portfolio), toStringVal(acctTypeCode)),
        provider,
        addresses: [],
        accountNumber,
        amountOverdue,
        currentBalance: currentBal,
        status: mapStatusCodeToStatus(statusRaw),
      };
    })
    .filter((a) => a.accountNumber || a.currentBalance || a.amountOverdue || a.provider);

  const basicDetails = {
    name: name || "",
    mobile: mobile || "",
    pan: pan || "",
    creditScore: creditScore ?? null,
  };

  const summary = {
    totalAccounts: totalAccounts ?? accounts.length ?? 0,
    activeAccounts: activeAccounts ?? 0,
    closedAccounts: closedAccounts ?? 0,
    currentBalance: currentBalance ?? accounts.reduce((s, a) => s + (a.currentBalance || 0), 0),
    securedAmount: securedAmount ?? 0,
    unsecuredAmount: unsecuredAmount ?? 0,
    enquiriesLast7Days: enquiriesLast7Days ?? 0,
  };

  return { basicDetails, summary, accounts };
};
