let authEmail = null;

export function setAuthEmail(email) {
  authEmail = email || null;
}

export function getAuthEmail() {
  return authEmail;
}
