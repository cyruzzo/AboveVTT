const AVTT_S3 =
  "https://l0cqoq0b4d.execute-api.us-east-1.amazonaws.com/default/uploader";

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
const avttFolderListingCache = new Map();
let avttAllFilesCache = null;
const avttUsageCache = {
  totalBytes: null,
  objectCount: null,
  pending: null,
};
let avttSearchActive = false;
let avttLastBrowsedFolder = "";
const AVTT_THUMBNAIL_PREFIX = "thumbnails/";
const AVTT_THUMBNAIL_DIMENSION = 50;
const AVTT_THUMBNAIL_MIME_TYPE = "image/png";
const avttPendingThumbnailGenerations = new Set();

function avttIsThumbnailRelativeKey(relativeKey) {
  const normalized = avttNormalizeRelativePath(relativeKey);
  return normalized.startsWith(AVTT_THUMBNAIL_PREFIX);
}

function avttGetThumbnailRelativeKey(relativeKey) {
  const normalized = avttNormalizeRelativePath(relativeKey);
  if (!normalized) {
    return "";
  }
  if (avttIsThumbnailRelativeKey(normalized)) {
    return normalized;
  }
  return `${AVTT_THUMBNAIL_PREFIX}${normalized}`;
}

function avttGetThumbnailKeyFromRelative(relativeKey) {
  const normalized = avttNormalizeRelativePath(relativeKey);
  if (!normalized) {
    return "";
  }
  return avttGetThumbnailRelativeKey(normalized);
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
          type === "public.file-url",
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
  const cloned = entries
    .map(avttCloneListingEntry)
    .filter(
      (entry) =>
        entry &&
        entry.Key &&
        !avttIsThumbnailRelativeKey(avttExtractRelativeKey(entry.Key)),
    );
  avttFolderListingCache.set(normalized, cloned);
}

function avttPrimeListingCachesFromFullListing(entries) {
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
        !avttIsThumbnailRelativeKey(avttExtractRelativeKey(entry.Key)),
    );
  const grouped = new Map();
  for (const entry of avttAllFilesCache) {
    const relative = avttExtractRelativeKey(entry.Key);
    if (avttIsThumbnailRelativeKey(relative)) {
      continue;
    }
    const parentFolder = avttGetParentFolder(relative);
    if (!grouped.has(parentFolder)) {
      grouped.set(parentFolder, []);
    }
    grouped.get(parentFolder).push({ ...entry });
  }
  // Ensure all ancestor folders exist in the grouped map even if there is no
  // explicit folder object returned from the server. This lets the UI show
  // folder entries for implicit folders.
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

  // For each folder that exists (either explicitly or implicitly because it
  // contained files), ensure its parent listing contains a folder entry
  // representing that folder. Also add the implicit folder entry to
  // avttAllFilesCache so other cache operations can find it.
  for (const folderPath of Array.from(grouped.keys())) {
    if (!folderPath) continue; // skip root
    const parent = avttGetParentFolder(folderPath);
    const absoluteFolderKey = `${window.PATREON_ID}/${folderPath}`;
    const parentListing = grouped.get(parent) || [];
    const alreadyPresentInParent = parentListing.some(
      (e) => (e?.Key || e?.key || "") === absoluteFolderKey,
    );
    if (!alreadyPresentInParent) {
      // Add a minimal folder entry to the parent's listing
      const folderEntry = { Key: absoluteFolderKey, Size: 0 };
      parentListing.push(folderEntry);
      grouped.set(parent, parentListing);

      // Ensure avttAllFilesCache contains this folder entry as well
      const existsInAll = avttAllFilesCache.some(
        (e) => (e?.Key || e?.key || "") === absoluteFolderKey,
      );
      if (!existsInAll) {
        avttAllFilesCache.push({ ...folderEntry });
      }
    }
  }

  // Finally store grouped listings into the folder cache
  for (const [folderPath, listing] of grouped.entries()) {
    avttStoreFolderListing(folderPath, listing);
  }
  if (!grouped.has("")) {
    avttStoreFolderListing("", []);
  }
  // Attempt to persist the freshly primed caches to IndexedDB (if available)
  try {
    avttSchedulePersist();
  } catch (e) {
    
  }
}

// IndexedDB persistence helpers for avtt caches
let avttPersistTimer = null;
function avttSchedulePersist(delay = 250) {
  if (avttPersistTimer) {
    clearTimeout(avttPersistTimer);
  }
  avttPersistTimer = setTimeout(() => {
    avttPersistTimer = null;
    avttPersistCachesToIndexedDB();
  }, delay);
}

function avttWriteFilePickerRecords(records = []) {
  return new Promise((resolve, reject) => {
    if (!window.globalIndexedDB) {
      return reject(new Error('globalIndexedDB not available'));
    }
    try {
      const tx = window.globalIndexedDB.transaction(['avttFilePicker'], 'readwrite');
      const store = tx.objectStore('avttFilePicker');
      const clearReq = store.clear();
      clearReq.onsuccess = () => {
        try {
          for (const rec of Array.isArray(records) ? records : []) {
            // ensure the key exists
            if (!rec || !rec.fileEntry) continue;
            store.put(rec);
          }
        } catch (err) {
          // continue and let transaction complete/error
          console.warn('avttWriteFilePickerRecords put failed', err);
        }
      };
      clearReq.onerror = (e) => {
        console.warn('avttWriteFilePickerRecords clear failed', e);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e);
    } catch (err) {
      reject(err);
    }
  });
}


function avttReadFilePickerRecords() {
  return new Promise((resolve, reject) => {
    if (!window.globalIndexedDB) {
      return reject(new Error('globalIndexedDB not available'));
    }
    try {
      const tx = window.globalIndexedDB.transaction(['avttFilePicker'], 'readonly');
      const store = tx.objectStore('avttFilePicker');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e);
    } catch (err) {
      reject(err);
    }
  });
}
function avttPersistCachesToIndexedDB() {
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
    avttWriteFilePickerRecords(records).catch((err) => {
      console.warn("avttWriteFilePickerRecords failed", err);
    });
  } catch (err) {
    console.warn("avttPersistCachesToIndexedDB write helper failed", err);
  }
  return;
}

function avttLoadCachesFromIndexedDB() {
  
  return avttReadFilePickerRecords().then((results) => {
    avttFolderListingCache.clear();
    avttAllFilesCache = [];
    for (const rec of results) {
      if (!rec || !rec.fileEntry) continue;
      if (rec.type === "file" && rec.payload) {
        const clonedEntry = avttCloneListingEntry(rec.payload);
        if (
          clonedEntry?.Key &&
          !avttIsThumbnailRelativeKey(avttExtractRelativeKey(clonedEntry.Key))
        ) {
          avttAllFilesCache.push(clonedEntry);
        }
      } else if (rec.type === "folderListing" && typeof rec.fileEntry === "string") {
        const folderKey = rec.fileEntry.replace(/^folder:/, "");
        const listing = Array.isArray(rec.payload)
          ? rec.payload
              .map(avttCloneListingEntry)
              .filter(
                (entry) =>
                  entry &&
                  entry.Key &&
                  !avttIsThumbnailRelativeKey(avttExtractRelativeKey(entry.Key)),
              )
          : [];
        avttFolderListingCache.set(folderKey, listing);
      }
    }
    if (!avttFolderListingCache.has("")) {
      avttFolderListingCache.set("", []);
    }
  });
}

