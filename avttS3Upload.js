const AVTT_S3 = "https://l0cqoq0b4d.execute-api.us-east-1.amazonaws.com/default/uploader";

let S3_Current_Size = 0;
let currentFolder = "";
let activeFilePickerFilter;
const AVTT_SORT_COLUMNS = Object.freeze({
  NAME: "name",
  TYPE: "type",
  SIZE: "size",
});
const avttSortState = {
  column: "default",
  direction: null,
};
const AVTT_CLIPBOARD_MODE = Object.freeze({
  CUT: "cut",
  COPY: "copy",
});
let avttClipboard = { mode: null, items: [] };
let avttDragItems = null;
let avttLastSelectedIndex = null;
let avttFolderListingCache = new Map();
let avttAllFilesCache = null;
const avttPendingGetAllFilesRequests = new Map();
const avttUsageCache = {
  totalBytes: null,
  objectCount: null,
  pending: null,
};
let avttSearchActive = false;
let avttLastBrowsedFolder = "";
const AVTT_THUMBNAIL_BASE = "thumbnails";
const AVTT_FILE_CACHE_BASE = "files_cache";
const AVTT_FILE_CACHE_FILENAME = "FILESCACHE.abovevtt";
const AVTT_THUMBNAIL_DIMENSION = 50;
const AVTT_THUMBNAIL_MIME_TYPE = "image/png";
const avttPendingThumbnailGenerations = new Set();
window.filePickerFirstLoad = true;

function avttGetPatreonIdForPaths() {
  const patreonId =
    typeof window !== "undefined" && window && typeof window.PATREON_ID === "string" && window.PATREON_ID
      ? window.PATREON_ID
      : "anonymous";
  return patreonId;
}

function avttBuildUserScopedFolderName(base) {
  const normalizedBase = typeof base === "string" && base.trim() ? base.trim() : "shared";
  const scopedIdRaw = avttNormalizeRelativePath(avttGetPatreonIdForPaths());
  const scopedId = scopedIdRaw.replace(/\//g, "_");
  return `${normalizedBase}_${scopedId}`;
}

function avttGetThumbnailPrefix() {
  return `${avttBuildUserScopedFolderName(AVTT_THUMBNAIL_BASE)}/`;
}

function avttGetFileCacheFolder() {
  return `${avttBuildUserScopedFolderName(AVTT_FILE_CACHE_BASE)}/`;
}

function avttGetFileCacheKey() {
  return `${avttGetFileCacheFolder()}${AVTT_FILE_CACHE_FILENAME}`;
}

function avttApplyThumbnailPrefixToAboveBucket(path) {
  if (typeof path !== "string") {
    return path;
  }
  return path.replace(/^(above-bucket-not-a-url\/.*?\/)(.*)$/i, (match, bucketPrefix, rest) => {
    const userMatch = bucketPrefix.match(/^above-bucket-not-a-url\/([^/]+)\//i);
    const scopedUser = userMatch && userMatch[1] ? userMatch[1] : "anonymous";
    const sanitizedUser = String(scopedUser).replace(/[\\/]/g, "_") || "anonymous";
    const thumbnailFolder = `thumbnails_${sanitizedUser}`;
    const remaining = rest
      .replace(/^thumbnails_[^/]*\//i, "")
    const normalizedRemaining = remaining.replace(/^\/+/, "");
    const base = `${bucketPrefix}${thumbnailFolder}`;
    return normalizedRemaining ? `${base}/${normalizedRemaining}` : `${base}/`;
  });
}

function avttIsThumbnailRelativeKey(relativeKey) {
  const normalized = avttNormalizeRelativePath(relativeKey);
  if (!normalized) {
    return false;
  }
  if (normalized.startsWith(avttGetThumbnailPrefix())) {
    return true;
  }
  return /^thumbnails_[^/]+(?:\/|$)/i.test(normalized);
}

function avttIsFileCacheRelativeKey(relativeKey) {
  const normalized = avttNormalizeRelativePath(relativeKey);
  if (!normalized) {
    return false;
  }
  if (normalized.startsWith(avttGetFileCacheFolder())) {
    return true;
  }
  return /^files_cache_[^/]+(?:\/|$)/i.test(normalized);
}

function avttIsHiddenSystemRelativeKey(relativeKey) {
  return avttIsThumbnailRelativeKey(relativeKey) || avttIsFileCacheRelativeKey(relativeKey);
}

function avttGetThumbnailKeyFromRelative(relativeKey) {
  const normalized = avttNormalizeRelativePath(relativeKey);
  if (!normalized) {
    return "";
  }
  if (avttIsThumbnailRelativeKey(normalized)) {
    return normalized;
  }
  return `${avttGetThumbnailPrefix()}${normalized}`;
}

function avttGetRelativeKeyFromThumbnail(thumbnailKey) {
  const normalized = avttNormalizeRelativePath(thumbnailKey);
  if (!normalized) {
    return "";
  }
  const prefix = avttGetThumbnailPrefix();
  if (!normalized.startsWith(prefix)) {
    return normalized;
  }
  return normalized.slice(prefix.length);
}

function avttVerifyImageUrl(url, timeout = 5000) {
  if (!url) {
    return Promise.reject(new Error("Missing URL"));
  }
  return new Promise((resolve, reject) => {
    let timer = null;
    const img = new Image();
    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      img.onload = null;
      img.onerror = null;
    };
    img.onload = () => {
      cleanup();
      resolve(true);
    };
    img.onerror = (event) => {
      cleanup();
      reject(event?.error || new Error("Failed to load image."));
    };
    if (Number.isFinite(timeout) && timeout > 0) {
      timer = setTimeout(() => {
        cleanup();
        reject(new Error("Image load timed out."));
      }, timeout);
    }
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.src = url;
  });
}

function avttIsExternalFileDrag(event) {
  const dt = event?.dataTransfer;
  if (!dt) {
    return false;
  }
  if (dt.items && typeof dt.items.length === "number") {
    for (const item of dt.items) {
      if (!item) continue;
      if (item.kind === "file") {
        return true;
      }
    }
  }
  if (dt.files && typeof dt.files.length === "number" && dt.files.length > 0) {
    return true;
  }
  if (dt.types) {
    const types = Array.from(dt.types);
    if (
      types.some(
        (type) =>
          type === "Files" ||
          type === "application/x-moz-file" ||
          type === "public.file-url" ||
          type === "text/uri-list",
      )
    ) {
      return true;
    }
  }
  return false;
}

function avttNormalizeRelativePath(path) {
  if (typeof path !== "string") {
    return "";
  }
  return path.replace(/\\/g, "/");
}

const AVTT_DEFAULT_RETRYABLE_STATUSES = new Set([429, 503, 504]);
const AVTT_UPLOAD_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const AVTT_RESOURCE_RETRY_LIMIT = 3;
const AVTT_MAX_MOVE_KEYS_PER_REQUEST = 7;
const AVTT_MAX_CONCURRENT_MOVES = 3;

function avttDelay(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function avttFetchWithRetry(input, init = {}, options = {}) {
  const {
    retries = 4,
    baseDelay = 400,
    maxDelay = 5000,
    retryStatuses = AVTT_DEFAULT_RETRYABLE_STATUSES,
    jitter = 0.25,
    treatNetworkErrorsAsRetryable = true,
  } = options;
  const signal = init?.signal;
  let attempt = 0;
  let delay = baseDelay;
  let lastError = null;

  while (attempt <= retries) {
    if (signal?.aborted) {
      throw new DOMException(signal.reason || "Aborted", "AbortError");
    }
    try {
      const response = await fetch(input, init);
      const shouldRetryStatus =
        retryStatuses &&
        (typeof retryStatuses.has === "function"
          ? retryStatuses.has(response.status)
          : Array.isArray(retryStatuses)
            ? retryStatuses.includes(response.status)
            : false);
      if (!shouldRetryStatus) {
        if(response.status == 403){
          const json = await response.json();
          if (json.error && json.message)
            alert(`${json.error}\n\s${json.message}`)
        }
        
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      const abortRequested =
        error?.name === "AbortError" || signal?.aborted === true;
      if (!treatNetworkErrorsAsRetryable || abortRequested) {
        throw error;
      }
    }

    attempt += 1;
    if (attempt > retries) {
      break;
    }

    const jitterAmount = jitter
      ? delay * jitter * (Math.random() * 2 - 1)
      : 0;
    const waitTime = Math.max(0, Math.min(delay + jitterAmount, maxDelay));
    if (waitTime > 0) {
      await avttDelay(waitTime);
    }
    delay = Math.min(delay * 2, maxDelay);
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error("Retry attempts exhausted");
}

function avttNormalizeFolderPath(folderPath) {
  const normalized = avttNormalizeRelativePath(folderPath);
  if (!normalized) {
    return "";
  }
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function avttEnsureFolderListing(folderPath) {
  const normalized = typeof folderPath === "string" ? folderPath : "";
  if (!avttFolderListingCache.has(normalized)) {
    avttFolderListingCache.set(normalized, []);
  }
  return avttFolderListingCache.get(normalized);
}

function avttCloneListingEntry(entry) {
  if (entry && typeof entry === "object") {
    const clone = { ...entry };
    if (entry.Key) {
      clone.Key = entry.Key;
    } else if (entry.key) {
      clone.Key = entry.key;
    }
    if (typeof clone.Size === "number") {
      clone.Size = Number.isFinite(clone.Size) ? clone.Size : 0;
    } else if (typeof entry.size === "number") {
      clone.Size = Number.isFinite(entry.size) ? entry.size : 0;
    } else {
      clone.Size = 0;
    }
    return clone;
  }
  if (typeof entry === "string") {
    return { Key: entry, Size: 0 };
  }
  return null;
}

function avttStoreFolderListing(folderPath, entries) {
  const normalized = typeof folderPath === "string" ? folderPath : "";
  if (!Array.isArray(entries)) {
    avttFolderListingCache.set(normalized, []);
    return;
  }
  const seen = new Set();
  const cloned = entries
    .map(avttCloneListingEntry)
    .filter(
      (entry) =>
        entry &&
        entry.Key &&
        !avttIsHiddenSystemRelativeKey(avttExtractRelativeKey(entry.Key)),
    )
    .filter((entry) => {
      if (seen.has(entry.Key)) return false;
      seen.add(entry.Key);
      return true;
    });
  avttFolderListingCache.set(normalized, cloned);
}

const avttPrimeListingCachesFromFullListing = throttle((entries) => {
  if (!Array.isArray(entries)) {
    avttAllFilesCache = null;
    return;
  }
  avttFolderListingCache.clear();
  avttAllFilesCache = entries
    .map(avttCloneListingEntry)
    .filter(
      (entry) =>
        entry &&
        entry.Key &&
        !avttIsHiddenSystemRelativeKey(avttExtractRelativeKey(entry.Key)),
    );
  // Deduplicate global list by Key
  if (Array.isArray(avttAllFilesCache)) {
    const dedup = new Map();
    for (const e of avttAllFilesCache) {
      if (e && e.Key && !dedup.has(e.Key)) dedup.set(e.Key, e);
    }
    avttAllFilesCache = Array.from(dedup.values());
  }
  const grouped = new Map();
  for (const entry of avttAllFilesCache) {
    const relative = avttExtractRelativeKey(entry.Key);
    if (avttIsHiddenSystemRelativeKey(relative)) {
      continue;
    }
    const parentFolder = avttGetParentFolder(relative);
    if (!grouped.has(parentFolder)) {
      grouped.set(parentFolder, []);
    }
    grouped.get(parentFolder).push({ ...entry });
  }

  const initialFolderKeys = Array.from(grouped.keys());
  for (const folder of initialFolderKeys) {
    let parent = avttGetParentFolder(folder);
    while (parent !== "") {
      if (!grouped.has(parent)) {
        grouped.set(parent, []);
      }
      parent = avttGetParentFolder(parent);
    }
  }





  for (const folderPath of Array.from(grouped.keys())) {
    if (!folderPath) continue;
    const parent = avttGetParentFolder(folderPath);
    const absoluteFolderKey = `${window.PATREON_ID}/${folderPath}`;
    const parentListing = grouped.get(parent) || [];
    const alreadyPresentInParent = parentListing.some(
      (e) => (e?.Key || e?.key || "") === absoluteFolderKey,
    );
    if (!alreadyPresentInParent) {

      const folderEntry = { Key: absoluteFolderKey, Size: 0 };
      parentListing.push(folderEntry);
      grouped.set(parent, parentListing);


      const existsInAll = avttAllFilesCache.some(
        (e) => (e?.Key || e?.key || "") === absoluteFolderKey,
      );
      if (!existsInAll) {
        avttAllFilesCache.push({ ...folderEntry });
      }
    }
  }


  for (const [folderPath, listing] of grouped.entries()) {
    avttStoreFolderListing(folderPath, listing);
  }
  if (!grouped.has("")) {
    avttStoreFolderListing("", []);
  }

  try {
    avttSchedulePersist();
  } catch (e) {
    
  }
}, 15000, {leading: true, trailing: true})


let avttPersistTimer = null;
function avttSchedulePersist(delay = 250, persistToCloud = true) {
  if (avttPersistTimer) {
    clearTimeout(avttPersistTimer);
  }
  avttPersistTimer = setTimeout(() => {
    avttPersistTimer = null;
    avttPersistCachesToIndexedDB(persistToCloud);
  }, delay);
}

const AVTT_FILE_PICKER_STORE = "avttFilePicker";
const AVTT_FILE_PICKER_WRITE_BATCH_SIZE = 200;

function avttDelayFilePickerWriteTick() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}


const persistCacheThrottle = throttle((persistToCloud = true)=>{
  const records = [];
  if (Array.isArray(avttAllFilesCache)) {
    for (const entry of avttAllFilesCache) {
      const key = entry?.Key || entry?.key || null;
      if (!key) continue;
      records.push({ fileEntry: key, type: "file", payload: avttCloneListingEntry(entry) });
    }
  }
  for (const [folderPath, listing] of avttFolderListingCache.entries()) {
    const recordKey = `folder:${folderPath}`;
    const clonedListing = Array.isArray(listing) ? listing.map(avttCloneListingEntry) : [];
    records.push({ fileEntry: recordKey, type: "folderListing", payload: clonedListing });
  }
  try {

    if(persistToCloud){
      uploadCacheFile()
    }
  } catch (err) {
    console.warn("avttPersistCachesToIndexedDB write helper failed", err);
  }
  return;
}, 30000, { leading: true, trailing: true });
function avttPersistCachesToIndexedDB(persistToCloud = true) {
  persistCacheThrottle(persistToCloud);
}



function avttExtractRelativeKey(absoluteKey) {
  const prefix = `${window.PATREON_ID}/`;
  if (typeof absoluteKey !== "string") {
    return "";
  }
  return absoluteKey.startsWith(prefix)
    ? absoluteKey.slice(prefix.length)
    : avttNormalizeRelativePath(absoluteKey);
}

function avttBuildCacheEntry(relativeKey, size = 0, sourceEntry = null) {
  if (sourceEntry && typeof sourceEntry === "object") {
    const cloned = avttCloneListingEntry(sourceEntry);
    if (cloned?.Key) {
      return cloned;
    }
  }
  const normalizedRelative = avttNormalizeRelativePath(relativeKey);
  if (!normalizedRelative) {
    return null;
  }
  if (avttIsHiddenSystemRelativeKey(normalizedRelative)) {
    return null;
  }
  return {
    Key: `${window.PATREON_ID}/${normalizedRelative}`,
    Size: Number.isFinite(Number(size)) ? Number(size) : 0,
  };
}

function avttUpsertCacheEntry(relativeKey, size = 0, sourceEntry = null) {
  const normalizedRelative = avttNormalizeRelativePath(relativeKey);
  if (!normalizedRelative) {
    return;
  }
  const parentFolder = avttGetParentFolder(normalizedRelative);
  const listing = avttEnsureFolderListing(parentFolder);
  const normalizedKey = `${window.PATREON_ID}/${normalizedRelative}`;
  const existingIndex = listing.findIndex(
    (entry) => (entry?.Key || entry?.key || "") === normalizedKey,
  );
  const newEntry = avttBuildCacheEntry(normalizedRelative, size, sourceEntry);
  if (!newEntry) {
    return;
  }
  if (existingIndex >= 0) {
    listing[existingIndex] = newEntry;
  } else {
    listing.push(newEntry);
  }
  if (Array.isArray(avttAllFilesCache)) {
    const allIndex = avttAllFilesCache.findIndex(
      (entry) => (entry?.Key || entry?.key || "") === normalizedKey,
    );
    if (allIndex >= 0) {
      avttAllFilesCache[allIndex] = { ...newEntry };
    } else {
      avttAllFilesCache.push({ ...newEntry });
    }
  }
  try {
    avttSchedulePersist();
  } catch (e) {
    
  }
}

function avttRemoveCacheEntry(relativeKey) {
  const normalizedRelative = avttNormalizeRelativePath(relativeKey);
  if (!normalizedRelative) {
    return;
  }
  const parentFolder = avttGetParentFolder(normalizedRelative);
  if (avttFolderListingCache.has(parentFolder)) {
    const listing = avttFolderListingCache.get(parentFolder);
    const normalizedKey = `${window.PATREON_ID}/${normalizedRelative}`;
    const filtered = listing.filter(
      (entry) => (entry?.Key || entry?.key || entry) !== normalizedKey,
    );
    avttFolderListingCache.set(parentFolder, filtered);
  }
  if (Array.isArray(avttAllFilesCache)) {
    const normalizedKey = `${window.PATREON_ID}/${normalizedRelative}`;
    avttAllFilesCache = avttAllFilesCache.filter(
      (entry) => (entry?.Key || entry?.key || entry) !== normalizedKey,
    );
  }
  try {
    avttSchedulePersist();
  } catch (e) {
    
  }
}

function avttRemoveFolderCacheRecursively(folderPath) {
  const normalizedFolder = avttNormalizeFolderPath(folderPath);
  if (!normalizedFolder) {
    return;
  }
  const absolutePrefix = `${window.PATREON_ID}/${normalizedFolder}`;
  for (const key of Array.from(avttFolderListingCache.keys())) {
    if (key === normalizedFolder || key.startsWith(normalizedFolder)) {
      avttFolderListingCache.delete(key);
    }
  }
  if (Array.isArray(avttAllFilesCache)) {
    avttAllFilesCache = avttAllFilesCache.filter((entry) => {
      const absolute = entry?.Key || entry?.key || "";
      return typeof absolute === "string"
        ? !absolute.startsWith(absolutePrefix)
        : true;
    });
  }
  try {
    avttSchedulePersist();
  } catch (e) {
    
  }
}

function avttMoveFolderCaches(fromFolder, toFolder) {
  const source = avttNormalizeFolderPath(fromFolder);
  const target = avttNormalizeFolderPath(toFolder);
  if (!source || source === target) {
    return;
  }
  const absoluteSource = `${window.PATREON_ID}/${source}`;
  const absoluteTarget = `${window.PATREON_ID}/${target}`;
  const pendingUpdates = [];
  for (const [key, listing] of avttFolderListingCache.entries()) {
    if (key === source || key.startsWith(source)) {
      const newKey = `${target}${key.slice(source.length)}`;
      const remappedListing = listing.map((entry) => {
        const absolute = entry?.Key || entry?.key || "";
        if (typeof absolute !== "string") {
          return avttCloneListingEntry(entry);
        }
        if (!absolute.startsWith(absoluteSource)) {
          return avttCloneListingEntry(entry);
        }
        const suffix = absolute.slice(absoluteSource.length);
        return {
          ...avttCloneListingEntry(entry),
          Key: `${absoluteTarget}${suffix}`,
        };
      });
      pendingUpdates.push({ oldKey: key, newKey, listing: remappedListing });
    }
  }
  for (const update of pendingUpdates) {
    avttFolderListingCache.delete(update.oldKey);
  }
  for (const update of pendingUpdates) {
    avttFolderListingCache.set(update.newKey, update.listing);
  }
  if (Array.isArray(avttAllFilesCache)) {
    avttAllFilesCache = avttAllFilesCache.map((entry) => {
      const absolute = entry?.Key || entry?.key || "";
      if (typeof absolute !== "string" || !absolute.startsWith(absoluteSource)) {
        return avttCloneListingEntry(entry);
      }
      const suffix = absolute.slice(absoluteSource.length);
      return {
        ...avttCloneListingEntry(entry),
        Key: `${absoluteTarget}${suffix}`,
      };
    });
  }
  try {
    avttSchedulePersist();
  } catch (e) {
    
  }
}

function avttCopyFolderCaches(fromFolder, toFolder) {
  const source = avttNormalizeFolderPath(fromFolder);
  const target = avttNormalizeFolderPath(toFolder);
  if (!source || !target || source === target) {
    return;
  }
  const absoluteSource = `${window.PATREON_ID}/${source}`;
  const gathered = [];
  if (Array.isArray(avttAllFilesCache)) {
    for (const entry of avttAllFilesCache) {
      const absolute = entry?.Key || entry?.key || "";
      if (typeof absolute !== "string" || !absolute.startsWith(absoluteSource)) {
        continue;
      }
      gathered.push(avttCloneListingEntry(entry));
    }
  } else {
    for (const [key, listing] of avttFolderListingCache.entries()) {
      if (key === source || key.startsWith(source)) {
        for (const entry of listing) {
          const absolute = entry?.Key || entry?.key || "";
          if (typeof absolute !== "string" || !absolute.startsWith(absoluteSource)) {
            continue;
          }
          gathered.push(avttCloneListingEntry(entry));
        }
      }
    }
    const parentListing = avttFolderListingCache.get(avttGetParentFolder(source));
    if (parentListing) {
      const folderEntry = parentListing.find((entry) => {
        const absolute = entry?.Key || entry?.key || "";
        return typeof absolute === "string" && absolute === absoluteSource;
      });
      if (folderEntry) {
        gathered.push(avttCloneListingEntry(folderEntry));
      }
    }
  }
  if (!gathered.length) {
    avttUpsertCacheEntry(target, 0);
    avttEnsureFolderListing(target);
    return;
  }
  for (const entry of gathered) {
    const absolute = entry?.Key || entry?.key || "";
    if (typeof absolute !== "string" || !absolute.startsWith(absoluteSource)) {
      continue;
    }
    const suffix = absolute.slice(absoluteSource.length);
    const newRelative = `${target}${suffix}`;
    const clone = {
      ...avttCloneListingEntry(entry),
      Key: `${window.PATREON_ID}/${newRelative}`,
    };
    avttUpsertCacheEntry(newRelative, clone.Size, clone);
  }
  avttEnsureFolderListing(target);
  try {
    avttSchedulePersist();
  } catch (e) {
    
  }
}

function avttAdjustCachedUsage(deltaBytes = 0, deltaObjects = 0) {
  if (typeof deltaBytes === "number" && deltaBytes !== 0) {
    S3_Current_Size = Math.max(0, Number(S3_Current_Size || 0) + deltaBytes);
  }
  if (typeof deltaObjects === "number" && deltaObjects !== 0) {
    if (typeof avttUsageCache.objectCount === "number") {
      avttUsageCache.objectCount = Math.max(
        0,
        Number(avttUsageCache.objectCount) + deltaObjects,
      );
    }
  }
  if (typeof avttUsageCache.totalBytes === "number" && deltaBytes !== 0) {
    avttUsageCache.totalBytes = Math.max(
      0,
      Number(avttUsageCache.totalBytes) + deltaBytes,
    );
  }
  const usedElement = document.getElementById("user-used");
  if (usedElement) {
    usedElement.innerHTML = formatFileSize(S3_Current_Size);
  }
  const tierLabel = $("#patreon-tier span.user-teir-level");
  if (tierLabel.length && typeof activeUserTier === "object") {
    tierLabel[0].innerHTML = `Azmoria <a draggable='false' target='_blank' href='https://www.patreon.com/cw/Azmoria/membership'>Patreon</a> Tier: ${activeUserTier.label}`;
  }
}

function avttEscapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = String(value);
  return span.innerHTML;
}
const avttContextMenuState = {
  element: null,
  targetPath: "",
  isFolder: false,
  displayName: "",
  isImplicit: false,
  rawKey: "",
};

function avttGetSelectedEntries() {
  const selectedCheckboxes = $('#file-listing input[type="checkbox"]:checked').get();
  return selectedCheckboxes.map((element) => ({
    key: element.value,
    size: Number(element.getAttribute("data-size")) || 0,
    isFolder: element.classList.contains("folder"),
  }));
}

function avttSelectPaths(paths) {
  const pathSet = new Set(Array.isArray(paths) ? paths : []);
  let lastIndex = null;
  $('#file-listing input[type="checkbox"]').each(function () {
    const shouldCheck = pathSet.has(this.value);
    this.checked = shouldCheck;
    if (shouldCheck) {
      const indexAttr = this.getAttribute("data-index");
      if (indexAttr !== null) {
        lastIndex = Number(indexAttr);
      }
    }
  });
  avttLastSelectedIndex = lastIndex;
  avttUpdateSelectNonFoldersCheckbox();
  avttUpdateActionsMenuState();
  avttApplyClipboardHighlights();
}

function avttEnsureSelectionIncludes(path, isFolder) {
  const selected = avttGetSelectedEntries();
  const hasPath = selected.some((entry) => entry.key === path);
  if (hasPath) {
    const checkbox = $('#file-listing input[type="checkbox"]').filter(function () {
      return this.value === path;
    });
    checkbox.each(function () {
      const indexAttr = this.getAttribute("data-index");
      if (indexAttr !== null) {
        avttLastSelectedIndex = Number(indexAttr);
      }
    });
    avttUpdateSelectNonFoldersCheckbox();
    avttUpdateActionsMenuState();
    return selected;
  }
  avttSelectPaths([path]);
  const checkbox = $('#file-listing input[type="checkbox"]').filter(function () {
    return this.value === path;
  });
  checkbox.each(function () {
    this.classList.toggle("folder", isFolder);
    const indexAttr = this.getAttribute("data-index");
    if (indexAttr !== null) {
      avttLastSelectedIndex = Number(indexAttr);
    }
  });
  avttUpdateSelectNonFoldersCheckbox();
  avttUpdateActionsMenuState();
  return avttGetSelectedEntries();
}

function avttFindRowByPath(path) {
  const rows = document.querySelectorAll("#file-listing tr.avtt-file-row");
  for (const row of rows) {
    if (row.dataset && row.dataset.path === path) {
      return row;
    }
  }
  return null;
}

function avttClearClipboard() {
  avttClipboard = { mode: null, items: [] };
  avttApplyClipboardHighlights();
  avttUpdateContextMenuState();
  avttUpdateActionsMenuState();
}

function avttApplyClipboardHighlights() {
  const rows = document.querySelectorAll("#file-listing tr.avtt-file-row");
  rows.forEach((row) => row.classList.remove("avtt-cut-row"));
  if (
    avttClipboard.mode !== AVTT_CLIPBOARD_MODE.CUT ||
    !Array.isArray(avttClipboard.items) ||
    avttClipboard.items.length === 0
  ) {
    return;
  }
  for (const entry of avttClipboard.items) {
    const row = avttFindRowByPath(entry.key);
    if (row) {
      row.classList.add("avtt-cut-row");
    }
  }
}

function avttSetClipboard(items, mode) {
  const entries = Array.isArray(items)
    ? items
        .map((item) => ({
          key: item.key,
          size: Number(item.size) || 0,
          isFolder: Boolean(item.isFolder),
        }))
        .filter((item) => item.key)
    : [];
  if (!entries.length || !mode) {
    avttClearClipboard();
    return false;
  }
  avttClipboard = {
    mode,
    items: entries,
  };
  avttApplyClipboardHighlights();
  avttUpdateContextMenuState();
  avttUpdateActionsMenuState();
  return true;
}

function avttClipboardHasEntries() {
  return Array.isArray(avttClipboard.items) && avttClipboard.items.length > 0;
}

function avttCopySelectedPathsToClipboard() {
  const selections = avttGetSelectedEntries();
  if (!selections.length) {
    return false;
  }
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    console.warn("Clipboard API is not available.");
    return false;
  }
  const paths = selections.map(
    (entry) => `above-bucket-not-a-url/${window.PATREON_ID}/${entry.key}`,
  );
  const copyText = paths.join(", ");
  navigator.clipboard.writeText(copyText);
  return true;
}

function avttGetNonFolderCheckboxes() {
  return Array.from(
    document.querySelectorAll(
      '#file-listing input[type="checkbox"]:not(.folder)',
    ),
  );
}

function avttUpdateSelectNonFoldersCheckbox() {
  const toggle = document.getElementById("avtt-select-files");
  if (!toggle) {
    return;
  }
  const nonFolderCheckboxes = avttGetNonFolderCheckboxes();
  if (!nonFolderCheckboxes.length) {
    toggle.checked = false;
    toggle.indeterminate = false;
    toggle.disabled = true;
    return;
  }
  toggle.disabled = false;
  const selectedCount = nonFolderCheckboxes.filter((checkbox) => checkbox.checked).length;
  if (selectedCount === 0) {
    toggle.checked = false;
    toggle.indeterminate = false;
  } else if (selectedCount === nonFolderCheckboxes.length) {
    toggle.checked = true;
    toggle.indeterminate = false;
  } else {
    toggle.checked = false;
    toggle.indeterminate = true;
  }
}

function avttUpdateActionsMenuState() {
  const dropdown = document.getElementById("avtt-actions-dropdown");
  if (!dropdown) {
    return;
  }
  const selection = avttGetSelectedEntries();
  const hasSelection = selection.length > 0;
  const singleSelection = selection.length === 1;

  const cutButton = dropdown.querySelector('[data-action="cut"]');
  if (cutButton) {
    cutButton.disabled = !hasSelection;
  }
  const deleteButton = dropdown.querySelector('[data-action="delete"]');
  if (deleteButton) {
    deleteButton.disabled = !hasSelection;
  }
  const copyPathButton = dropdown.querySelector('[data-action="copy-path"]');
  if (copyPathButton) {
    copyPathButton.disabled = !hasSelection;
  }
  const renameButton = dropdown.querySelector('[data-action="rename"]');
  if (renameButton) {
    renameButton.disabled = !singleSelection;
  }
  const pasteButton = dropdown.querySelector('[data-action="paste"]');
  if (pasteButton) {
    pasteButton.disabled = !avttClipboardHasEntries();
  }

  const hasNonFolder = selection.some((e) => !e.isFolder);
  const hasAbovevtt = hasNonFolder && selection.some((e) => (/\.abovevtt$/i.test(e.key) || /\.csv$/i.test(e.key)));
  const openNewTabButton = dropdown.querySelector('button[data-action="openNewTab"]');
  if (openNewTabButton) {
    
    openNewTabButton.disabled = !singleSelection || !hasNonFolder;
  }
  const openButton = dropdown.querySelector('button[data-action="open"]');
  if (openButton) {
    openButton.disabled = hasAbovevtt || !singleSelection || !hasNonFolder ;
  }
  const forceOpenButton = dropdown.querySelector('button[data-action="forceOpen"]');
  if (forceOpenButton) {
    forceOpenButton.disabled = hasAbovevtt || !singleSelection || !hasNonFolder ;
  }
  const importButton = dropdown.querySelector('button[data-action="import"]');
  if (importButton) {
    importButton.disabled = !hasAbovevtt;
  }
  const sendToGamelogButton = dropdown.querySelector('button[data-action="sendToGamelog"]');
  if (sendToGamelogButton) {
    const hasAbovevtt = selection.some((e) => !e.isFolder && (allowedVideoTypes.includes(getFileExtension(e.key)) || allowedImageTypes.includes(getFileExtension(e.key))));
    sendToGamelogButton.disabled = !hasAbovevtt;
  }
}

function avttHideActionsMenu() {
  const dropdown = document.getElementById("avtt-actions-dropdown");
  if (!dropdown) {
    return;
  }
  dropdown.classList.remove("visible");
}

function avttShowActionsMenu() {
  const dropdown = document.getElementById("avtt-actions-dropdown");
  if (!dropdown) {
    return;
  }
  avttUpdateActionsMenuState();
  dropdown.classList.add("visible");
}

function avttToggleActionsMenu() {
  const dropdown = document.getElementById("avtt-actions-dropdown");
  if (!dropdown) {
    return;
  }
  if (dropdown.classList.contains("visible")) {
    avttHideActionsMenu();
  } else {
    avttHideExportMenu();
    avttHideContextMenu();
    avttShowActionsMenu();
  }
}

function avttHideExportMenu() {
  const dropdown = document.getElementById("avtt-export-dropdown");
  if (!dropdown) {
    return;
  }
  dropdown.classList.remove("visible");
}

function avttShowExportMenu() {
  const dropdown = document.getElementById("avtt-export-dropdown");
  if (!dropdown) {
    return;
  }
  dropdown.classList.add("visible");
}

function avttToggleExportMenu() {
  const dropdown = document.getElementById("avtt-export-dropdown");
  if (!dropdown) {
    return;
  }
  if (dropdown.classList.contains("visible")) {
    avttHideExportMenu();
  } else {
    avttShowExportMenu();
  }
}

function avttGetAllCheckboxElements() {
  return Array.from(
    document.querySelectorAll('#file-listing input[type="checkbox"]'),
  );
}

function avttHandleCheckboxClick(event, index) {
  const checkbox = event.currentTarget;
  if (!checkbox) {
    return;
  }
  const allCheckboxes = avttGetAllCheckboxElements();
  if (
    event.shiftKey &&
    avttLastSelectedIndex !== null &&
    avttLastSelectedIndex >= 0 &&
    avttLastSelectedIndex < allCheckboxes.length
  ) {
    const start = Math.min(index, avttLastSelectedIndex);
    const end = Math.max(index, avttLastSelectedIndex);
    const shouldCheck = checkbox.checked;
    for (let i = start; i <= end; i += 1) {
      const candidate = allCheckboxes[i];
      if (!candidate) {
        continue;
      }
      if (candidate.checked !== shouldCheck) {
        candidate.checked = shouldCheck;
      }
    }
  }
  avttLastSelectedIndex = index;
  avttUpdateSelectNonFoldersCheckbox();
  avttUpdateActionsMenuState();
  avttApplyClipboardHighlights();
}

function avttDefaultSortComparator(a, b) {
  if (a.isFolder && !b.isFolder) {
    return -1;
  }
  if (!a.isFolder && b.isFolder) {
    return 1;
  }
  const nameCompare = (a.displayName || "").localeCompare(
    b.displayName || "",
    undefined,
    { sensitivity: "base" },
  );
  if (nameCompare !== 0) {
    return nameCompare;
  }
  return (a.relativePath || "").localeCompare(b.relativePath || "");
}

function avttSortEntries(entries) {
  if (!Array.isArray(entries)) {
    return;
  }
  const { column, direction } = avttSortState;
  if (column === "default" || !column || !direction) {
    entries.sort(avttDefaultSortComparator);
    return;
  }
  const multiplier = direction === "desc" ? -1 : 1;
  entries.sort((a, b) => {
    if (column != AVTT_SORT_COLUMNS.TYPE){
      if (a.isFolder && !b.isFolder) {
        return -1;
      }
      if (!a.isFolder && b.isFolder) {
        return 1;
      }
    }

    let compare = 0;
    if (column === AVTT_SORT_COLUMNS.NAME) {
      compare = (a.displayName || "").localeCompare(
        b.displayName || "",
        undefined,
        { sensitivity: "base" },
      );
    } else if (column === AVTT_SORT_COLUMNS.TYPE) {
      compare = (a.type || "").localeCompare(
        b.type || "",
        undefined,
        { sensitivity: "base" },
      );
    } else if (column === AVTT_SORT_COLUMNS.SIZE) {
      const sizeA = Number(a.size) || 0;
      const sizeB = Number(b.size) || 0;
      compare = sizeA - sizeB;
    }
    if (compare === 0) {
      compare = avttDefaultSortComparator(a, b);
    }
    return compare * multiplier;
  });
}

function avttUpdateSortIndicators() {
  const headers = document.querySelectorAll(
    "#avtt-column-headers [data-sort]",
  );
  headers.forEach((header) => {
    const label = header.getAttribute("data-label") || header.textContent.trim();
    header.innerHTML = "";
    header.classList.remove("active");
    const labelNode = document.createElement("span");
    labelNode.textContent = label;
    header.appendChild(labelNode);
    if (
      avttSortState.column === header.getAttribute("data-sort") &&
      avttSortState.direction
    ) {
      header.classList.add("active");
      const indicator = document.createElement("span");
      indicator.className = "avtt-sort-indicator";
      indicator.textContent = avttSortState.direction === "asc" ? "\u25B2" : "\u25BC";
      header.appendChild(indicator);
    }
  });
}

function avttRefreshWithCurrentSort() {
  const searchInput = document.getElementById("search-files");
  const searchTerm = searchInput ? searchInput.value.trim() : "";
  if (searchTerm) {
    refreshFiles("", false, true, searchTerm, activeFilePickerFilter, {
      useCache: true,
      revalidate: !Array.isArray(avttAllFilesCache),
    });
  } else {
    refreshFiles(currentFolder, false, false, undefined, activeFilePickerFilter, {
      useCache: true,
      revalidate:
        !avttFolderListingCache.has(currentFolder) ||
        !Array.isArray(avttFolderListingCache.get(currentFolder)),
    });
  }
}

function avttToggleSort(column) {
  if (!column) {
    avttSortState.column = "default";
    avttSortState.direction = null;
  } else if (avttSortState.column !== column) {
    avttSortState.column = column;
    avttSortState.direction = "asc";
  } else if (avttSortState.direction === "asc") {
    avttSortState.direction = "desc";
  } else {
    avttSortState.column = "default";
    avttSortState.direction = null;
  }
  avttUpdateSortIndicators();
  avttRefreshWithCurrentSort();
}

function avttGetParentFolder(relativeKey) {
  if (typeof relativeKey !== "string") {
    return "";
  }
  const normalized = relativeKey.replace(/\\/g, "/");
  const trimmed = normalized.replace(/\/+$/, "");
  const lastSlash = trimmed.lastIndexOf("/");
  if (lastSlash < 0) {
    return "";
  }
  return `${trimmed.slice(0, lastSlash + 1)}`;
}

async function avttGetFolderListingCached(folderPath = "") {
  const normalized = typeof folderPath === "string" ? folderPath : "";
  if (avttFolderListingCache.has(normalized)) {
    return avttFolderListingCache.get(normalized);
  }
  try {
    const listing = await getFolderListingFromS3(normalized);
    const normalizedListing = Array.isArray(listing) ? listing.slice() : [];
    avttFolderListingCache.set(normalized, normalizedListing);
    return normalizedListing;
  } catch (error) {
    console.warn("Failed to load folder listing for cache", folderPath, error);
    avttFolderListingCache.set(normalized, []);
    return [];
  }
}

async function avttGetEntryForKey(relativeKey) {
  const parentFolder = avttGetParentFolder(relativeKey);
  const listing = await avttGetFolderListingCached(parentFolder);
  const normalizedKey = `${window.PATREON_ID}/${relativeKey}`;
  return (
    listing.find((entry) => (entry?.Key || entry?.key) === normalizedKey) ||
    null
  );
}

function avttRegisterPendingUploadKey(relativeKey, size = 0) {
  const normalized = avttNormalizeRelativePath(relativeKey);
  if (!normalized) {
    return;
  }
  avttUpsertCacheEntry(normalized, size);
  if (avttIsHiddenSystemRelativeKey(normalized)) {
    return;
  }
  let parentFolder = avttGetParentFolder(normalized);
  while (parentFolder) {
    avttUpsertCacheEntry(parentFolder, 0);
    const nextParent = avttGetParentFolder(parentFolder);
    if (!nextParent || nextParent === parentFolder) {
      break;
    }
    parentFolder = nextParent;
  }
}

async function avttDoesObjectExist(relativeKey) {
  const entry = await avttGetEntryForKey(relativeKey);
  return Boolean(entry);
}

async function avttDeriveUniqueKey(originalKey) {
  const parentFolder = avttGetParentFolder(originalKey);
  const isFolder = /\/$/.test(originalKey);
  const relativeName = originalKey
    .slice(parentFolder.length)
    .replace(/\/+$/, "");
  const baseNameWithExt = relativeName || "item";
  const dotIndex = isFolder ? -1 : baseNameWithExt.lastIndexOf(".");
  const baseName =
    dotIndex >= 0 ? baseNameWithExt.slice(0, dotIndex) : baseNameWithExt;
  const extension =
    !isFolder && dotIndex >= 0 ? baseNameWithExt.slice(dotIndex) : "";
  let counter = 1;
  while (counter < 1000) {
    const candidateName = isFolder
      ? `${baseName} (${counter})/`
      : `${baseName} (${counter})${extension}`;
    const candidateKey = `${parentFolder}${candidateName}`;
    const exists = await avttDoesObjectExist(candidateKey);
    if (!exists) {
      avttRegisterPendingUploadKey(candidateKey);
      return candidateKey;
    }
    counter += 1;
  }
  throw new Error("Unable to generate a unique filename for the uploaded file.");
}

function avttEntryAppearsFolder(entry) {
  if (!entry || typeof entry !== "object") {
    return false;
  }
  if (entry.isFolder === true) {
    return true;
  }
  const keyCandidate = entry.Key || entry.key;
  if (typeof keyCandidate === "string" && keyCandidate.endsWith("/")) {
    return true;
  }
  const relativeKey =
    typeof keyCandidate === "string" ? avttExtractRelativeKey(keyCandidate) : "";
  return typeof relativeKey === "string" && relativeKey.endsWith("/");
}

async function avttResolveFolderDescendantConflicts(move, targetRootKey, conflictPolicy) {
  const skipDescendants = new Set();
  const additionalMoves = [];
  let activePolicy = conflictPolicy || null;

  const normalizedFrom = avttNormalizeFolderPath(move?.fromKey);
  const normalizedTarget = avttNormalizeFolderPath(targetRootKey);
  if (!normalizedFrom || !normalizedTarget) {
    return { skipDescendants, additionalMoves, conflictPolicy: activePolicy };
  }

  let sourceDescendants = [];
  try {
    sourceDescendants = await avttCollectDescendantEntries(normalizedFrom, {
      includeSelf: false,
    });
  } catch (error) {
    console.warn(
      "Failed to collect source descendants for conflict detection",
      move?.fromKey,
      error,
    );
    return { skipDescendants, additionalMoves, conflictPolicy: activePolicy };
  }

  if (!Array.isArray(sourceDescendants) || sourceDescendants.length === 0) {
    return { skipDescendants, additionalMoves, conflictPolicy: activePolicy };
  }

  let destinationDescendants = [];
  try {
    destinationDescendants = await avttCollectDescendantEntries(normalizedTarget, {
      includeSelf: true,
    });
  } catch (error) {
    console.warn(
      "Failed to collect destination descendants for conflict detection",
      targetRootKey,
      error,
    );
    destinationDescendants = [];
  }

  const destinationEntryMap = new Map();
  if (Array.isArray(destinationDescendants)) {
    for (const entry of destinationDescendants) {
      if (!entry || entry.synthetic) {
        continue;
      }
      if (avttEntryAppearsFolder(entry)) {
        continue;
      }
      const candidate = entry.key || entry.Key;
      const normalizedCandidate = avttNormalizeRelativePath(candidate);
      if (!normalizedCandidate) {
        continue;
      }
      destinationEntryMap.set(normalizedCandidate, entry);
    }
  }

  for (const entry of sourceDescendants) {
    if (!entry || entry.synthetic || entry.isFolder) {
      continue;
    }
    const sourceKey = avttNormalizeRelativePath(entry.key || entry.Key);
    if (!sourceKey || avttIsHiddenSystemRelativeKey(sourceKey)) {
      continue;
    }
    if (!sourceKey.startsWith(normalizedFrom)) {
      continue;
    }
    const relativeSuffix = sourceKey.slice(normalizedFrom.length);
    if (!relativeSuffix) {
      continue;
    }
    const targetKey = avttNormalizeRelativePath(`${normalizedTarget}${relativeSuffix}`);
    if (!targetKey) {
      continue;
    }

    let existingEntry = destinationEntryMap.get(targetKey) || null;
    if (!existingEntry) {
      try {
        existingEntry = await avttGetEntryForKey(targetKey);
      } catch (lookupError) {
        existingEntry = null;
      }
    }

    if (!existingEntry || avttEntryAppearsFolder(existingEntry)) {
      continue;
    }

    let action = "overwrite";
    if (activePolicy?.applyAll) {
      action = activePolicy.action;
    } else {
      const conflictResult = await avttPromptUploadConflict({
        fileName: targetKey,
      });
      if (!conflictResult || !conflictResult.action) {
        action = "skip";
      } else {
        action = conflictResult.action;
        if (conflictResult.applyAll) {
          activePolicy = {
            action,
            applyAll: true,
          };
        }
      }
    }

    if (action === "skip") {
      skipDescendants.add(sourceKey);
      continue;
    }

    if (action === "keepBoth") {
      let uniqueTargetKey = null;
      try {
        uniqueTargetKey = await avttDeriveUniqueKey(targetKey);
      } catch (deriveError) {
        console.error(
          "Failed to generate unique destination while resolving descendant conflict",
          targetKey,
          deriveError,
        );
        alert("Failed to generate a unique name. Skipping this item.");
        skipDescendants.add(sourceKey);
        continue;
      }
      const sizeValue = Number(entry.size);
      const normalizedSize = Number.isFinite(sizeValue) ? sizeValue : 0;
      avttRegisterPendingUploadKey(uniqueTargetKey, normalizedSize);
      additionalMoves.push({
        fromKey: sourceKey,
        toKey: uniqueTargetKey,
        isFolder: false,
        size: normalizedSize,
        overwrite: false,
      });
      skipDescendants.add(sourceKey);
      continue;
    }

    // overwrite: ensure entry not marked as skipped
    if (skipDescendants.has(sourceKey)) {
      skipDescendants.delete(sourceKey);
    }
  }

  return { skipDescendants, additionalMoves, conflictPolicy: activePolicy };
}

async function avttResolveMoveConflicts(moves) {
  const resolved = [];
  let conflictPolicy = null;

  for (const move of moves) {
    let targetKey = move.toKey;
    let action = "overwrite";
    let existingEntry = null;
    const isFolderMove =
      Boolean(move?.isFolder) || (typeof targetKey === "string" && /\/$/.test(targetKey));

    try {
      existingEntry = await avttGetEntryForKey(targetKey);
    } catch (error) {
      console.warn("Failed to inspect destination before move", error);
      existingEntry = null;
    }

    const exists = Boolean(existingEntry);
    const existingEntryAppearsFolder = isFolderMove && exists
      ? avttEntryAppearsFolder(existingEntry)
      : false;

    if (exists && !existingEntryAppearsFolder) {
      if (conflictPolicy?.applyAll) {
        action = conflictPolicy.action;
      } else {
        const conflictResult = await avttPromptUploadConflict({
          fileName: targetKey,
        });
        if (!conflictResult || !conflictResult.action) {
          action = "skip";
        } else {
          action = conflictResult.action;
          if (conflictResult.applyAll) {
            conflictPolicy = {
              action,
              applyAll: true,
            };
          }
        }
      }
    }

    if (action === "skip") {
      continue;
    }

    if (action === "keepBoth") {
      try {
        targetKey = await avttDeriveUniqueKey(targetKey);
      } catch (deriveError) {
        console.error("Failed to generate unique destination during move", deriveError);
        alert("Failed to generate a unique name. Skipping this item.");
        continue;
      }
    }

    const skipDescendants = new Set(
      Array.isArray(move?.skipDescendants)
        ? move.skipDescendants
            .map((candidate) => avttNormalizeRelativePath(candidate))
            .filter(Boolean)
        : [],
    );
    const additionalMoves = [];

    if (isFolderMove) {
      try {
        const descendantOutcome = await avttResolveFolderDescendantConflicts(
          move,
          targetKey,
          conflictPolicy,
        );
        if (descendantOutcome) {
          if ("conflictPolicy" in descendantOutcome) {
            conflictPolicy = descendantOutcome.conflictPolicy;
          }
          if (descendantOutcome.skipDescendants instanceof Set) {
            descendantOutcome.skipDescendants.forEach((key) => {
              const normalizedKey = avttNormalizeRelativePath(key);
              if (normalizedKey) {
                skipDescendants.add(normalizedKey);
              }
            });
          }
          if (
            Array.isArray(descendantOutcome.additionalMoves) &&
            descendantOutcome.additionalMoves.length
          ) {
            additionalMoves.push(...descendantOutcome.additionalMoves);
          }
        }
      } catch (descendantError) {
        console.warn(
          "Failed to resolve descendant conflicts during move",
          move?.fromKey,
          move?.toKey,
          descendantError,
        );
      }
    }

    avttRegisterPendingUploadKey(targetKey, Number(move.size) || 0);
    resolved.push({
      ...move,
      toKey: targetKey,
      overwrite: action === "overwrite" && exists,
      ...(skipDescendants.size ? { skipDescendants: Array.from(skipDescendants) } : {}),
    });
    if (additionalMoves.length) {
      resolved.push(...additionalMoves);
    }
  }

  return resolved;
}

async function avttPromptUploadConflict({ fileName }) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "avtt-conflict-overlay";
    const modal = document.createElement("div");
    modal.className = "avtt-conflict-modal";
    const safeName = avttEscapeHtml(fileName);
    modal.innerHTML = `
      <h3>File Already Exists</h3>
      <p>The file <strong>${safeName}</strong> already exists. What would you like to do?</p>
      <div class="avtt-conflict-apply-all">
        <input type="checkbox" id="avtt-conflict-apply-all" />
        <label for="avtt-conflict-apply-all">Apply this choice to all remaining conflicts</label>
      </div>
      <div class="avtt-conflict-modal-buttons">
        <button type="button" data-action="skip">Skip</button>
        <button type="button" data-action="keepBoth">Keep Both</button>
        <button type="button" data-action="overwrite">Overwrite</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const applyAllCheckbox = modal.querySelector("#avtt-conflict-apply-all");

    const cleanup = (result) => {
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
      resolve(result);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        cleanup({ action: "skip", applyAll: applyAllCheckbox?.checked || false });
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    modal
      .querySelectorAll("button[data-action]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const action = button.getAttribute("data-action");
          const applyAll = applyAllCheckbox?.checked || false;
          cleanup({ action, applyAll });
        });
      });

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        cleanup({ action: "skip", applyAll: applyAllCheckbox?.checked || false });
      }
    });
  });
}

function avttPromptTextDialog({
  title = "Input Required",
  message = "",
  defaultValue = "",
  placeholder = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "avtt-conflict-overlay";
    const modal = document.createElement("div");
    modal.className = "avtt-conflict-modal";
    const safeTitle = avttEscapeHtml(title);
    const safeMessage = message ? `<p>${avttEscapeHtml(message)}</p>` : "";
    modal.innerHTML = `
      <h3>${safeTitle}</h3>
      ${safeMessage}
      <input type="text" id="avtt-text-prompt-input" value="${avttEscapeHtml(defaultValue || "")}" placeholder="${avttEscapeHtml(placeholder || "")}" />
      <div class="avtt-conflict-modal-buttons avtt-modal-buttons">
        <button type="button" data-action="cancel">${avttEscapeHtml(cancelLabel)}</button>
        <button type="button" data-action="confirm">${avttEscapeHtml(confirmLabel)}</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector("#avtt-text-prompt-input");
    const cancelButton = modal.querySelector('button[data-action="cancel"]');
    const confirmButton = modal.querySelector('button[data-action="confirm"]');

    const cleanup = (value) => {
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
      resolve(value);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        cleanup(null);
      } else if (event.key === "Enter") {
        event.preventDefault();
        confirmButton.click();
      }
    };

    cancelButton.addEventListener("click", () => cleanup(null));
    confirmButton.addEventListener("click", () => cleanup(input.value));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        cleanup(null);
      }
    });
    document.addEventListener("keydown", onKeyDown, true);

    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  });
}

