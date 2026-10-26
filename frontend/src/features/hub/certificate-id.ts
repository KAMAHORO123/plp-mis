// Preserve the unique identifier when cleaning up legacy certificate references.
export const certificateReference = (id: string) => id.replace(/^PLP-DEMO-/, "PLP-");