try {
  if (window.globalIndexedDB) {
    avttLoadCachesFromIndexedDB().catch(() => {});
  } else {
    let attempts = 0;
    const poll = setInterval(() => {
      attempts += 1;
      if (window.globalIndexedDB) {
        clearInterval(poll);
        avttLoadCachesFromIndexedDB().catch(() => {});
      } else if (attempts > 50) {
        clearInterval(poll);
      }
    }, 100);
  }
} catch (e) {

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
  if (avttIsThumbnailRelativeKey(normalizedRelative)) {
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
    tierLabel[0].innerHTML = `<a target='_blank' href='https://www.patreon.com/cw/Azmoria/membership'>Patreon</a> tier: ${activeUserTier.label}`;
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
  const copyPromise = navigator.clipboard.writeText(copyText);
  if (copyPromise && typeof copyPromise.then === "function") {
    copyPromise.catch((error) => {
      console.error("Failed to copy AVTT paths", error);
    });
  }
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
  const importButton = dropdown.querySelector('[data-action="import"]');
  if (importButton) {
    const hasAbovevtt = selection.some((e) => !e.isFolder && (/\.abovevtt$/i.test(e.key) || /\.csv$/i.test(e.key)));
    importButton.disabled = !hasAbovevtt;
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
    if (a.isFolder && !b.isFolder) {
      return -1;
    }
    if (!a.isFolder && b.isFolder) {
      return 1;
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
  if (avttIsThumbnailRelativeKey(normalized)) {
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

async function avttResolveMoveConflicts(moves) {
  const resolved = [];
  let conflictPolicy = null;

  for (const move of moves) {
    let targetKey = move.toKey;
    let action = "overwrite";
    let existingEntry = null;

    try {
      existingEntry = await avttGetEntryForKey(targetKey);
    } catch (error) {
      console.warn("Failed to inspect destination before move", error);
      existingEntry = null;
    }

    const exists = Boolean(existingEntry);
    if (exists) {
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

    avttRegisterPendingUploadKey(targetKey, Number(move.size) || 0);
    resolved.push({
      ...move,
      toKey: targetKey,
      overwrite: action === "overwrite" && exists,
    });
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
  try {
    // show global import indicator if available
    if (typeof build_import_loading_indicator === 'function') {
      build_import_loading_indicator('Importing Files');
    }
  } catch (e) {
    
  }

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
      // call Settings import processor
      if (typeof import_process_datafile_text === 'function') {
        await import_process_datafile_text(text);
      }
    } catch (err) {
      console.error('Import failed for', entry.key, err);
    }
  }

  const scenes = window.__IMPORT_SCENES_BUFFER || [];
  try {
    if (scenes.length) {
      await AboveApi.migrateScenes(window.gameId, scenes);
    }
    if (typeof window.$ === 'function') {
      $(".import-loading-indicator .loading-status-indicator__subtext").addClass('complete');
    }
    setTimeout(() => {
      alert("Migration (hopefully) completed. You need to Re-Join AboveVTT");
      location.reload();
    }, 2000);
  } catch (err) {
    console.error('Migration failed after import', err);
    showError(err, 'cloud_migration failed');
  }
}

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
    <button type="button" data-action="sendToGamelog">Send To Gamelog</button>
    <button type="button" data-action="cut">Cut</button>
    <button type="button" data-action="paste">Paste</button>
    <button type="button" data-action="copyPath">Copy Path</button>
    <button type="button" data-action="rename">Rename</button>
    <button type="button" data-action="import">Import</button>
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
    openNewTabButton.disabled =
      !hasExplicitTarget || avttContextMenuState.isFolder;
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
      if (avttContextMenuState.isImplicit && !avttContextMenuState.targetPath) {
        await avttHandlePasteFromClipboard(currentFolder);
      } else if (avttContextMenuState.isFolder) {
        await avttHandlePasteFromClipboard(avttContextMenuState.targetPath);
      } else {
        await avttHandlePasteFromClipboard(currentFolder);
      }
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
      const helper = typeof getAvttStorageUrl === "function" ? getAvttStorageUrl : null;
      const fallbackHelper =
        !helper && typeof getFileFromS3 === "function" ? getFileFromS3 : null;
      if (!helper && !fallbackHelper) {
        alert("Cannot resolve file URL to open in a new tab.");
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
        const url = helper
          ? await helper(rawKey)
          : await fallbackHelper(rawKey.replace(/^above-bucket-not-a-url\//, ""));
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
      const url = `above-bucket-not-a-url/${window.PATREON_ID}/${avttContextMenuState.targetPath}`;
      const avttUrl = await getAvttStorageUrl(url)
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
  const normalizedDestination =
    destinationFolder && destinationFolder.endsWith("/")
      ? destinationFolder
      : destinationFolder
      ? `${destinationFolder}/`
      : "";
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

async function avttMoveEntries(moves, options = {}) {
  const fileListingSection = document.getElementById("file-listing-section");
  if ($('#file-listing-section .sidebar-panel-loading-indicator').length == 0) {
    $(fileListingSection).append(build_combat_tracker_loading_indicator('Loading files...'));
  }
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
    return;
  }
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
    const moveItems = resolvedMoves.map((move) => ({
      fromKey: move.fromKey,
      toKey: move.toKey,
      isFolder: Boolean(move.isFolder),
      overwrite: Boolean(move.overwrite),
    }));
    const thumbnailMoves = [];
    const seenThumbnailMoves = new Set();
    for (const move of resolvedMoves) {
      const isFolderMove = Boolean(move.isFolder);
      let fromThumbnailKey = null;
      let toThumbnailKey = null;
      if (isFolderMove) {
        fromThumbnailKey = avttGetThumbnailKeyFromRelative(move.fromKey);
        toThumbnailKey = avttGetThumbnailKeyFromRelative(move.toKey);
      } else if (avttShouldGenerateThumbnail(getFileExtension(move.fromKey))) {
        fromThumbnailKey = avttGetThumbnailKeyFromRelative(move.fromKey);
        toThumbnailKey = avttGetThumbnailKeyFromRelative(move.toKey);
      }
      if (!fromThumbnailKey || !toThumbnailKey || fromThumbnailKey === toThumbnailKey) {
        continue;
      }
      const signature = `${fromThumbnailKey}|${toThumbnailKey}`;
      if (seenThumbnailMoves.has(signature)) {
        continue;
      }
      seenThumbnailMoves.add(signature);
      thumbnailMoves.push({
        fromKey: fromThumbnailKey,
        toKey: toThumbnailKey,
        isFolder: isFolderMove,
        overwrite: Boolean(move.overwrite),
      });
    }

    const response = await fetch(`${AVTT_S3}?action=move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: window.PATREON_ID,
        items: moveItems,
        operation,
      }),
    });
    const json = await response.json();
    if (!response.ok || !json?.moved) {
      throw new Error(json?.message || "Failed to move item(s).");
    }
    const refreshPath =
      typeof options.refreshPath === "string" ? options.refreshPath : currentFolder;

    if (operation === "move") {
      for (const move of resolvedMoves) {
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
        const size = Number(move.size) || 0;
        if (move.isFolder) {
          avttCopyFolderCaches(move.fromKey, move.toKey);
        }
        avttRegisterPendingUploadKey(move.toKey, size);
      }
    }

    if (thumbnailMoves.length) {
      try {
        const thumbnailResponse = await fetch(`${AVTT_S3}?action=move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: window.PATREON_ID,
            items: thumbnailMoves,
            operation,
          }),
        });
        const thumbnailJson = await thumbnailResponse.json();
        if (!thumbnailResponse.ok || !thumbnailJson?.moved) {
          throw new Error(thumbnailJson?.message || "Failed to update thumbnail(s).");
        }
      } catch (thumbnailError) {
        console.warn("Thumbnail move/copy request failed", thumbnailError);
      }
    }

    refreshFiles(
      refreshPath,
      true,
      undefined,
      undefined,
      activeFilePickerFilter,
      { useCache: true, revalidate: false },
    );
    if (options.clearClipboard) {
      avttClearClipboard();
    } else {
      avttApplyClipboardHighlights();
    }
  } catch (error) {
    console.error("Failed to move entries", error);
    alert(error.message || "Failed to move item(s).");
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
  const operation =
    avttClipboard.mode === AVTT_CLIPBOARD_MODE.COPY ? "copy" : "move";
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
  const promptValue = await avttPromptTextDialog({
    title: isFolder ? "Rename Folder" : "Rename File",
    message: `Enter a new name for "${baseName}".`,
    defaultValue: baseName,
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
    return false;
  }
  const newKey = `${parentPath}${trimmedName}${isFolder ? "/" : ""}`;
  if (newKey === path) {
    return false;
  }
  if (isFolder && newKey.startsWith(`${path}`)) {
    alert("Cannot rename a folder into its own sub-path.");
    return false;
  }
  await avttMoveEntries(
    [{ fromKey: path, toKey: newKey, isFolder }],
    { operation: "move", clearClipboard: false },
  );
  return true;
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
      // best-effort
    }
  }
  const row = event.currentTarget;
  if (row && row.classList) {
    row.classList.add("avtt-dragging");
  }
}

function avttHandleDragEnd() {
  const rows = document.querySelectorAll("#file-listing tr.avtt-file-row");
  rows.forEach((row) => {
    row.classList.remove("avtt-dragging", "avtt-drop-target");
  });
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

async function avttHandleMapDrop(event) {
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

  if (!Array.isArray(avttDragItems) || avttDragItems.length === 0) {
    avttHandleDragEnd();
    return;
  }

  for (const entry of avttDragItems) {
    const rawKey = entry.key;

    if (entry.isFolder && destinationPath.startsWith(entry.key)) {
      continue;
    }
    const url = `above-bucket-not-a-url/${window.PATREON_ID}/${rawKey}`
    const listItem = new SidebarListItem(uuid(), entry.displayName, url, ItemType.MyToken, RootFolder.MyTokens.path);
    create_and_place_token(listItem, event.shiftKey, url, event.pageX, event.pageY, false, undefined, undefined, {tokenStyleSelect: "definitelyNotAToken"});
  }

  avttHandleDragEnd();
}

const userLimit = Object.freeze({
  low: 10 * 1024 * 1024 * 1024,
  mid: 25 * 1024 * 1024 * 1024,
  high: 100 * 1024 * 1024 * 1024,
});
const allowedImageTypes = ["jpeg", "jpg", "png", "gif", "bmp", "webp"];
const allowedVideoTypes = ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm"];
const allowedAudioTypes = ["mp3", "wav", "aac", "flac", "ogg"];
const allowedJsonTypes = ["json", "uvtt", "dd2vtt", "df2vtt"];
const allowedDocTypes = ["pdf"];
const allowedTextTypes = ["abovevtt", "csv"];
let avttUploadController;
let avttUploadSignal;

function avttShouldGenerateThumbnail(extension) {
  if (!extension) {
    return false;
  }
  const normalized = String(extension).toLowerCase();
  return allowedImageTypes.includes(normalized) || allowedVideoTypes.includes(normalized);
}

function avttCalculateCoverDimensions(sourceWidth, sourceHeight, targetWidth, targetHeight) {
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
    const { drawWidth, drawHeight, offsetX, offsetY } = avttCalculateCoverDimensions(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      canvas.width,
      canvas.height,
    );
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    return await avttCanvasToBlob(canvas);
  } catch (error) {
    console.warn("Failed to generate image thumbnail", file?.name, error);
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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
    const { drawWidth, drawHeight, offsetX, offsetY } = avttCalculateCoverDimensions(
      sourceWidth,
      sourceHeight,
      canvas.width,
      canvas.height,
    );
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    return await avttCanvasToBlob(canvas);
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
  if (allowedImageTypes.includes(normalizedExtension)) {
    return await avttGenerateImageThumbnailBlob(file);
  }
  if (allowedVideoTypes.includes(normalizedExtension)) {
    return await avttGenerateVideoThumbnailBlob(file);
  }
  return null;
}

async function avttUploadThumbnail(relativeTargetKey, blob, signal) {
  const normalizedTarget = avttNormalizeRelativePath(relativeTargetKey);
  if (!normalizedTarget || !blob) {
    return false;
  }
  const thumbnailKey = avttGetThumbnailKeyFromRelative(normalizedTarget);
  if (!thumbnailKey) {
    return false;
  }
  try {
    const presignResponse = await fetch(
      `${AVTT_S3}?filename=${encodeURIComponent(thumbnailKey)}&user=${window.PATREON_ID}&upload=true`,
      { signal },
    );
    if (!presignResponse.ok) {
      throw new Error("Failed to retrieve thumbnail upload URL.");
    }
    const data = await presignResponse.json();
    const uploadResponse = await fetch(data.uploadURL, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": AVTT_THUMBNAIL_MIME_TYPE },
      signal,
    });
    if (!uploadResponse.ok) {
      throw new Error("Thumbnail upload failed.");
    }
    try {
      avttRegisterPendingUploadKey(thumbnailKey, Number(blob.size) || 0);
    } catch (registerError) {
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
    campaignSlug: "azmoria",
    creatorVanity: "azmoria",
    creatorName: "Azmoria",
    creatorIds: ["939792"],
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

  function resolveConfig() {
    const external =
      typeof window.AVTT_PATRON_CONFIG === "object"
        ? window.AVTT_PATRON_CONFIG
        : {};
    const merged = { ...defaultConfig, ...external };
    merged.campaignSlug = (
      merged.campaignSlug || defaultConfig.campaignSlug
    ).toLowerCase();
    return merged;
  }

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

  function isCreatorIdentity(identity, config) {
    if (!identity) {
      return false;
    }
    try {
      const creatorVanity = String(
        config.creatorVanity || config.campaignSlug || "",
      ).toLowerCase();
      const creatorName = String(config.creatorName || "").toLowerCase();
      const creatorIds = Array.isArray(config.creatorIds)
        ? config.creatorIds.map((id) => String(id))
        : [];
      const identityId = identity.id ? String(identity.id) : "";
      const identityAttributes = identity.attributes || {};
      const identityVanity = String(
        identityAttributes.vanity || "",
      ).toLowerCase();
      const identityUrl = String(identityAttributes.url || "").toLowerCase();
      const identityFullName = String(
        identityAttributes.full_name || "",
      ).toLowerCase();
      window.PATREON_ID = identityId;
      if (
        creatorVanity &&
        (identityVanity === creatorVanity ||
          identityUrl.includes(creatorVanity))
      ) {
        return true;
      }
      if (creatorName && identityFullName === creatorName) {
        return true;
      }
      if (identityId && creatorIds.includes(identityId)) {
        return true;
      }
    } catch (error) {
      console.warn("Failed to evaluate Patreon creator identity", error);
    }
    return false;
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

  async function fetchPatreonIdentity(accessToken, query) {
    try {
      const response = await fetch(`${AVTT_S3}?action=patreonIdentity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          query,
        }),
      });
      let json;
      try {
        json = await response.json();
      } catch (parseError) {
        console.error("Failed to parse Patreon identity response", parseError);
        throw new Error("Failed to parse Patreon identity response.");
      }
      if (!response.ok || json?.error) {
        const message =
          json?.error_description ||
          json?.message ||
          json?.error ||
          "Failed to load Patreon profile information.";
        throw new Error(message);
      }
      return json;
    } catch (error) {
      console.error("Patreon identity request failed", error);
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

  function indexIncludedByType(included = [], type) {
    return included
      .filter((item) => item.type === type)
      .reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
  }

  function resolveCampaignTiers(campaignId, tiersIndex) {
    const cached = campaignTierCache.get(campaignId);
    if (cached && cached.length) {
      return cached;
    }
    const tierList = Object.values(tiersIndex || {}).filter(
      (tier) => tier?.relationships?.campaign?.data?.id === campaignId,
    );
    tierList.sort(
      (a, b) =>
        (a?.attributes?.amount_cents || 0) - (b?.attributes?.amount_cents || 0),
    );
    if (tierList.length) {
      campaignTierCache.set(campaignId, tierList);
    }
    return tierList;
  }

  async function fetchCampaignTiersFallback(campaignId, accessToken) {
    try {
      const response = await fetch(`${AVTT_S3}?action=patreonCampaignTiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, accessToken }),
      });
      const json = await response.json();
      if (!response.ok || json?.error) {
        const message =
          json?.error_description ||
          json?.message ||
          json?.error ||
          "Failed to fetch Patreon campaign tiers.";
        throw new Error(message);
      }
      const tiers = (json.included || []).filter(
        (item) => item.type === "tier",
      );
      tiers.sort(
        (a, b) =>
          (a?.attributes?.amount_cents || 0) -
          (b?.attributes?.amount_cents || 0),
      );
      return tiers;
    } catch (error) {
      console.warn("Fallback campaign tier request failed", error);
      throw error;
    }
  }

  function buildMembershipResult(member, campaign, tiersIndex, campaignTiers) {
    const memberRole = member?.attributes?.role;
    if (memberRole && memberRole.toLowerCase() === "creator") {
      const label = member?.attributes?.full_name || "Creator";
      return {
        level: "creator",
        label,
        amountCents: Number.MAX_SAFE_INTEGER,
        member,
        campaign,
        tiers: [],
      };
    }

    const tierIds = (
      member.relationships?.currently_entitled_tiers?.data || []
    ).map((t) => t.id);
    if (!tierIds.length) {
      return {
        level: "free",
        label: "Free",
        amountCents: 0,
        member,
        campaign,
        tiers: [],
      };
    }

    const userTiers = tierIds.map((id) => tiersIndex[id]).filter(Boolean);
    if (!userTiers.length) {
      return {
        level: "free",
        label: "Free",
        amountCents: 0,
        member,
        campaign,
        tiers: [],
      };
    }

    let highest = null;
    let highestIndex = -1;
    campaignTiers.forEach((tier, index) => {
      if (tierIds.includes(tier?.id)) {
        if (
          !highest ||
          (tier?.attributes?.amount_cents || 0) >=
            (highest?.attributes?.amount_cents || 0)
        ) {
          highest = tier;
          highestIndex = index;
        }
      }
    });

    if (!highest) {
      highest = userTiers[userTiers.length - 1];
      highestIndex = campaignTiers.findIndex((t) => t?.id === highest?.id);
    }

    let level = "low";
    if (highestIndex >= campaignTiers.length - 1) {
      level = "high";
    } else if (highestIndex >= 2) {
      level = "mid";
    }

    const label = highest?.attributes?.title || "Supporter";
    const amountCents = highest?.attributes?.amount_cents || 0;

    return { level, label, amountCents, member, campaign, tiers: userTiers };
  }

  async function fetchMembership(accessToken, config) {
    const query = {
      include: "memberships.campaign,memberships.currently_entitled_tiers",
      "fields[member]": "patron_status",
      "fields[campaign]": "vanity,url",
    };
    const json = await fetchPatreonIdentity(accessToken, query);
    const identity = json.data;
    const isCreatorAccount = isCreatorIdentity(identity, config);
    const membershipRefs = json.data?.relationships?.memberships?.data || [];
    const members = indexIncludedByType(json.included, "member");
    const campaigns = indexIncludedByType(json.included, "campaign");
    const tiersIndex = indexIncludedByType(json.included, "tier");
    const targetSlug = config.campaignSlug;

    for (const ref of membershipRefs) {
      const member = members[ref.id];
      if (!member) {
        continue;
      }
      const campaignRel = member.relationships?.campaign?.data;
      if (!campaignRel) {
        continue;
      }
      const campaign = campaigns[campaignRel.id];
      const vanity = (
        campaign?.attributes?.vanity ||
        campaign?.attributes?.url ||
        ""
      ).toLowerCase();
      if (!campaign || !vanity.includes(targetSlug)) {
        continue;
      }

      let campaignTiers = resolveCampaignTiers(campaign.id, tiersIndex);
      if (!campaignTiers.length) {
        try {
          campaignTiers = await fetchCampaignTiersFallback(
            campaign.id,
            accessToken,
          );
          if (campaignTiers.length) {
            campaignTierCache.set(campaign.id, campaignTiers);
          }
        } catch (fallbackError) {
          console.warn(
            "Failed to fetch campaign tiers via fallback",
            fallbackError,
          );
        }
      }
      const result = buildMembershipResult(
        member,
        campaign,
        tiersIndex,
        campaignTiers,
      );
      if (result.level === "creator" || isCreatorAccount) {
        result.level = "creator";
        result.label =
          identity?.attributes?.full_name || result.label || "Creator";
      }
      return result;
    }

    if (isCreatorAccount) {
      return {
        level: "creator",
        label: identity?.attributes?.full_name || "Creator",
        amountCents: Number.MAX_SAFE_INTEGER,
        member: null,
        campaign: null,
        tiers: [],
      };
    }

    return {
      level: "free",
      label: "Free",
      amountCents: 0,
      member: null,
      campaign: null,
      tiers: [],
    };
  }

  async function ensureMembership() {
    const config = resolveConfig();
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
  }

  return {
    ensureMembership,
    logout,
    resolveConfig,
  };
})();