function avttCaptureDownload(invoker) {
  return new Promise((resolve, reject) => {
    const originalDownload = window.download;
    let timeoutId = null;
    let settled = false;

    const cleanup = (error) => {
      if (window.download === intercept) {
        window.download = originalDownload;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (error && !settled) {
        reject(error);
      }
    };

    const intercept = (data, filename, mimeType) => {
      settled = true;
      cleanup();
      resolve({ data, filename, mimeType });
    };

    window.download = intercept;

    const handleFailure = (error) => {
      cleanup(error || new Error("Export failed to produce a file."));
    };

    try {
      const result = invoker();
      if (result && typeof result.then === "function") {
        result.catch((error) => {
          if (!settled) {
            handleFailure(error);
          }
        });
      }
    } catch (error) {
      handleFailure(error);
      return;
    }

    timeoutId = setTimeout(() => {
      if (!settled) {
        handleFailure(new Error("Export timed out."));
      }
    }, 300000);
  });
}

async function avttHandleToolbarAction(action) {
  let handled = false;
  switch (action) {
    case "cut": {
      handled = avttCutSelectedFiles();
      break;
    }
    case "paste": {
      if (avttClipboardHasEntries()) {
        handled = Boolean(await avttHandlePasteFromClipboard(currentFolder));
      }
      break;
    }
    case "copy-path":
    case "copyPath": {
      handled = avttCopySelectedPathsToClipboard();
      break;
    }
    case "rename": {
      const selection = avttGetSelectedEntries();
      if (selection.length === 1) {
        handled = Boolean(
          await avttPromptRename(selection[0].key, selection[0].isFolder),
        );
      }
      break;
    }
    case "delete": {
      const selection = avttGetSelectedEntries();
      if (selection.length > 0) {
        await deleteFilesFromS3Folder(selection, activeFilePickerFilter);
        handled = true;
        avttUpdateSelectNonFoldersCheckbox();
      }
      break;
    }
    case "import": {
      const selection = avttGetSelectedEntries();
      if (selection.length > 0) {
        await avttImportSelectedFiles(selection);
        handled = true;
      }
      break;
    }
    case "openNewTab": {
      const selection = avttGetSelectedEntries();
      if (selection.length > 0) {
        const rawKey = selection[0].key
        const url = await getAvttStorageUrl(rawKey, true)

        if (!url) {
          throw new Error("File URL could not be generated.");
        }
        window.open(url, "_blank", "noopener,noreferrer");
      }
      try {

      } catch (error) {
        console.error("Failed to open file in new tab", error);
        alert(error?.message || "Failed to open the file in a new tab.");
      }
      handled = true;
      break;
    }
    case "forceOpen": {
      try {
        const selection = avttGetSelectedEntries();
        if (selection.length > 0) {
          const rawKey = selection[0].key
          const url = await getAvttStorageUrl(rawKey);
          if (!url) {
            throw new Error("File URL could not be generated.");
          }
          window.MB.sendMessage("custom/myVTT/open-url-embed", url)
          display_url_embeded(url);
        }
      } catch (error) {
        console.error("Failed to open file in new tab", error);
        alert(error?.message || "Failed to open the file in a new tab.");
      }
      handled = true;
      break;
    }
    case "forceOpen":
    case "open": {

      try {
        const selection = avttGetSelectedEntries();
        if (selection.length > 0) {
          const rawKey = selection[0].key
          const url = await getAvttStorageUrl(rawKey);
          if (!url) {
            throw new Error("File URL could not be generated.");
          }
          display_url_embeded(url);
          if (action == 'forceOpen')
            window.MB.sendMessage("custom/myVTT/open-url-embed", url)
        }
      } catch (error) {
        console.error("Failed to open file in new tab", error);
        alert(error?.message || "Failed to open the file in a new tab.");
      }
      handled = true;
      break;
    }
    case "sendToGamelog": {
      const selection = avttGetSelectedEntries();
      if (selection.length > 0) {
        let player = window.PLAYER_NAME;
        let image = window.PLAYER_IMG;
        if (window.DM && window.CURRENTLY_SELECTED_TOKENS.length > 0) {
          let id = window.CURRENTLY_SELECTED_TOKENS[0];
          let firstToken = window.TOKEN_OBJECTS[id];
          image = firstToken.options.imgsrc;
          player = window.CURRENTLY_SELECTED_TOKENS.map(id => window.TOKEN_OBJECTS[id].options.name).join(", ");
        }
        let data = {
          player: player,
          img: image,
          dmonly: false,
          language: $('#chat-language').val()
        };

        if (data.img?.startsWith('above-bucket-not-a-url')) {
          data.img = await getAvttStorageUrl(data.img, true);
        }


        const url = `above-bucket-not-a-url/${window.PATREON_ID}/${selection[0].key}`;
        const avttUrl = await getAvttStorageUrl(url, true)
        data.text = `
            <a class='chat-link' href='${avttUrl}' target='_blank' rel='noopener noreferrer'>${url}</a>
            <img width=100% class='magnify' src='${avttUrl}' href='${avttUrl}' alt='Chat Image' style='display: none'/>
            <video width=100% class='magnify' autoplay muted loop src='${avttUrl}' href='${avttUrl}' alt='Chat Video' style='display: none'/>
        `;
        window.MB.inject_chat(data);
      }
      handled = true;
    }
    default:
      break;
  }
  if (handled) {
    avttHideActionsMenu();
    avttHideExportMenu();
  }
  avttUpdateActionsMenuState();
  avttApplyClipboardHighlights();
}

function avttCutSelectedFiles() {
  const selections = avttGetSelectedEntries();
  if (!selections.length) {
    return false;
  }
  return avttSetClipboard(selections, AVTT_CLIPBOARD_MODE.CUT);
}

async function avttPasteFiles(destinationFolder) {
  if (!avttClipboardHasEntries()) {
    return false;
  }
  return await avttHandlePasteFromClipboard(
    typeof destinationFolder === "string" ? destinationFolder : currentFolder,
  );
}

async function avttImportSelectedFiles(selection) {
  const entries = Array.isArray(selection) ? selection : avttGetSelectedEntries();
  const csvFiles = entries.filter((e) => !e.isFolder && /\.csv$/i.test(e.key));
  if (csvFiles.length) {
    try { 
      build_import_loading_indicator('Importing CSV Files');

      for (const entry of csvFiles) {
        try {
          const url = await getAvttStorageUrl(`${PATREON_ID}/${entry.key}`);
          if (!url) continue;
          const resp = await fetch(url);
          if (!resp.ok) {
            console.warn('Failed to fetch CSV file for import', entry.key);
            continue;
          }
          const text = await resp.text();
          window.TRACK_LIBRARY.importCSV(text);
        } catch (err) {
          console.error('CSV Import failed for', entry.key, err);
        }
      }
      $('body>.import-loading-indicator').remove();
    }
    catch (e) {
        $('body>.import-loading-indicator').remove();
        console.error('CSV Import failed', e);
    }
  }

  const filesToImport = entries.filter((e) => !e.isFolder && /\.abovevtt$/i.test(e.key));
  if (!filesToImport.length) return;

  build_import_loading_indicator('Importing Files');


  window.__IMPORT_SCENES_BUFFER = [];

  for (const entry of filesToImport) {
    try {
      const url = await getAvttStorageUrl(`${PATREON_ID}/${entry.key}`);
      if (!url) continue;
      const resp = await fetch(url);
      if (!resp.ok) {
        console.warn('Failed to fetch file for import', entry.key);
        continue;
      }
      const text = await resp.text();

 
      await import_process_datafile_text(text);
     
    } catch (err) {
      console.error('Import failed for', entry.key, err);
    }
  }

  const scenes = window.__IMPORT_SCENES_BUFFER || [];
  try {
    if (scenes.length) {
      await AboveApi.migrateScenes(window.gameId, scenes);
    }
    
    $(".import-loading-indicator .loading-status-indicator__subtext").addClass('complete');
  
    setTimeout(() => {
      alert("Migration (hopefully) completed. You need to Re-Join AboveVTT");
      location.reload();
    }, 2000);
  } catch (err) {
    console.error('Migration failed after import', err);
    showError(err, 'cloud_migration failed');
  }
}

window.avttGetThumbnailPrefix = avttGetThumbnailPrefix;
window.avttApplyThumbnailPrefixToAboveBucket = avttApplyThumbnailPrefixToAboveBucket;
window.avttGetFileCacheFolder = avttGetFileCacheFolder;
window.avttGetFileCacheKey = avttGetFileCacheKey;
window.avttIsThumbnailRelativeKey = avttIsThumbnailRelativeKey;
window.avttIsFileCacheRelativeKey = avttIsFileCacheRelativeKey;
window.avttIsHiddenSystemRelativeKey = avttIsHiddenSystemRelativeKey;
window.avttCutSelectedFiles = avttCutSelectedFiles;
window.avttPasteFiles = avttPasteFiles;
window.avttClipboardHasEntries = avttClipboardHasEntries;

function avttEnsureContextMenu() {
  if (avttContextMenuState.element) {
    return avttContextMenuState.element;
  }
  const menu = document.createElement("div");
  menu.id = "avtt-file-context-menu";
  menu.className = "avtt-context-menu hidden";
  menu.innerHTML = `
    <button type="button" data-action="cut">Cut</button>
    <button type="button" data-action="paste">Paste</button>
    <button type="button" data-action="rename">Rename</button>
    <hr/>
    <button type="button" data-action="copyPath">Copy Path</button>
    <button type="button" data-action="import">Import</button>
    <hr/>
    <button type="button" data-action="sendToGamelog">Send To Gamelog</button>
    <button type="button" data-action="open">Display to Self</button>
    <button type="button" data-action="forceOpen">Display to Everyone</button>
    <button type="button" data-action="openNewTab">Open in New Tab</button>
    <hr/>
    <button type="button" data-action="delete">Delete</button>
  `;
  document.body.appendChild(menu);

  menu.addEventListener("click", async (event) => {
    const button = event.target;
    const action = button?.getAttribute("data-action");
    if (!action || button.disabled) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    await avttHandleContextAction(action);
    avttHideContextMenu();
  });

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!menu.contains(target)) {
        avttHideContextMenu();
      }
    },
    true,
  );

  document.addEventListener(
    "contextmenu",
    (event) => {
      const target = event.target;
      if (!menu.contains(target)) {
        avttHideContextMenu();
      }
    },
    true,
  );

  window.addEventListener("blur", () => {
    avttHideContextMenu();
  });

  avttContextMenuState.element = menu;
  return menu;
}

function avttHideContextMenu() {
  const menu = avttContextMenuState.element;
  if (menu) {
    menu.classList.add("hidden");
    menu.style.top = "-9999px";
    menu.style.left = "-9999px";
  }
  avttContextMenuState.targetPath = "";
  avttContextMenuState.isFolder = false;
  avttContextMenuState.displayName = "";
  avttContextMenuState.isImplicit = false;
  avttContextMenuState.rawKey = "";
}

function avttUpdateContextMenuState() {
  const menu = avttContextMenuState.element;
  if (!menu) {
    return;
  }
  const selection = avttGetSelectedEntries();
  const hasSelection = selection.length > 0;
  const pasteButton = menu.querySelector('button[data-action="paste"]');
  if (pasteButton) {
    pasteButton.disabled = !avttClipboardHasEntries();
  }
  const renameButton = menu.querySelector('button[data-action="rename"]');
  const cutButton = menu.querySelector('button[data-action="cut"]');
  const deleteButton = menu.querySelector('button[data-action="delete"]');
  const copyPathButton = menu.querySelector('button[data-action="copyPath"]');
  const hasExplicitTarget =
    Boolean(avttContextMenuState.targetPath) && !avttContextMenuState.isImplicit;
  if (renameButton) {
    renameButton.disabled = !hasExplicitTarget;
  }
  if (cutButton) {
    cutButton.disabled = !hasExplicitTarget;
  }
  if (deleteButton) {
    deleteButton.disabled = !hasExplicitTarget;
  }
  if (copyPathButton) {
    copyPathButton.disabled = !hasSelection;
  }
  const openNewTabButton = menu.querySelector('button[data-action="openNewTab"]');
  if (openNewTabButton) {
    openNewTabButton.disabled = !hasExplicitTarget || avttContextMenuState.isFolder;
  } 
  const openButton = menu.querySelector('button[data-action="open"]');
  if (openButton) {
    const hasAbovevtt = selection.some((e) => !e.isFolder && (/\.abovevtt$/i.test(e.key) || /\.csv$/i.test(e.key)));
    openButton.disabled = hasAbovevtt || !hasExplicitTarget || avttContextMenuState.isFolder;
  } 
  const forceOpenButton = menu.querySelector('button[data-action="forceOpen"]');
  if (forceOpenButton) {
    const hasAbovevtt = selection.some((e) => !e.isFolder && (/\.abovevtt$/i.test(e.key) || /\.csv$/i.test(e.key)));
    forceOpenButton.disabled = hasAbovevtt || !hasExplicitTarget || avttContextMenuState.isFolder;
  } 
  const importButton = menu.querySelector('button[data-action="import"]');
  if (importButton) {
    const hasAbovevtt = selection.some((e) => !e.isFolder && (/\.abovevtt$/i.test(e.key) || /\.csv$/i.test(e.key)));
    importButton.disabled = !hasAbovevtt;
  }
  const sendToGamelogButton = menu.querySelector('button[data-action="sendToGamelog"]');
  if (sendToGamelogButton) {
    const hasAbovevtt = selection.some((e) => !e.isFolder && (allowedVideoTypes.includes(getFileExtension(e.key)) || allowedImageTypes.includes(getFileExtension(e.key))));
    sendToGamelogButton.disabled = !hasAbovevtt;
  }
}

