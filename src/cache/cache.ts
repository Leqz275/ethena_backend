import fs from "fs";
import fsp from "fs/promises"; // Import the 'promises' version
import path from "path";

const CACHE_FILE_PATH = path.join(process.cwd(), ".memory_cache.json");
const SAVE_DEBOUNCE_MS = 1000; // 1 second

let saveTimer: NodeJS.Timeout | null = null;
let isDirty = false;


async function saveCache(): Promise<void> {
  saveTimer = null; 
  if (!isDirty) return; 

  isDirty = false;  
  // console.log("cache: Saving to disk...");
  try {
    const entries = Array.from(memoryCache.entries());
    const data = JSON.stringify(entries);
   
    await fsp.writeFile(CACHE_FILE_PATH, data, "utf8");
  
  } catch (err) {
    console.error("Error saving cache to disk:", err);
    isDirty = true;  
  }
}

 
function queueSave(): void {
  isDirty = true;
 
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
 
  saveTimer = setTimeout(saveCache, SAVE_DEBOUNCE_MS);
}

 
function loadCache(): Map<string, { value: any; expires: number }> {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      console.log("cache: Loading from disk...");
      const data = fs.readFileSync(CACHE_FILE_PATH, "utf8");
      const entries = JSON.parse(data);
      return new Map(entries);
    }
  } catch (err) {
    console.error("Error loading cache file, starting fresh:", err);
  }
  return new Map<string, { value: any; expires: number }>();
}

 
const memoryCache = loadCache();
 

export function getCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;

  if (Date.now() > item.expires) {
    memoryCache.delete(key);
    
    queueSave();  
 
    return null;
  }
  return item.value;
}

export function setCache(key: string, value: any, ttlSeconds = 30): void {
  const expires =
    ttlSeconds === 0 ? Infinity : Date.now() + ttlSeconds * 1000;

  memoryCache.set(key, {
    value,
    expires,
  });

 
  queueSave();  
  
}

 
function handleShutdown() {
  
  if (saveTimer) clearTimeout(saveTimer);
  
   
  if (isDirty) {
    console.log("cache: Performing final synchronous save...");
    try {
      const entries = Array.from(memoryCache.entries());
      const data = JSON.stringify(entries);
     
      fs.writeFileSync(CACHE_FILE_PATH, data, "utf8");
    } catch (err) {
      console.error("Error during final save:", err);
    }
  }
  process.exit(0);
}


process.on("SIGINT", handleShutdown); 
process.on("SIGTERM", handleShutdown); 