function applyActiveMembership(membership) {
  if (!membership || typeof membership !== "object") {
    activeUserTier = {
      level: "free",
      label: "Free",
      amountCents: 0,
      membership: null,
    };
  } else {
    const rawLevel =
      membership.level ||
      (membership.tiers && membership.tiers.length ? "low" : "free");
    const level = rawLevel.toLowerCase();
    const fallbackLabel =
      membership.tiers && membership.tiers.length
        ? membership.tiers[membership.tiers.length - 1]?.attributes?.title ||
          "Supporter"
        : "Free";
    const label = membership.label || fallbackLabel;
    const amountCents =
      typeof membership.amountCents === "number" ? membership.amountCents : 0;
    activeUserTier = { level, label, amountCents, membership };
  }

  switch (activeUserTier.level) {
    case "creator":
    case "high":
      activeUserLimit = userLimit.high;
      break;
    case "mid":
      activeUserLimit = userLimit.mid;
      break;
    case "low":
      activeUserLimit = userLimit.low;
      break;
    default:
      activeUserLimit = 0;
      break;
  }
}

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

  if (refreshPromise && typeof refreshPromise.finally === "function") {
    refreshPromise.finally(() => {
      if (avttActiveSearchAbortController === controller) {
        avttActiveSearchAbortController = null;
      }
    });
  } else if (avttActiveSearchAbortController === controller) {
    avttActiveSearchAbortController = null;
  }
}, 400);