function avttOpenContextMenu(event, entry, options = {}) {
  const { ensureSelection = true, implicitTarget = false } = options;
  const menu = avttEnsureContextMenu();
  event.preventDefault();
  event.stopPropagation();

  let selection = [];
  if (entry && ensureSelection && entry.relativePath) {
    selection = avttEnsureSelectionIncludes(entry.relativePath, entry.isFolder);
  }
  avttContextMenuState.targetPath = entry?.relativePath || "";
  avttContextMenuState.isFolder = Boolean(entry?.isFolder);
  avttContextMenuState.displayName = entry?.displayName || "";
  avttContextMenuState.isImplicit = Boolean(implicitTarget || entry?.isImplicit);
  if (entry?.rawKey) {
    avttContextMenuState.rawKey = entry.rawKey;
  } else if (
    avttContextMenuState.targetPath &&
    typeof window !== "undefined" &&
    typeof window.PATREON_ID === "string"
  ) {
    avttContextMenuState.rawKey = `${window.PATREON_ID}/${avttContextMenuState.targetPath}`;
  } else {
    avttContextMenuState.rawKey = "";
  }

  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  menu.style.left = "-9999px";
  menu.style.top = "-9999px";
  menu.classList.remove("hidden");
  const menuRect = menu.getBoundingClientRect();
  let left = event.clientX;
  let top = event.clientY;
  if (left + menuRect.width > viewportWidth) {
    left = Math.max(0, viewportWidth - menuRect.width - 10);
  }
  if (top + menuRect.height > viewportHeight) {
    top = Math.max(0, viewportHeight - menuRect.height - 10);
  }

  menu.style.left = `${left + window.scrollX}px`;
  menu.style.top = `${top + window.scrollY}px`;
  avttUpdateContextMenuState();
  avttApplyClipboardHighlights();
  return selection;
}

async function avttHandleContextAction(action) {
  switch (action) {
    case "cut": {
      if (!avttContextMenuState.targetPath || avttContextMenuState.isImplicit) {
        return;
      }
      const selection = avttEnsureSelectionIncludes(
        avttContextMenuState.targetPath,
        avttContextMenuState.isFolder,
      );
      avttSetClipboard(selection, AVTT_CLIPBOARD_MODE.CUT);
      break;
    }
    case "paste": {
      /*if (avttContextMenuState.isImplicit && !avttContextMenuState.targetPath) {
        await avttHandlePasteFromClipboard(currentFolder);
      } else if (avttContextMenuState.isFolder) {
        await avttHandlePasteFromClipboard(avttContextMenuState.targetPath);
      } */
      await avttHandlePasteFromClipboard(currentFolder);
      
      break;
    }
    case "copyPath": {
      avttCopySelectedPathsToClipboard();
      break;
    }
    case "rename": {
      if (!avttContextMenuState.targetPath || avttContextMenuState.isImplicit) {
        return;
      }
      avttHideExportMenu();
      await avttRenameTarget();
      break;
    }
    case "delete": {
      if (!avttContextMenuState.targetPath || avttContextMenuState.isImplicit) {
        return;
      }
      avttHideExportMenu();
      const selection = avttEnsureSelectionIncludes(
        avttContextMenuState.targetPath,
        avttContextMenuState.isFolder,
      );
      if (selection.length === 0) {
        return;
      }
      await deleteFilesFromS3Folder(selection, activeFilePickerFilter);
      avttUpdateSelectNonFoldersCheckbox();
      avttUpdateActionsMenuState();
      avttApplyClipboardHighlights();
      break;
    }
    case "import": {
      if (!avttContextMenuState.targetPath || avttContextMenuState.isImplicit) {
        return;
      }
      const selection = avttEnsureSelectionIncludes(
        avttContextMenuState.targetPath,
        avttContextMenuState.isFolder,
      );
      if (selection.length === 0) return;
      await avttImportSelectedFiles(selection);
      break;
    }
    case "openNewTab": {
      if (
        !avttContextMenuState.targetPath ||
        avttContextMenuState.isImplicit ||
        avttContextMenuState.isFolder
      ) {
        return;
      }

      try {
        const rawKey = avttContextMenuState.rawKey 
          || (typeof window !== "undefined" && typeof window.PATREON_ID === "string"
            ? `${window.PATREON_ID}/${avttContextMenuState.targetPath}`
            : avttContextMenuState.targetPath);
        if (!rawKey) {
          throw new Error("File path is unavailable.");
        }
        const url = await getAvttStorageUrl(rawKey, true)

        if (!url) {
          throw new Error("File URL could not be generated.");
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.error("Failed to open file in new tab", error);
        alert(error?.message || "Failed to open the file in a new tab.");
      }
      break; 
    } 
    case "forceOpen": {
      if (
        !avttContextMenuState.targetPath ||
        avttContextMenuState.isImplicit ||
        avttContextMenuState.isFolder
      ) {
        return;
      }
      try {
        const rawKey =
          avttContextMenuState.rawKey ||
          (typeof window !== "undefined" && typeof window.PATREON_ID === "string"
            ? `${window.PATREON_ID}/${avttContextMenuState.targetPath}`
            : avttContextMenuState.targetPath);
        if (!rawKey) {
          throw new Error("File path is unavailable.");
        }
        const url = await getAvttStorageUrl(rawKey);
        if (!url) {
          throw new Error("File URL could not be generated.");
        }
        window.MB.sendMessage("custom/myVTT/open-url-embed", url)
        display_url_embeded(url);
      } catch (error) {
        console.error("Failed to open file in new tab", error);
        alert(error?.message || "Failed to open the file in a new tab.");
      }
      break;
    } 
        case "forceOpen":
        case "open": {
      if (
        !avttContextMenuState.targetPath ||
        avttContextMenuState.isImplicit ||
        avttContextMenuState.isFolder
      ) {
        return;
      }
      try {
        const rawKey =
          avttContextMenuState.rawKey ||
          (typeof window !== "undefined" && typeof window.PATREON_ID === "string"
            ? `${window.PATREON_ID}/${avttContextMenuState.targetPath}`
            : avttContextMenuState.targetPath);
        if (!rawKey) {
          throw new Error("File path is unavailable.");
        }
        const url = await getAvttStorageUrl(rawKey);
        if (!url) {
          throw new Error("File URL could not be generated.");
        }
        display_url_embeded(url);
        if(action == 'forceOpen')
          window.MB.sendMessage("custom/myVTT/open-url-embed", url)

      } catch (error) {
        console.error("Failed to open file in new tab", error);
        alert(error?.message || "Failed to open the file in a new tab.");
      }
      break;
    } 
    case "sendToGamelog": {
      if (
        !avttContextMenuState.targetPath ||
        avttContextMenuState.isImplicit ||
        avttContextMenuState.isFolder
      ) {
        return;
      }
      let player = window.PLAYER_NAME;
      let image = window.PLAYER_IMG;
      if (window.DM && window.CURRENTLY_SELECTED_TOKENS.length > 0) {
        let id = window.CURRENTLY_SELECTED_TOKENS[0];
        let firstToken = window.TOKEN_OBJECTS[id];
        image = firstToken.options.imgsrc;
        player = window.CURRENTLY_SELECTED_TOKENS.map(id => window.TOKEN_OBJECTS[id].options.name).join(", ");
      }
      let data = {
        player: player,
        img: image,
        dmonly: false,
        language: $('#chat-language').val()
      };

      if (data.img?.startsWith('above-bucket-not-a-url')) {
        data.img = await getAvttStorageUrl(data.img, true);
      }


      const url = `above-bucket-not-a-url/${window.PATREON_ID}/${avttContextMenuState.targetPath}`;
      const avttUrl = await getAvttStorageUrl(url, true)
      data.text = `
          <a class='chat-link' href='${avttUrl}' target='_blank' rel='noopener noreferrer'>${url}</a>
          <img width=100% class='magnify' src='${avttUrl}' href='${avttUrl}' alt='Chat Image' style='display: none'/>
          <video width=100% class='magnify' autoplay muted loop src='${avttUrl}' href='${avttUrl}' alt='Chat Video' style='display: none'/>
      `; 
      window.MB.inject_chat(data);

    }
    default:
      break;
  }
}

function avttComputeNewKeyForDestination(entry, destinationFolder) {
  const normalizedDestination = (destinationFolder && destinationFolder.endsWith("/")) ? destinationFolder
      : destinationFolder ? `${destinationFolder}/` : "";
  if (entry.isFolder) {
    const trimmed = entry.key.replace(/\/$/, "");
    const folderName = trimmed.split("/").pop();
    if (!folderName) {
      return null;
    }
    return `${normalizedDestination}${folderName}/`;
  }
  const fileName = entry.key.split("/").pop();
  if (!fileName) {
    return null;
  }
  return `${normalizedDestination}${fileName}`;
}

async function avttCollectDescendantEntries(folderKey, options = {}) {
  const { includeSelf = false } = options || {};
  const normalizedFolder = avttNormalizeFolderPath(folderKey);
  if (!normalizedFolder) {
    return [];
  }

  const entriesByKey = new Map();
  const order = [];

  const addEntry = (
    relativeKey,
    size,
    isFolder,
    { allowFolderSelf = false, synthetic = false } = {},
  ) => {
    const normalizedRelative = avttNormalizeRelativePath(relativeKey);
    if (!normalizedRelative) {
      return false;
    }
    const normalizedKey = isFolder
      ? avttNormalizeFolderPath(normalizedRelative)
      : normalizedRelative;
    if (!allowFolderSelf && normalizedKey === normalizedFolder) {
      return false;
    }
    const numericSize = Number.isFinite(Number(size)) ? Number(size) : undefined;
    const existing = entriesByKey.get(normalizedKey);
    if (existing) {
      if (existing.synthetic && !synthetic) {
        entriesByKey.set(normalizedKey, {
          key: normalizedKey,
          size: numericSize,
          isFolder: Boolean(isFolder),
          synthetic: false,
        });
      }
      return false;
    }
    entriesByKey.set(normalizedKey, {
      key: normalizedKey,
      size: numericSize,
      isFolder: Boolean(isFolder),
      synthetic: Boolean(synthetic),
    });
    order.push(normalizedKey);
    return true;
  };

  if (includeSelf) {
    addEntry(normalizedFolder, 0, true, { allowFolderSelf: true, synthetic: true });
  }

  let fulfilledFromAllFilesCache = false;
  if (Array.isArray(avttAllFilesCache) && avttAllFilesCache.length > 0) {
    const absolutePrefix = `${window.PATREON_ID}/${normalizedFolder}`;
    const beforeCount = order.length;
    for (const cachedEntry of avttAllFilesCache) {
      const absolute = cachedEntry?.Key || cachedEntry?.key;
      if (typeof absolute !== "string" || !absolute.startsWith(absolutePrefix)) {
        continue;
      }
      const relative = avttExtractRelativeKey(absolute);
      if (!relative) {
        continue;
      }
      const size = Number.isFinite(Number(cachedEntry?.Size))
        ? Number(cachedEntry.Size)
        : Number(cachedEntry?.size);
      const isFolder = relative.endsWith("/");
      addEntry(relative, size, isFolder, { allowFolderSelf: relative === normalizedFolder });
    }
    fulfilledFromAllFilesCache = order.length > beforeCount;
  }

  if (fulfilledFromAllFilesCache) {
    return order.map((key) => entriesByKey.get(key));
  }

  const getCachedFolderListing = (folderPath) => {
    const variants = [
      folderPath,
      typeof folderPath === "string" ? folderPath.replace(/\/$/, "") : folderPath,
      avttNormalizeFolderPath(folderPath),
    ];
    for (const variant of variants) {
      if (typeof variant !== "string") {
        continue;
      }
      if (avttFolderListingCache.has(variant)) {
        return avttFolderListingCache.get(variant);
      }
    }
    return null;
  };

  const visitedFolders = new Set();
  const fetchedFolders = new Set();
  const stack = [normalizedFolder];

  while (stack.length) {
    const currentFolder = stack.pop();
    if (!currentFolder || visitedFolders.has(currentFolder)) {
      continue;
    }
    visitedFolders.add(currentFolder);

    let listing = getCachedFolderListing(currentFolder);
    if ((!Array.isArray(listing) || listing.length === 0) && !fetchedFolders.has(currentFolder)) {
      try {
        listing = await getFolderListingFromS3(currentFolder);
        if (Array.isArray(listing) && listing.length > 0) {
          avttStoreFolderListing(currentFolder, listing);
        }
      } catch (error) {
        console.warn(
          "Failed to expand folder listing while preparing move payload",
          currentFolder,
          error,
        );
        fetchedFolders.add(currentFolder);
        continue;
      }
      fetchedFolders.add(currentFolder);
    }

    if (!Array.isArray(listing) || listing.length === 0) {
      continue;
    }

    for (const cachedEntry of listing) {
      const absolute = cachedEntry?.Key || cachedEntry?.key;
      if (typeof absolute !== "string") {
        continue;
      }
      const relative = avttExtractRelativeKey(absolute);
      if (!relative) {
        continue;
      }
      const size = Number.isFinite(Number(cachedEntry?.Size))
        ? Number(cachedEntry.Size)
        : Number(cachedEntry?.size);
      const isFolder = relative.endsWith("/");
      addEntry(relative, size, isFolder, { allowFolderSelf: relative === normalizedFolder });
      if (isFolder) {
        const childFolder = avttNormalizeFolderPath(relative);
        if (
          childFolder &&
          childFolder !== currentFolder &&
          !visitedFolders.has(childFolder)
        ) {
          stack.push(childFolder);
        }
      }
    }
  }

  return order.map((key) => entriesByKey.get(key));
}

function avttBuildThumbnailDescendants(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  const resultsByKey = new Map();
  const order = [];

  for (const entry of entries) {
    if (!entry || typeof entry.key !== "string") {
      continue;
    }
    const normalizedSourceKey = avttNormalizeRelativePath(entry.key);
    if (!normalizedSourceKey) {
      continue;
    }
    let thumbnailKey = avttGetThumbnailKeyFromRelative(normalizedSourceKey);
    if (!thumbnailKey) {
      continue;
    }

    const isFolder = Boolean(entry.isFolder);
    const synthetic = Boolean(entry.synthetic);

    if (isFolder) {
      thumbnailKey = avttNormalizeFolderPath(thumbnailKey);
    } else {
      if (!avttShouldGenerateThumbnail(getFileExtension(normalizedSourceKey))) {
        continue;
      }
      thumbnailKey = avttNormalizeRelativePath(thumbnailKey);
    }

    const existing = resultsByKey.get(thumbnailKey);
    const payload = {
      key: thumbnailKey,
      isFolder,
      ...(synthetic ? { synthetic: true } : {}),
    };

    if (!existing) {
      resultsByKey.set(thumbnailKey, payload);
      order.push(thumbnailKey);
      continue;
    }

    if (existing.synthetic && !payload.synthetic) {
      resultsByKey.set(thumbnailKey, { ...payload });
    }
  }

  return order.map((key) => resultsByKey.get(key));
}

function avttChunkMovePayloadItems(items, maxKeys = AVTT_MAX_MOVE_KEYS_PER_REQUEST) {
  const limit = Number.isFinite(Number(maxKeys)) && maxKeys > 0 ? Number(maxKeys) : 1000;
  if (!Array.isArray(items) || !items.length) {
    return [];
  }

  const expandedItems = [];

  for (const originalItem of items) {
    if (!originalItem || !originalItem.fromKey || !originalItem.toKey) {
      continue;
    }
    if (!originalItem.isFolder || !Array.isArray(originalItem.descendants)) {
      expandedItems.push({ ...originalItem });
      continue;
    }

    const normalizedFrom = avttNormalizeFolderPath(originalItem.fromKey);
    const sourceDescendantsRaw = Array.isArray(originalItem.descendants)
      ? originalItem.descendants
      : [];
    const destinationDescendantsRaw = Array.isArray(originalItem.destinationDescendants)
      ? originalItem.destinationDescendants
      : [];
    const hasSyntheticRoot = sourceDescendantsRaw.some((entry) => {
      if (!entry || !entry.synthetic) {
        return false;
      }
      const normalizedKey = avttNormalizeFolderPath(entry.key);
      return normalizedKey === normalizedFrom;
    });

    const sourceDescendants = sourceDescendantsRaw
      .filter((entry) => entry && !entry.synthetic)
      .map((entry) => ({ ...entry }));
    const destinationDescendants = destinationDescendantsRaw
      .filter((entry) => entry && !entry.synthetic)
      .map((entry) => ({ ...entry }));

    if (!sourceDescendants.length && !destinationDescendants.length) {
      expandedItems.push({
        ...originalItem,
        descendants: [],
        destinationDescendants: [],
        segmentIndex: 0,
        segmentTotal: 1,
        includeSyntheticRoot: hasSyntheticRoot,
      });
      continue;
    }

    let sourceIndex = 0;
    let destinationIndex = 0;
    const segments = [];
    while (
      sourceIndex < sourceDescendants.length ||
      destinationIndex < destinationDescendants.length
    ) {
      const segmentSource = [];
      const segmentDestination = [];
      let remaining = limit - 1;

      while (remaining > 0 && sourceIndex < sourceDescendants.length) {
        segmentSource.push({ ...sourceDescendants[sourceIndex] });
        sourceIndex += 1;
        remaining -= 1;
      }

      while (remaining > 0 && destinationIndex < destinationDescendants.length) {
        segmentDestination.push({ ...destinationDescendants[destinationIndex] });
        destinationIndex += 1;
        remaining -= 1;
      }

      segments.push({
        source: segmentSource,
        destination: segmentDestination,
      });
    }

    if (!segments.length) {
      segments.push({ source: [], destination: [] });
    }

    const totalSegments = segments.length;
    segments.forEach((segment, index) => {
      expandedItems.push({
        ...originalItem,
        descendants: segment.source,
        destinationDescendants: segment.destination,
        segmentIndex: index,
        segmentTotal: totalSegments,
        includeSyntheticRoot: hasSyntheticRoot && index === 0,
      });
    });
  }

  const chunks = [];
  let currentChunk = [];
  let currentCount = 0;

  const flush = () => {
    if (currentChunk.length) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentCount = 0;
    }
  };

  for (const item of expandedItems) {
    const descendantsCount = Array.isArray(item.descendants) ? item.descendants.length : 0;
    const destinationCount = Array.isArray(item.destinationDescendants)
      ? item.destinationDescendants.length
      : 0;
    const itemCost = item.isFolder ? 1 + descendantsCount + destinationCount : 1;

    if (itemCost > limit) {
      console.warn(
        "Move payload item exceeds maximum chunk size and could not be split further.",
        item.fromKey,
      );
    }

    if (currentCount + itemCost > limit && currentChunk.length) {
      flush();
    }

    currentChunk.push({
      ...item,
      descendants: Array.isArray(item.descendants)
        ? item.descendants.map((entry) => ({ ...entry }))
        : undefined,
      destinationDescendants: Array.isArray(item.destinationDescendants)
        ? item.destinationDescendants.map((entry) => ({ ...entry }))
        : undefined,
    });
    currentCount += itemCost;
  }

  flush();
  return chunks;
}

function avttComputeMovePayloadItemCost(item) {
  if (!item || typeof item !== "object") {
    return 0;
  }
  const isFolderMove = Boolean(item.isFolder);
  const descendantsCount = Array.isArray(item.descendants) ? item.descendants.length : 0;
  const destinationCount = Array.isArray(item.destinationDescendants)
    ? item.destinationDescendants.length
    : 0;
  if (!isFolderMove) {
    return 1;
  }
  return 1 + descendantsCount + destinationCount;
}

function avttCountMovePayloadEntries(items) {
  if (!Array.isArray(items) || !items.length) {
    return 0;
  }
  return items.reduce((sum, item) => sum + avttComputeMovePayloadItemCost(item), 0);
}

async function avttProcessMoveChunks(chunks, options = {}) {
  const normalizedChunks = Array.isArray(chunks)
    ? chunks
        .map((items, index) => ({
          items: Array.isArray(items) ? items : [],
          index,
        }))
        .filter((entry) => Array.isArray(entry.items) && entry.items.length > 0)
    : [];
  if (!normalizedChunks.length) {
    return { failures: [], completedEntries: 0 };
  }

  const totalChunks = normalizedChunks.length;
  const maxConcurrent = Number.isFinite(Number(options.concurrency))
    ? Math.max(1, Math.min(Number(options.concurrency), totalChunks))
    : Math.min(AVTT_MAX_CONCURRENT_MOVES, totalChunks);
  const chunkDelayMs =
    Number.isFinite(Number(options.chunkDelayMs)) && Number(options.chunkDelayMs) > 0
      ? Number(options.chunkDelayMs)
      : 0;
  const getEntryCount =
    typeof options.getEntryCount === "function"
      ? options.getEntryCount
      : (chunk) => avttCountMovePayloadEntries(chunk?.items);
  const onChunkSettled =
    typeof options.onChunkSettled === "function" ? options.onChunkSettled : null;
  const signal = options.signal;
  const createAbortError = () => {
    const reason = signal?.reason || "Aborted";
    try {
      return new DOMException(reason, "AbortError");
    } catch (domExceptionError) {
      const abortError = new Error(reason);
      abortError.name = "AbortError";
      return abortError;
    }
  };
  const checkAbort = () => {
    if (signal?.aborted) {
      throw createAbortError();
    }
  };

  let nextIndex = 0;
  let completedEntries = 0;
  const failures = [];

  const worker = async () => {
    while (nextIndex < totalChunks) {
      checkAbort();
      const currentIndex = nextIndex;
      nextIndex += 1;
      const chunk = normalizedChunks[currentIndex];
      if (!chunk || !Array.isArray(chunk.items) || !chunk.items.length) {
        continue;
      }

      const chunkLabel = totalChunks > 1 ? `${chunk.index + 1}/${totalChunks}` : null;
      let increment = 0;
      try {
        await avttSendMoveChunk(chunk.items, options.operation || "move", {
          chunkLabel,
          isThumbnail: options.isThumbnail === true,
          signal,
        });
        increment = Number(getEntryCount(chunk, null)) || 0;
        if (increment > 0) {
          completedEntries += increment;
        }
        if (onChunkSettled) {
          await onChunkSettled({
            chunk,
            chunkLabel,
            status: "fulfilled",
            increment,
          });
        }
      } catch (error) {
        if (error?.name === "AbortError") {
          throw error;
        }
        const normalizedError =
          error instanceof Error ? error : new Error(String(error ?? "Failed to move item(s)."));
        increment = Number(getEntryCount(chunk, normalizedError)) || 0;
        if (increment > 0) {
          completedEntries += increment;
        }
        failures.push({ chunk, error: normalizedError });
        if (onChunkSettled) {
          await onChunkSettled({
            chunk,
            chunkLabel,
            status: "rejected",
            error: normalizedError,
            increment,
          });
        }
      }

      checkAbort();
      if (chunkDelayMs > 0) {
        await avttDelay(chunkDelayMs);
      }
    }
  };

  const workers = [];
  for (let i = 0; i < maxConcurrent; i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);
  checkAbort();

  return {
    failures,
    completedEntries,
  };
}

async function avttSendMoveChunk(
  items,
  operation,
  {
    chunkLabel = null,
    depth = 0,
    maxDepth = 4,
    isThumbnail = false,
    signal = null,
  } = {},
) {
  if (!Array.isArray(items) || !items.length) {
    return;
  }

  const createAbortError = () => {
    const reason = signal?.reason || "Aborted";
    try {
      return new DOMException(reason, "AbortError");
    } catch (domExceptionError) {
      const abortError = new Error(reason);
      abortError.name = "AbortError";
      return abortError;
    }
  };
  if (signal?.aborted) {
    throw createAbortError();
  }

  const requestUrl = `${AVTT_S3}?action=move`;
  const actionText = isThumbnail ? "update thumbnail(s)" : "move item(s)";
  const chunkText = chunkLabel ? ` (${chunkLabel})` : "";

  const splitAndRequeue = async () => {
    if (signal?.aborted) {
      throw createAbortError();
    }
    if (items.length <= 1 || depth >= maxDepth) {
      throw new Error(`Failed to ${actionText}${chunkText}.`);
    }
    const midpoint = Math.ceil(items.length / 2);
    const firstLabel = chunkLabel ? `${chunkLabel} (part 1)` : null;
    const secondLabel = chunkLabel ? `${chunkLabel} (part 2)` : null;
    await avttSendMoveChunk(items.slice(0, midpoint), operation, {
      chunkLabel: firstLabel,
      depth: depth + 1,
      maxDepth,
      isThumbnail,
      signal,
    });
    await avttDelay(250 + depth * 100);
    if (signal?.aborted) {
      throw createAbortError();
    }
    await avttSendMoveChunk(items.slice(midpoint), operation, {
      chunkLabel: secondLabel,
      depth: depth + 1,
      maxDepth,
      isThumbnail,
      signal,
    });
  };

  const requestBody = {
    user: window.PATREON_ID,
    items,
    operation,
  };
  const requestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal,
  };

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      throw createAbortError();
    }
    let response;
    try {
      response = await avttFetchWithRetry(requestUrl, requestInit, {
        retries: 4,
        baseDelay: 700,
        maxDelay: 8000,
        jitter: 0.45,
      });
    } catch (error) {
      if (items.length > 1 && depth < maxDepth) {
        await avttDelay(300 * (attempt + 1));
        if (signal?.aborted) {
          throw createAbortError();
        }
        await splitAndRequeue();
        return;
      }
      if (attempt < maxAttempts - 1) {
        await avttDelay(600 * (attempt + 1));
        if (signal?.aborted) {
          throw createAbortError();
        }
        continue;
      }
      const message =
        error?.message && error.message !== "Failed to fetch"
          ? error.message
          : `Failed to ${actionText}${chunkText}.`;
      throw new Error(message);
    }

    let json = null;
    try {
      json = await response.json();
    } catch (parseError) {
      json = null;
    }

    if (response.ok && json?.moved) {
      return;
    }

    const status = Number(response?.status) || 0;
    if ([429, 500, 502, 503, 504].includes(status) && items.length > 1 && depth < maxDepth) {
      await avttDelay(300 * (attempt + 1));
      await splitAndRequeue();
      return;
    }

    if (attempt < maxAttempts - 1) {
      await avttDelay(600 * (attempt + 1));
      continue;
    }

    const message =
      json?.message && typeof json.message === "string"
        ? json.message
        : `Failed to ${actionText}${chunkText}.`;
    throw new Error(message);
  }
}

