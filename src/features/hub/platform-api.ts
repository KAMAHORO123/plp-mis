export async function platformApi<T>(path: string, method = 'GET', body?: object): Promise<T> {
 const response = await fetch('/api' + path, {method, keepalive: path.startsWith('/assessment-attempts/'), headers:{'Content-Type':'application/json'}, body:body ? JSON.stringify(body) : undefined});
 let data;
 try { data = await response.json(); } catch { throw Error('Account services are unavailable. Please try again.'); }
 if(!response.ok) throw Object.assign(new Error(data.error || 'Request failed'), {status:response.status});
 return data as T;
}
export const refreshVerifiedCredits = () => window.dispatchEvent(new Event('plp:credits-updated'));
/** Uploads a PDF, PNG or JPEG to the platform and returns its file id. */
export async function uploadFile(file: File): Promise<string> {
 const response = await fetch('/api/files', {method:'POST', headers:{'Content-Type':file.type || 'application/octet-stream','x-file-name':file.name}, body:file});
 const data = await response.json().catch(() => ({}));
 if(!response.ok) throw Error(data.error || 'The file could not be uploaded.');
 return data.id as string;
}
