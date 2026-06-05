export function productPath(id: string): string {
  return `/products/${id}`;
}

export function orderPath(reference: string): string {
  return `/orders/${reference}`;
}

export function merchantPath(): string {
  return `/merchant`;
}

export function riderPath(): string {
  return `/rider`;
}

export function drivePath(): string {
  return `/drive`;
}