async function avttMoveEntries(moves, options = {}) {
  const fileListingSection = document.getElementById("file-listing-section");
  let appendedLoadingIndicator = null;

  const removeLoadingIndicator = () => {
    if (appendedLoadingIndicator && appendedLoadingIndicator.length) {
      appendedLoadingIndicator.remove();
    }
    appendedLoadingIndicator = null;
  };
  const validMoves = Array.isArray(moves)
    ? moves.filter(
        (move) =>
          move &&
          move.fromKey &&
          move.toKey &&
          move.fromKey !== move.toKey &&
          move.fromKey !== `${move.toKey}/` &&
          move.toKey !== `${move.fromKey}/`,
      )
    : [];
  if (validMoves.length === 0) {
    removeLoadingIndicator();
    return;
  }
  let aborted = false;
  let indicatorMode = AVTT_OPERATION_INDICATOR_MODES.MOVE;
  let abortController = null;
  let signal = null;
  let cancelCompletionMessage = "Operation Cancelled";
  let cancelButtonTitle = "Cancel Operation";
  let cancelHandler = () => {};
  let abortReason = "";
  let ensureNotAborted = () => {};
  try {
    const resolvedMoves = await avttResolveMoveConflicts(validMoves);
    if (!resolvedMoves.length) {
      if (options.clearClipboard) {
        avttClearClipboard();
      }
      avttApplyClipboardHighlights();
      avttUpdateSelectNonFoldersCheckbox();
      avttUpdateActionsMenuState();
      return;
    }
    const operation =
      options.operation === "copy" || options.operation === "move"
        ? options.operation
        : "move";
    const progressLabelSingular =
      typeof options.progressLabelSingular === "string" && options.progressLabelSingular.trim()
        ? options.progressLabelSingular.trim()
        : null;
    const progressLabelPlural =
      typeof options.progressLabelPlural === "string" && options.progressLabelPlural.trim()
        ? options.progressLabelPlural.trim()
        : null;
    const completionMessageOverride =
      typeof options.completionMessage === "string" && options.completionMessage.trim()
        ? options.completionMessage.trim()
        : null;
    indicatorMode =
      options.indicatorMode === AVTT_OPERATION_INDICATOR_MODES.RENAME
        ? AVTT_OPERATION_INDICATOR_MODES.RENAME
        : AVTT_OPERATION_INDICATOR_MODES.MOVE;
    if (indicatorMode === AVTT_OPERATION_INDICATOR_MODES.RENAME) {
      if (avttRenameAbortController && avttRenameAbortController.signal && !avttRenameAbortController.signal.aborted) {
        try { avttRenameAbortController.abort("Replaced by new rename operation."); } catch {}
      }
      avttRenameAbortController = new AbortController();
    } else {
      if (avttMoveAbortController && avttMoveAbortController.signal && !avttMoveAbortController.signal.aborted) {
        try { avttMoveAbortController.abort("Replaced by new move operation."); } catch {}
      }
      avttMoveAbortController = new AbortController();
    }
    abortController =
      indicatorMode === AVTT_OPERATION_INDICATOR_MODES.RENAME
        ? avttRenameAbortController
        : avttMoveAbortController;
    signal = abortController?.signal || null;
    const createAbortError = () => {
      const reason = signal?.reason || "Aborted";
      try { return new DOMException(reason, "AbortError"); }
      catch {
        const abortError = new Error(reason);
        abortError.name = "AbortError";
        return abortError;
      }
    };
    ensureNotAborted = () => {
      if (signal?.aborted) {
        throw createAbortError();
      }
    };
    abortReason =
      indicatorMode === AVTT_OPERATION_INDICATOR_MODES.RENAME
        ? "User cancelled rename operation."
        : operation === "copy"
          ? "User cancelled copy operation."
          : "User cancelled move operation.";
    cancelButtonTitle =
      indicatorMode === AVTT_OPERATION_INDICATOR_MODES.RENAME
        ? "Cancel Rename"
        : operation === "copy"
          ? "Cancel Copy"
          : "Cancel Move";
    cancelCompletionMessage =
      indicatorMode === AVTT_OPERATION_INDICATOR_MODES.RENAME
        ? "Rename Cancelled"
        : operation === "copy"
          ? "Copy Cancelled"
          : "Move Cancelled";
    cancelHandler = () => {
      if (!signal?.aborted) {
        try { abortController.abort(abortReason); } catch { }
      }
    };
    ensureNotAborted();
    const folderDescendantsCache = new Map();
    const resolveFolderDescendants = async (folderKey) => {
      const normalized = avttNormalizeFolderPath(folderKey);
      if (!normalized) {
        return [];
      }
      if (folderDescendantsCache.has(normalized)) {
        return folderDescendantsCache.get(normalized);
      }
      const entries = await avttCollectDescendantEntries(normalized, { includeSelf: true });
      folderDescendantsCache.set(normalized, entries);
      return entries;
    };
    const buildDescendantPayload = (entries) =>
      entries.map((entry) => {
        const payload = {
          key: entry.key,
          isFolder: Boolean(entry.isFolder),
        };
        if (Number.isFinite(Number(entry.size))) {
          payload.size = Number(entry.size);
        }
        if (entry.synthetic) {
          payload.synthetic = true;
        }
        return payload;
      });

    const moveItems = [];
    const thumbnailMoves = [];
    const seenThumbnailMoves = new Set();

    for (const move of resolvedMoves) {
      ensureNotAborted();
      const isFolderMove = Boolean(move.isFolder);
      let descendantEntries = null;
      if (isFolderMove) {
        const collected = await resolveFolderDescendants(move.fromKey);
        ensureNotAborted();
        descendantEntries = Array.isArray(collected)
          ? collected.map((entry) => ({ ...entry }))
          : [];
      }
      let destinationDescendants = null;
      if (isFolderMove && move.overwrite) {
        try {
          const collectedDestination = await avttCollectDescendantEntries(move.toKey, {
            includeSelf: true,
          });
          destinationDescendants = Array.isArray(collectedDestination)
            ? collectedDestination.map((entry) => ({ ...entry }))
            : [];
        } catch (collectDestinationError) {
          console.warn(
            "Failed to collect destination descendants while preparing move payload",
            move.toKey,
            collectDestinationError,
          );
          destinationDescendants = [];
        }
        ensureNotAborted();
      }

      const skipDescendantKeysRaw = Array.isArray(move?.skipDescendants)
        ? move.skipDescendants
        : [];
      if (skipDescendantKeysRaw.length) {
        const skipSourceSet = new Set(
          skipDescendantKeysRaw
            .map((value) => avttNormalizeRelativePath(value))
            .filter(Boolean),
        );
        if (skipSourceSet.size > 0) {
          if (Array.isArray(descendantEntries) && descendantEntries.length) {
            descendantEntries = descendantEntries.filter((entry) => {
              const candidate = avttNormalizeRelativePath(entry?.key || entry?.Key);
              return candidate ? !skipSourceSet.has(candidate) : true;
            });
          }
          if (Array.isArray(destinationDescendants) && destinationDescendants.length) {
            const normalizedFromRoot = avttNormalizeFolderPath(move.fromKey);
            const normalizedToRoot = avttNormalizeFolderPath(move.toKey);
            const skipDestinationSet = new Set();
            if (normalizedFromRoot && normalizedToRoot) {
              skipSourceSet.forEach((sourceKey) => {
                if (sourceKey.startsWith(normalizedFromRoot)) {
                  const suffix = sourceKey.slice(normalizedFromRoot.length);
                  const destCandidate = avttNormalizeRelativePath(
                    `${normalizedToRoot}${suffix}`,
                  );
                  if (destCandidate) {
                    skipDestinationSet.add(destCandidate);
                  }
                }
              });
            }
            destinationDescendants = destinationDescendants.filter((entry) => {
              const candidate = avttNormalizeRelativePath(entry?.key || entry?.Key);
              return candidate ? !skipDestinationSet.has(candidate) : true;
            });
          }
        }
      }

      let descendantRelativeKeySet = null;
      if (isFolderMove && Array.isArray(descendantEntries)) {
        const normalizedFromRoot = avttNormalizeFolderPath(move.fromKey);
        if (normalizedFromRoot) {
          descendantRelativeKeySet = new Set([""]);
          descendantEntries.forEach((entry) => {
            const rawKey = avttNormalizeRelativePath(entry?.key || entry?.Key);
            if (!rawKey) {
              return;
            }
            if (rawKey === normalizedFromRoot) {
              descendantRelativeKeySet.add("");
              return;
            }
            if (!rawKey.startsWith(normalizedFromRoot)) {
              return;
            }
            const suffix = rawKey.slice(normalizedFromRoot.length);
            descendantRelativeKeySet.add(suffix);
          });
        }
      }

      if (
        isFolderMove &&
        descendantRelativeKeySet &&
        Array.isArray(destinationDescendants) &&
        destinationDescendants.length
      ) {
        const normalizedToRoot = avttNormalizeFolderPath(move.toKey);
        if (normalizedToRoot) {
          destinationDescendants = destinationDescendants.filter((entry) => {
            const rawKey = avttNormalizeRelativePath(entry?.key || entry?.Key);
            if (!rawKey || !rawKey.startsWith(normalizedToRoot)) {
              return false;
            }
            const suffix = rawKey.slice(normalizedToRoot.length);
            return descendantRelativeKeySet.has(suffix);
          });
        }
      }

      const moveItem = {
        fromKey: move.fromKey,
        toKey: move.toKey,
        isFolder: Boolean(move.isFolder),
        overwrite: Boolean(move.overwrite),
      };
      if (Array.isArray(descendantEntries) && descendantEntries.length) {
        moveItem.descendants = buildDescendantPayload(descendantEntries);
      }
      if (Array.isArray(destinationDescendants) && destinationDescendants.length) {
        moveItem.destinationDescendants = buildDescendantPayload(destinationDescendants);
      }
      moveItems.push(moveItem);

      let fromThumbnailKey = null;
      let toThumbnailKey = null;
      let thumbnailDescendants = null;

      if (isFolderMove) {
        fromThumbnailKey = avttGetThumbnailKeyFromRelative(move.fromKey);
        toThumbnailKey = avttGetThumbnailKeyFromRelative(move.toKey);
        if (Array.isArray(descendantEntries) && descendantEntries.length) {
          thumbnailDescendants = avttBuildThumbnailDescendants(descendantEntries);
        }
      } else if (avttShouldGenerateThumbnail(getFileExtension(move.fromKey))) {
        fromThumbnailKey = avttGetThumbnailKeyFromRelative(move.fromKey);
        toThumbnailKey = avttGetThumbnailKeyFromRelative(move.toKey);
      }
      ensureNotAborted();

      if (!fromThumbnailKey || !toThumbnailKey || fromThumbnailKey === toThumbnailKey) {
        continue;
      }

      const signature = `${fromThumbnailKey}|${toThumbnailKey}`;
      if (seenThumbnailMoves.has(signature)) {
        continue;
      }
      seenThumbnailMoves.add(signature);

      const thumbnailItem = {
        fromKey: fromThumbnailKey,
        toKey: toThumbnailKey,
        isFolder: isFolderMove,
        overwrite: Boolean(move.overwrite),
      };
      if (isFolderMove && Array.isArray(thumbnailDescendants) && thumbnailDescendants.length) {
        thumbnailItem.descendants = buildDescendantPayload(thumbnailDescendants);
      }
      thumbnailMoves.push(thumbnailItem);
    }

    ensureNotAborted();
    const moveItemChunks = avttChunkMovePayloadItems(
      moveItems,
      AVTT_MAX_MOVE_KEYS_PER_REQUEST,
    );
    if (!moveItemChunks.length) {
      throw new Error("No move items available for processing.");
    }

    const totalMovePayloadCount = moveItemChunks.reduce(
      (sum, chunkItems) => sum + avttCountMovePayloadEntries(chunkItems),
      0,
    );
    let moveProgressCount = 0;
    const moveIndicatorLabel = (() => {
      const defaultSingular = operation === "copy" ? "Copying Item" : "Moving Item";
      const defaultPlural = operation === "copy" ? "Copying Items" : "Moving Items";
      if (progressLabelSingular || progressLabelPlural) {
        if (totalMovePayloadCount === 1) {
          return progressLabelSingular || progressLabelPlural || defaultSingular;
        }
        return progressLabelPlural || progressLabelSingular || defaultPlural;
      }
      return totalMovePayloadCount === 1 ? defaultSingular : defaultPlural;
    })();
    if (totalMovePayloadCount > 0) {
      avttShowOperationProgressIndicator(indicatorMode, {
        label: moveIndicatorLabel,
        currentDisplay: 0,
        total: totalMovePayloadCount,
        showCancelButton: true,
        cancelButtonTitle,
        cancelButtonLabel: "X",
        cancelHandler,
      });
    }

    const moveChunkResult = await avttProcessMoveChunks(moveItemChunks, {
      operation,
      concurrency: AVTT_MAX_CONCURRENT_MOVES,
      signal,
      getEntryCount: (chunk) => avttCountMovePayloadEntries(chunk.items),
      onChunkSettled: async ({ increment }) => {
        if (signal?.aborted || totalMovePayloadCount <= 0) {
          return;
        }
        const normalizedIncrement = Number.isFinite(Number(increment)) ? Number(increment) : 0;
        if (normalizedIncrement > 0) {
          moveProgressCount = Math.min(
            moveProgressCount + normalizedIncrement,
            totalMovePayloadCount,
          );
        }
        const moveDisplayValue =
          totalMovePayloadCount > 0
            ? Math.min(Math.max(moveProgressCount, 0), totalMovePayloadCount)
            : Math.max(moveProgressCount, 0);
        avttShowOperationProgressIndicator(indicatorMode, {
          label: moveIndicatorLabel,
          currentDisplay: moveDisplayValue,
          total: totalMovePayloadCount,
          showCancelButton: true,
          cancelButtonTitle,
          cancelButtonLabel: "X",
          cancelHandler,
        });
      },
    });
    ensureNotAborted();
    const chunkFailures = Array.isArray(moveChunkResult?.failures) ? moveChunkResult.failures : [];
    const refreshPath =
      typeof options.refreshPath === "string" ? options.refreshPath : currentFolder;

    if (operation === "move") {
      for (const move of resolvedMoves) {
        ensureNotAborted();
        const size = Number(move.size) || 0;
        if (move.isFolder) {
          avttRemoveCacheEntry(move.fromKey);
          avttMoveFolderCaches(move.fromKey, move.toKey);
        } else {
          avttRemoveCacheEntry(move.fromKey);
        }
        avttRegisterPendingUploadKey(move.toKey, size);
      }
    } else {
      for (const move of resolvedMoves) {
        ensureNotAborted();
        const size = Number(move.size) || 0;
        if (move.isFolder) {
          avttCopyFolderCaches(move.fromKey, move.toKey);
        }
        avttRegisterPendingUploadKey(move.toKey, size);
      }
    }

    if (thumbnailMoves.length) {
      ensureNotAborted();
      const thumbnailChunks = avttChunkMovePayloadItems(
        thumbnailMoves,
        AVTT_MAX_MOVE_KEYS_PER_REQUEST,
      );
      const thumbnailResult = await avttProcessMoveChunks(thumbnailChunks, {
        operation,
        concurrency: AVTT_MAX_CONCURRENT_MOVES,
        isThumbnail: true,
        signal,
      });
      ensureNotAborted();
      if (Array.isArray(thumbnailResult?.failures) && thumbnailResult.failures.length > 0) {
        const [firstThumbnailFailure] = thumbnailResult.failures;
        console.warn(
          "Thumbnail move/copy request failed",
          firstThumbnailFailure?.error || thumbnailResult.failures,
        );
      }
    }

    ensureNotAborted();
    await Promise.resolve(
      refreshFiles(
        refreshPath,
        true,
        undefined,
        undefined,
        activeFilePickerFilter,
        { useCache: true, revalidate: false },
      ),
    );
    if (totalMovePayloadCount > 0) {
      const completionMessage =
        completionMessageOverride ||
        (operation === "copy" ? "Copy Complete" : "Move Complete");
      avttShowOperationComplete(indicatorMode, completionMessage, 1500);
    } else {
      avttHideOperationIndicator(indicatorMode);
    }
    if (options.clearClipboard) {
      avttClearClipboard();
    } else {
      avttApplyClipboardHighlights();
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      aborted = true;
    } else {
      console.error("Failed to move entries", error);
      avttHideOperationIndicator(indicatorMode);
      const normalizedError =
        error instanceof Error ? error : new Error(String(error ?? "Failed to move item(s)."));
      if (options?.suppressErrorAlert !== true) {
        alert(normalizedError.message || "Failed to move item(s).");
      }
      if (options?.bubbleOnError) {
        throw normalizedError;
      }
    }
  } finally {
    if (indicatorMode === AVTT_OPERATION_INDICATOR_MODES.RENAME) {
      if (avttRenameAbortController === abortController) {
        avttRenameAbortController = null;
      }
    } else if (indicatorMode === AVTT_OPERATION_INDICATOR_MODES.MOVE) {
      if (avttMoveAbortController === abortController) {
        avttMoveAbortController = null;
      }
    }
    removeLoadingIndicator();
  }
  if (aborted) {
    const indicatorElement = avttGetOperationIndicatorElement(indicatorMode);
    if (indicatorElement && indicatorElement.style.display !== "none") {
      avttShowOperationComplete(indicatorMode, cancelCompletionMessage, 800);
    } else {
      avttHideOperationIndicator(indicatorMode);
    }
    return;
  }
}

async function avttHandlePasteFromClipboard(destinationFolder = currentFolder) {
  if (!avttClipboardHasEntries()) {
    return;
  }
  const moves = [];
  for (const entry of avttClipboard.items) {
    if (
      entry.isFolder &&
      destinationFolder &&
      destinationFolder.startsWith(entry.key)
    ) {
      alert("Cannot paste a folder inside itself.");
      return;
    }
    const newKey = avttComputeNewKeyForDestination(entry, destinationFolder);
    if (!newKey || newKey === entry.key) {
      continue;
    }
    moves.push({
      fromKey: entry.key,
      toKey: newKey,
      isFolder: entry.isFolder,
      size: Number(entry.size) || 0,
    });
  }
  if (moves.length === 0) {
    return;
  }
  const operation = avttClipboard.mode === AVTT_CLIPBOARD_MODE.COPY ? "copy" : "move";
  await avttMoveEntries(moves, {
    operation,
    clearClipboard: operation === "move",
    refreshPath: destinationFolder || currentFolder,
  });
  return true;
}

async function avttPromptRename(path, isFolder) {
  if (!path) {
    return false;
  }
  const normalizedPath = isFolder ? path.replace(/\/$/, "") : path;
  const baseName = normalizedPath.split("/").pop() || "";
  const parentPath = (() => {
    const idx = normalizedPath.lastIndexOf("/");
    return idx >= 0 ? `${normalizedPath.slice(0, idx + 1)}` : "";
  })();
  let lastSuggestedName = baseName;

  while (true) {
    const promptValue = await avttPromptTextDialog({
      title: isFolder ? "Rename Folder" : "Rename File",
      message: `Enter a new name for "${baseName}".`,
      defaultValue: lastSuggestedName,
      confirmLabel: "Rename",
    });
    if (promptValue === null || promptValue === undefined) {
      return false;
    }
    const trimmedName = String(promptValue).trim();
    if (!trimmedName || trimmedName === baseName) {
      return false;
    }
    if (/[\\/]/.test(trimmedName)) {
      alert("Names cannot contain slashes.");
      lastSuggestedName = trimmedName;
      continue;
    }
    const newKey = `${parentPath}${trimmedName}${isFolder ? "/" : ""}`;
    if (newKey === path) {
      return false;
    }
    if (isFolder && newKey.startsWith(`${path}`)) {
      alert("Cannot rename a folder into its own sub-path.");
      lastSuggestedName = trimmedName;
      continue;
    }
    try {
      await avttMoveEntries(
        [{ fromKey: path, toKey: newKey, isFolder }],
        {
          operation: "move",
          indicatorMode: AVTT_OPERATION_INDICATOR_MODES.RENAME,
          clearClipboard: false,
          progressLabelSingular: "Renaming Item",
          progressLabelPlural: "Renaming Items",
          completionMessage: "Rename Complete",
          suppressErrorAlert: true,
          bubbleOnError: true,
        },
      );
      return true;
    } catch (error) {
      const message = error?.message ? String(error.message) : "Failed to rename item(s).";
      if (/already exists/i.test(message)) {
        alert("An item with that name already exists. Please choose a different name.");
        lastSuggestedName = trimmedName;
        continue;
      }
      alert(message);
      return false;
    }
  }
}

async function avttRenameTarget() {
  if (!avttContextMenuState.targetPath || avttContextMenuState.isImplicit) {
    return;
  }
  await avttPromptRename(
    avttContextMenuState.targetPath,
    avttContextMenuState.isFolder,
  );
}

function avttHandleDragStart(event, entry) {
  avttHideContextMenu();
  const selection = avttEnsureSelectionIncludes(entry.relativePath, entry.isFolder);
  avttDragItems = selection.map((item) => ({ ...item }));
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    try {
      event.dataTransfer.setData(
        "application/json",
        JSON.stringify(avttDragItems.map((item) => item.key)),
      );
    } catch (error) {
      event.dataTransfer.setData(
        "text/plain",
        avttDragItems.map((item) => item.key).join(","),
      );
    }
    try {
      event.dataTransfer.setData("text/avtt-entry", "1");
    } catch (e) {

    }
  }
  for (const item of avttDragItems) {
    const row = avttFindRowByPath(item.key);
    if (row) {
      row.classList.add("avtt-cut-row");
    }
  }
  return avttDragItems;
}

function avttHandleDragEnd() {
  const rows = $("#file-listing tr.avtt-file-row");
  rows.toggleClass("avtt-dragging avtt-drop-target", false);
  avttDragItems = null;
  avttApplyClipboardHighlights();
}

function avttCanDropOnFolder(destinationPath) {
  if (!Array.isArray(avttDragItems) || avttDragItems.length === 0) {
    return false;
  }
  return !avttDragItems.some((item) => {
    if (item.key === destinationPath) {
      return true;
    }
    if (item.isFolder && destinationPath.startsWith(item.key)) {
      return true;
    }
    return false;
  });
}

function avttHandleFolderDragEnter(event, element, destinationPath) {
  if (avttIsExternalFileDrag(event)) {
    element.classList.remove("avtt-drop-target");
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (!avttCanDropOnFolder(destinationPath)) {
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "none";
    }
    element.classList.remove("avtt-drop-target");
    return;
  }
  element.classList.add("avtt-drop-target");
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function avttHandleFolderDragOver(event, element, destinationPath) {
  if (avttIsExternalFileDrag(event)) {
    element.classList.remove("avtt-drop-target");
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (!avttCanDropOnFolder(destinationPath)) {
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "none";
    }
    element.classList.remove("avtt-drop-target");
    return;
  }
  element.classList.add("avtt-drop-target");
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function avttHandleFolderDragLeave(event, element) {
  if (avttIsExternalFileDrag(event)) {
    element.classList.remove("avtt-drop-target");
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const related = event.relatedTarget;
  if (related && element.contains(related)) {
    return;
  }
  element.classList.remove("avtt-drop-target");
}

async function avttHandleFolderDrop(event, destinationPath) {
  if (avttIsExternalFileDrag(event)) {
    if (event.currentTarget && event.currentTarget.classList) {
      event.currentTarget.classList.remove("avtt-drop-target");
    }
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const element = event.currentTarget;
  if (element && element.classList) {
    element.classList.remove("avtt-drop-target");
  }
  if (!avttCanDropOnFolder(destinationPath)) {
    avttHandleDragEnd();
    return;
  }
  if (!Array.isArray(avttDragItems) || avttDragItems.length === 0) {
    avttHandleDragEnd();
    return;
  }
  const moves = [];
  for (const entry of avttDragItems) {
    if (entry.key === destinationPath) {
      continue;
    }
    if (entry.isFolder && destinationPath.startsWith(entry.key)) {
      alert("Cannot move a folder inside itself.");
      avttHandleDragEnd();
      return;
    }
    const newKey = avttComputeNewKeyForDestination(entry, destinationPath);
    if (!newKey || newKey === entry.key) {
      continue;
    }
    moves.push({
      fromKey: entry.key,
      toKey: newKey,
      isFolder: entry.isFolder,
      size: Number(entry.size) || 0,
    });
  }
  if (moves.length > 0) {
    await avttMoveEntries(moves);
  }
  avttHandleDragEnd();
}

async function avttHandleMapDrop(event, listItemArray) {
  if (listItemArray.length == 1){
    create_and_place_token(listItemArray[0].listItem, event.shiftKey, listItemArray[0].url, event.pageX, event.pageY, false, undefined, undefined, { tokenStyleSelect: "definitelyNotAToken" });
  }
  else if (listItemArray.length < 10 || confirm(`This will add ${listItemArray.length} tokens which could lead to unexpected results. Are you sure you want to add all of these tokens?`)) {
    let distanceFromCenter = window.CURRENT_SCENE_DATA.hpps * window.ZOOM * (listItemArray.length / 8); 
    for (let index = 0; index<listItemArray.length; index++) {
      let item = listItemArray[index];
      let radius = index / listItemArray.length;
      let left = event.pageX + (distanceFromCenter * Math.cos(2 * Math.PI * radius));
      let top = event.pageY + (distanceFromCenter * Math.sin(2 * Math.PI * radius));
      create_and_place_token(item.listItem, event.shiftKey, item.url, left, top, false, undefined, undefined, { tokenStyleSelect: "definitelyNotAToken" });
    }
  }
}


const allowedImageTypes = ["jpeg", "jpg", "png", "gif", "bmp", "webp"];
const allowedVideoTypes = ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm"];
const allowedAudioTypes = ["mp3", "wav", "aac", "flac", "ogg"];
const allowedJsonTypes = ["json", "uvtt", "dd2vtt", "df2vtt"];
const allowedDocTypes = ["pdf"];
const allowedTextTypes = ["abovevtt", "csv"];
let avttUploadController;
let avttUploadSignal;

let avttUploadQueue = [];
let avttActiveUploads = 0;
let avttQueueTotalEnqueued = 0;
let avttQueueCompleted = 0;
let avttQueueConflictPolicy = null;
let avttConflictPromptPending = null;
const AVTT_MAX_CONCURRENT_UPLOADS = 3;
let avttMoveAbortController = null;
let avttRenameAbortController = null;
let avttDeleteAbortController = null;



function avttShouldGenerateThumbnail(extension) {
  if (!extension) {
    return false;
  }
  const normalized = String(extension).toLowerCase();
  return allowedImageTypes.includes(normalized) || allowedVideoTypes.includes(normalized);
}

function avttCalculateContainDimensions(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const safeSourceWidth = Number(sourceWidth) > 0 ? Number(sourceWidth) : targetWidth;
  const safeSourceHeight = Number(sourceHeight) > 0 ? Number(sourceHeight) : targetHeight;
  if (!safeSourceWidth || !safeSourceHeight) {
    return {
      drawWidth: targetWidth,
      drawHeight: targetHeight,
      offsetX: 0,
      offsetY: 0,
    };
  }
  const sourceAspect = safeSourceWidth / safeSourceHeight;
  const targetAspect = targetWidth / targetHeight;
  let drawWidth = targetWidth;
  let drawHeight = targetHeight;
  if (sourceAspect > targetAspect) {
    drawHeight = targetHeight;
    drawWidth = targetHeight * sourceAspect;
  } else {
    drawWidth = targetWidth;
    drawHeight = targetWidth / sourceAspect;
  }
  const offsetX = (targetWidth - drawWidth) / 2;
  const offsetY = (targetHeight - drawHeight) / 2;
  return { drawWidth, drawHeight, offsetX, offsetY };
}

function avttDataUrlToBlob(dataUrl) {
  if (typeof dataUrl !== "string") {
    throw new Error("Invalid data URL");
  }
  const parts = dataUrl.split(",");
  if (parts.length < 2) {
    throw new Error("Invalid data URL structure");
  }
  const meta = parts[0];
  const data = parts[1];
  const mimeMatch = meta.match(/^data:(.*?)(;base64)?,?$/i);
  const mimeType = mimeMatch && mimeMatch[1] ? mimeMatch[1] : AVTT_THUMBNAIL_MIME_TYPE;
  const isBase64 = /;base64/i.test(meta);
  const byteString = isBase64 ? atob(data) : decodeURIComponent(data);
  const buffer = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i += 1) {
    buffer[i] = byteString.charCodeAt(i);
  }
  return new Blob([buffer], { type: mimeType });
}

function avttCanvasToBlob(canvas, mimeType = AVTT_THUMBNAIL_MIME_TYPE) {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      reject(new Error("Canvas element not provided"));
      return;
    }
    if (typeof canvas.toBlob === "function") {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          try {
            const dataUrl = canvas.toDataURL(mimeType);
            resolve(avttDataUrlToBlob(dataUrl));
          } catch (error) {
            reject(error);
          }
        }
      }, mimeType);
      return;
    }
    try {
      const dataUrl = canvas.toDataURL(mimeType);
      resolve(avttDataUrlToBlob(dataUrl));
    } catch (error) {
      reject(error);
    }
  });
}

async function avttGenerateImageThumbnailBlob(file) {
  if (!file) {
    return null;
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (event) => reject(event?.error || new Error("Failed to load image for thumbnail"));
      img.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = AVTT_THUMBNAIL_DIMENSION;
    canvas.height = AVTT_THUMBNAIL_DIMENSION;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { drawWidth, drawHeight, offsetX, offsetY } = avttCalculateContainDimensions(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      canvas.width,
      canvas.height,
    );
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    const blob = await avttCanvasToBlob(canvas);
    try {
      const ctx2 = canvas.getContext('2d');
      if (ctx2) { ctx2.clearRect(0, 0, canvas.width, canvas.height); }
      canvas.width = 0; canvas.height = 0;
    } catch {}
    image.src = '';
    return blob;
  } catch (error) {
    console.warn("Failed to generate image thumbnail", file?.name, error);
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
function avttCalculateContainDimensions(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const safeSourceWidth = Number(sourceWidth) > 0 ? Number(sourceWidth) : targetWidth;
  const safeSourceHeight = Number(sourceHeight) > 0 ? Number(sourceHeight) : targetHeight;
  if (!safeSourceWidth || !safeSourceHeight) {
    return { drawWidth: targetWidth, drawHeight: targetHeight, offsetX: 0, offsetY: 0 };
  }

  const scale = Math.min(targetWidth / safeSourceWidth, targetHeight / safeSourceHeight);
  const drawWidth = safeSourceWidth * scale;
  const drawHeight = safeSourceHeight * scale;
  const offsetX = (targetWidth - drawWidth) / 2;
  const offsetY = (targetHeight - drawHeight) / 2;
  return { drawWidth, drawHeight, offsetX, offsetY };
}
async function avttGenerateVideoThumbnailBlob(file) {
  if (!file) {
    return null;
  }
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.src = objectUrl;
  try {
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener("loadeddata", handleLoadedData);
        video.removeEventListener("error", handleError);
      };
      const handleLoadedData = () => {
        cleanup();
        resolve();
      };
      const handleError = (event) => {
        cleanup();
        reject(event?.error || new Error("Failed to load video for thumbnail"));
      };
      video.addEventListener("loadeddata", handleLoadedData, { once: true });
      video.addEventListener("error", handleError, { once: true });
      video.load();
    });
    try {
      const targetTime =
        Number.isFinite(video.duration) && video.duration > 0.2
          ? Math.min(0.2, video.duration - 0.01)
          : 0;
      if (!Number.isNaN(targetTime)) {
        video.currentTime = targetTime;
      }
    } catch (seekError) {
      console.warn("Failed to seek video for thumbnail", seekError);
    }
    await new Promise((resolve) => {
      if (video.readyState >= 2) {
        resolve();
        return;
      }
      const handleSeeked = () => {
        video.removeEventListener("seeked", handleSeeked);
        resolve();
      };
      video.addEventListener("seeked", handleSeeked, { once: true });
      setTimeout(() => {
        video.removeEventListener("seeked", handleSeeked);
        resolve();
      }, 500);
    });
    const sourceWidth = video.videoWidth || AVTT_THUMBNAIL_DIMENSION;
    const sourceHeight = video.videoHeight || AVTT_THUMBNAIL_DIMENSION;
    const canvas = document.createElement("canvas");
    canvas.width = AVTT_THUMBNAIL_DIMENSION;
    canvas.height = AVTT_THUMBNAIL_DIMENSION;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context unavailable");
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { drawWidth, drawHeight, offsetX, offsetY } = avttCalculateContainDimensions(
      sourceWidth,
      sourceHeight,
      canvas.width,
      canvas.height,
    );
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    const blob = await avttCanvasToBlob(canvas);
    try {
      const ctx2 = canvas.getContext('2d');
      if (ctx2) { ctx2.clearRect(0, 0, canvas.width, canvas.height); }
      canvas.width = 0; canvas.height = 0;
    } catch {}
    return blob;
  } catch (error) {
    console.warn("Failed to generate video thumbnail", file?.name, error);
    return null;
  } finally {
    video.pause();
    video.removeAttribute("src");
    try {
      video.load();
    } catch (loadError) {
      console.warn("Failed to reset video element after thumbnail generation", loadError);
    }
    URL.revokeObjectURL(objectUrl);
  }
}

async function avttGenerateThumbnailBlob(file, extension) {
  if (!file) {
    return null;
  }
  const normalizedExtension = String(extension || "").toLowerCase();
  if (!avttShouldGenerateThumbnail(normalizedExtension)) {
    return null;
  }
  if (allowedImageTypes.includes(normalizedExtension) && normalizedExtension != 'gif') {
    return await avttGenerateImageThumbnailBlob(file);
  }
  if (allowedVideoTypes.includes(normalizedExtension) || normalizedExtension == 'gif') {
    return await avttGenerateVideoThumbnailBlob(file);
  } 
  return null;
}

async function avttUploadThumbnail(relativeTargetKey, blob, signal) {
  const normalizedTarget = avttNormalizeRelativePath(relativeTargetKey);
  if (!normalizedTarget || !blob) {
    return false;
  }
  if (signal?.aborted) {
    console.warn("Thumbnail upload aborted for", normalizedTarget);
    return false;
  }
  const thumbnailKey = avttGetThumbnailKeyFromRelative(normalizedTarget);
  if (!thumbnailKey) {
    return false;
  }
  try {
    const fileName =
      (typeof thumbnailKey === "string" && thumbnailKey.includes("/"))
        ? thumbnailKey.split("/").pop()
        : null;
    const thumbnailFile = new File(
      [blob],
      fileName && fileName.trim() ? fileName : `thumbnail.${AVTT_THUMBNAIL_MIME_TYPE.split("/").pop() || "png"}`,
      { type: AVTT_THUMBNAIL_MIME_TYPE },
    );
    assignRelativePath(thumbnailFile, thumbnailKey);
    thumbnailFile.originFolder = "";
    thumbnailFile.avttTargetKey = thumbnailKey;
    thumbnailFile.avttCountsTowardTotals = false;
    thumbnailFile.avttSkipProgress = true;
    thumbnailFile.avttSkipConflictPrompt = true;
    thumbnailFile.avttIsThumbnailUpload = true;
    if (signal) {
      thumbnailFile.avttLinkedAbortSignal = signal;
    }

    let resolveCompletion;
    let rejectCompletion;
    const completionPromise = new Promise((resolve, reject) => {
      resolveCompletion = resolve;
      rejectCompletion = reject;
    });
    thumbnailFile.avttCompletionDeferred = {
      resolve: (value) => {
        if (typeof resolveCompletion === "function") {
          resolveCompletion(value);
        }
      },
      reject: (error) => {
        if (typeof rejectCompletion === "function") {
          rejectCompletion(error);
        }
      },
    };

    avttQueueUploadEntry(thumbnailFile, { uploadFolder: "", assignOrigin: false, unshift: true });
    avttProcessUploadQueue();

    const outcome = await completionPromise;
    if (typeof outcome === "boolean") {
      return outcome;
    }
    return true;
  } catch (error) {
    if (error?.name === "AbortError") {
      console.warn("Thumbnail upload aborted for", normalizedTarget);
    } else {
      console.warn("Failed to upload thumbnail for", normalizedTarget, error);
    }
    return false;
  }
}

