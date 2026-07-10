// Support contacts — shown on the home screen and in the Support popup.
export const SUPPORT_CONTACTS = [
  { name: "Abir", phone: "52776225" },
  { name: "Bilel", phone: "29102760" },
];

// Numbers are stored as local 8-digit numbers; dial them with the country code.
export function telHref(phone) {
  return `tel:+216${phone.replace(/\D/g, "")}`;
}

// 52776225 → "52 77 62 25"
export function formatPhone(phone) {
  return phone.replace(/(\d{2})(?=\d)/g, "$1 ");
}
