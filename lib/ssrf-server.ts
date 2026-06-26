import dns from "dns";

/**
 * Checks if a URL is safe to fetch from the server.
 * Ensures the protocol is HTTP/HTTPS and that the hostname does not resolve
 * to any loopback, private subnet, or link-local IP addresses (SSRF protection).
 */
export async function isSafeUrl(urlString: string): Promise<boolean> {
  try {
    const url = new URL(urlString);
    
    // Only allow http and https protocols
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // 1. Basic text-based check
    const privateHosts = ["localhost", "0.0.0.0", "::1"];
    if (privateHosts.includes(hostname) || hostname.endsWith(".local")) {
      return false;
    }

    // 2. DNS resolution verification
    // Resolve all IPs associated with the host to prevent DNS pinning/rebinding bypasses
    const addresses = await new Promise<string[]>((resolve) => {
      dns.lookup(hostname, { all: true }, (err, result) => {
        if (err || !result) {
          resolve([]);
        } else {
          resolve(result.map((r) => r.address));
        }
      });
    });

    if (addresses.length === 0) {
      return false;
    }

    // If any resolved IP is a private/loopback/local address, reject the URL
    for (const ip of addresses) {
      if (isPrivateIp(ip)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

function isPrivateIp(ip: string): boolean {
  // IPv4 Private Range Checks
  if (ip.includes(".")) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) {
      return true; // Malformed IP, block
    }
    
    const [p0, p1] = parts;
    // 127.0.0.0/8 (Loopback)
    // 10.0.0.0/8 (Private)
    // 0.0.0.0 (Any/Default)
    if (p0 === 127 || p0 === 10 || p0 === 0) return true;
    
    // 172.16.0.0/12 (Private)
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
    
    // 192.168.0.0/16 (Private)
    if (p0 === 192 && p1 === 168) return true;
    
    // 169.254.0.0/16 (Link-local)
    if (p0 === 169 && p1 === 254) return true;
    
    return false;
  }
  
  // IPv6 Private Range Checks
  if (ip.includes(":")) {
    const norm = ip.toLowerCase();
    
    // Loopback or Unspecified
    if (norm === "::1" || norm === "::" || norm === "0:0:0:0:0:0:0:1" || norm === "0:0:0:0:0:0:0:0") {
      return true;
    }
    
    // Unique Local Address (fc00::/7) or Link-Local (fe80::/10)
    if (
      norm.startsWith("fc") || 
      norm.startsWith("fd") || 
      norm.startsWith("fe8") || 
      norm.startsWith("fe9") || 
      norm.startsWith("fea") || 
      norm.startsWith("feb")
    ) {
      return true;
    }
    
    // IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1)
    if (norm.startsWith("::ffff:")) {
      const ipv4Part = ip.substring(7);
      return isPrivateIp(ipv4Part);
    }
  }

  return false;
}