async function avttCreateThumbnailForExisting(relativeKey, sourceUrl, entryType) {
  const normalized = avttNormalizeRelativePath(relativeKey);
  if (!normalized || !sourceUrl) {
    return;
  }
  if (avttPendingThumbnailGenerations.has(normalized)) {
    return;
  }
  const extension = getFileExtension(normalized);
  if (!avttShouldGenerateThumbnail(extension)) {
    return;
  }
  if (entryType && entryType !== avttFilePickerTypes.IMAGE && entryType !== avttFilePickerTypes.VIDEO) {
    return;
  }
  avttPendingThumbnailGenerations.add(normalized);
  try {
    const response = await fetch(sourceUrl, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Failed to fetch source for thumbnail (${response.status})`);
    }
    const blob = await response.blob();
    const fileName = normalized.split("/").pop() || `file.${extension || "dat"}`;
    const fileType = blob.type || resolveContentType({ name: fileName, type: blob.type || "" });
    const file = new File([blob], fileName, { type: fileType || "" });
    const thumbnailBlob = await avttGenerateThumbnailBlob(file, extension);
    if (!thumbnailBlob) {
      return;
    }
    await avttUploadThumbnail(normalized, thumbnailBlob);
  } catch (error) {
    console.warn("Failed to backfill thumbnail for", normalized, error);
  } finally {
    avttPendingThumbnailGenerations.delete(normalized);
  }
}

const PATREON_AUTH_STORAGE_KEYS = Object.freeze({
  state: "avtt.patreon.state",
  codeVerifier: "avtt.patreon.codeVerifier",
  tokens: "avtt.patreon.tokens",
  lastCode: "avtt.patreon.lastCode",
});

const avttFilePickerTypes = Object.freeze({
  FOLDER: "FOLDER",
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
  UVTT: "UVTT",
  PDF: "PDF",
  IMAGE: "IMAGE",
  ABOVEVTT: "ABOVEVTT",
  CSV: "CSV",
});

let activeUserLimit = 0;
let activeUserTier = { level: "free", label: "Free", amountCents: 0 };
const campaignTierCache = new Map();

const PatreonAuth = (() => {
  const defaultConfig = {
    clientId:
      "2Pn4arX8GDny2KAhA5HjETX4Ni4M04SzECfN_GTdUmLKcM3ReJso1YA8wyHG1FBi",
    redirectUri: `https://patreon-html.s3.us-east-1.amazonaws.com/patreon-auth-callback.html`,
    scope:
      "identity identity[email] identity.memberships campaigns campaigns.members",
    popupWidth: 600,
    popupHeight: 750, 
    timeoutMs: 180000,
  };
  const membershipCacheTtlMs = 5 * 60 * 1000;
  const apiBase = "https://www.patreon.com/api/oauth2/v2";

  let cachedMembership = null;
  let cachedMembershipFetchedAt = 0;


  function loadStoredTokens() {
    try {
      const raw = localStorage.getItem(PATREON_AUTH_STORAGE_KEYS.tokens);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (err) {
      console.warn("Failed to parse stored Patreon tokens", err);
      return null;
    }
  }

  function saveTokens(tokens) {
    const payload = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    };
    localStorage.setItem(
      PATREON_AUTH_STORAGE_KEYS.tokens,
      JSON.stringify(payload),
    );
  }

  function clearTokens() {
    localStorage.removeItem(PATREON_AUTH_STORAGE_KEYS.tokens);
  }


  function tokensValid(tokens) {
    return (
      tokens &&
      tokens.accessToken &&
      typeof tokens.expiresAt === "number" &&
      tokens.expiresAt > Date.now()
    );
  }

  function computeExpiry(expiresIn) {
    const skewMs = 60 * 1000;
    return Date.now() + expiresIn * 1000 - skewMs;
  }

  async function requestPatreonToken(payload, config) {
    const body = { ...payload };
    if (config?.clientId && !body.clientId) {
      body.clientId = config.clientId;
    }
    try {
      const response = await fetch(`${AVTT_S3}?action=patreonToken`, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      let json;
      try {
        json = await response.json();
      } catch (parseError) {
        console.error("Failed to parse Patreon token response", parseError);
        throw new Error("Failed to parse Patreon token response.");
      }
      if (!response.ok) {
        const message =
          json?.error_description ||
          json?.message ||
          json?.error ||
          "Patreon token exchange failed.";
        throw new Error(message);
      }
      if (json?.error) {
        throw new Error(json.error_description || json.error);
      }
      return json;
    } catch (error) {
      console.error("Patreon token request failed", error);
      throw error;
    }
  }



  function storeState(state) {
    sessionStorage.setItem(PATREON_AUTH_STORAGE_KEYS.state, state);
  }

  function readState() {
    return sessionStorage.getItem(PATREON_AUTH_STORAGE_KEYS.state);
  }

  function clearState() {
    sessionStorage.removeItem(PATREON_AUTH_STORAGE_KEYS.state);
  }

  function storeCodeVerifier(codeVerifier) {
    sessionStorage.setItem(
      PATREON_AUTH_STORAGE_KEYS.codeVerifier,
      codeVerifier,
    );
  }

  function readCodeVerifier() {
    return sessionStorage.getItem(PATREON_AUTH_STORAGE_KEYS.codeVerifier);
  }

  function clearCodeVerifier() {
    sessionStorage.removeItem(PATREON_AUTH_STORAGE_KEYS.codeVerifier);
  }

  function readLastAuthorizationCode() {
    return sessionStorage.getItem(PATREON_AUTH_STORAGE_KEYS.lastCode);
  }

  function storeLastAuthorizationCode(code) {
    if (code) {
      sessionStorage.setItem(PATREON_AUTH_STORAGE_KEYS.lastCode, code);
    }
  }

  function clearLastAuthorizationCode() {
    sessionStorage.removeItem(PATREON_AUTH_STORAGE_KEYS.lastCode);
  }

  function generateRandomString(length) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    if (window.crypto?.getRandomValues) {
      const values = new Uint8Array(length);
      window.crypto.getRandomValues(values);
      return Array.from(values, (v) => chars[v % chars.length]).join("");
    }
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  function base64UrlEncode(bytes) {
    let str = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      str += String.fromCharCode.apply(null, chunk);
    }
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function createCodeChallenge(codeVerifier) {
    if (window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return base64UrlEncode(new Uint8Array(digest));
    }
    return codeVerifier;
  }

  function openLoginPopup(url, config) {
    return new Promise((resolve, reject) => {
      const { popupWidth, popupHeight, timeoutMs } = config;
      const dualScreenLeft =
        window.screenLeft !== undefined ? window.screenLeft : window.screenX;
      const dualScreenTop =
        window.screenTop !== undefined ? window.screenTop : window.screenY;
      const width =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        screen.width;
      const height =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        screen.height;
      const systemZoom = width / window.screen.availWidth;
      const left = (width - popupWidth) / 2 / systemZoom + dualScreenLeft;
      const top = (height - popupHeight) / 2 / systemZoom + dualScreenTop;
      const features = `scrollbars=yes, width=${popupWidth}, height=${popupHeight}, top=${top}, left=${left}`;
      const popup = window.open(url, "avttPatreonAuth", features);
      if (!popup) {
        reject(
          new Error(
            "Unable to open Patreon login window. Please disable popup blockers and try again.",
          ),
        );
        return;
      }

      let resolved = false;
      const timeoutHandle = window.setTimeout(() => {
        cleanup();
        reject(new Error("Patreon login timed out. Please try again."));
      }, timeoutMs);

      const closeInterval = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(closeInterval);
          if (!resolved) {
            window.clearTimeout(timeoutHandle);
            cleanup();
            reject(new Error("Patreon login was closed before completing."));
          }
        }
      }, 500);

      function cleanup() {
        window.removeEventListener("message", messageHandler);
        if (!popup.closed) {
          popup.close();
        }
      }

      function messageHandler(event) {
        try {
          if (!event.data || event.data.source !== "avtt:patreon-auth") {
            return;
          }
          const expectedOrigin = new URL(config.redirectUri).origin;
          if (event.origin !== expectedOrigin) {
            console.warn(
              "Ignoring Patreon auth message from unexpected origin",
              event.origin,
            );
            return;
          }
          resolved = true;
          window.clearTimeout(timeoutHandle);
          window.clearInterval(closeInterval);
          cleanup();
          resolve(event.data);
        } catch (error) {
          console.error("Failed to process Patreon auth message", error);
        }
      }

      window.addEventListener("message", messageHandler);
      popup.focus();
    });
  }

  async function exchangeAuthorizationCode(code, codeVerifier, config) {
    const json = await requestPatreonToken(
      {
        grantType: "authorization_code",
        code,
        codeVerifier,
        redirectUri: config.redirectUri,
      },
      config,
    );
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: computeExpiry(json.expires_in),
    };
  }

  async function refreshAccessToken(refreshToken, config) {
    const json = await requestPatreonToken(
      {
        grantType: "refresh_token",
        refreshToken,
        redirectUri: config.redirectUri,
      },
      config,
    );
    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token || refreshToken,
      expiresAt: computeExpiry(json.expires_in),
    };
  }

  async function ensureAccessToken(config) {
    const stored = loadStoredTokens();
    if (tokensValid(stored)) {
      return stored;
    }
    if (stored?.refreshToken) {
      try {
        const refreshed = await refreshAccessToken(stored.refreshToken, config);
        saveTokens(refreshed);
        return refreshed;
      } catch (error) {
        console.warn("Patreon refresh failed, clearing session", error);
        clearTokens();
      }
    }
    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await createCodeChallenge(codeVerifier);
    storeState(state);
    storeCodeVerifier(codeVerifier);
    const authParams = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    const authUrl = `https://www.patreon.com/oauth2/authorize?${authParams.toString()}`;
    const message = await openLoginPopup(authUrl, config);
    clearState();
    const storedCodeVerifier = readCodeVerifier();
    clearCodeVerifier();
    if (message.error) {
      throw new Error(
        message.error_description || "Patreon authentication was cancelled.",
      );
    }
    if (message.state !== state) {
      throw new Error("State mismatch detected during Patreon authentication.");
    }
    if (!message.code) {
      throw new Error(
        "Patreon authentication did not return a valid authorization code.",
      );
    }
    if (!storedCodeVerifier) {
      throw new Error("Missing PKCE verifier for Patreon authentication.");
    }
    const lastCode = readLastAuthorizationCode();
    if (lastCode && lastCode === message.code) {
      throw new Error(
        "Patreon returned an authorization code that was already used. Please try logging in again.",
      );
    }
    storeLastAuthorizationCode(message.code);
    const tokens = await exchangeAuthorizationCode(
      message.code,
      storedCodeVerifier,
      config,
    );
    saveTokens(tokens);
    return tokens;
  }

  async function fetchMembership(accessToken, config) {
    const response = await fetch(`${AVTT_S3}?action=patreonMembership`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          accessToken, 
          config 
        }),
      },
    );
    
    const { user } = await response.json();
    activeUserLimit = user.limit;
    activeUserTier = user;
    window.PATREON_ID = user.membership.identity;

    return user.membership;
  }

  async function ensureMembership() {
    const config = defaultConfig;
    if (!config.clientId || !config.redirectUri) {
      console.warn(
        "Patreon configuration is incomplete. Falling back to free tier.",
      );
      return {
        level: "free",
        label: "Free",
        amountCents: 0,
        member: null,
        campaign: null,
        tiers: [],
      };
    }
    if (
      cachedMembership &&
      Date.now() - cachedMembershipFetchedAt < membershipCacheTtlMs
    ) {
      return cachedMembership;
    }
    const tokens = await ensureAccessToken(config);
    const membership = await fetchMembership(tokens.accessToken, config);
    cachedMembership = membership;
    cachedMembershipFetchedAt = Date.now();
    return membership;
  }

  function logout() {
    clearTokens();
    clearLastAuthorizationCode();
    cachedMembership = null;
    cachedMembershipFetchedAt = 0;
    window.filePickerFirstLoad = true;
    try { 
      avttUploadController.abort('User cancelled upload by logout.')
      avttActiveSearchAbortController = null; 
    }catch{};
    try{
      window.abortGetAllUserFilesController.abort('User logged out, aborting file fetch.');
    }
    catch{};
  }

  return {
    ensureMembership,
    logout,
    defaultConfig,
  };
})();



let avttActiveSearchAbortController = null;

const avttDebouncedSearchHandler = mydebounce((searchTerm, fileTypes) => {
  const controller = new AbortController();
  avttActiveSearchAbortController = controller;
  const { signal } = controller;

  const refreshPromise =
    !searchTerm || searchTerm === ""
      ? refreshFiles(
          currentFolder,
          undefined,
          undefined,
          undefined,
          fileTypes,
          {
            signal,
            useCache: true,
            revalidate:
              !avttFolderListingCache.has(currentFolder) ||
              !Array.isArray(avttFolderListingCache.get(currentFolder)),
          },
        )
      : refreshFiles("", false, true, searchTerm, fileTypes, {
          signal,
          useCache: true,
          revalidate: !Array.isArray(avttAllFilesCache),
        });


  refreshPromise.then(() => {
    if (avttActiveSearchAbortController === controller) {
      avttActiveSearchAbortController = null;
    }
    else if (avttActiveSearchAbortController === controller) {
      avttActiveSearchAbortController = null;
    }
  });
     
}, 250);

const debounceSearchFiles = (searchTerm, fileTypes) => {
  if (avttActiveSearchAbortController) {
    avttActiveSearchAbortController.abort();
    avttActiveSearchAbortController = null;
  }
  avttDebouncedSearchHandler(searchTerm, fileTypes);
};

async function launchFilePicker(selectFunction = false, fileTypes = []) {
  $("#avtt-s3-uploader").remove();
  const draggableWindow = find_or_create_generic_draggable_window(
    "avtt-s3-uploader",
    "AVTT File Uploader",
    true,
    false,
    undefined,
    "800px",
    "600px",
    undefined,
    undefined,
    false,
    "input, li, a, label",
  );
  draggableWindow.toggleClass("prevent-sidebar-modal-close", true);

  
  let membership;
  try {
    membership = await PatreonAuth.ensureMembership(window.filePickerFirstLoad);
    if(window.filePickerFirstLoad)
      readUploadedFileCache();
  } catch (error) {
    console.error("Patreon verification failed", error);
    alert("Patreon login is required to open the AVTT File Uploader.");
    return;
  }


  currentFolder = "";
  const filePicker = $(` 
        <style>   
            #avtt-file-picker {
                background: var(--background-color, #fff);
                color: var(--font-color, #000);
                border-radius: 5px;
                top: -6px;
                position: relative;
                padding: 10px;
                height: calc(100% - 15px);
                overflow: auto;
                border: 1px solid #ddd;
                width: calc(100% + 2px);
                left: -1px;
            }
            
            #file-listing-section {
                text-align: left;
                margin: 7px 10px 20px 10px;
                border: 1px solid gray;
                padding: 10px;
                list-style: none;
                padding: 0px;
                height: calc(100% - 165px);
                overflow-y: auto;
            }
            .file-picker-path{
              color: color-mix(in srgb, var(--font-color, #000) 60%, transparent 0%);
              font-size: 9px;
              position: relative;
              top: 0px;
              line-height: 10px;
              display: block;
            }
            #avtt-listing-toolbar {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin: 5px 10px 0 10px;
            }
            #avtt-listing-toolbar .avtt-toolbar-row {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            #avtt-listing-toolbar label {
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            #avtt-column-headers {
              display: grid;
              grid-template-columns: 43px 1fr 173px 41px;
              padding: 0 15px;
              font-weight: bold;
              color: var(--font-color, #000);
            }
            #avtt-column-headers span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            #avtt-column-headers .avtt-sortable-header {
                cursor: pointer;
                user-select: none;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            #avtt-column-headers .avtt-sortable-header.active {
                color: var(--link-color, rgba(39, 150, 203, 1));
            }
            .avtt-sort-indicator {
                font-size: 0.75em;
            }
            #avtt-column-headers span:last-child {
                text-align: right;
            }
            #avtt-actions-menu {
                position: relative;
            }
            .avtt-toolbar-link {
                color: var(--link-color, rgba(39, 150, 203, 1));
                margin: 0;
                cursor: pointer;
            }
            .avtt-toolbar-button {
                background: var(--background-color, #fff);
                color: var(--font-color, #000);
                border: 1px solid gray;
                border-radius: 5px;
                padding: 4px 10px;
                cursor: pointer;
            }
            .avtt-toolbar-button:active {
                transform: translate(1px, 1px);
            }
            .avtt-toolbar-dropdown {
                position: relative;
            }
            .avtt-toolbar-dropdown-list {
                position: absolute;
                top: 100%;
                right: 0;
                background: var(--background-color, #fff);
                color: var(--font-color, #000);
                border: 1px solid rgba(0, 0, 0, 0.2);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                border-radius: 4px;
                padding: 6px;
                display: none;
                z-index: 9999;
                min-width: 150px;
            }
            #avtt-actions-dropdown{
              left:0;
              right: auto;
            }
            .avtt-toolbar-dropdown-list.visible {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .avtt-toolbar-dropdown-list button {
                background: transparent;
                color: inherit;
                border: none;
                text-align: left;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
            }
            .avtt-toolbar-dropdown-list button:hover:not(:disabled) {
                background: rgba(131, 185, 255, 0.2);
            }
            .avtt-toolbar-dropdown-list button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            #file-listing-section tr{
                padding: 3px 5px;
                margin: 5px 0px;
            }
            #file-listing-section tr.avtt-file-row {
                cursor: default;
            }
            #file-listing-section tr.avtt-drop-target {
                background: rgba(131, 185, 255, 0.15);
                outline: 1px dashed rgba(131, 185, 255, 0.6);
            }
            #file-listing-section tr.avtt-cut-row {
                opacity: 0.6;
            }
            #file-listing-section tr.avtt-dragging {
                opacity: 0.5;
            }
            #file-listing-section tr input {
                height: 16px;
                width: 16px;
                margin: 3px 0px;
                vertical-align: middle;
            }
            #file-listing-section tr td:first-of-type {
                width: 30px;
            }
            #file-listing-section tr td {
                vertical-align: middle;
            }
            #file-listing {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
            }
            #file-listing td {
                padding: 4px 16px;
            }
            #file-listing td:nth-of-type(1) {
                width: 40px;
                padding-right: 8px;
            }
            #file-listing td:nth-of-type(3) {
                width: 120px;
            }
            #file-listing td:nth-of-type(4) {
                width: 120px;
                text-align: right;
                padding-right: 16px;
            }
            #file-listing td.avtt-file-size {
                text-align: right;
            }
            label.avtt-file-name .material-symbols-outlined {
                font-size: 35px;
                vertical-align: middle;
                margin-right: 10px;
                color: #e11414;
            }

            label.avtt-file-name .material-symbols-outlined {
              font-variation-settings:
              'FILL' 1,
              'wght' 700,
              'GRAD' 0,
              'opsz' 48
            }

            label.avtt-file-name {
              vertical-align: middle;
            }

            #avtt-file-picker.avtt-drop-over {
                border-color: var(--link-color, rgba(39, 150, 203, 1));
                box-shadow: 0 0 8px rgba(131, 185, 255, 0.6);
            }

            #avtt-file-picker.avtt-drop-over #file-listing-section {
              background: color-mix(in srgb, var(--background-color, #fff), rgb(131, 185, 255) 20%);)
            }
            #upFolder{
              display:flex;
              max-width:400px;
              flex-wrap: nowrap;
            }
            a.avtt-breadcrumb {
                flex-grow:1;
                white-space: nowrap;
            }
            a.avtt-breadcrumb:not(:first-of-type):not(:last-of-type) {
                flex-shrink:1;
                overflow: hidden;
            }
            #avtt-file-context-menu hr,
            #avtt-actions-dropdown hr {
                height:2px;
                margin:5px;
                opacity:0.2;
            }
            .crumbSeparator{
                margin: 0 5px;
            }
            div#avtt-select-controls button {
                background: var(--background-color, #fff);
                color: var(--font-color, #000);
                border: 1px solid gray;
                border-radius: 5px;
                padding: 5px;
                margin-right: 10px;
            }
            a.avtt-breadcrumb:not(:first-of-type):not(:last-of-type)
            {
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            div#avtt-select-controls button:active{
                transform: translate(1px, 1px);
                background-color: color-mix(in srgb, var(--background-color, #fff) 100%, #808080 50%);
            }
            div#select-section>div {
                margin: 5px 0px 0px 0px;
            }
            #file-listing-section tr label{
                margin: 0px;
                display: flex;
                align-items: center;
            }
            #file-listing-section tr span{
                overflow: hidden;
                text-overflow: ellipsis;    
                white-space: nowrap;
            }
            #file-listing-section tr span.material-symbols-outlined{
                flex-shrink:0;
            }
            #select-section{
                display: flex;
                text-align: right;
                flex-direction: column;
                align-items: flex-end;
            }
            #file-listing-section tr:nth-of-type(odd) {
                backdrop-filter: brightness(0.95);
            }
            .avtt-context-menu {
                position: absolute;
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding: 6px;
                background: var(--background-color, #fff);
                color: var(--font-color, #000);
                border: 1px solid rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 99999;
                white-space: nowrap;
            }
            .avtt-context-menu.hidden {
                display: none;
            }
            .avtt-context-menu button {
                font: inherit;
                background: transparent;
                color: inherit;
                border: none;
                text-align: left;
                padding: 4px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            .avtt-context-menu button:hover:not(:disabled) {
                background: rgba(131, 185, 255, 0.2);
            }
            .avtt-context-menu button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        
            .avtt-conflict-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
            }
            .avtt-conflict-modal {
                background: var(--background-color, #fff);
                color: var(--font-color, #000);
                border-radius: 6px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                padding: 18px 20px;
                width: min(420px, 90vw);
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .avtt-conflict-modal h3 {
                margin: 0;
                font-size: 1.1em;
            }
            .avtt-conflict-modal-buttons {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
                flex-wrap: wrap;
            }
            .avtt-conflict-modal button {
                background: var(--background-color, #fff);
                color: var(--font-color, #000);
                border: 1px solid gray;
                border-radius: 4px;
                padding: 6px 12px;
                cursor: pointer;
            }
            .avtt-conflict-modal button:hover {
                background: rgba(131, 185, 255, 0.2);
            }
            .avtt-conflict-modal button:focus-visible {
                outline: 2px solid var(--link-color, rgb(39, 150, 203));
                outline-offset: 2px;
            }
            .avtt-operation-cancel-button {
              background: var(--background-color, #fff) !important;
              color: var(--font-color, #000) !important;
              border: 1px solid gray;
              border-radius: 2px !important;
              padding: 0px !important;
              width: 15px;
              height: 15px;
              font-size: 10px;
            }    
            .avtt-operation-cancel-button:hover{
              color: #F00 !important;
            }
            .avtt-conflict-apply-all {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .avtt-conflict-modal input[type="text"] {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #c6c6c6;
                border-radius: 4px;
                background: var(--background-color, #fff);
                color: var(--font-color, #000);
            }
            .avtt-conflict-modal input[type="text"]:focus {
                outline: 2px solid var(--link-color, rgba(39, 150, 203));
                outline-offset: 1px;
            }
            #avtt-file-picker .beholder-dm-screen.loading-status-indicator__svg {
                margin:0px !important;
            }
            #avtt-file-picker .sidebar-panel-loading-indicator {
                position: absolute !important;
                top: 20px !important;
                left: 50% !important;
                background: var(--transparency-color, #d3d3d3d9) !important;
                width: 200px !important;
                height: 130px !important;
                padding: 5px !important;
                border-radius: 5px;
                border: 1px solid var(--border-color, #000000);
                transform: translateX(-50%);
                filter: none;
            }
            #avtt-file-picker #loading-container{
              pointer-events:none;
              position:absolute;
              height: 0px;
              width: 100%;
            }
            #patreon-tier a{
              text-decoration: underline 1px dotted color-mix(in srgb, var(--link-color, rgba(39, 150, 203, 1)), transparent 50%);
              color: var(--font-color, #000);
              cursor: pointer;
            }
            #counter-indicators{
                position: absolute;
                bottom: 18px;
                left: 15px;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }
            .avtt-operation-indicator{
                display: flex;
                gap: 3px;
                flex-wrap: nowrap;
                flex-direction: row;
                align-items: center;
            }
            div#counter-indicators .avtt-operation-cancel-button {
                width:12px; 
                height:12px;
                font-size:8px;
            }
            div#counter-indicators{
                gap: 3px;
                font-size:12px;
                padding: 0px;
                max-height: 60px;
                max-width:350px;
                width:350px;
                bottom:0px;
                align-content: space-between;
                flex-wrap: wrap;
            }
        </style>
        <div id="avtt-file-picker">
            <div id="select-section">
                <div>
                    <div id='sizeUsed'><span id='user-used'></span> used of <span id='user-limit'> </span></div>
                    <div id='patreon-tier'><span class='user-teir-level'></span><span> | <a draggable='false' id='logout-patreon-button'>Logout</a></span></div>
                </div>
                <div style='display: flex; gap: 10px; line-height: 16px; width: 100%; align-items: center; padding-left:20px;'>
                  <div id="avtt-actions-menu" class="avtt-toolbar-dropdown">
                    <button type="button" class="avtt-toolbar-link avtt-toolbar-button avtt-actions-toggle">Actions &#9662;</button>
                    <div id="avtt-actions-dropdown" class="avtt-toolbar-dropdown-list">
                      <button type="button" data-action="cut">Cut</button>
                      <button type="button" data-action="paste">Paste</button>
                      <button type="button" data-action="rename">Rename</button>
                      <hr/>
                      <button type="button" data-action="copyPath">Copy Path</button>
                      <button type="button" data-action="import">Import</button>
                      <hr/>
                      <button type="button" data-action="sendToGamelog">Send To Gamelog</button>
                      <button type="button" data-action="open">Display to Self</button>
                      <button type="button" data-action="forceOpen">Display to Everyone</button>
                      <button type="button" data-action="openNewTab">Open in New Tab</button>
                      <hr/>
                      <button type="button" data-action="delete">Delete</button>
                    </div>
                  </div>
                  <input id='search-files' type='search' placeholder='Search' />
                  <div style='display:flex'><span id='refresh-files' class="material-symbols-outlined">refresh</span></div>
                  <div style='flex-grow:1'></div>
                  <div id='counter-indicators'>
                    <div id='uploading-file-indicator' class='avtt-operation-indicator' style='display:none'></div>
                    <div id='rename-file-indicator' class='avtt-operation-indicator' style='display:none'></div>
                    <div id='move-file-indicator' class='avtt-operation-indicator' style='display:none'></div>
                    <div id='delete-file-indicator' class='avtt-operation-indicator' style='display:none'></div>
                  </div>
                    <label style='color: var(--link-color, rgba(39, 150, 203, 1));margin: 0;cursor:pointer;line-height: 16px;' for="file-input">Upload File</label>
                    <input style='display:none;' type="file" multiple id="file-input"
                        accept="image/*,video/*,audio/*,.uvtt,.json,.dd2vtt,.df2vtt,application/pdf" />
                    <div id='create-folder' class='avtt-toolbar-link'>Create Folder</div>
                    <div id="avtt-export-menu" class="avtt-toolbar-dropdown">
                        <div id="avtt-export-toggle" class="avtt-toolbar-link avtt-toolbar-button">Take Export &#9662;</div>
                        <div id="avtt-export-dropdown" class="avtt-toolbar-dropdown-list">
                            <button type="button" data-export="campaign">Campaign Export</button>
                            <button type="button" data-export="currentScene">Current Scene</button>
                            <button type="button" data-export="tokenCustomization">Token Customization</button>
                            <button type="button" data-export="journal">Journal</button>
                            <button type="button" data-export="audio">Audio</button>
                            <button type="button" data-export="audioCsv">Audio CSV</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id='upFolder' style='position: absolute; left: 30px; top:10px; text-align: left; cursor: pointer; var(--link-color, rgba(39, 150, 203, 1))'>
            </div>
            <div id="avtt-listing-toolbar">
                <div id="avtt-column-headers">
                    <span><label for="avtt-select-files"><input type="checkbox" id="avtt-select-files" style='width:20px;height:20px'/></label></span>
                    <span class="avtt-sortable-header" data-sort="name" data-label="Name">Name</span>
                    <span class="avtt-sortable-header" data-sort="type" data-label="Type">Type</span>
                    <span class="avtt-sortable-header" data-sort="size" data-label="Size">Size</span>
                </div>
            </div>
            <div id='loading-container'></div>
            <div id="file-listing-section" style='position: relative;'>

                <table id="file-listing">
                    <tr>
                        <td colspan="4">Loading...</td>
                    </tr>
                </table>
            </div>
            <div id="avtt-select-controls" style="text-align:center; margin-top:10px;">
                <button id="copy-path-to-clipboard" style="${typeof selectFunction === "function" ? "display: none;" : ""}">Copy Path</button>
                <button id="select-file" style="${typeof selectFunction === "function" ? "" : "display: none;"}">Select</button>
            </div>
        </div>

    
    
    `);
  draggableWindow.append(filePicker);
  draggableWindow.find(".sidebar-panel-loading-indicator").remove();

  $("body").append(draggableWindow);
  activeFilePickerFilter = fileTypes;
  avttEnsureContextMenu();
  avttHideContextMenu();

  const tierLabel = $("#patreon-tier span.user-teir-level");
  if (tierLabel.length) {
    tierLabel[0].innerHTML = `<a draggable='false' target='_blank' href='https://www.patreon.com/cw/Azmoria/membership'>Patreon</a> Tier: ${activeUserTier.label}`;
  }



  const fileInput = document.getElementById("file-input");
  const createFolder = document.getElementById("create-folder");
  const exportMenu = document.getElementById("avtt-export-menu");
  const exportDropdown = document.getElementById("avtt-export-dropdown");
  const exportToggle = document.getElementById("avtt-export-toggle");
  const copyPathButton = document.getElementById("copy-path-to-clipboard"); 
  const searchInput = document.getElementById("search-files");
  const selectFile = document.getElementById("select-file");
  const filePickerElement = document.getElementById("avtt-file-picker");
  const selectFilesToggle = document.getElementById("avtt-select-files");
  const logoutPatreonButton = document.getElementById("logout-patreon-button");
  const actionsMenu = document.getElementById("avtt-actions-menu");
  const actionsDropdown = document.getElementById("avtt-actions-dropdown");
  const actionsToggle = actionsMenu
    ? actionsMenu.querySelector(".avtt-actions-toggle")
    : null;

  if (selectFilesToggle) {
    selectFilesToggle.addEventListener("change", (event) => {
      const shouldSelect = Boolean(event.target.checked);
      const nonFolderCheckboxes = avttGetNonFolderCheckboxes();
      nonFolderCheckboxes.forEach((checkbox) => {
        checkbox.checked = shouldSelect;
      });
      if (nonFolderCheckboxes.length) {
        const lastCheckbox = nonFolderCheckboxes[nonFolderCheckboxes.length - 1];
        let indexAttr = null;
        if (lastCheckbox) {
          indexAttr = lastCheckbox.getAttribute("data-index");
        }
        avttLastSelectedIndex = shouldSelect && indexAttr !== null ? Number(indexAttr) : null;
      } else {
        avttLastSelectedIndex = null;
      }
      avttUpdateSelectNonFoldersCheckbox();
      avttUpdateActionsMenuState();
      avttApplyClipboardHighlights();
    });
    $(selectFilesToggle).off('focus.preventDefault').on('focus.preventDefault', function () {
      this.blur()
    }) 
  }

  const handleExportOption = async (option) => {
    avttHideExportMenu();
    avttHideContextMenu();
    avttHideActionsMenu();
    const exportHandlers = {
      campaign: () => {
        if (typeof window.export_file !== "function") {
          throw new Error("Campaign export is not available.");
        }
        return window.export_file();
      },
      currentScene: () => {
        if (typeof window.export_current_scene !== "function") {
          throw new Error("Current scene export is not available.");
        }
        return window.export_current_scene();
      },
      tokenCustomization: () => {
        if (typeof window.export_token_customization !== "function") {
          throw new Error("Token customization export is not available.");
        }
        return window.export_token_customization();
      },
      journal: () => {
        if (typeof window.export_journal !== "function") {
          throw new Error("Journal export is not available.");
        }
        return window.export_journal();
      },
      audio: () => {
        if (typeof window.export_audio !== "function") {
          throw new Error("Audio export is not available.");
        }
        return window.export_audio();
      },
      audioCsv: () => {
        if (typeof window.export_audio_csv !== "function") {
          throw new Error("Audio CSV export is not available.");
        }
        return window.export_audio_csv();
      },
    };
    const handler = exportHandlers[option];
    if (typeof handler !== "function") {
      alert("Selected export option is not available.");
      return;
    }
    try {
      const { data, filename, mimeType } = await avttCaptureDownload(handler);
      const fileName =
        typeof filename === "string" && filename.trim()
          ? filename.trim()
          : `${option}-${Date.now()}.abovevtt`;

      const blob = new Blob([data], { type: mimeType || "text/plain" });
      const syntheticFile = new File([blob], fileName, {
        type: mimeType || "text/plain",
      });
      await uploadSelectedFiles([syntheticFile]);
    } catch (error) {
      console.error("Export upload failed", error);
      alert(error?.message || "Failed to export data.");
    } finally {   
     $(".import-loading-indicator").remove();
    }
  };

  if (actionsToggle && actionsDropdown && actionsMenu) {
    const handleActionsOutsideClick = (event) => {
      if (!actionsDropdown.classList.contains("visible")) {
        return;
      }
      if (!actionsMenu.contains(event.target)) {
        avttHideActionsMenu();
        avttHideExportMenu();
      }
    };
    const handleActionsWindowBlur = () => {
      avttHideActionsMenu();
      avttHideExportMenu();
    };
    actionsToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      avttToggleActionsMenu();
    });
    actionsDropdown
      .querySelectorAll("button[data-action]")
      .forEach((button) => {
        button.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const action = button.getAttribute("data-action");
          await avttHandleToolbarAction(action);
        });
      });
    document.addEventListener("click", handleActionsOutsideClick, true);
    window.addEventListener("blur", handleActionsWindowBlur);
    const cleanupActionsMenuHandlers = () => {
      document.removeEventListener("click", handleActionsOutsideClick, true);
      window.removeEventListener("blur", handleActionsWindowBlur);
    };
    draggableWindow
      .off("remove.actionsMenu")
      .on("remove.actionsMenu", () => {
        cleanupActionsMenuHandlers();
        avttHideActionsMenu();
        avttHideExportMenu();
      });
    draggableWindow.find(".title_bar_close_button")
      .off("click.actionsMenu")
      .on("click.actionsMenu", () => {
        cleanupActionsMenuHandlers();
        avttHideActionsMenu();
        avttHideExportMenu();
      });
  }


  if (exportToggle && exportDropdown && exportMenu) {
    const handleExportOutsideClick = (event) => {
      if (!exportDropdown.classList.contains("visible")) {
        return;
      }
      if (!exportMenu.contains(event.target)) {
        avttHideExportMenu();
      }
    };
    const handleExportWindowBlur = () => {
      avttHideExportMenu();
    };
    exportToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      avttToggleExportMenu();
    });
    exportDropdown
      .querySelectorAll("button[data-export]")
      .forEach((button) => {
        button.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const exportType = button.getAttribute("data-export");
          await handleExportOption(exportType);
        });
      });
    document.addEventListener("click", handleExportOutsideClick, true);
    window.addEventListener("blur", handleExportWindowBlur);
    const cleanupExportMenuHandlers = () => {
      document.removeEventListener("click", handleExportOutsideClick, true);
      window.removeEventListener("blur", handleExportWindowBlur);
    };
    draggableWindow
      .off("remove.exportMenu")
      .on("remove.exportMenu", () => {
        cleanupExportMenuHandlers();
        avttHideExportMenu();
      });
    draggableWindow.find(".title_bar_close_button")
      .off("click.exportMenu")
      .on("click.exportMenu", () => {
        cleanupExportMenuHandlers();
        avttHideExportMenu();
      });
  }

  const columnHeadersContainer = document.getElementById("avtt-column-headers");
  if (columnHeadersContainer) {
    columnHeadersContainer
      .querySelectorAll(".avtt-sortable-header")
      .forEach((header) => {
        header.addEventListener("click", () => {
          const column = header.getAttribute("data-sort");
          avttToggleSort(column);
        });
      });
    avttUpdateSortIndicators();
  }

  refreshFiles(currentFolder, true, undefined, undefined, fileTypes);
  avttUpdateSelectNonFoldersCheckbox();
  avttUpdateActionsMenuState();




  const readDirectoryEntries = async (directoryEntry, prefix = "", uploadFolder = currentFolder) => {
    const reader = directoryEntry.createReader();
    const entries = [];

    await new Promise((resolve, reject) => {
      const read = () => {
        reader.readEntries((batch) => {
          if (!batch.length) {
            resolve();
            return;
          }
          entries.push(...batch);
          read();
        }, reject);
      };
      read();
    });

    const directoryPath = `${prefix}${directoryEntry.name ? `${directoryEntry.name}/` : ""}`;
    const files = [];

    for (const entry of entries) {

      if (avttUploadController?.signal?.aborted) {
        avttUploadQueue = [];
        break;
      }
      if (entry.isDirectory) {
        const nestedFiles = await readDirectoryEntries(entry, directoryPath, uploadFolder);
        files.push(...nestedFiles);
      } else if (entry.isFile) {
        const file = await new Promise((resolve, reject) =>
          entry.file(resolve, reject),
        );
        const relativePath = `${directoryPath}${file.name}`;

        const fileWithPath = assignRelativePath(file, relativePath);
        file.originFolder = uploadFolder;
        avttEnqueueUploads([fileWithPath], uploadFolder);
        files.push({ file, relativePath });
      }
    }

    return files;
  };

  const collectDroppedFiles = async (dataTransfer) => {
    if (!dataTransfer) {
      return [];
    }

    const uploadFolder = currentFolder;
    if (avttUploadController?.signal?.aborted) {
      avttUploadQueue = [];
      return [];
    }
    const items = dataTransfer.items;
    if (!items || !items.length) {
      const files = Array.from(dataTransfer.files || []);
      if (files.length) { avttEnqueueUploads(files, uploadFolder); }
      return files;
    }

    const collected = [];

    const enqueue = (file) => {
      if (!file) return;
      file.originFolder = uploadFolder;
      collected.push(file);
      avttEnqueueUploads([file], uploadFolder);
    };

    for (const item of items) {
      if (item.kind !== "file") {
        continue;
      }

      const entry = typeof item.webkitGetAsEntry === "function" ? item.webkitGetAsEntry() : null;

      if (entry && entry.isDirectory) {
        if (avttUploadController?.signal?.aborted) {
          avttUploadQueue = [];
          break;
        }

        const directoryFiles = await readDirectoryEntries(entry, undefined, uploadFolder);
        collected.push(...directoryFiles.map(({ file, relativePath }) => assignRelativePath(file, relativePath)));
      } else {
        const file = item.getAsFile();
        file.originFolder = uploadFolder;
        if (file) {
          enqueue(assignRelativePath(file, file.name));
        }
      }
    }

    if (!collected.length) {
      const filesFallback = Array.from(dataTransfer.files || []);
      if (filesFallback.length) { avttEnqueueUploads(filesFallback, uploadFolder); }
      return filesFallback;
    }

    return collected;
  };

  fileInput.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    try {
      await uploadSelectedFiles(files, currentFolder);
    } finally {
      event.target.value = "";
    }
  });


  let dragDepth = 0;

  const preventDefaults = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const activateDropState = () => {
    filePickerElement.classList.add("avtt-drop-over");
  };

  const clearDropState = () => {
    dragDepth = 0;
    filePickerElement.classList.remove("avtt-drop-over");
  };

  filePickerElement.addEventListener("dragenter", (event) => {
    if (!avttIsExternalFileDrag(event)) {
      return;
    }
    preventDefaults(event);
    dragDepth += 1;
    activateDropState();
  });

  filePickerElement.addEventListener("dragover", (event) => {
    if (!avttIsExternalFileDrag(event)) {
      return;
    }
    preventDefaults(event);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
    activateDropState();
  });

  filePickerElement.addEventListener("dragleave", (event) => {
    if (!avttIsExternalFileDrag(event)) {
      return;
    }
    preventDefaults(event);
    dragDepth = Math.max(dragDepth - 1, 0);
    if (dragDepth === 0) {
      if ($(event.fromElement).closest('#avtt-file-picker').length === 0)
        clearDropState();
    }
  });

  filePickerElement.addEventListener("drop", async (event) => {
    if (!avttIsExternalFileDrag(event)) {
      return;
    }
    preventDefaults(event);
    clearDropState();

    const transfer = event.dataTransfer;
    if (!transfer) {
      return;
    }

    try {
      const uploadFolder = currentFolder;
      let uriListRaw = "";
      try {
        if (typeof transfer.getData === "function") {
          uriListRaw = transfer.getData("text/uri-list") || "";
        }
      } catch (_) { }
      if (uriListRaw && typeof uriListRaw === "string") {
        const urls = uriListRaw
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith("#") && /^https?:\/\//i.test(line));
        for (const url of urls) {
          try {
            const derivedName = avttDeriveFilenameFromUrl(url);
            let syntheticFile;
            try {
              syntheticFile = new File([new Uint8Array(0)], derivedName, { type: "" });
            } catch (_) {
              syntheticFile = new Blob([new Uint8Array(0)], { type: "" });
              syntheticFile.name = derivedName;
            }
            syntheticFile.avttProxySourceUrl = url;
            syntheticFile.avttGenerateThumbnail = false;
            syntheticFile.originFolder = uploadFolder;
            avttEnqueueUploads([assignRelativePath(syntheticFile, derivedName)], uploadFolder);
          } catch (downloadError) {
            console.warn("Failed to queue URL drop for proxy download", url, downloadError);
          }
        }
      }
    } catch (uriListError) {
      console.warn("Failed processing text/uri-list", uriListError);
    }

    try {
      await collectDroppedFiles(transfer);
    } catch (error) { 
      console.error("Failed to upload dropped files", error);
      if (error.message.includes('A requested file or directory could not be found at the time an operation was processed.'))
        return;
      alert(error.message || "An unexpected error occurred while uploading dropped files.");
      hideUploadingIndicator();
    }
  });
  logoutPatreonButton.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if(typeof PatreonAuth?.logout == "function"){
      PatreonAuth.logout();
      $('#avtt-s3-uploader').remove()
    }
    const childWindow = await window.open('https://www.patreon.com/logout', "patreonLogout", `scrollbars=no, width=10, height=10, top=0, left=0`);
    
    setTimeout(() => {
        childWindow.close();
    }, 2000)
  })

  selectFile.addEventListener("click", (event) => {
    const selectedCheckboxes = $('#file-listing input[type="checkbox"]:checked');

    if (selectedCheckboxes.length === 0) {
      return;
    }

    const paths = [];
    for (const selected of selectedCheckboxes) {
      const checkbox = selected;
      const relativePath = typeof checkbox.value === "string" ? checkbox.value : "";
      if (!relativePath) {
        continue;
      }
      const isFolder = checkbox.classList.contains("folder");
      const row = checkbox.closest("tr.avtt-file-row");
      const entryType = row?.dataset?.type || "";
      const link = `above-bucket-not-a-url/${window.PATREON_ID}/${relativePath}`;
      let displayName = "";
      if (isFolder) {
        const trimmed = relativePath.replace(/\/+$/, "");
        const folderName = trimmed.split("/").filter(Boolean).pop() || trimmed;
        displayName = decodeURIComponent(folderName);
      } else {
        const fileName = relativePath.split("/").filter(Boolean).pop() || relativePath;
        displayName = decodeURIComponent(fileName.replace(/\.[^.]+$/, ""));
      }
      paths.push({
        link,
        name: displayName,
        path: relativePath,
        isFolder,
        type: entryType || (isFolder ? avttFilePickerTypes.FOLDER : ""),
        extension: isFolder ? "" : getFileExtension(relativePath),
      });
    }

    if (paths.length === 0) {
      return;
    }

    selectFunction(paths);
    draggableWindow.find(".title_bar_close_button").click();
  });

  $(searchInput)
    .off("input keypress")
    .on("input keypress", async (event) => {
      const searchTerm = event.target.value;
      debounceSearchFiles(searchTerm, fileTypes);
    });

  createFolder.addEventListener("click", async () => {
    avttHideExportMenu();
    avttHideActionsMenu();
    avttHideContextMenu();
    const userInput = await avttPromptTextDialog({
      title: "Create Folder",
      message: "Enter a name for the new folder.",
      placeholder: "Folder name",
      confirmLabel: "Create",
    });
    if (userInput === null) {
      return;
    }
    const trimmed = String(userInput).trim();
    if (!trimmed) {
      alert("Folder name cannot be empty.");
      return;
    }
    if (/[\\/]/.test(trimmed)) {
      alert("Folder names cannot contain slashes.");
      return;
    }
    const folderName = trimmed.replace(/\/+$/g, "");
    if (!folderName) {
      alert("Folder name cannot be empty.");
      return;
    }
    try {
      await fetch(
        `${AVTT_S3}?folderName=${encodeURIComponent(`${currentFolder}${folderName}`)}&user=${window.PATREON_ID}`,
      );
      const newFolderPath = `${currentFolder}${folderName}/`;
      avttUpsertCacheEntry(newFolderPath, 0);
      avttEnsureFolderListing(newFolderPath);
      refreshFiles(
        currentFolder,
        false,
        false,
        undefined,
        fileTypes,
        { useCache: true, revalidate: false },
      );
    } catch (error) {
      console.error("Failed to create folder", error);
      alert("Failed to create folder");
    }
  });

  if (copyPathButton) {
    copyPathButton.addEventListener("click", () => {
      avttCopySelectedPathsToClipboard();
      avttUpdateActionsMenuState();
    });
  }



}
const assignRelativePath = (file, relativePath) => {
  if (!file || !relativePath || file.webkitRelativePath) {
    return file;
  }
  const normalized = relativePath.replace(/^[\/]+/, "").replace(/\\/g, "/");
  try {
    Object.defineProperty(file, "relativePath", {
      value: normalized,
      configurable: true,
    });
  } catch (defineError) {
    file.relativePath = normalized;
  }
  return file;
};
function isAllowedExtension(extension) {
  return (
    allowedImageTypes.includes(extension) ||
    allowedVideoTypes.includes(extension) ||
    allowedAudioTypes.includes(extension) ||
    allowedJsonTypes.includes(extension) ||
    allowedDocTypes.includes(extension) ||
    allowedTextTypes.includes(extension)
  );
}

