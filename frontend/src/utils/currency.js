export const currencies = [
  { code: "TZS", symbol: "TSh", label: "Tanzanian Shilling", rate: 1 },
  { code: "USD", symbol: "$", label: "US Dollar", rate: 2500 },
  { code: "UGX", symbol: "USh", label: "Ugandan Shilling", rate: 0.67 },
];

export const convertToTZS = (amount, currency) => {
  const c = currencies.find((c) => c.code === currency);
  if (!c || currency === "TZS") return amount;
  return amount * c.rate;
};

export const convertFromTZS = (amountTZS, targetCurrency) => {
  const c = currencies.find((c) => c.code === targetCurrency);
  if (!c || targetCurrency === "TZS") return amountTZS;
  return amountTZS / c.rate;
};

export const formatCurrency = (amount, currency = "TZS") => {
  const c = currencies.find((c) => c.code === currency) || currencies[0];
  return `${c.symbol} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};
