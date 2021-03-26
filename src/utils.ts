export function decapitalize(s: string): string {
    if (!s) return s;
    return `${s[0].toLowerCase()}${s.substr(1)}`;
}
