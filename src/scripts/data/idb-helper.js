import CONFIG from "../config";

const { DATABASE_NAME, DATABASE_VERSION, OBJECT_STORE_NAME } = CONFIG;

/**
 * Initialize IndexedDB
 * @returns {Promise} - Promise object represents the database connection
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      reject(new Error("Your browser doesn't support IndexedDB"));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onerror = (event) => {
      reject(new Error("Error opening IndexedDB"));
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        const objectStore = db.createObjectStore(OBJECT_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Create indexes for searching
        objectStore.createIndex("id", "id", { unique: true });
        objectStore.createIndex("createdAt", "createdAt", { unique: false });
        objectStore.createIndex("type", "type", { unique: false });
        objectStore.createIndex("storyId", "storyId", { unique: false });
        objectStore.createIndex("isArchived", "isArchived", { unique: false });
      }
    };
  });
};

/**
 * Get all stories from IndexedDB
 * @returns {Promise} - Promise object represents the stories
 */
const getAllStories = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      const request = objectStore.getAll();

      request.onerror = (event) => {
        reject(new Error("Error getting stories from IndexedDB"));
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
    });
  } catch (error) {
    console.error("Error in getAllStories:", error);
    return [];
  }
};

/**
 * Get a story by ID from IndexedDB
 * @param {number} id - The story ID
 * @returns {Promise} - Promise object represents the story
 */
const getStoryById = async (id) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      const request = objectStore.get(id);

      request.onerror = (event) => {
        reject(new Error(`Error getting story with ID ${id} from IndexedDB`));
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
    });
  } catch (error) {
    console.error(`Error in getStoryById for ID ${id}:`, error);
    return null;
  }
};

/**
 * Save a story to IndexedDB
 * @param {Object} story - The story object to save
 * @returns {Promise} - Promise object represents the saved story ID
 */
const saveStory = async (story) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);

      // Add timestamp if not present
      if (!story.createdAt) {
        story.createdAt = new Date().toISOString();
      }

      const request = objectStore.add(story);

      request.onerror = (event) => {
        reject(new Error("Error saving story to IndexedDB"));
      };

      request.onsuccess = (event) => {
        resolve(event.target.result); // Returns the generated ID
      };
    });
  } catch (error) {
    console.error("Error in saveStory:", error);
    throw error;
  }
};

/**
 * Delete a story from IndexedDB
 * @param {number} id - The story ID to delete
 * @returns {Promise} - Promise object represents the deletion operation
 */
const deleteStory = async (id) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      const request = objectStore.delete(id);

      request.onerror = (event) => {
        reject(new Error(`Error deleting story with ID ${id} from IndexedDB`));
      };

      request.onsuccess = (event) => {
        resolve(true);
      };
    });
  } catch (error) {
    console.error(`Error in deleteStory for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Clear all stories from IndexedDB
 * @returns {Promise} - Promise object represents the clear operation
 */
const clearAllStories = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      const request = objectStore.clear();

      request.onerror = (event) => {
        reject(new Error("Error clearing stories from IndexedDB"));
      };

      request.onsuccess = (event) => {
        resolve(true);
      };
    });
  } catch (error) {
    console.error("Error in clearAllStories:", error);
    throw error;
  }
};

/**
 * Archive a story for offline viewing
 * @param {Object} story - The story object to archive
 * @returns {Promise} - Promise object represents the archived story ID
 */
const archiveStory = async (story) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, "readwrite");
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);

      // Check if story is already archived
      const index = objectStore.index("storyId");
      const request = index.getAll(story.id);

      request.onsuccess = (event) => {
        const existingStories = event.target.result;

        // If story is already archived, return its ID
        if (existingStories && existingStories.length > 0) {
          resolve(existingStories[0].id);
          return;
        }

        // Prepare story for archiving
        const archivedStory = {
          storyId: story.id,
          name: story.name || "Archived Story",
          description: story.description || "",
          photoUrl: story.photoUrl || "",
          createdAt: story.createdAt || new Date().toISOString(),
          lat: story.lat || null,
          lon: story.lon || null,
          type: "archived",
          isArchived: true,
          archivedAt: new Date().toISOString(),
        };

        // Save to IndexedDB
        const saveRequest = objectStore.add(archivedStory);

        saveRequest.onerror = () => {
          reject(new Error("Error archiving story to IndexedDB"));
        };

        saveRequest.onsuccess = (event) => {
          resolve(event.target.result);
        };
      };

      request.onerror = () => {
        reject(new Error("Error checking if story is already archived"));
      };
    });
  } catch (error) {
    console.error("Error in archiveStory:", error);
    throw error;
  }
};

/**
 * Get all archived stories from IndexedDB
 * @returns {Promise} - Promise object represents the archived stories
 */
const getArchivedStories = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, "readonly");
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);

      // Get all stories and filter for archived ones
      const request = objectStore.getAll();

      request.onerror = () => {
        reject(new Error("Error getting archived stories from IndexedDB"));
      };

      request.onsuccess = (event) => {
        // Filter for stories with type "archived" or isArchived flag
        const allStories = event.target.result || [];
        const archivedStories = allStories.filter(
          (story) => story.type === "archived" || story.isArchived === true
        );
        resolve(archivedStories);
      };
    });
  } catch (error) {
    console.error("Error in getArchivedStories:", error);
    return [];
  }
};

export {
  openDB,
  getAllStories,
  getStoryById,
  saveStory,
  deleteStory,
  clearAllStories,
  archiveStory,
  getArchivedStories,
};