const debounceSearchFiles = (searchTerm, fileTypes) => {
  if (avttActiveSearchAbortController) {
    avttActiveSearchAbortController.abort();
    avttActiveSearchAbortController = null;
  }
  avttDebouncedSearchHandler(searchTerm, fileTypes);
};

async function launchFilePicker(selectFunction = false, fileTypes = []) {
  $("#avtt-s3-uploader").remove();
  if (avttUploadController) {
    avttUploadController.abort('User cancelled upload by reopening uploader.');
  }
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
  draggableWindow.find(".title_bar_close_button").off("click.cancelUpload").on("click.cancelUpload", () => {
    if (avttUploadController) {
      avttUploadController.abort('User cancelled upload by closing window.');
    }
    clearGetFileFromS3Queue();
  });
  
  let membership;
  try {
    
    membership = await PatreonAuth.ensureMembership(!window.notFilePickerFirstLoad);
  } catch (error) {
    console.error("Patreon verification failed", error);
    alert("Patreon login is required to open the AVTT File Uploader.");
    return;
  }

  applyActiveMembership(membership);

  /*if (activeUserTier.level === "free") {
    const patreonConfig = PatreonAuth.resolveConfig();
    if (!patreonConfig.clientId || !patreonConfig.redirectUri) {
      alert("Patreon login is not configured.");
      return;
    }

    const shouldAttemptLogin = window.confirm(
      "Log in with Patreon to verify your Azmoria membership?",
    );
    if (!shouldAttemptLogin) {
      return;
    }

    PatreonAuth.logout();
    try {
      membership = await PatreonAuth.ensureMembership();
      applyActiveMembership(membership);
    } catch (reauthError) {
      console.error(
        "Patreon verification failed after reauth prompt",
        reauthError,
      );
      alert(
        "Patreon verification failed. Patreon login is required to open the AVTT File Uploader.",
      );
      return;
    }

    if (activeUserTier.level === "free") {
      alert(
        "Unable to detect an active Azmoria Patreon membership. Please check your subscription tier and try again.",
      );
      return;
    }
  }*/

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
                min-width: 140px;
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
            #cancel-avtt-upload-button {
              background: var(--background-color, #fff) !important;
              color: var(--font-color, #000) !important;
              border: 1px solid gray;
              border-radius: 2px !important;
              padding: 0px !important;
              width: 15px;
              height: 15px;
              font-size: 10px;
              float: right;
            }    
            #cancel-avtt-upload-button:hover{
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
            #avtt-file-picker #file-listing-section .sidebar-panel-loading-indicator {
                padding: 0px !important;
                position: sticky !important;
            }
            #patreon-tier a{
              text-decoration: underline 1px dotted color-mix(in srgb, var(--link-color, rgba(39, 150, 203, 1)), transparent 50%);
              color: var(--font-color, #000);
              cursor: pointer;
            }
        </style>
        <div id="avtt-file-picker">
            <div id="select-section">
                <div>
                    <div id='sizeUsed'><span id='user-used'></span> used of <span id='user-limit'> </span></div>
                    <div id='patreon-tier'><span class='user-teir-level'></span><span> | <a id='logout-patreon-button'>Logout</a></span></div>
                </div>
                <div style='display: flex; gap: 10px; line-height: 16px; width: 100%; align-items: center; padding-left:20px;'>
                  <div id="avtt-actions-menu" class="avtt-toolbar-dropdown">
                    <button type="button" class="avtt-toolbar-link avtt-toolbar-button avtt-actions-toggle">Actions &#9662;</button>
                    <div id="avtt-actions-dropdown" class="avtt-toolbar-dropdown-list">
                      <button type="button" data-action="cut">Cut</button>
                      <button type="button" data-action="paste">Paste</button>
                      <button type="button" data-action="copy-path">Copy Path</button>
                      <button type="button" data-action="rename">Rename</button>
                      <button type="button" data-action="import">Import</button>
                      <hr/>
                      <button type="button" data-action="delete">Delete</button>
                    </div>
                  </div>
                  <input id='search-files' type='search' placeholder='Search' />
                  <div style='flex-grow:1'></div>
                  <div id='uploading-file-indicator' style='display:none'></div>
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
    tierLabel[0].innerHTML = `<a target='_blank' href='https://www.patreon.com/cw/Azmoria/membership'>Patreon</a> tier: ${activeUserTier.label}`;
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
  const uploadingIndicator = document.getElementById("uploading-file-indicator");
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
        if (lastCheckbox && typeof lastCheckbox.getAttribute === "function") {
          indexAttr = lastCheckbox.getAttribute("data-index");
        }
        avttLastSelectedIndex =
          shouldSelect && indexAttr !== null ? Number(indexAttr) : null;
      } else {
        avttLastSelectedIndex = null;
      }
      avttUpdateSelectNonFoldersCheckbox();
      avttUpdateActionsMenuState();
      avttApplyClipboardHighlights();
    });
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
      if (typeof window.$ === "function") {
        try {
          $(".import-loading-indicator").remove();
        } catch (cleanupError) {
          
        }
      }
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

  const showUploadingProgress = (index, total) => {
    if (!uploadingIndicator) {
      return;
    }
    uploadingIndicator.innerHTML = `Uploading File <span id='file-number'>${index + 1}</span> of <span id='total-files'>${total}</span>`;
    uploadingIndicator.style.display = "block";
    const cancelButton = $("<button id='cancel-avtt-upload-button' title='Cancel Upload'>X  </button>");


    cancelButton.on('click', () => {
      if (avttUploadController) {
        avttUploadController.abort('User cancelled upload by clicking the cancel button.');
      }
    });

    $(uploadingIndicator).prepend(cancelButton);
  };

  const hideUploadingIndicator = () => {
    if (!uploadingIndicator) {
      return;
    }
    uploadingIndicator.innerHTML = "";
    uploadingIndicator.style.display = "none";
  };

  const showUploadComplete = () => {
    if (!uploadingIndicator) {
      return;
    }
    uploadingIndicator.innerHTML = "Upload Complete";
    setTimeout(() => {
      uploadingIndicator.style.display = "none";
    }, 2000);
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

  const resolveUploadKey = (file) =>
    `${currentFolder}${toNormalizedUploadPath(file)}`;

  const uploadSelectedFiles = async (files) => {
    const fileArray = Array.from(files || []).filter(Boolean);
    if (!fileArray.length) {
      return;
    }

    let totalSize = 0;
    let uploadedBytes = 0;
    let uploadedCount = 0;
    let conflictPolicy = null;
    const userUsedElement = document.getElementById("user-used");
    const targetFileKeys = [];
    let numberSkipped = 0;
    for (let i = 0; i < fileArray.length; i += 1) {
      const selectedFile = fileArray[i];
      showUploadingProgress(i, fileArray.length);

      const extension = getFileExtension(selectedFile.name);
      if (!isAllowedExtension(extension)) {
        console.warn(`Skipping unsupported file type: ${selectedFile.name}`);
        numberSkipped += 1;
        if (i === fileArray.length - 1) {
          alert(`Skipped ${numberSkipped} unsupported file(s).`);
          hideUploadingIndicator();
        }
        continue;
      }

      let targetKey = resolveUploadKey(selectedFile);
      let action = "overwrite";

      try {
        const exists = await avttDoesObjectExist(targetKey);
        if (exists) {
          if (conflictPolicy?.applyAll) {
            action = conflictPolicy.action;
          } else {
            const conflictResult = await avttPromptUploadConflict({ fileName: targetKey });
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
      } catch (existError) {
        console.warn("Failed to verify if file exists before upload", existError);
      }

      if (action === "skip") {
        continue;
      }

      if (action === "keepBoth") {
        try {
          targetKey = await avttDeriveUniqueKey(targetKey);
        } catch (deriveError) {
          console.error("Failed to generate unique key for duplicate upload", deriveError);
          alert("Failed to generate a unique name for a duplicate file. Skipping.");
          continue;
        }
      }

      const prospectiveTotal = totalSize + selectedFile.size;
      if (
        activeUserLimit !== undefined &&
        prospectiveTotal + S3_Current_Size > activeUserLimit
      ) {
        alert("Skipping File. This upload would exceed the storage limit for your Patreon tier. Delete some files before uploading more.");
        hideUploadingIndicator();
        return;
      }

      let thumbnailBlob = null;
      if (avttShouldGenerateThumbnail(extension)) {
        try {
          thumbnailBlob = await avttGenerateThumbnailBlob(selectedFile, extension);
        } catch (thumbnailError) {
          console.warn("Failed to generate thumbnail for", targetKey, thumbnailError);
          thumbnailBlob = null;
        }
      }

      try {
        const presignResponse = await fetch(`${AVTT_S3}?filename=${encodeURIComponent(targetKey)}&user=${window.PATREON_ID}&upload=true`);
        if (!presignResponse.ok) {
          throw new Error("Failed to retrieve upload URL.");
        }

        const data = await presignResponse.json();
        const uploadHeaders = {};
        const inferredType = resolveContentType(selectedFile);
        if (inferredType) {
          uploadHeaders["Content-Type"] = inferredType;
        }
        avttUploadController = new AbortController();
        avttUploadSignal = avttUploadController.signal;
        const uploadResponse = await fetch(data.uploadURL, {
          method: "PUT",
          body: selectedFile,
          headers: uploadHeaders,
          signal: avttUploadSignal,
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed.");
        }

        if (thumbnailBlob) {
          await avttUploadThumbnail(targetKey, thumbnailBlob, avttUploadSignal);
        }

        totalSize = prospectiveTotal;
        if (userUsedElement) {
          userUsedElement.innerHTML = formatFileSize(totalSize + S3_Current_Size);
        }
        avttRegisterPendingUploadKey(targetKey, Number(selectedFile.size) || 0);
        targetFileKeys.push(targetKey);
        uploadedBytes += Number(selectedFile.size) || 0;
        uploadedCount += 1;
      } catch (error) {
        console.error(error);
        if (typeof error === "string") {
          alert(error || "Aborted manually.");
        } else {
          alert(error.message || "An unexpected error occurred while uploading.");
        }
        if (uploadedCount > 0) {
          await applyUsageDelta(uploadedBytes, uploadedCount);
        }
        hideUploadingIndicator();
        return;
      }
    }

    if (uploadedCount > 0) {
      await applyUsageDelta(uploadedBytes, uploadedCount);
    }

    refreshFiles(
      currentFolder,
      true,
      undefined,
      undefined,
      activeFilePickerFilter,
      { useCache: true, revalidate: false, selectFiles: targetFileKeys },
    );
    showUploadComplete();
  };

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

  const readDirectoryEntries = async (directoryEntry, prefix = "") => {
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
      if (entry.isDirectory) {
        const nestedFiles = await readDirectoryEntries(entry, directoryPath);
        files.push(...nestedFiles);
      } else if (entry.isFile) {
        const file = await new Promise((resolve, reject) =>
          entry.file(resolve, reject),
        );
        files.push({ file, relativePath: `${directoryPath}${file.name}` });
      }
    }

    return files;
  };

  const collectDroppedFiles = async (dataTransfer) => {
    if (!dataTransfer) {
      return [];
    }

    const items = dataTransfer.items;
    if (!items || !items.length) {
      return Array.from(dataTransfer.files || []);
    }

    const collected = [];

    for (const item of items) {
      if (item.kind !== "file") {
        continue;
      }

      const entry =
        typeof item.webkitGetAsEntry === "function"
          ? item.webkitGetAsEntry()
          : null;

      if (entry && entry.isDirectory) {
        const directoryFiles = await readDirectoryEntries(entry);
        for (const { file, relativePath } of directoryFiles) {
          collected.push(assignRelativePath(file, relativePath));
        }
      } else {
        const file = item.getAsFile();
        if (file) {
          collected.push(assignRelativePath(file, file.name));
        }
      }
    }

    if (!collected.length) {
      return Array.from(dataTransfer.files || []);
    }

    return collected;
  };

  fileInput.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

    try {
      await uploadSelectedFiles(files);
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
      const droppedFiles = await collectDroppedFiles(transfer);
      if (droppedFiles.length) {
        await uploadSelectedFiles(droppedFiles);
      }
    } catch (error) {
      console.error("Failed to upload dropped files", error);
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
      }, 250)
   
    
   
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
    .off("change keypress input")
    .on("change keypress input", async (event) => {
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

function refreshFiles(
  path,
  recheckSize = false,
  allFiles = false,
  searchTerm,
  fileTypes,
  options = {},
) {
    // Clear any queued getFileFromS3 requests (these are pending preview/fetch requests)
    // This prevents stale queued requests from running after a folder/refresh change.
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

    const fileListingSection = document.getElementById("file-listing-section");
    if ($('#file-listing-section .sidebar-panel-loading-indicator').length == 0){
      $(fileListingSection).append(build_combat_tracker_loading_indicator('Loading files...'));
    }
    currentFolder = typeof path === "string" ? path : "";
    activeFilePickerFilter = fileTypes;
    avttLastSelectedIndex = null;
    avttHideActionsMenu();
    avttHideExportMenu();
    avttUpdateSortIndicators();
    if (recheckSize) {
        getUserUploadedFileSize(false, { signal })
        .then((size) => {
          S3_Current_Size = size;
          document.getElementById("user-used").innerHTML = formatFileSize(S3_Current_Size);
          document.getElementById("user-limit").innerHTML = formatFileSize(activeUserLimit);
          const tierLabel = $("#patreon-tier span.user-teir-level");
          if (tierLabel.length) {
            tierLabel[0].innerHTML = `<a target='_blank' href='https://www.patreon.com/cw/Azmoria/membership'>Patreon</a> tier: ${activeUserTier.label}`;
          }
        })
        .catch((error) => {
          if (error?.name !== "AbortError") {
            console.warn("Failed to refresh usage size", error);
          }
        });
    }
    if(!window.notFilePickerFirstLoad){
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
        window.notFilePickerFirstLoad = true;
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
                : "Home",
            isImplicit: true,
          },
          { ensureSelection: false, implicitTarget: true },
        );
      });
      fileListingSection.dataset.avttContextBound = "true";
    }
    const upFolder = $("#upFolder");
    if (path != ""){
      const splitPath = path.replace(/\/$/gi, "").split("/");
      const breadCrumbs = splitPath.map((part, index) => {
        const crumbPath = splitPath.slice(0, index + 1).join("/") + "/";
        return `<a href="#" class="avtt-breadcrumb" data-path="${crumbPath}">${part}</a>`;
      });
      breadCrumbs.unshift(`<a href="#" class="avtt-breadcrumb" data-path="">Home</a>`);
      upFolder.html(`${breadCrumbs.join("<span class='crumbSeparator'>></span>")}`);
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
      upFolder.show();
    } 
    else{
      upFolder.hide();
    }
    $('#VTT').off('dragover.avttFiles').on('dragover.avttFiles', (event) => {
      event.preventDefault(); 
    });

    $('#VTT').off('drop.avttFiles').on('drop.avttFiles', async (e) => {
      console.log('DROPED ON MAP');
      await avttHandleMapDrop(e)
    });
    const insertFiles = (files, searchTerm, fileTypes) => {
      if (signal?.aborted) {
        return;
      }
      $('#file-listing-section .sidebar-panel-loading-indicator').remove();
      console.log("Files in folder: ", files);
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
      const prepared = [];

      for (const fileEntry of files) {
        const rawKey =
          typeof fileEntry === "object" && fileEntry !== null
            ? fileEntry.Key || fileEntry.key || ""
            : fileEntry;
        if (!rawKey) {
          continue;
        }
        const relativePath = rawKey.replace(regEx, "");
        if (avttIsThumbnailRelativeKey(relativePath)) {
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

        prepared.push({
          rawKey,
          relativePath,
          size,
          isFolder,
          type,
          displayName: relativePath.split("/").filter(Boolean).pop() || relativePath,
        });
      }

      if (prepared.length === 0) {
        fileListing.innerHTML = "<tr><td colspan='4'>No files found.</td></tr>";
        avttApplyClipboardHighlights();
        avttUpdateSelectNonFoldersCheckbox();
        avttUpdateActionsMenuState();
        return;
      }

      avttSortEntries(prepared);
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
      prepared.forEach((entry, index) => {
        const listItem = document.createElement("tr");
        listItem.classList.add("avtt-file-row");
        listItem.dataset.path = entry.relativePath;
        listItem.dataset.isFolder = entry.isFolder ? "true" : "false";
        listItem.dataset.type = entry.type || "";
        listItem.setAttribute("draggable", "true");
        const checkboxCell = $(`<td><input type="checkbox" id='input-${entry.relativePath}' class="avtt-file-checkbox ${entry.isFolder ? "folder" : ""}" value="${entry.relativePath}" data-size="${entry.isFolder ? 0 : entry.size}"></td>`);
        if (!entry.isFolder && selectFiles && Array.isArray(selectFiles) && selectFiles.includes(entry.relativePath)){
          checkboxCell.find("input").prop("checked", true);
        }

        const labelCell = $(`<td><label for='input-${entry.relativePath}' style="cursor:pointer;" class="avtt-file-name  ${entry.isFolder ? "folder" : ""}" title="${entry.relativePath}"><span class="material-symbols-outlined">${fileTypeIcon[entry.type] || ""}</span><span>${entry.displayName}</span></label></td>`);
        const typeCell = $(`<td>${entry.type || ""}</td>`);
        const sizeValue = entry.isFolder ? "" : formatFileSize(entry.size || 0);
        const sizeCell = $(`<td class="avtt-file-size">${sizeValue}</td>`);

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
        listItem.addEventListener("click", () => {
          $("input").blur();
        });
        const checkboxElement = checkboxCell.find("input")[0];
        if (checkboxElement) {
          checkboxElement.setAttribute("data-index", String(index));
          checkboxElement.addEventListener("click", (clickEvent) => {
            avttHandleCheckboxClick(clickEvent, index);
          });
        }
        listItem.addEventListener("dragstart", (dragEvent) => {
          avttHandleDragStart(dragEvent, entry);
        });
        listItem.addEventListener("dragend", (dragEvent) => {
          avttHandleDragEnd(dragEvent);
        });
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
          listItem.addEventListener("drop", async (dragEvent) => {
            await avttHandleFolderDrop(dragEvent, entry.relativePath);
          });
        }        
        listItem.addEventListener("contextmenu", (contextEvent) => {
          avttOpenContextMenu(contextEvent, entry);
        });

        fileListing.appendChild(listItem);
      });
      avttApplyClipboardHighlights();
      avttUpdateSelectNonFoldersCheckbox();
      avttUpdateActionsMenuState();

    };
    const hasCachedAllFiles =
      Array.isArray(avttAllFilesCache) && avttAllFilesCache.length > 0;
    const hasCachedFolder =
      avttFolderListingCache.has(normalizedPath) &&
      Array.isArray(avttFolderListingCache.get(normalizedPath));
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
        $('#file-listing-section .sidebar-panel-loading-indicator').remove();
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

async function deleteFilesFromS3Folder(selections, fileTypes) {
  const entries = Array.isArray(selections) ? selections.filter((entry) => entry && entry.key) : [];
  if (entries.length === 0) {
    return;
  }
  if (!confirm(`Are you sure you want to delete the selected ${entries.length} item(s)? This action cannot be undone.`)) {
    return;
  }
  
  $('#avtt-file-picker #file-listing-section').append(build_combat_tracker_loading_indicator('Deleting files...'));

  const seenKeys = new Set();
  const payloadEntries = [];
  const addPayloadEntry = (key, size, isFolder) => {
    const normalized = avttNormalizeRelativePath(key);
    if (!normalized || seenKeys.has(normalized)) {
      return;
    }
    seenKeys.add(normalized);
    payloadEntries.push({
      key: normalized,
      size: Number(size) || 0,
      isFolder: Boolean(isFolder),
    });
  };

  for (const entry of entries) {
    if (!entry?.key) {
      continue;
    }
    addPayloadEntry(entry.key, entry.size, entry.isFolder);
    if (entry.isFolder) {
      const thumbnailFolderKey = avttGetThumbnailKeyFromRelative(entry.key);
      addPayloadEntry(thumbnailFolderKey, 0, true);
    } else if (avttShouldGenerateThumbnail(getFileExtension(entry.key))) {
      const thumbnailKey = avttGetThumbnailKeyFromRelative(entry.key);
      addPayloadEntry(thumbnailKey, 0, false);
    }
  }

  const payload = { keys: payloadEntries };
  payload.totalSize = entries.reduce(
    (sum, entry) => sum + (Number(entry?.size) || 0),
    0,
  );
  payload.objectCount = entries.length;

  try {
    const response = await fetch(`${AVTT_S3}?user=${window.PATREON_ID}&deleteFiles=true`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await response.json();
    if (!response.ok || !json.deleted) {
      throw new Error(json?.message || "Failed to delete file(s)");
    }
    for (const entry of entries) {
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
    avttAdjustCachedUsage(-json.usage.totalBytes, -json.usage.objectCount);
    refreshFiles(
      currentFolder,
      true,
      undefined,
      undefined,
      fileTypes,
      { useCache: true, revalidate: false },
    );
  } catch (error) {
    console.error("Failed to delete files", error);
    alert(error.message || "Failed to delete file(s).");
  }
}


const GET_FILE_FROM_S3_MAX_RETRIES = 5;
const GET_FILE_FROM_S3_BASE_DELAY_MS = 250;
const GET_FILE_FROM_S3_MAX_DELAY_MS = 4000;
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

async function processGetFileFromS3Queue() {
  if (isProcessingGetFileFromS3Queue) 
    return;
  
  isProcessingGetFileFromS3Queue = true;
  while (getFileFromS3Queue.length > 0) {
    const { originalName, cacheKey, sanitizedKey, resolve, reject } = getFileFromS3Queue.shift();
    try {
      const result = await fetchFileFromS3WithRetry(originalName, cacheKey, sanitizedKey);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }
  isProcessingGetFileFromS3Queue = false;
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
      window.avtt_file_urls[cacheKey] = {
        url: fileURL,
        expire: Date.now() + 3500000
      };
      if (sanitizedKey && sanitizedKey !== cacheKey) {
        window.avtt_file_urls[sanitizedKey] = {
          url: fileURL,
          expire: Date.now() + 3500000
        };
      }
      console.log("File found on S3: ", fileURL);
      return fileURL;
    } catch (error) {
      lastError = error;
      if (attempt >= GET_FILE_FROM_S3_MAX_RETRIES) {
        break;
      }
      const backoffDelay = Math.min(GET_FILE_FROM_S3_BASE_DELAY_MS * 2 ** (attempt - 1), GET_FILE_FROM_S3_MAX_DELAY_MS);
      await getFileFromS3Delay(backoffDelay);
    }
  }
  throw lastError || new Error("Failed to fetch file from S3");
}

async function getFileFromS3(fileName) {
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
    return getFileFromS3Pending.get(cacheKey);
  }

  const queuedPromise = new Promise((resolve, reject) => {
    // Avoid pushing duplicate queue items for the same cacheKey
    const alreadyQueued = getFileFromS3Queue.find((q) => q && q.cacheKey === cacheKey);
    if (!alreadyQueued) {
      getFileFromS3Queue.push({
        originalName,
        cacheKey,
        sanitizedKey,
        resolve,
        reject,
      });
    } else {
      // If already queued, hook up to the existing pending promise if present
      if (getFileFromS3Pending.has(cacheKey)) {
        const existing = getFileFromS3Pending.get(cacheKey);
        existing.then(resolve).catch(reject);
      } else {
        // fallback: still push (rare) to ensure this caller gets resolved
        getFileFromS3Queue.push({ originalName, cacheKey, sanitizedKey, resolve, reject });
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
  const { signal } = options;
  const url = await fetch(
    `${AVTT_S3}?user=${window.PATREON_ID}&filename=${encodeURIComponent(folderPath)}&list=true`,
    { signal },
  );
  const json = await url.json();
  const folderContents = json.folderContents || [];
  return folderContents;
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
        continue;
      }
      userSize += Number(file.Size) || 0;
      objectCount += 1;
    }
    avttPrimeListingCachesFromFullListing(folderContents);
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

  if (shouldUseCache) {
    avttUsageCache.pending = usagePromise;
  }

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
  const url = await fetch(
    `${AVTT_S3}?user=${window.PATREON_ID}&filename=${encodeURIComponent("")}&list=true&includeSubDirFiles=true`,
    { signal },
  );
  const json = await url.json();
  const folderContents = json.folderContents;

  return folderContents;
}