function resolveContentType(file) {
  if (file.type) {
    return file.type;
  }

  const extension = getFileExtension(file.name);
  if (allowedJsonTypes.includes(extension)) {
    return "application/json";
  }
  if (allowedImageTypes.includes(extension)) {
    return `image/${extension === "jpg" ? "jpeg" : extension}`;
  }
  if (allowedVideoTypes.includes(extension)) {
    return `video/${extension}`;
  }
  if (allowedAudioTypes.includes(extension)) {
    return `audio/${extension}`;
  }
  if (allowedDocTypes.includes(extension)) {
    return `application/pdf`;
  }
  if (allowedTextTypes.includes(extension)) {
    return "text/plain";
  }
  return "";
}

const AVTT_OPERATION_INDICATOR_MODES = Object.freeze({
  UPLOAD: "upload",
  DELETE: "delete",
  MOVE: "move",
  RENAME: "rename",
});
const AVTT_OPERATION_INDICATOR_TARGETS = Object.freeze({
  [AVTT_OPERATION_INDICATOR_MODES.UPLOAD]: "uploading-file-indicator",
  [AVTT_OPERATION_INDICATOR_MODES.RENAME]: "rename-file-indicator",
  [AVTT_OPERATION_INDICATOR_MODES.MOVE]: "move-file-indicator",
  [AVTT_OPERATION_INDICATOR_MODES.DELETE]: "delete-file-indicator",
});

function avttGetOperationIndicatorElement(mode) {
  const targetId = AVTT_OPERATION_INDICATOR_TARGETS?.[mode];
  if (!targetId) {
    return null;
  }
  return document.getElementById(targetId);
}

function avttShowOperationProgressIndicator(mode, options = {}) {
  const indicator = avttGetOperationIndicatorElement(mode);
  if (!indicator) {
    return null;
  }

  const {
    label = "",
    currentDisplay = 0,
    total = 0,
    showCancelButton = false,
    cancelHandler = null,
    cancelButtonTitle = "Cancel Operation",
    cancelButtonLabel = "X",
  } = options;
  const normalizedTotal = Number.isFinite(Number(total)) && Number(total) > 0 ? Number(total) : 0;
  const normalizedCurrent = Number.isFinite(Number(currentDisplay)) && Number(currentDisplay) >= 0
    ? Number(currentDisplay)
    : 0;

  const currentMode = indicator.dataset.mode || "";
  if (currentMode !== mode) {
    indicator.innerHTML = "";
  }
  indicator.dataset.mode = mode;
  indicator.style.display = "flex";

  const cancelButtonId = `cancel-avtt-${mode}-button`;
  let cancelButton = indicator.querySelector(`#${cancelButtonId}`);
  if (showCancelButton) {
    if (!cancelButton) {
      cancelButton = document.createElement("button");
      cancelButton.id = cancelButtonId;
      cancelButton.type = "button";
      cancelButton.className = "avtt-operation-cancel-button";
    }
    cancelButton.title = cancelButtonTitle;
    cancelButton.setAttribute("aria-label", cancelButtonTitle);
    cancelButton.textContent = cancelButtonLabel;
  } else if (cancelButton) {
    $(cancelButton).off(".operationIndicator");
    cancelButton.remove();
    cancelButton = null;
  }

  let labelSpan = indicator.querySelector(".avtt-operation-label");
  let fileNumberSpan = indicator.querySelector("#file-number");
  let totalFilesSpan = indicator.querySelector("#total-files");
  if (!labelSpan || !fileNumberSpan || !totalFilesSpan) {
    indicator.innerHTML = "";
    labelSpan = document.createElement("span");
    labelSpan.className = "avtt-operation-label";
    fileNumberSpan = document.createElement("span");
    fileNumberSpan.id = "file-number";
    totalFilesSpan = document.createElement("span");
    totalFilesSpan.id = "total-files";

    indicator.appendChild(labelSpan);
    indicator.appendChild(document.createTextNode(" "));
    indicator.appendChild(fileNumberSpan);
    indicator.appendChild(document.createTextNode(" of "));
    indicator.appendChild(totalFilesSpan);
  }

  if (showCancelButton && cancelButton) {
    if (!cancelButton.isConnected || cancelButton.parentElement !== indicator) {
      indicator.prepend(cancelButton);
    }
    if (cancelHandler) {
      $(cancelButton).off(".operationIndicator").on("click.operationIndicator", cancelHandler);
    } else {
      $(cancelButton).off(".operationIndicator");
    }
  }

  labelSpan.textContent = label;
  totalFilesSpan.textContent = normalizedTotal > 0 ? String(normalizedTotal) : "0";

  const boundedCurrent =
    normalizedTotal > 0
      ? Math.min(Math.max(normalizedCurrent, 0), normalizedTotal)
      : Math.max(normalizedCurrent, 0);
  fileNumberSpan.textContent = String(boundedCurrent);

  indicator.dataset.total = String(normalizedTotal);
  indicator.dataset.current = String(boundedCurrent);
  return indicator;
}

function avttShowOperationComplete(mode, message, delay = 2000) {
  const indicator = avttGetOperationIndicatorElement(mode);
  if (!indicator || indicator.dataset.mode !== mode) {
    return;
  }
  $(indicator).find(".avtt-operation-cancel-button").off(".operationIndicator").remove();
  indicator.innerHTML = message;
  indicator.style.display = "flex";
  indicator.dataset.current = "";
  indicator.dataset.total = "";
  if (Number.isFinite(Number(delay)) && delay > 0) {
    setTimeout(() => {
      avttHideOperationIndicator(mode);
    }, delay);
  }
}

function avttHideOperationIndicator(mode) {
  const indicator = avttGetOperationIndicatorElement(mode);
  if (!indicator) {
    return;
  }
  const currentMode = indicator.dataset.mode;
  if (mode && currentMode && currentMode !== mode) {
    return;
  }
  $(indicator).find(".avtt-operation-cancel-button").off(".operationIndicator").remove();
  indicator.innerHTML = "";
  indicator.style.display = "none";
  indicator.removeAttribute("data-mode");
  indicator.removeAttribute("data-current");
  indicator.removeAttribute("data-total");
}

const showUploadingProgress = (index, total) => {
  const currentDisplay = Math.max(1, Math.min(index + 1, Math.max(total, 1)));
  avttShowOperationProgressIndicator(AVTT_OPERATION_INDICATOR_MODES.UPLOAD, {
    label: "Uploading File",
    currentDisplay,
    total,
    showCancelButton: true,
    cancelButtonTitle: "Cancel Upload",
    cancelButtonLabel: "X",
    cancelHandler: () => {
      if (avttUploadController) {
        try {
          avttUploadController.abort("User cancelled upload by clicking the cancel button.");
          showUploadComplete();
        } catch {
        }
      }
      avttUploadQueue = [];
      avttQueueTotalEnqueued = avttQueueCompleted;
    },
  });
};

const hideUploadingIndicator = () => {
  avttHideOperationIndicator(AVTT_OPERATION_INDICATOR_MODES.UPLOAD);
};

const showUploadComplete = () => {
  avttShowOperationComplete(AVTT_OPERATION_INDICATOR_MODES.UPLOAD, "Upload Complete");
};

const toNormalizedUploadPath = (file) => {
  const rawPath = (
    file.webkitRelativePath ||
    file.relativePath ||
    file.name ||
    ""
  )
    .replace(/^[\/]+/, "")
    .replace(/\\/g, "/");
  return rawPath || file.name;
};

const resolveUploadKey = (file, uploadFolder = currentFolder) =>
  `${uploadFolder}${toNormalizedUploadPath(file)}`;

const avttDeriveFilenameFromUrl = (urlString, fallback = "download") => {
  if (typeof urlString !== "string" || !urlString.trim()) {
    return fallback;
  }
  try {
    const parsed = new URL(urlString.trim());
    const pathname = parsed.pathname || "";
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length) {
      const last = segments[segments.length - 1];
      const cleaned = decodeURIComponent(last).split("?")[0] || last;
      return cleaned || fallback;
    }
  } catch {}
  return fallback;
};

function avttQueueUploadEntry(file, { uploadFolder = currentFolder, assignOrigin = true, unshift=false } = {}) {
  if (!file) {
    return;
  }
  
  const targetKey = file.avttTargetKey
    ? avttNormalizeRelativePath(file.avttTargetKey)
    : resolveUploadKey(file, uploadFolder);

  const existingIndex = avttUploadQueue.findIndex((queued) => {
    const queuedKey = queued.avttPendingTargetKey
      || (queued.avttTargetKey
        ? avttNormalizeRelativePath(queued.avttTargetKey)
        : resolveUploadKey(queued, queued.originFolder ?? uploadFolder));
    return queuedKey === targetKey;
  });

  if (existingIndex !== -1) {
    const [removed] = avttUploadQueue.splice(existingIndex, 1);
    if (removed?.avttCountsTowardTotals !== false) {
      avttQueueTotalEnqueued = Math.max(0, avttQueueTotalEnqueued - 1);
    }
  }
  file.avttPendingTargetKey = targetKey;

  if (assignOrigin || typeof file.originFolder === "undefined") {
    file.originFolder = uploadFolder;
  }
  const countsTowardTotals = file.avttCountsTowardTotals !== false;
  if (countsTowardTotals) {
    avttQueueTotalEnqueued += 1;
  }

  if (unshift){
    avttUploadQueue.unshift(file);
    return;
  }

  avttUploadQueue.push(file);
}

function avttEnqueueUploads(filesOrFileArray, uploadFolder = currentFolder) {
  const files = Array.isArray(filesOrFileArray) ? filesOrFileArray : [filesOrFileArray];
  for (const f of files) {
    if (!f) continue;
    avttQueueUploadEntry(f, { uploadFolder });
  }
  avttProcessUploadQueue();
}

