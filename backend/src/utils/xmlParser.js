import { parseStringPromise, processors } from "xml2js";

// normalize "₹1,23,456.00", "1,234.56", " $ 1200 "
const toNumber = (v) => {
  if (v == null) return null;
  const raw =
    typeof v === "object"
      ? (v._ ?? v.$?.value ?? v.$?.Value ?? v.value ?? v.Value ?? "")
      : String(v);
  const cleaned = String(raw).trim().replace(/[,\s₹$]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

// extract a string from text/attr/object
const toStringVal = (v) => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v).trim();
  return String(v._ ?? v.$?.value ?? v.$?.Value ?? v.value ?? v.Value ?? "").trim();
};

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

// get the first present key from an object (case-insensitive)
const pick = (obj, ...keys) => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] != null) return obj[k];
    const match = Object.keys(obj).find((x) => x.toLowerCase() === String(k).toLowerCase());
    if (match) return obj[match];
  }
  return undefined;
};

export const parseExperianXML = async (xmlData) => {
  const json = await parseStringPromise(xmlData, {
    explicitArray: false,
    trim: true,
    mergeAttrs: true,
    // strip ns prefixes like ns:Tag -> Tag
    tagNameProcessors: [processors.stripPrefix],
  });

  // helpful once; comment out after you confirm structure
  console.log("PARSED XML (root keys):", Object.keys(json || {}));

  const root = json?.ExperianReport ?? json?.Report ?? json?.CreditReport ?? json ?? {};

  const basic = pick(root, "BasicDetails", "Header", "Customer", "CustomerDetails") ?? {};
  const summary = pick(root, "ReportSummary", "Summary", "Overview") ?? {};

  const accountsContainer = pick(root, "CreditAccounts", "Accounts", "AccountList") ?? {};
  const accountsRaw =
    pick(accountsContainer, "Account", "Accounts", "AccountList") ??
    accountsContainer ??
    [];

  const accountsArr = asArray(accountsRaw).filter(Boolean);

  const accounts = accountsArr.map((acc) => {
    const type = toStringVal(pick(acc, "Type", "AccountType")) || "Unknown";
    const provider = toStringVal(pick(acc, "Bank", "Provider", "Lender"));
    const accountNumber = toStringVal(pick(acc, "AccountNumber", "AcctNo", "AccountNo"));
    const amountOverdue = toNumber(pick(acc, "AmountOverdue", "Overdue", "PastDue")) ?? 0;
    const currentBalance = toNumber(pick(acc, "CurrentBalance", "Balance", "Outstanding")) ?? 0;
    const status = toStringVal(pick(acc, "Status", "AccountStatus"));

    // addresses can be string, array, or { Address: [...] }
    let addresses = [];
    const add = pick(acc, "Addresses", "Address");
    if (add) {
      if (typeof add === "string") addresses = add.split(",").map((s) => s.trim()).filter(Boolean);
      else if (Array.isArray(add)) addresses = add.map((a) => toStringVal(a)).filter(Boolean);
      else if (add.Address) addresses = asArray(add.Address).map((a) => toStringVal(a)).filter(Boolean);
    }

    return { type, provider, addresses, accountNumber, amountOverdue, currentBalance, status };
    });

  const basicDetails = {
    name: toStringVal(pick(basic, "Name", "FullName", "CustomerName")),
    mobile: toStringVal(pick(basic, "Mobile", "Phone", "Contact")),
    pan: toStringVal(pick(basic, "PAN", "Pan", "pan")),
    creditScore: toNumber(pick(basic, "CreditScore", "Score")) ?? 0,
  };

  const summaryOut = {
    totalAccounts: toNumber(pick(summary, "TotalAccounts", "Total")) ?? accounts.length,
    activeAccounts: toNumber(pick(summary, "ActiveAccounts", "Active")) ?? 0,
    closedAccounts: toNumber(pick(summary, "ClosedAccounts", "Closed")) ?? 0,
    currentBalance:
      toNumber(pick(summary, "CurrentBalance", "Balance")) ??
      accounts.reduce((s, a) => s + (a.currentBalance || 0), 0),
    securedAmount: toNumber(pick(summary, "SecuredAmount", "Secured")) ?? 0,
    unsecuredAmount: toNumber(pick(summary, "UnsecuredAmount", "Unsecured")) ?? 0,
    enquiriesLast7Days:
      toNumber(pick(summary, "EnquiriesLast7Days", "Enquiries7Days", "Enquiries")) ?? 0,
  };

  return { basicDetails, summary: summaryOut, accounts };
};
