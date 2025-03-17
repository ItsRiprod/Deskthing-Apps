export function sortObjectKeys(obj: Record<string, any>): Record<string, any> {
    if (!obj || typeof obj !== 'object') return obj;
    return Object.keys(obj).sort().reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {} as Record<string, any>);
  }