async function avttProcessUploadQueue() {
  if (avttActiveUploads >= AVTT_MAX_CONCURRENT_UPLOADS) {
    return;
  }

  while (avttActiveUploads < AVTT_MAX_CONCURRENT_UPLOADS && avttUploadQueue.length > 0) {
    const nextFile = avttUploadQueue.shift();
    if (!nextFile) continue;
    
    const selectedFile = nextFile;
    let uploadRequeued = false;
    const completionDeferred = selectedFile?.avttCompletionDeferred || null;
    const skipsConcurrencyLimit = selectedFile?.avttSkipConcurrency === true;
    const countsTowardTotals = selectedFile?.avttCountsTowardTotals !== false;
    const skipProgressIndicator = selectedFile?.avttSkipProgress === true;
    const linkedSignal = selectedFile?.avttLinkedAbortSignal;
    const bypassExtensionCheck = selectedFile?.avttBypassExtensionCheck === true;
    const skipPersistCache = selectedFile?.skipPersistCache === true;
    const isProxyUpload = Boolean(selectedFile?.avttProxySourceUrl);
    if (!skipsConcurrencyLimit) {
      avttActiveUploads += 1;
    }
    (async () => {
      try {

        if (linkedSignal?.aborted) {
          if (completionDeferred?.reject) {
            completionDeferred.reject(new DOMException("Aborted", "AbortError"));
          }
          return;
        }

        const extension = getFileExtension(selectedFile.name);
        if (!isProxyUpload && !bypassExtensionCheck && !isAllowedExtension(extension)) {
          console.warn(`Skipping unsupported file type: ${selectedFile.name}`);
          if (completionDeferred?.resolve) {
            completionDeferred.resolve(false);
          }
          return;
        }

        if (countsTowardTotals && !skipProgressIndicator) {
          showUploadingProgress(avttQueueCompleted, Math.max(avttQueueTotalEnqueued, 1));
        }

        let targetKey = selectedFile.avttTargetKey
          ? avttNormalizeRelativePath(selectedFile.avttTargetKey)
          : resolveUploadKey(selectedFile, selectedFile.originFolder);
        if (!targetKey) {
          if (completionDeferred?.resolve) {
            completionDeferred.resolve(false);
          }
          return;
        }

        const isThumbnailTarget = avttIsThumbnailRelativeKey(targetKey);
        const isFileCacheTarget = avttIsFileCacheRelativeKey(targetKey);
        const isSystemTarget = isThumbnailTarget || isFileCacheTarget;
        let action = selectedFile.avttDefaultConflictAction || "overwrite";

        if (!selectedFile.avttSkipConflictPrompt) {
          try {
            const exists = await avttDoesObjectExist(targetKey);
            if (exists) {
              if (avttQueueConflictPolicy?.applyAll) {
                action = avttQueueConflictPolicy.action;
              } else {
                if (avttConflictPromptPending) {
                  try {
                    const sharedResult = await avttConflictPromptPending;
                    if (!sharedResult || !sharedResult.action) {
                      action = "skip";
                    } else {
                      action = sharedResult.action;
                      if (sharedResult.applyAll) {
                        avttQueueConflictPolicy = { action, applyAll: true };
                      }
                    }
                  } catch (_) {
                    action = "skip";
                  }
                } else {
                  avttConflictPromptPending = avttPromptUploadConflict({ fileName: targetKey });
                  try {
                    const conflictResult = await avttConflictPromptPending;
                    if (!conflictResult || !conflictResult.action) {
                      action = "skip";
                    } else {
                      action = conflictResult.action;
                      if (conflictResult.applyAll) {
                        avttQueueConflictPolicy = { action, applyAll: true };
                      }
                    }
                  } finally {
                    avttConflictPromptPending = null;
                  }
                }
              }
            }
          } catch (existError) {
            console.warn("Failed to verify if file exists before upload", existError);
          }
        }

        if (action === "skip") {
          if (completionDeferred?.resolve) {
            completionDeferred.resolve(false);
          }
          return;
        }

        if (action === "keepBoth") {
          try {
            targetKey = await avttDeriveUniqueKey(targetKey);
          } catch (deriveError) {
            console.error("Failed to generate unique key for duplicate upload", deriveError);
            alert("Failed to generate a unique name for a duplicate file. Skipping.");
            if (completionDeferred?.resolve) {
              completionDeferred.resolve(false);
            }
            return;
          }
        }

        if (linkedSignal?.aborted) {
          if (completionDeferred?.reject) {
            completionDeferred.reject(new DOMException("Aborted", "AbortError"));
          }
          return;
        }

        if (!isProxyUpload) {
          const prospectiveTotal = (Number(selectedFile.size) || 0) + (avttPendingUsageBytes || 0);
          if (
            activeUserLimit !== undefined &&
            prospectiveTotal + S3_Current_Size > activeUserLimit
          ) {
            alert("Skipping File. This upload would exceed the storage limit for your Patreon tier. Delete some files before uploading more.");
            if (completionDeferred?.resolve) {
              completionDeferred.resolve(false);
            }
            return;
          }
        }

        let thumbnailBlob = null;
        const shouldGenerateThumbnailForFile =
          selectedFile.avttIsThumbnailUpload === true
            ? false
            : !isProxyUpload &&
            !isSystemTarget &&
            selectedFile.avttGenerateThumbnail !== false &&
            avttShouldGenerateThumbnail(extension);
        if (shouldGenerateThumbnailForFile) {
          try {
            thumbnailBlob = await avttGenerateThumbnailBlob(selectedFile, extension);
          } catch (thumbnailError) {
            console.warn("Failed to generate thumbnail for", targetKey, thumbnailError);
            thumbnailBlob = null;
          }
        }

        if (!avttUploadController || avttUploadController.signal?.aborted) {
          avttUploadController = new AbortController();
        }
        avttUploadSignal = avttUploadController.signal;

        let linkedAbortHandler = null;
        if (linkedSignal) {
          linkedAbortHandler = () => {
            try {
              avttUploadController.abort(linkedSignal.reason || "Linked upload aborted");
            } catch { }
          };
          if (linkedSignal.aborted) {
            linkedAbortHandler();
          } else {
            linkedSignal.addEventListener("abort", linkedAbortHandler, { once: true });
          }
        }
        let remoteSize=0;
        try {
          if (isProxyUpload) {
            const proxyResponse = await avttFetchWithRetry(
              `${AVTT_S3}?action=proxyDownload&user=${window.PATREON_ID}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  sourceUrl: selectedFile.avttProxySourceUrl,
                  targetKey,
                }),
                signal: avttUploadSignal,
              },
              {
                retries: 4,
                baseDelay: 400,
                maxDelay: 5000,
                retryStatuses: AVTT_UPLOAD_RETRYABLE_STATUSES,
              },
            );
            let proxyPayload = null;
            try {
              proxyPayload = await proxyResponse.json();
            } catch (_) {
              proxyPayload = null;
            }
            if (!proxyResponse.ok) {
              const message =
                (proxyPayload && (proxyPayload.message || proxyPayload.error)) ||
                `Failed to proxy download (${proxyResponse.status})`;
              throw new Error(message);
            }
            if (proxyPayload && typeof proxyPayload.targetKey === "string") {
              const normalizedProxyTarget = avttNormalizeRelativePath(proxyPayload.targetKey);
              if (normalizedProxyTarget) {
                targetKey = normalizedProxyTarget;
              }
            }
            remoteSize = Number(proxyPayload?.size);
            if (Number.isFinite(remoteSize) && remoteSize >= 0) {
              selectedFile.size = remoteSize;
            } else if (!Number.isFinite(Number(selectedFile.size))) {
              selectedFile.size = 0;
            }
            if (typeof proxyPayload?.contentType === "string") {
              selectedFile.avttUploadedContentType = proxyPayload.contentType;
            }
          } else {
            const presignResponse = await avttFetchWithRetry(
              `${AVTT_S3}?filename=${encodeURIComponent(targetKey)}&user=${window.PATREON_ID}&upload=true`,
              { signal: avttUploadSignal },
              {
                retries: 5,
                baseDelay: 300,
                maxDelay: 4000,
                retryStatuses: AVTT_DEFAULT_RETRYABLE_STATUSES,
              },
            );
            if (!presignResponse.ok) {
              throw new Error("Failed to retrieve upload URL.");
            }
            const data = await presignResponse.json();
            const uploadHeaders = {};
            const inferredType = resolveContentType(selectedFile);
            if (inferredType) {
              uploadHeaders["Content-Type"] = inferredType;
            }
            const uploadResponse = await avttFetchWithRetry(
              data.uploadURL,
              {
                method: "PUT",
                body: selectedFile,
                headers: uploadHeaders,
                signal: avttUploadSignal,
              },
              {
                retries: 3,
                baseDelay: 500,
                maxDelay: 6000,
                retryStatuses: AVTT_UPLOAD_RETRYABLE_STATUSES,
              },
            );
            if (!uploadResponse.ok) {
              throw new Error("Upload failed.");
            }
          }
        } finally {
          if (linkedSignal && linkedAbortHandler) {
            linkedSignal.removeEventListener("abort", linkedAbortHandler);
          }
        }

        if (!isProxyUpload && thumbnailBlob) {
          avttUploadThumbnail(targetKey, thumbnailBlob, avttUploadSignal).catch(() => { });
        }

        if (selectedFile.avttResourceRetryAttempts) {
          delete selectedFile.avttResourceRetryAttempts;
        }
        selectedFile.avttPendingTargetKey = targetKey;

        const userUsedElement = document.getElementById("user-used");
        if (userUsedElement) {
          userUsedElement.innerHTML = formatFileSize((avttPendingUsageBytes || 0) + S3_Current_Size);
        }
       
        try {
          if (!isSystemTarget){
            const now = new Date().toISOString();
            const normalizedKey = `${window.PATREON_ID}/${targetKey}`;
            const newSize = selectedFile.size == 0 && remoteSize > 0 ? remoteSize : Number(selectedFile.size) || 0;
            const newEntry = { Key: normalizedKey, Size: newSize, LastModified: now };
            avttRegisterPendingUploadKey(targetKey, newSize);
            if (Array.isArray(avttAllFilesCache)) {
              const idx = avttAllFilesCache.findIndex((f) => (f?.Key || f?.key) === normalizedKey);
              if (idx >= 0) {
                avttAllFilesCache[idx] = { ...avttAllFilesCache[idx], ...newEntry, key: undefined, size: undefined, lastModified: undefined };
              } else {
                avttAllFilesCache.push({ ...newEntry });
              }
            }
            if (avttFolderListingCache && typeof avttFolderListingCache.get === 'function') {
              const parentFolder = avttGetParentFolder(normalizedKey);
              const existing = avttFolderListingCache.get(parentFolder);
              if (Array.isArray(existing)) {
                const idx = existing.findIndex((f) => (f?.Key || f?.key) === normalizedKey);
                if (idx >= 0) {
                  existing[idx] = { ...existing[idx], ...newEntry, key: undefined, size: undefined, lastModified: undefined };
                } else {
                  existing.push({ ...newEntry });
                }
                avttFolderListingCache.set(parentFolder, existing);
              }
            }
            if (!skipPersistCache) {
              try { avttSchedulePersist(false); } catch { }
            }
          }
         
            
        } catch (cacheError) {
          console.warn('Failed to update local caches after upload', cacheError);
        }

        avttPendingUsageBytes += Number(selectedFile.size) || 0;
        avttPendingUsageCount += 1;
        avttPendingUsageKeys.push(targetKey);

        if (completionDeferred?.resolve) {
          completionDeferred.resolve(true);
        }
      } catch (error) {
        const isAbortError = error?.name === 'AbortError';
        if (!isAbortError) {
          const rawMessage =
            typeof error === "string"
              ? error
              : typeof error?.message === "string"
                ? error.message
                : "";
          const messageUpper = String(rawMessage || "").toUpperCase();
          const isResourceExhausted = messageUpper.includes("ERR_INSUFFICIENT_RESOURCES");
          const isNetworkFailure = messageUpper.includes("FAILED TO FETCH");
          if ((isResourceExhausted || isNetworkFailure) && !linkedSignal?.aborted) {
            const attempts = Number(selectedFile.avttResourceRetryAttempts) || 0;
            if (attempts < AVTT_RESOURCE_RETRY_LIMIT) {
              uploadRequeued = true;
              selectedFile.avttResourceRetryAttempts = attempts + 1;
              const retryDelay = Math.min(2000 * selectedFile.avttResourceRetryAttempts, 8000);
              console.warn(
                `Upload retry scheduled for ${selectedFile.name || targetKey || "file"} (attempt ${
                  selectedFile.avttResourceRetryAttempts
                }) after resource exhaustion.`,
              );
              await avttDelay(retryDelay);
              avttUploadQueue.unshift(selectedFile);
            }
          }
        }

        if (uploadRequeued) {
          return;
        }

        console.error('Upload task failed', error);
        if (!isAbortError) {
          if (isProxyUpload && error instanceof Error && error.message) {
            alert(error.message);
          }
        }
        if (completionDeferred?.reject) {
          completionDeferred.reject(
            error instanceof Error ? error : new Error(String(error ?? "Unknown upload error")),
          );
        }
      } finally {
        if (uploadRequeued) {
          return;
        }
        if (countsTowardTotals) {
          avttQueueCompleted += 1;
          if (!skipProgressIndicator) {
            showUploadingProgress(avttQueueCompleted, Math.max(avttQueueTotalEnqueued, 1));
          }
        }
      }
    })()
      .catch((e) => console.warn('Unhandled upload task error', e))
      .finally(() => {

        if (!skipsConcurrencyLimit) {
          avttActiveUploads = Math.max(0, avttActiveUploads - 1);
        }
        if (avttUploadQueue.length === 0 && avttQueueCompleted === Math.max(avttQueueTotalEnqueued, 1)) {
          avttQueueConflictPolicy = null;
          avttQueueTotalEnqueued = 0;
          avttQueueCompleted = 0;
          avttScheduleFlush(skipPersistCache);
        }


        avttProcessUploadQueue();
        
      });
  }
  
}

let avttPendingUsageBytes = 0;
let avttPendingUsageCount = 0;
let avttPendingUsageKeys = [];
let avttUsageFlushScheduled = false;

async function avttFlushUsageAndRefresh(skipPersist = false) {
  const bytes = avttPendingUsageBytes;
  const count = avttPendingUsageCount;
  const keys = avttPendingUsageKeys.slice();
  avttPendingUsageBytes = 0;
  avttPendingUsageCount = 0;
  avttPendingUsageKeys = [];

  try {
    if (document.getElementById("file-listing-section")) {
      showUploadComplete();
      refreshFiles(
        currentFolder,
        true,
        undefined,
        undefined,
        activeFilePickerFilter,
        { useCache: true, revalidate: false, selectFiles: keys },
      );

    }
    if (count > 0) {

      if (!skipPersist) {
        try { avttSchedulePersist(); } catch { }
      }
      await applyUsageDelta(bytes, count);
    }
  } finally {
    avttUsageFlushScheduled = false;
    setTimeout(function () { avttUploadController = undefined; }, 1000);
  }
  
  
}

function avttScheduleFlush(skipPersist=false) {
  if (avttUsageFlushScheduled) return;
  avttUsageFlushScheduled = true;

  Promise.resolve().then(() => { avttFlushUsageAndRefresh(skipPersist)});
}
async function uploadSelectedFiles (files, uploadFolder = currentFolder){
  const fileArray = Array.from(files || []).filter(Boolean);
  if (!fileArray.length) {
    return;
  }

  avttEnqueueUploads(fileArray, uploadFolder);
};

const debounceUploadCacheFile = mydebounce(throttle(async () => {
  try {
    const { data, filename, mimeType } = await avttCaptureDownload(function () {
      const DataFile = {};
      DataFile.avttAllFilesCache = avttAllFilesCache;
      DataFile.avttFolderListingCache = Object.fromEntries(avttFolderListingCache);
      download(JSON.stringify(DataFile, null, "\t"), AVTT_FILE_CACHE_FILENAME, "text/plain");
    });
    const fileName =
      typeof filename === "string" && filename.trim()
        ? filename.trim()
        : AVTT_FILE_CACHE_FILENAME;

    const blob = new Blob([data], { type: mimeType || "text/plain" });
    const syntheticFile = new File([blob], fileName, {
      type: mimeType || "text/plain",
    });

    syntheticFile.avttCountsTowardTotals = false;
    syntheticFile.avttSkipProgress = true;
    syntheticFile.avttDefaultConflictAction = "overwrite";
    syntheticFile.avttSkipConflictPrompt = true;
    syntheticFile.skipPersistCache = true;

    await uploadSelectedFiles([syntheticFile], avttGetFileCacheFolder());
  } catch (error) {
    console.error("AVTT File cache upload failed", error);
  }
}, 30000), 30000);
function uploadCacheFile() {
  debounceUploadCacheFile();
}

async function readUploadedFileCache() {
  try {
    let url;
    try {
      const cacheKey = avttGetFileCacheKey();
      const response = await fetch(`${AVTT_S3}?user=${window.PATREON_ID}&filename=${encodeURIComponent(cacheKey)}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.message || `Failed to fetch file from S3 (${response.status})`);
      }
      const fileURL = json.downloadURL;
      if (!fileURL) {
        throw new Error("File not found on S3");
      }
      url = fileURL;
    }
    catch {
      console.warn('Failed to get FILESCACHE')
    }
    if (!url) return;
    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn(`Failed to fetch file for import ${avttGetFileCacheKey()}`);
      return;
    }
    const DataFile = await resp.json();
    if (!DataFile)
      return;

    avttAllFilesCache = DataFile.avttAllFilesCache;
    avttFolderListingCache = new Map(Object.entries(DataFile.avttFolderListingCache));
    avttSchedulePersist(250, false);

  } catch (err) {
   console.error(err);
  }
}
function getFileExtension(name) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
let filesForInsert = [];
function refreshFiles(
  path,
  recheckSize = false,
  allFiles = false,
  searchTerm,
  fileTypes,
  options = {},
) {
    $('#refresh-files').off('click.refresh').on('click.refresh', function () {
      const newOptions = searchTerm != undefined ? options : {...options, useCache: false, revalidate: true};
      
      refreshFiles(path, recheckSize, allFiles, searchTerm, fileTypes, newOptions);
    })

    try {
      clearGetFileFromS3Queue();
    } catch (e) {
      console.warn('Failed to clear getFileFromS3Queue on refresh', e);
    }
    let {
      signal,
      useCache = true,
      revalidate,
      selectFiles
    } = options;
    const normalizedPath = typeof path === "string" ? path : "";
    let renderIndex = 0;
    const fileListingSection = document.getElementById("file-listing-section");
    if ($('#avtt-file-picker .sidebar-panel-loading-indicator').length == 0){
      const loadingContainer = $('#avtt-file-picker #loading-container');
      loadingContainer.append(build_combat_tracker_loading_indicator('Loading files...'))
    }
    $(fileListingSection).off('scroll.loadMore')
    currentFolder = typeof path === "string" ? path : "";
    activeFilePickerFilter = fileTypes;
    avttLastSelectedIndex = null;
    avttHideActionsMenu();
    avttHideExportMenu();
    avttUpdateSortIndicators();
    if (recheckSize || window.filePickerFirstLoad) {
      getUserUploadedFileSize(false, { signal, bypassCache: window.filePickerFirstLoad })
        .then((size) => {
          S3_Current_Size = size;
          document.getElementById("user-used").innerHTML = formatFileSize(S3_Current_Size);
          document.getElementById("user-limit").innerHTML = formatFileSize(activeUserLimit);
          const tierLabel = $("#patreon-tier span.user-teir-level");
          if (tierLabel.length) {
            tierLabel[0].innerHTML = `Azmoria <a draggable='false' target='_blank' href='https://www.patreon.com/cw/Azmoria/membership'>Patreon</a> Tier: ${activeUserTier.label}`;
          }
        })
        .catch((error) => {
          if (error?.name !== "AbortError") {
            console.warn("Failed to refresh usage size", error);
          }
        });
    }
    if(window.filePickerFirstLoad){
        getUserUploadedFileSize(true, { signal })
        .then((size) => {
            S3_Current_Size = size;
            document.getElementById("user-used").innerHTML = formatFileSize(S3_Current_Size);
        })
        .catch((error) => {
          if (error?.name !== "AbortError") {
            console.warn("Failed to load initial usage details", error);
          }
        });
        window.filePickerFirstLoad = false;
        useCache = false;
    }

    const fileListing = document.getElementById("file-listing");
    $('#file-listing')
      .off('change.avttSelection')
      .on('change.avttSelection', 'input[type="checkbox"]', () => {
        avttUpdateSelectNonFoldersCheckbox();
        avttUpdateActionsMenuState();
      });
    if (fileListingSection && !fileListingSection.dataset.avttContextBound) {
      fileListingSection.addEventListener("contextmenu", (event) => {
        const row = event.target.closest("tr.avtt-file-row");
        if (row) {
          return;
        }
        const targetTag = String(event.target?.tagName || "").toLowerCase();
        if (targetTag === "input" || event.target?.isContentEditable) {
          return;
        }
        avttOpenContextMenu(
          event,
          {
            relativePath: currentFolder,
            isFolder: true,
            displayName:
              currentFolder && currentFolder !== ""
                ? currentFolder.replace(/\/$/, "").split("/").pop()
                : "Root",
            isImplicit: true,
          },
          { ensureSelection: false, implicitTarget: true },
        );
      });
      fileListingSection.dataset.avttContextBound = "true";
    }
    const upFolder = $("#upFolder");
    
    const splitPath = path.replace(/\/$/gi, "").split("/");
    let breadCrumbs = [];
    if(splitPath[0] != ""){
      breadCrumbs = splitPath.map((part, index) => {
        const crumbPath = splitPath.slice(0, index + 1).join("/") + "/";
        return `<a draggable='false' href="#" class="avtt-breadcrumb" data-path="${crumbPath}">${part}</a>`;
      });
    }

  breadCrumbs.unshift(`<a draggable='false' href="#" class="avtt-breadcrumb" data-path="">Root</a>`);
    upFolder.html(`${breadCrumbs.length > 1 ? breadCrumbs.join("<span class='crumbSeparator'>></span>") : breadCrumbs[0]}`);
    upFolder.find('.avtt-breadcrumb').on("click", function (e) {
      e.preventDefault();
      const newPath = e.currentTarget.getAttribute("data-path");
      refreshFiles(newPath, undefined, undefined, undefined, fileTypes, {
        useCache: true,
        revalidate:
          !avttFolderListingCache.has(newPath) ||
          !Array.isArray(avttFolderListingCache.get(newPath)),
      });
      currentFolder = newPath;
    });

    const insertFiles = (files, searchTerm, fileTypes) => {
      if (signal?.aborted) {
        return;
      }

      const normalizedSearch =
        typeof searchTerm === "string" ? searchTerm.toLowerCase() : undefined;

      const fileTypeIcon = {
        [avttFilePickerTypes.FOLDER]: "folder",
        [avttFilePickerTypes.UVTT]: "description",
        [avttFilePickerTypes.IMAGE]: "imagesmode",
        [avttFilePickerTypes.VIDEO]: "video_file",
        [avttFilePickerTypes.AUDIO]: "audio_file",
        [avttFilePickerTypes.PDF]: "picture_as_pdf",
        [avttFilePickerTypes.ABOVEVTT]: "description",
        [avttFilePickerTypes.CSV]: "csv",
      };

      const regEx = new RegExp(`^${window.PATREON_ID}/`, "gi");
      filesForInsert = [];

      for (const fileEntry of files) {
        const rawKey =
          typeof fileEntry === "object" && fileEntry !== null
            ? fileEntry.Key || fileEntry.key || ""
            : fileEntry;
        if (!rawKey) {
          continue;
        }
        const relativePath = rawKey.replace(regEx, "");
        if (avttIsHiddenSystemRelativeKey(relativePath)) {
          continue;
        }
        const isFolder = /\/$/gi.test(relativePath);
        const size =
          typeof fileEntry === "object" &&
          fileEntry !== null &&
          Number.isFinite(Number(fileEntry.Size))
            ? Number(fileEntry.Size)
            : 0;

        const extension = getFileExtension(rawKey);
        let type;
        if (isFolder) {
          type = avttFilePickerTypes.FOLDER;
        } else if (allowedJsonTypes.includes(extension)) {
          type = avttFilePickerTypes.UVTT;
        } else if (allowedImageTypes.includes(extension)) {
          type = avttFilePickerTypes.IMAGE;
        } else if (allowedVideoTypes.includes(extension)) {
          type = avttFilePickerTypes.VIDEO;
        } else if (allowedAudioTypes.includes(extension)) {
          type = avttFilePickerTypes.AUDIO;
        } else if (allowedDocTypes.includes(extension)) {
          type = avttFilePickerTypes.PDF;
        } else if (allowedTextTypes.includes(extension)) {
          if (
            extension.toLowerCase() ===
            avttFilePickerTypes.ABOVEVTT.toLowerCase()
          ) {
            type = avttFilePickerTypes.ABOVEVTT;
          } else if (
            extension.toLowerCase() === avttFilePickerTypes.CSV.toLowerCase()
          ) {
            type = avttFilePickerTypes.CSV;
          }
        }

        if (normalizedSearch) {
          const displayName = relativePath.split("/").filter(Boolean).pop() || "";
          if (
            !relativePath.toLowerCase().includes(normalizedSearch) &&
            !(type && type.toLowerCase() === normalizedSearch) &&
            !displayName.toLowerCase().includes(normalizedSearch)
          ) {
            continue;
          }
        }

        if (fileTypes && fileTypes.length > 0) {
          if (type !== avttFilePickerTypes.FOLDER && !fileTypes.includes(type)) {
            continue;
          }
        }

        filesForInsert.push({
          rawKey,
          relativePath,
          size,
          isFolder,
          type,
          displayName: relativePath.split("/").filter(Boolean).pop() || relativePath,
        });
      }

      if (filesForInsert.length === 0) {
        fileListing.innerHTML = "<tr><td colspan='4'>No files found.</td></tr>";
        avttApplyClipboardHighlights();
        avttUpdateSelectNonFoldersCheckbox();
        avttUpdateActionsMenuState();
        return;
      }

      avttSortEntries(filesForInsert);
      const setLineImgSrc = (container, entry) => {
        requestAnimationFrame(async () => {
          try {
            if (
              !entry ||
              (entry.type !== avttFilePickerTypes.IMAGE &&
                entry.type !== avttFilePickerTypes.VIDEO)
            ) {
              return;
            }
            const rawKey = entry.rawKey || "";
            const relativeKey = entry.relativePath || avttExtractRelativeKey(rawKey);
            if (!relativeKey) {
              return;
            }
            const absoluteSourceKey = rawKey && rawKey.startsWith(`${window.PATREON_ID}/`)
              ? rawKey
              : `${window.PATREON_ID}/${relativeKey}`;
            await async_sleep(0.01);
            const thumbnailRelativeKey = avttGetThumbnailKeyFromRelative(relativeKey);
            const thumbnailAbsoluteKey = `${window.PATREON_ID}/${thumbnailRelativeKey}`;
            let previewUrl = null;
            let hasValidThumbnail = false;
            let sourceUrl = null;
            try {
              const thumbnailCandidate = await getAvttStorageUrl(thumbnailAbsoluteKey);
              if (thumbnailCandidate) {
                await avttVerifyImageUrl(thumbnailCandidate);
                previewUrl = thumbnailCandidate;
                hasValidThumbnail = true;
              }
            } catch (thumbnailError) {
              previewUrl = null;
            }
            if (!previewUrl) {
              sourceUrl = await getAvttStorageUrl(absoluteSourceKey);
              if (!sourceUrl) {
                return;
              }
              previewUrl = sourceUrl;
            } else {
              sourceUrl = await getAvttStorageUrl(absoluteSourceKey);
            }
            if (!previewUrl) {
              return;
            }
            const imageDiv = $('<div class="avtt-image-icon"></div>');
            imageDiv.css({
              "width": "35px",
              "height": "35px",
              "display": "inline-block",
              "margin-right": "10px",
              "vertical-align": "middle",
              "background-size": "cover",
              "background-position": "center",
              "background-image": `url(${previewUrl})`,
              "flex-shrink": '0',
              "background-size": "contain",
              "background-repeat": "no-repeat"
            });
            container.replaceWith(imageDiv[0]);
            if (!hasValidThumbnail && sourceUrl) {
              avttCreateThumbnailForExisting(relativeKey, sourceUrl, entry.type).catch((error) => {
                console.warn("Failed to schedule backfill thumbnail for", relativeKey, error);
              });
            }
          } catch (error) {
            const path = entry?.rawKey || entry?.relativePath || "";
            console.warn("Failed to load preview for ", path, error);
          }
        });
      };
      fileListing.innerHTML = "";
      const CHUNK_SIZE = 100;

      renderIndex = 0;

      function* renderChunk(index) {
        if (signal?.aborted) return;
        
        while (index < filesForInsert.length) {
         
          const entry = filesForInsert[index];
          const listItem = document.createElement("tr");
          listItem.classList.add("avtt-file-row");
          listItem.dataset.path = entry.relativePath;
          listItem.dataset.isFolder = entry.isFolder ? "true" : "false";
          listItem.dataset.type = entry.type || "";
          const checkboxCell = $(`<td><input type=\"checkbox\" tabindex="-1" id='input-${entry.relativePath}' class=\"avtt-file-checkbox ${entry.isFolder ? "folder" : ""}\" value=\"${entry.relativePath}\" data-size=\"${entry.isFolder ? 0 : entry.size}\"></td>`);
          if (!entry.isFolder && selectFiles && Array.isArray(selectFiles) && selectFiles.includes(entry.relativePath)) {
            checkboxCell.find("input").prop("checked", true);
          }

          const labelCell = $(`<td><label for='input-${entry.relativePath}' style=\"cursor:pointer;\" class=\"avtt-file-name  ${entry.isFolder ? "folder" : ""}\" title=\"${entry.relativePath}\"><span class=\"material-symbols-outlined\">${fileTypeIcon[entry.type] || ""}</span><span>${entry.displayName}${searchTerm ? `<br><span class='file-picker-path'>${entry.relativePath}</span>`: ''}</span></label></td>`);
          const typeCell = $(`<td>${entry.type || ""}</td>`);
          const sizeValue = entry.isFolder ? "" : formatFileSize(entry.size || 0);
          const sizeCell = $(`<td class=\"avtt-file-size\">${sizeValue}</td>`);

          const iconElement = labelCell.find("span.material-symbols-outlined")[0];
          if (iconElement) {
            setLineImgSrc(iconElement, entry);
          }

          $(listItem).append(checkboxCell, labelCell, typeCell, sizeCell);
          if (entry.isFolder) {
            labelCell
              .off("click.openFolder")
              .on("click.openFolder", function (e) {
                e.preventDefault();
                $('#avtt-file-picker #search-files').val('');
                refreshFiles(
                  entry.relativePath,
                  undefined,
                  undefined,
                  undefined,
                  fileTypes,
                  {
                    useCache: true,
                    revalidate:
                      !avttFolderListingCache.has(entry.relativePath) ||
                      !Array.isArray(avttFolderListingCache.get(entry.relativePath)),
                  },
                );
                currentFolder = entry.relativePath;
              });
          }

          const checkboxElement = checkboxCell.find("input")[0];
          if (checkboxElement) {
            const checkBoxIndex = String(index);
            checkboxElement.setAttribute("data-index", checkBoxIndex);
            checkboxElement.addEventListener("click", (clickEvent) => {
              avttHandleCheckboxClick(clickEvent, checkBoxIndex);
            });
          }
          $(checkboxElement).off('focus.preventDefault').on('focus.preventDefault', function(){
            this.blur()
          }) 
          const preventDefaults = (event) => {
            event.preventDefault();
            
          };
          let listItemArray = [];
          let draggedItems;
          $(listItem).draggable({
            addClasses: false,
            scroll: true,
            cursorAt: { left: 0, top: 0 },
            containment: "#windowContainment",
            distance: 5,
            helper: (event) => {
              const helper = $(event.target).closest('tr').find('td:nth-of-type(2)>label>:first-child').clone();
              helper.css({
                "pointer-events": 'none'
              })
              return helper;
            },
            appendTo: 'body',
            zIndex: 10000000,
            start: function (event, ui) {
              draggedItems = avttHandleDragStart(event, entry);
              listItemArray = [];
              window.orig_zoom = window.ZOOM;
              if (!Array.isArray(avttDragItems) || avttDragItems.length === 0) {
                return;
              }
              for (const entry of avttDragItems) {
                const rawKey = entry.key;
                if (entry.isFolder) {
                  continue;
                }
                const url = `above-bucket-not-a-url/${window.PATREON_ID}/${rawKey}`
                const listItem = new SidebarListItem(uuid(), entry.displayName, url, ItemType.MyToken, RootFolder.MyTokens.path);
                listItemArray.push({ url, listItem });
              }
            },
            drag: function (event, ui){
              let droppedOn = $(document.elementFromPoint(event.clientX, event.clientY));
              const closestFolder = droppedOn.closest('[data-is-folder="true"]');
              const isAvttDropTarget = closestFolder.hasClass('avtt-drop-target');

              if(closestFolder.length>0 && isAvttDropTarget)
                return;
              if (droppedOn.closest('#VTT').length > 0) {
                if (event.shiftKey) {
                  $(ui.helper).css("opacity", 0.5);
                } else {
                  $(ui.helper).css("opacity", 1);
                }
                let zoom = parseFloat(window.ZOOM);
                const size = window.CURRENT_SCENE_DATA.hpps * window.ZOOM;
                const helper = ui.helper;

                helper.css({ width: `${size}px`, height: `${size}px` });

                ui.position = {
                  left: (ui.position.left - (size / 2)),
                  top: (ui.position.top - (size / 2))
                };


 

                $('[data-is-folder="true"]').toggleClass('avtt-drop-target', false);
              } else if (closestFolder.length == 0) {
                $(ui.helper).css("opacity", 1);
                $('[data-is-folder="true"]').toggleClass('avtt-drop-target', false);
              } else { 
                $(ui.helper).css({
                  width: ``,
                  height: ``
                });
                $('[data-is-folder="true"]').toggleClass('avtt-drop-target', false);
                if ($(this).attr('data-path') == closestFolder.attr('data-path'))
                  return;
                closestFolder.toggleClass('avtt-drop-target', true); 
              }
            },
            stop: function (event, ui) {
              avttHandleDragEnd(event);
              let droppedOn = $(document.elementFromPoint(event.clientX, event.clientY));
              const closestFolder = droppedOn.closest('[data-is-folder="true"]');
              if(droppedOn.closest('#VTT').length>0){
                avttHandleMapDrop(event, listItemArray)
              } else if (closestFolder.length > 0){
                if ($(this).attr('data-path') == closestFolder.attr('data-path'))
                  return;
                avttDragItems = draggedItems;
                avttHandleFolderDrop(event, closestFolder.attr('data-path'));
              }
              const allCheckboxes = avttGetAllCheckboxElements();
              allCheckboxes.forEach((checkbox) => {
                checkbox.checked = false;
              });
              avttUpdateSelectNonFoldersCheckbox();
              avttUpdateActionsMenuState();
              avttApplyClipboardHighlights();
            },
          })
       
          if (entry.isFolder) {
            listItem.addEventListener("dragenter", (dragEvent) => {
              avttHandleFolderDragEnter(dragEvent, listItem, entry.relativePath);
            });
            listItem.addEventListener("dragover", (dragEvent) => {
              avttHandleFolderDragOver(dragEvent, listItem, entry.relativePath);
            });
            listItem.addEventListener("dragleave", (dragEvent) => {
              avttHandleFolderDragLeave(dragEvent, listItem);
            });
            listItem.addEventListener("drop", (dragEvent) => {
              avttHandleFolderDrop(dragEvent, entry.relativePath);
            });
          }
          listItem.addEventListener("contextmenu", (contextEvent) => {
            avttOpenContextMenu(contextEvent, entry);
          });

          fileListing.appendChild(listItem);


          avttApplyClipboardHighlights();
          avttUpdateSelectNonFoldersCheckbox();
          avttUpdateActionsMenuState(); 
          index++;
          yield(index);

        }
      }
      let renderFiles = renderChunk(0);

      for (let i = 0; i < CHUNK_SIZE && renderIndex < filesForInsert.length; i++) {
        renderIndex = renderFiles.next().value
      }      

      const debounceScroll = mydebounce(throttle(() => {
        if (!fileListingSection) return;
        if (fileListingSection.scrollHeight - fileListingSection.scrollTop - fileListingSection.clientHeight <= 400) {    
          for (let i = 0; i < CHUNK_SIZE && renderIndex < filesForInsert.length; i++) {
            renderIndex = renderFiles.next().value  
          }
        }
      }, 250), 250);
      
      if (fileListingSection) {
        $(fileListingSection).off('scroll.loadMore').on('scroll.loadMore', debounceScroll);
      }
    };
    const hasCachedAllFiles = Array.isArray(avttAllFilesCache) && avttAllFilesCache.length > 0;
    const hasCachedFolder = avttFolderListingCache.has(normalizedPath) && Array.isArray(avttFolderListingCache.get(normalizedPath));
    const hasCachedData = allFiles ? hasCachedAllFiles : hasCachedFolder;
    const shouldUseCachedData = useCache && hasCachedData;

    if (shouldUseCachedData) {
      const cachedEntries = allFiles
        ? avttAllFilesCache
        : avttFolderListingCache.get(normalizedPath);
      insertFiles(cachedEntries || [], searchTerm, fileTypes);
    }

    const wantsRevalidate =
      revalidate !== undefined ? revalidate : !hasCachedData;
    const shouldFetch =
      wantsRevalidate || !hasCachedData || !useCache;
    if (!shouldFetch) {
      $('#avtt-file-picker .sidebar-panel-loading-indicator').remove();
      return Promise.resolve();
    }

    const fetchPromise = allFiles
      ? getAllUserFiles({ signal })
      : getFolderListingFromS3(path, { signal });

    const handledPromise = fetchPromise
      .then((files) => {
        if (allFiles) {
          avttPrimeListingCachesFromFullListing(files);
        } else {
          avttStoreFolderListing(normalizedPath, files);
        }
        insertFiles(files, searchTerm, fileTypes);
      })
      .catch((err) => {
        if (err?.name === "AbortError") {
          return;
        }
        alert("Error fetching folder listing. See console for details.");
        console.error("Error fetching folder listing: ", err);
        $('#avtt-file-picker .sidebar-panel-loading-indicator').remove();
      }).finally(() => {
        $('#avtt-file-picker .sidebar-panel-loading-indicator').remove();
      });

    return handledPromise;
}

async function sendUsageUpdate(payload) {
  try {
    const response = await fetch(`${AVTT_S3}?action=usage&user=${window.PATREON_ID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    let json = null;
    try {
      json = await response.json();
    } catch (parseError) {
      json = null;
    }
    if (!response.ok) {
      const message = json && json.message ? json.message : "Usage update failed.";
      throw new Error(message);
    }
    return json;
  } catch (error) {
    console.warn("Usage update failed", error);
    return null;
  }
}

async function applyUsageDelta(deltaBytes, deltaObjects) {
  const bytes = Number(deltaBytes) || 0;
  const objects = Number(deltaObjects) || 0;
  if (bytes === 0 && objects === 0) {
    return null;
  }
  const result = await sendUsageUpdate({ deltaBytes: bytes, objectDelta: objects });
  if (result) {
    avttAdjustCachedUsage(bytes, objects);
  }
  return result;
}

async function avttDeleteThumbnailKeys(entries, options = {}) {
  const normalizedEntries = Array.isArray(entries)
    ? entries
        .map((entry) => {
          if (!entry) return null;
          const key =
            typeof entry === "string"
              ? avttNormalizeRelativePath(entry)
              : avttNormalizeRelativePath(entry.key);
          if (!key || !avttIsThumbnailRelativeKey(key)) {
            return null;
          }
          const sizeValue =
            typeof entry === "string" ? undefined : Number.isFinite(Number(entry.size)) ? Number(entry.size) : undefined;
          return {
            key,
            size: sizeValue,
            isFolder: false,
          };
        })
        .filter(Boolean)
    : [];
  if (!normalizedEntries.length) {
    return;
  }

  const MAX_DELETE_KEYS_PER_REQUEST = 1000;
  let latestResponseJson = null;

  for (let offset = 0; offset < normalizedEntries.length; offset += MAX_DELETE_KEYS_PER_REQUEST) {
    const chunkEntries = normalizedEntries.slice(offset, offset + MAX_DELETE_KEYS_PER_REQUEST);
    if (!chunkEntries.length) {
      continue;
    }
    const chunkTotalSize = chunkEntries.reduce((sum, entry) => sum + (Number(entry?.size) || 0), 0);
    const chunkPayload = {
      keys: chunkEntries,
      totalSize: chunkTotalSize,
      objectCount: chunkEntries.length,
    };
    const response = await fetch(
      `${AVTT_S3}?user=${window.PATREON_ID}&deleteFiles=true`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chunkPayload),
        signal: options?.signal,
      },
    );
    let json = null;
    try {
      json = await response.json();
    } catch (parseError) {
      json = null;
    }
    if (!response.ok || !json?.deleted) {
      throw new Error(json?.message || "Failed to delete thumbnail(s)");
    }
    latestResponseJson = json;
  }

  if (latestResponseJson?.usage) {
    avttUsageCache.totalBytes = latestResponseJson.usage.totalBytes;
    avttUsageCache.objectCount = latestResponseJson.usage.objectCount;
  }

  for (const entry of normalizedEntries) {
    avttRemoveCacheEntry(entry.key);
  }
}

async function deleteFilesFromS3Folder(selections, fileTypes) {
  const entries = Array.isArray(selections) ? selections.filter((entry) => entry && entry.key) : [];
  if (entries.length === 0) {
    return;
  }
  if (!confirm(`Are you sure you want to delete the selected ${entries.length} item(s)? This action cannot be undone.`)) {
    return;
  }
  if (avttDeleteAbortController && avttDeleteAbortController.signal && !avttDeleteAbortController.signal.aborted) {
    try { avttDeleteAbortController.abort("Replaced by new delete operation."); } catch { /* no-op */ }
  }
  avttDeleteAbortController = new AbortController();
  const abortController = avttDeleteAbortController;
  const { signal } = abortController;
  const createAbortError = () => {
    const reason = signal?.reason || "Aborted";
    try { return new DOMException(reason, "AbortError"); }
    catch {
      const abortError = new Error(reason);
      abortError.name = "AbortError";
      return abortError;
    }
  };
  const ensureNotAborted = () => {
    if (signal?.aborted) {
      throw createAbortError();
    }
  };
  const indicatorMode = AVTT_OPERATION_INDICATOR_MODES.DELETE;
  const cancelButtonTitle = "Cancel Delete";
  const cancelCompletionMessage = "Delete Cancelled";
  const cancelHandler = () => {
    if (!signal?.aborted) {
      try { abortController.abort("User cancelled delete operation."); } catch { /* no-op */ }
    }
  };
  let aborted = false;

 
  ensureNotAborted();

  const seenKeys = new Set();
  const payloadEntries = [];
  const MAX_DELETE_KEYS_PER_REQUEST = 1000;
  let cachedExpansionCount = 0;

  const addPayloadEntry = (key, size, isFolder) => {
    const normalized = avttNormalizeRelativePath(key);
    if (!normalized || seenKeys.has(normalized)) {
      return false;
    }
    seenKeys.add(normalized);
    const numericSize = Number(size);
    payloadEntries.push({
      key: normalized,
      size: Number.isFinite(numericSize) ? numericSize : undefined,
      isFolder: Boolean(isFolder),
    });
    return true;
  };

  const addEntryWithAssociatedDeletes = (
    key,
    size,
    isFolder,
    { fromCache = false } = {},
  ) => {
    ensureNotAborted();
    const added = addPayloadEntry(key, size, isFolder);
    if (!added) {
      return;
    }
    if (fromCache) {
      cachedExpansionCount += 1;
    }

    if (isFolder) {
      const thumbnailFolderKey = avttGetThumbnailKeyFromRelative(key);
      addPayloadEntry(thumbnailFolderKey, 0, true);
    } else if (avttShouldGenerateThumbnail(getFileExtension(key))) {
      const thumbnailKey = avttGetThumbnailKeyFromRelative(key);
      addPayloadEntry(thumbnailKey, 0, false);
    }
  };

  const getCachedFolderListing = (folderPath) => {
    const variants = [
      folderPath,
      typeof folderPath === "string" ? folderPath.replace(/\/$/, "") : folderPath,
      avttNormalizeFolderPath(folderPath),
    ];
    for (const variant of variants) {
      if (typeof variant !== "string") {
        continue;
      }
      if (avttFolderListingCache.has(variant)) {
        return avttFolderListingCache.get(variant);
      }
    }
    return null;
  };

  const includeCachedDescendants = async (folderKey) => {
    ensureNotAborted();
    const normalizedFolder = avttNormalizeFolderPath(folderKey);
    if (!normalizedFolder) {
      return;
    }

    const includeEntry = (relativeKey, size, isFolder) => {
      ensureNotAborted();
      if (!relativeKey || relativeKey === normalizedFolder) {
        return;
      }
      addEntryWithAssociatedDeletes(relativeKey, size, isFolder, { fromCache: true });
    };

    let fulfilledFromAllFilesCache = false;
    if (Array.isArray(avttAllFilesCache) && avttAllFilesCache.length > 0) {
      const absolutePrefix = `${window.PATREON_ID}/${normalizedFolder}`;
      const expansionCountBefore = cachedExpansionCount;
      for (const cachedEntry of avttAllFilesCache) {
        ensureNotAborted();
        const absolute = cachedEntry?.Key || cachedEntry?.key;
        if (typeof absolute !== "string" || !absolute.startsWith(absolutePrefix)) {
          continue;
        }
        const relative = avttExtractRelativeKey(absolute);
        if (!relative || relative === normalizedFolder) {
          continue;
        }
        const size = Number.isFinite(Number(cachedEntry?.Size))
          ? Number(cachedEntry.Size)
          : Number(cachedEntry?.size);
        const isFolder = relative.endsWith("/");
        includeEntry(relative, size, isFolder);
      }
      fulfilledFromAllFilesCache = cachedExpansionCount > expansionCountBefore;
    }

    if (fulfilledFromAllFilesCache) {
      return;
    }

    const visitedFolders = new Set();
    const fetchedFolders = new Set();
    const stack = [normalizedFolder];
    while (stack.length > 0) {
      ensureNotAborted();
      const currentFolder = stack.pop();
      if (!currentFolder || visitedFolders.has(currentFolder)) {
        continue;
      }
      visitedFolders.add(currentFolder);
      let listing = getCachedFolderListing(currentFolder);
      if ((!Array.isArray(listing) || listing.length === 0) && !fetchedFolders.has(currentFolder)) {
        try {
          listing = await getFolderListingFromS3(currentFolder, { signal });
          ensureNotAborted();
          if (Array.isArray(listing) && listing.length > 0) {
            avttStoreFolderListing(currentFolder, listing);
          }
        } catch (fetchError) {
          console.warn("Failed to expand folder listing during delete", currentFolder, fetchError);
          fetchedFolders.add(currentFolder);
          continue;
        }
        fetchedFolders.add(currentFolder);
      }
      if (!Array.isArray(listing) || listing.length === 0) {
        continue;
      }
      for (const cachedEntry of listing) {
        ensureNotAborted();
        const absolute = cachedEntry?.Key || cachedEntry?.key;
        if (typeof absolute !== "string") {
          continue;
        }
        const relative = avttExtractRelativeKey(absolute);
        if (!relative || relative === currentFolder) {
          continue;
        }
        const size = Number.isFinite(Number(cachedEntry?.Size))
          ? Number(cachedEntry.Size)
          : Number(cachedEntry?.size);
        const isFolder = relative.endsWith("/");
        includeEntry(relative, size, isFolder);
        if (isFolder) {
          const childFolder = avttNormalizeFolderPath(relative);
          if (childFolder && !visitedFolders.has(childFolder)) {
            stack.push(childFolder);
          }
        }
      }
    }
  };

  for (const entry of entries) {
    ensureNotAborted();
    if (!entry?.key) {
      continue;
    }
    addEntryWithAssociatedDeletes(entry.key, entry.size, entry.isFolder);
    if (entry.isFolder) {
      await includeCachedDescendants(entry.key);
      ensureNotAborted();
    }
  }

  if (!payloadEntries.length) {
    $('#avtt-file-picker .sidebar-panel-loading-indicator').remove();
    avttHideOperationIndicator(indicatorMode);
    if (avttDeleteAbortController === abortController) {
      avttDeleteAbortController = null;
    }
    return;
  }

  const totalDeleteCount = payloadEntries.length;
  let deleteProgressCount = 0;
  const deleteIndicatorLabel = totalDeleteCount === 1 ? "Deleting Item" : "Deleting Items";
  avttShowOperationProgressIndicator(indicatorMode, {
    label: deleteIndicatorLabel,
    currentDisplay: 0,
    total: totalDeleteCount,
    showCancelButton: true,
    cancelButtonTitle,
    cancelButtonLabel: "X",
    cancelHandler,
  });

  try {
    let latestResponseJson = null;
    const MAX_DELETE_ATTEMPTS = 3;
    const DELETE_RETRY_BASE_DELAY_MS = 500;
    for (let offset = 0; offset < payloadEntries.length; offset += MAX_DELETE_KEYS_PER_REQUEST) {
      ensureNotAborted();
      const chunkEntries = payloadEntries.slice(offset, offset + MAX_DELETE_KEYS_PER_REQUEST);
      if (!chunkEntries.length) {
        continue;
      }
      const chunkTotalSize = chunkEntries.reduce(
        (sum, entry) => sum + (Number(entry?.size) || 0),
        0,
      );
      const chunkPayload = {
        keys: chunkEntries,
        totalSize: chunkTotalSize,
        objectCount: chunkEntries.length,
      };
      let chunkSucceeded = false;
      let lastChunkError = null;
      for (let attempt = 1; attempt <= MAX_DELETE_ATTEMPTS; attempt += 1) {
        ensureNotAborted();
        try {
          const response = await fetch(
            `${AVTT_S3}?user=${window.PATREON_ID}&deleteFiles=true`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(chunkPayload),
              signal,
            },
          );
          let json = null;
          try {
            json = await response.json();
          } catch (parseError) {
            json = null;
          }
          if (!response.ok || !json?.deleted) {
            throw new Error(json?.message || "Failed to delete file(s)");
          }
          latestResponseJson = json;
          chunkSucceeded = true;
          break;
        } catch (chunkError) {
          if (chunkError?.name === "AbortError") {
            throw createAbortError();
          }
          lastChunkError =
            chunkError instanceof Error
              ? chunkError
              : new Error(String(chunkError ?? "Failed to delete file(s)"));
          if (attempt >= MAX_DELETE_ATTEMPTS) {
            throw lastChunkError;
          }
          await avttDelay(DELETE_RETRY_BASE_DELAY_MS * attempt);
          ensureNotAborted();
        }
      }
      if (!chunkSucceeded) {
        continue;
      }

      deleteProgressCount += chunkEntries.length;
      const deleteDisplayValue = Math.min(Math.max(deleteProgressCount, 0), totalDeleteCount);
      if (signal?.aborted) {
        break;
      }
      avttShowOperationProgressIndicator(indicatorMode, {
        label: deleteIndicatorLabel,
        currentDisplay: deleteDisplayValue,
        total: totalDeleteCount,
        showCancelButton: true,
        cancelButtonTitle,
        cancelButtonLabel: "X",
        cancelHandler,
      });
    }

    ensureNotAborted();
    const finalJson = latestResponseJson || {};

    for (const entry of entries) {
      ensureNotAborted();
      if (entry.isFolder) {
        avttRemoveFolderCacheRecursively(entry.key);
        const thumbnailFolderKey = avttGetThumbnailKeyFromRelative(entry.key);
        avttRemoveFolderCacheRecursively(thumbnailFolderKey);
      } else if (avttShouldGenerateThumbnail(getFileExtension(entry.key))) {
        const thumbnailKey = avttGetThumbnailKeyFromRelative(entry.key);
        avttRemoveCacheEntry(thumbnailKey);
      }
      avttRemoveCacheEntry(entry.key);
    }

    if (finalJson?.usage) {
      avttUsageCache.totalBytes = finalJson.usage.totalBytes;
      avttUsageCache.objectCount = finalJson.usage.objectCount;
    }

    ensureNotAborted();
    refreshFiles(
      currentFolder,
      true,
      undefined,
      undefined,
      fileTypes,
      { useCache: true, revalidate: false },
    );
    if (totalDeleteCount > 0) {
      avttShowOperationComplete(indicatorMode, "Delete Complete", 1500);
    } else {
      avttHideOperationIndicator(indicatorMode);
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      aborted = true;
    } else {
      console.error("Failed to delete files", error);
      alert(error.message || "Failed to delete file(s).");
      avttHideOperationIndicator(indicatorMode);
    }
  } finally {
    if (avttDeleteAbortController === abortController) {
      avttDeleteAbortController = null;
    }
    $('#avtt-file-picker .sidebar-panel-loading-indicator').remove();
  }
  if (aborted) {
    const indicatorElement = avttGetOperationIndicatorElement(indicatorMode);
    if (indicatorElement && indicatorElement.style.display !== "none") {
      avttShowOperationComplete(indicatorMode, cancelCompletionMessage, 800);
    } else {
      avttHideOperationIndicator(indicatorMode);
    }
    return;
  }
}


const GET_FILE_FROM_S3_MAX_RETRIES = 5;
const GET_FILE_FROM_S3_BASE_DELAY_MS = 250;
const GET_FILE_FROM_S3_MAX_DELAY_MS = 4000;
const GET_FILE_FROM_S3_BATCH_SIZE = 50;
const GET_FILE_FROM_S3_CACHE_TTL_MS = 3500000;
let getFileFromS3Queue = [];
let getFileFromS3Pending = new Map();
let isProcessingGetFileFromS3Queue = false;

function clearGetFileFromS3Queue() {
  if (!Array.isArray(getFileFromS3Queue) || getFileFromS3Queue.length === 0) return;
  try {
    if (avttActiveSearchAbortController) {
      avttActiveSearchAbortController.abort('Cancelled Search Request');
    }
    getFileFromS3Queue = [];
    getFileFromS3Pending = new Map();
  } catch (e) {
    console.warn('Error while clearing getFileFromS3Queue', e);
  }
}

function getFileFromS3Delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function cacheGetFileFromS3Url(cacheKey, sanitizedKey, fileURL) {
  if (!cacheKey || !fileURL) {
    return;
  }
  if (!window.avtt_file_urls || typeof window.avtt_file_urls !== "object") {
    window.avtt_file_urls = {};
  }
  const expireAt = Date.now() + GET_FILE_FROM_S3_CACHE_TTL_MS;
  window.avtt_file_urls[cacheKey] = {
    url: fileURL,
    expire: expireAt,
  };
  if (sanitizedKey && sanitizedKey !== cacheKey) {
    window.avtt_file_urls[sanitizedKey] = {
      url: fileURL,
      expire: expireAt,
    };
  }
}

async function processGetFileFromS3Queue() {
  if (isProcessingGetFileFromS3Queue) {
    return;
  }

  const processSingleItem = async (queueItem) => {
    if (!queueItem) {
      return;
    }
    try {
      const result = await fetchFileFromS3WithRetry(
        queueItem.originalName,
        queueItem.cacheKey,
        queueItem.sanitizedKey,
      );
      queueItem.resolve(result);
    } catch (error) {
      queueItem.reject(error);
    }
  };

  isProcessingGetFileFromS3Queue = true;
  try {
    while (getFileFromS3Queue.length > 0) {
      const firstItem = getFileFromS3Queue.shift();
      if (!firstItem) {
        continue;
      }

      const normalizedOriginal = avttNormalizeRelativePath(firstItem.originalName);
      const [rawUser, ...restParts] = normalizedOriginal.split("/").filter(Boolean);
      const patreonId = rawUser || "";
      if (!patreonId || restParts.length === 0) {
        await processSingleItem(firstItem);
        continue;
      }

      const normalizedUser = avttNormalizeRelativePath(patreonId);
      const batchItems = [firstItem];

      for (let index = 0; index < getFileFromS3Queue.length && batchItems.length < GET_FILE_FROM_S3_BATCH_SIZE;) {
        const candidate = getFileFromS3Queue[index];
        if (!candidate) {
          getFileFromS3Queue.splice(index, 1);
          continue;
        }
        const candidateOriginal = avttNormalizeRelativePath(candidate.originalName);
        const candidateUser = candidateOriginal.split("/").filter(Boolean)[0] || "";
        if (candidateUser && avttNormalizeRelativePath(candidateUser) === normalizedUser) {
          batchItems.push(candidate);
          getFileFromS3Queue.splice(index, 1);
        } else {
          index += 1;
        }
      }

      const batchLookup = new Map();
      const fallbackItems = [];

      const extractRelativeKey = (item) => {
        const normalizedCacheKey = avttNormalizeRelativePath(item.cacheKey);
        const prefix = `${normalizedUser}/`;
        if (normalizedCacheKey.startsWith(prefix)) {
          return normalizedCacheKey.slice(prefix.length);
        }
        const sanitized = item.sanitizedKey ? avttNormalizeRelativePath(item.sanitizedKey) : "";
        if (sanitized) {
          return sanitized;
        }
        const normalizedOriginalKey = avttNormalizeRelativePath(item.originalName);
        if (normalizedOriginalKey.startsWith(prefix)) {
          return normalizedOriginalKey.slice(prefix.length);
        }
        const parts = normalizedCacheKey.split("/").filter(Boolean);
        if (parts.length > 1) {
          return parts.slice(1).join("/");
        }
        return "";
      };

      for (const item of batchItems) {
        const relativeKey = extractRelativeKey(item);
        if (!relativeKey) {
          fallbackItems.push(item);
          continue;
        }
        const normalizedRelative = avttNormalizeRelativePath(relativeKey);
        const fullPath = `${normalizedUser}/${normalizedRelative}`;
        if (!batchLookup.has(fullPath)) {
          batchLookup.set(fullPath, { relativeKey: normalizedRelative, items: [] });
        }
        batchLookup.get(fullPath).items.push(item);
      }

      if (batchLookup.size <= 1) {
        for (const item of batchItems) {
          await processSingleItem(item);
        }
        continue;
      }

      let batchResult = null;
      const relativeKeys = Array.from(batchLookup.values()).map((entry) => entry.relativeKey);
      try {
        batchResult = await fetchFilesFromS3BatchWithRetry(normalizedUser, relativeKeys);
      } catch (batchError) {
        console.warn("Batch signed URL fetch failed, falling back to individual requests", batchError);
      }

      if (!batchResult) {
        for (const item of batchItems) {
          await processSingleItem(item);
        }
        continue;
      }

      const unresolvedItems = new Set(fallbackItems);
      for (const [fullPath, entry] of batchLookup.entries()) {
        const result = batchResult.get(fullPath);
        const url = result?.url;
        if (url) {
          for (const item of entry.items) {
            cacheGetFileFromS3Url(item.cacheKey, item.sanitizedKey, url);
            item.resolve(url);
            unresolvedItems.delete(item);
          }
        } else {
          for (const item of entry.items) {
            unresolvedItems.add(item);
          }
        }
      }

      if (unresolvedItems.size > 0) {
        for (const item of unresolvedItems) {
          await processSingleItem(item);
        }
      }
    }
  } finally {
    isProcessingGetFileFromS3Queue = false;
  }
}

async function fetchFilesFromS3BatchWithRetry(userId, relativeKeys) {
  const normalizedUser = avttNormalizeRelativePath(userId);
  const uniqueKeys = Array.from(
    new Set(
      (Array.isArray(relativeKeys) ? relativeKeys : [])
        .map((key) => avttNormalizeRelativePath(key))
        .filter((key) => typeof key === "string" && key.length > 0),
    ),
  );
  if (!normalizedUser || uniqueKeys.length === 0) {
    return new Map();
  }

  let attempt = 0;
  let lastError = null;
  while (attempt < GET_FILE_FROM_S3_MAX_RETRIES) {
    attempt += 1;
    try {
      return await fetchFilesFromS3BatchOnce(normalizedUser, uniqueKeys);
    } catch (error) {
      lastError = error;
      if (attempt >= GET_FILE_FROM_S3_MAX_RETRIES) {
        break;
      }
      const backoffDelay = Math.min(
        GET_FILE_FROM_S3_BASE_DELAY_MS * 2 ** (attempt - 1),
        GET_FILE_FROM_S3_MAX_DELAY_MS,
      );
      await getFileFromS3Delay(backoffDelay);
    }
  }
  throw lastError || new Error("Failed to fetch batch of files from S3");
}

async function fetchFilesFromS3BatchOnce(userId, relativeKeys) {
  const response = await fetch(
    `${AVTT_S3}?action=batchDownload&user=${encodeURIComponent(userId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: relativeKeys }),
    },
  );

  let json = null;
  try {
    json = await response.json();
  } catch (error) {
    json = null;
  }

  if (!response.ok) {
    const message = json?.message || `Failed to fetch batch files from S3 (${response.status})`;
    throw new Error(message);
  }

  const resultMap = new Map();
  const successes = Array.isArray(json?.results) ? json.results : [];
  for (const entry of successes) {
    const relativeKey = typeof entry?.filename === "string" ? avttNormalizeRelativePath(entry.filename) : "";
    const rawPath = typeof entry?.path === "string" ? entry.path : "";
    const fullPath = rawPath
      ? avttNormalizeRelativePath(rawPath)
      : relativeKey
        ? `${userId}/${relativeKey}`
        : "";
    const downloadURL = typeof entry?.downloadURL === "string" ? entry.downloadURL : "";
    if (!fullPath || !downloadURL) {
      continue;
    }
    resultMap.set(fullPath, { url: downloadURL });
  }

  const errors = Array.isArray(json?.errors) ? json.errors : [];
  for (const entry of errors) {
    const relativeKey = typeof entry?.filename === "string" ? avttNormalizeRelativePath(entry.filename) : "";
    const rawPath = typeof entry?.path === "string" ? entry.path : "";
    const fullPath = rawPath
      ? avttNormalizeRelativePath(rawPath)
      : relativeKey
        ? `${userId}/${relativeKey}`
        : "";
    const message = typeof entry?.message === "string" && entry.message
      ? entry.message
      : "Failed to fetch file from S3";
    if (!fullPath || resultMap.has(fullPath)) {
      continue;
    }
    resultMap.set(fullPath, { error: message });
  }

  for (const key of relativeKeys) {
    const fullPath = avttNormalizeRelativePath(`${userId}/${key}`);
    if (!resultMap.has(fullPath)) {
      resultMap.set(fullPath, { error: "File missing from batch response" });
    }
  }

  return resultMap;
}

async function fetchFileFromS3WithRetry(originalName, cacheKey, sanitizedKey) {
  const patreonId = originalName.split("/")[0];
  const fileNameOnly = sanitizedKey || originalName;
  if (!patreonId) {
    throw new Error("Missing Patreon ID for S3 file lookup");
  }

  let attempt = 0;
  let lastError = null;
  while (attempt < GET_FILE_FROM_S3_MAX_RETRIES) {
    attempt += 1;
    try {
      const response = await fetch(`${AVTT_S3}?user=${patreonId}&filename=${fileNameOnly}`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.message || `Failed to fetch file from S3 (${response.status})`);
      }
      const fileURL = json.downloadURL;
      if (!fileURL) {
        throw new Error("File not found on S3");
      }
      cacheGetFileFromS3Url(cacheKey, sanitizedKey, fileURL);
      return fileURL;
    } catch (error) {
      lastError = error;
      if (attempt >= GET_FILE_FROM_S3_MAX_RETRIES) {
        break;
      }
      const backoffDelay = Math.min(
        GET_FILE_FROM_S3_BASE_DELAY_MS * 2 ** (attempt - 1),
        GET_FILE_FROM_S3_MAX_DELAY_MS,
      );
      await getFileFromS3Delay(backoffDelay);
    }
  }
  throw lastError || new Error("Failed to fetch file from S3");
}

async function getFileFromS3(fileName, highPriority=false) {
  const originalName = typeof fileName === "string" ? fileName : "";
  if (!originalName) {
    throw new Error("Missing filename for S3 request");
  }
  const cacheKey = originalName;
  const sanitizedKey = originalName.replace(/^.*?\//gi, "");

  if (!window.avtt_file_urls) {
    window.avtt_file_urls = {};
  } 
  const cachedValue = window.avtt_file_urls[cacheKey] || (sanitizedKey ? window.avtt_file_urls[sanitizedKey] : undefined);
  if (cachedValue?.expire > Date.now()){
    return cachedValue.url;
  }

  if (getFileFromS3Pending.has(cacheKey)) {

    if (highPriority) {
      const i = getFileFromS3Queue.findIndex(item => item.cacheKey === cacheKey);
      if (i > -1) {
        const [item] = getFileFromS3Queue.splice(i, 1);
        getFileFromS3Queue.unshift(item);
        return getFileFromS3Pending.get(cacheKey)
      }
    }else{
      return getFileFromS3Pending.get(cacheKey);
    }

  }

  const queuedPromise = new Promise((resolve, reject) => {

    const alreadyQueued = getFileFromS3Queue.find((q) => q && q.cacheKey === cacheKey);
    if (!alreadyQueued) {
      if(highPriority){
        getFileFromS3Queue.unshift({
          originalName,
          cacheKey,
          sanitizedKey,
          resolve,
          reject,
        });
      }
      else{
        getFileFromS3Queue.push({
          originalName,
          cacheKey,
          sanitizedKey,
          resolve,
          reject,
        });
      }

    } else {
      if (getFileFromS3Pending.has(cacheKey)) {
        
        if(highPriority){
          const i = getFileFromS3Queue.findIndex(item => item.cacheKey === cacheKey);
          if (i > -1) {
            const [item] = getFileFromS3Queue.splice(i, 1);
            getFileFromS3Queue.unshift(item);
            const existing = getFileFromS3Pending.get(cacheKey);
            existing.then(resolve).catch(reject);
          }
        }
        else{
          const existing = getFileFromS3Pending.get(cacheKey);
          existing.then(resolve).catch(reject);
        }
        
      } else {
        if (highPriority) {
          getFileFromS3Queue.unshift({ originalName, cacheKey, sanitizedKey, resolve, reject });
        }
        else{
          getFileFromS3Queue.push({ originalName, cacheKey, sanitizedKey, resolve, reject });
        }
      }
    }
  });
  getFileFromS3Pending.set(cacheKey, queuedPromise);
  processGetFileFromS3Queue();

  try {
    return await queuedPromise;
  } finally {
    getFileFromS3Pending.delete(cacheKey);
  }
}

async function getFolderListingFromS3(folderPath, options = {}) {
  const { signal } = options || {};
  const aggregated = [];
  let continuationToken = null;
  let iteration = 0;
  const MAX_ITERATIONS = 500;
  const normalizedPath =
    typeof folderPath === "string" ? folderPath : "";

  while (iteration < MAX_ITERATIONS) {
    if (signal?.aborted) {
      throw new DOMException(signal.reason || "Aborted", "AbortError");
    }
    const requestUrl = new URL(AVTT_S3);
    requestUrl.searchParams.set("user", window.PATREON_ID);
    requestUrl.searchParams.set("filename", normalizedPath);
    requestUrl.searchParams.set("list", "true");
    if (continuationToken) {
      requestUrl.searchParams.set("continuationToken", continuationToken);
    }

    const response = await avttFetchWithRetry(
      requestUrl.toString(),
      { signal },
      {
        retries: 4,
        baseDelay: 300,
        maxDelay: 4000,
        retryStatuses: AVTT_DEFAULT_RETRYABLE_STATUSES,
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch folder listing (${response.status})`);
    }
    const json = await response.json();
    const folderContents = Array.isArray(json.folderContents)
      ? json.folderContents
      : [];
    aggregated.push(...folderContents);

    const responseContinuationToken =
      typeof json.nextContinuationToken === "string" && json.nextContinuationToken
        ? json.nextContinuationToken
        : typeof json.continuationToken === "string" && json.continuationToken
          ? json.continuationToken
          : null;
    continuationToken = responseContinuationToken;
    iteration += 1;

    const isTruncated =
      json.isTruncated === undefined
        ? Boolean(continuationToken)
        : Boolean(json.isTruncated);
    if (!isTruncated || !continuationToken) {
      break;
    }
  }

  if (iteration >= MAX_ITERATIONS) {
    console.warn(
      "Reached maximum pagination iterations while fetching folder listing.",
    );
  }

  return aggregated;
}

async function getUserUploadedFileSize(forceFullCheck = false, options = {}) {
  const { signal, bypassCache = false } = options;
  const shouldUseCache = !forceFullCheck && !bypassCache;
  if (shouldUseCache) {
    if (avttUsageCache.pending) {
      return avttUsageCache.pending;
    }
    if (typeof avttUsageCache.totalBytes === "number") {
      return avttUsageCache.totalBytes;
    }
  }

  const fallBack = async () => {
    const folderContents = await getAllUserFiles({ signal });
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    let userSize = 0;
    let objectCount = 0;
    const nonThumbnailKeys = new Set();
    const thumbnailCandidates = [];
    for (const file of folderContents) {
      if (!file) {
        continue;
      }
      const key = file.Key || file.key;
      if (!key) {
        continue;
      }
      const relative = avttExtractRelativeKey(key);
      if (avttIsThumbnailRelativeKey(relative)) {
        thumbnailCandidates.push({
          key: avttNormalizeRelativePath(relative),
          size: Number.isFinite(Number(file.Size)) ? Number(file.Size) : undefined,
        });
        continue;
      }
      if (avttIsFileCacheRelativeKey(relative)) {
        continue;
      }
      const normalizedRelative = avttNormalizeRelativePath(relative);
      if (normalizedRelative) {
        nonThumbnailKeys.add(normalizedRelative);
      }
      userSize += Number(file.Size) || 0;
      objectCount += 1;
    }

    const orphanedThumbnails = [];
    if (thumbnailCandidates.length) {
      for (const candidate of thumbnailCandidates) {
        if (!candidate?.key) {
          continue;
        }
        const baseRelative = avttGetRelativeKeyFromThumbnail(candidate.key);
        if (!baseRelative || nonThumbnailKeys.has(baseRelative)) {
          continue;
        }
        orphanedThumbnails.push({
          key: candidate.key,
          size: candidate.size,
        });
      }
    }

    const orphanedThumbnailKeySet =
      orphanedThumbnails.length > 0
        ? new Set(orphanedThumbnails.map((thumb) => thumb.key))
        : null;

    const filteredFolderContents =
      orphanedThumbnailKeySet
        ? folderContents.filter((entry) => {
            const relative = avttExtractRelativeKey(entry?.Key || entry?.key);
            const normalized = avttNormalizeRelativePath(relative);
            return !orphanedThumbnailKeySet.has(normalized);
          })
        : folderContents;

    if (orphanedThumbnailKeySet && orphanedThumbnails.length > 0) {
      try {
        await avttDeleteThumbnailKeys(orphanedThumbnails, { signal });
      } catch (thumbnailCleanupError) {
        if (thumbnailCleanupError?.name === "AbortError") {
          throw thumbnailCleanupError;
        }
        console.warn("Failed to remove orphaned thumbnails during usage check", thumbnailCleanupError);
      }
    }

    avttPrimeListingCachesFromFullListing(filteredFolderContents);
    avttUsageCache.objectCount = objectCount;
    try {
      await fetch(`${AVTT_S3}?action=usage&user=${window.PATREON_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalBytes: userSize, objectCount }),
        signal,
      });
    } catch (persistError) {
      if (persistError?.name !== "AbortError") {
        console.warn("Failed to persist usage fallback", persistError);
      }
    }
    return userSize;
  };

  const usagePromise = (async () => {
    if (forceFullCheck) {
      return await fallBack();
    }
    try {
      const response = await fetch(
        `${AVTT_S3}?action=usage&user=${window.PATREON_ID}`,
        { signal },
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.message || "Usage lookup failed");
      }
      if (typeof json.totalBytes === "number") {
        if (typeof json.objectCount === "number") {
          avttUsageCache.objectCount = json.objectCount;
        }
        return json.totalBytes;
      }
      throw new Error("Usage total missing");
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }
      console.warn("Falling back to full listing for usage", error);
      return await fallBack();
    }
  })();

 
  avttUsageCache.pending = usagePromise;
  
  
  try {
    const totalBytes = await usagePromise;
    avttUsageCache.totalBytes = Number.isFinite(Number(totalBytes))
      ? Number(totalBytes)
      : 0;
    return avttUsageCache.totalBytes;
  } finally {
    if (shouldUseCache) {
      avttUsageCache.pending = null;
    }
  }
}

async function getAllUserFiles(options = {}) {
  const { signal } = options;
  if (signal?.aborted) {
    return Promise.reject(new DOMException(signal.reason || "Aborted", "AbortError"));
  }
  const requestKey = avttBuildGetAllUserFilesRequestKey(options);
  const existing = avttPendingGetAllFilesRequests.get(requestKey);
  if (existing) {
    return avttWrapPromiseWithAbort(existing.promise, signal);
  }

  window.abortGetAllUserFilesController = new AbortController();
  const { signal: internalSignal } = window.abortGetAllUserFilesController;
  let linkedAbortHandler = null;
  if (signal) {
    linkedAbortHandler = () => {
      try {
        abortController.abort(signal.reason);
      } catch (_) {
        abortController.abort();
      }
    };
    if (signal.aborted) {
      linkedAbortHandler();
    } else {
      signal.addEventListener("abort", linkedAbortHandler, { once: true });
    }
  }

  const requestPromise = (async () => {
    try {
      return await avttExecuteGetAllUserFilesRequest(
        {
          batchSize: options?.batchSize,
          searchTerm: options?.searchTerm,
        },
        internalSignal,
      );
    } finally {
      avttPendingGetAllFilesRequests.delete(requestKey);
      if (signal && linkedAbortHandler) {
        signal.removeEventListener("abort", linkedAbortHandler);
      }
    }
  })();

  avttPendingGetAllFilesRequests.set(requestKey, { promise: requestPromise });
  return avttWrapPromiseWithAbort(requestPromise, signal);
}

function avttBuildGetAllUserFilesRequestKey(options = {}) {
  const searchKey =
    typeof options?.searchTerm === "string"
      ? options.searchTerm.trim().toLowerCase()
      : "";
  const batchKey = Number.isFinite(Number(options?.batchSize))
    ? String(Number(options.batchSize))
    : "";
  return `${searchKey}::${batchKey || "default"}`;
}

function avttWrapPromiseWithAbort(promise, signal) {
  if (!signal) {
    return promise;
  }
  if (signal.aborted) {
    return Promise.reject(new DOMException(signal.reason || "Aborted", "AbortError"));
  }
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException(signal.reason || "Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise
      .then((value) => {
        cleanup();
        resolve(value);
      })
      .catch((error) => {
        cleanup();
        reject(error);
      });
  });
}

async function avttExecuteGetAllUserFilesRequest(options, signal) {
  const { batchSize, searchTerm } = options || {};
  const aggregated = [];
  const baseParams = new URLSearchParams({
    user: window.PATREON_ID,
    filename: "",
    list: "true",
    includeSubDirFiles: "true",
  });
  if (typeof searchTerm === "string" && searchTerm.length > 0) {
    baseParams.set("searchTerm", searchTerm);
  }
  const parsedBatchSize = Number.parseInt(batchSize, 10);
  if (Number.isFinite(parsedBatchSize) && parsedBatchSize > 0) {
    baseParams.set("maxKeys", String(parsedBatchSize));
  }

  let continuationToken = null;
  let iterationSafeGuard = 0;
  const MAX_ITERATIONS = 2000;
  while (iterationSafeGuard < MAX_ITERATIONS) {
    iterationSafeGuard += 1;
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const params = new URLSearchParams(baseParams);
    if (continuationToken) {
      params.set("continuationToken", continuationToken);
    }

    const response = await fetch(`${AVTT_S3}?${params.toString()}`, { signal });
    const json = await response.json();
    const folderContents = Array.isArray(json.folderContents)
      ? json.folderContents
      : [];
    aggregated.push(...folderContents);

    const responseContinuationToken =
      typeof json.nextContinuationToken === "string" && json.nextContinuationToken
        ? json.nextContinuationToken
        : typeof json.continuationToken === "string" && json.continuationToken
          ? json.continuationToken
          : null;
    continuationToken = responseContinuationToken;

    const isTruncated =
      json.isTruncated === undefined
        ? Boolean(continuationToken)
        : Boolean(json.isTruncated);

    if (!isTruncated || !continuationToken) {
      break;
    }
  }

  if (iterationSafeGuard >= MAX_ITERATIONS) {
    console.warn(
      "Reached maximum pagination iterations while fetching all user files.",
    );
  }

  return aggregated;
}





