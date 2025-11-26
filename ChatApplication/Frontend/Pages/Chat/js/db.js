const dbName = "ChatApp";
const dbVersion = 1;
let db = null;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => {
            console.error("IDB Error:", event.target.error);
            reject("Could not open DB");
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains('conversations')) {
                database.createObjectStore("conversations", { keyPath: "_id" });
            }
            if (!database.objectStoreNames.contains('messages')) {
                const msgStore = database.createObjectStore("messages", { keyPath: "_id" });
                msgStore.createIndex("conversationId", "conversationId", { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("IndexedDB Opened Successfully");
            resolve(db);
        };
    });
}

async function getDB() {
    if (db) return db;
    return await openDB();
}

export async function saveConversations(serverConversations) {
    const database = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["conversations"], "readwrite");
        const store = transaction.objectStore("conversations");

        const request = store.getAllKeys();

        request.onsuccess = () => {
            const localIDs = request.result;

            if(serverConversations.length > 0) {
                const serverIDSet = new Set(serverConversations.map(c => c._id));

                localIDs.forEach(localId => {
                    if (!serverIDSet.has(localId)) {
                        console.log("Removing deleted chat from cache:", localId);
                        store.delete(localId);
                    }
                });
            }

            serverConversations.forEach(chat => {
                store.put(chat);
            });
        };

        transaction.oncomplete = () => resolve("Sync Complete");
        transaction.onerror = (e) => reject(e.target.error);
    });
}

export async function saveMessages(messages) {
    const database = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["messages"], "readwrite");
        const store = transaction.objectStore("messages");

        messages.forEach(msg => {
            if(msg._id && msg.conversationId) {
                store.put(msg);
            }
        });

        transaction.oncomplete = () => resolve("Messages saved");
        transaction.onerror = (e) => {
            console.log("Save Error:", e.target.error);
            reject(e);
        };
    });
}

export async function getLocalConversations() {
    const database = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["conversations"], "readonly"); 
        const store = transaction.objectStore("conversations");

        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result || []);
        };
        request.onerror = (event) => {
            console.log("Fetch Error:", event.target.error);
            reject(event.target.error);
        };
    });
}

export async function getLocalMessages(conversationId) {
    const database = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["messages"], "readonly");
        const store = transaction.objectStore("messages");

        const index = store.index("conversationId");
        const request = index.getAll(conversationId);

        request.onsuccess = (event) => {
            resolve(event.target.result || []);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}


export async function deleteMessage(messageId) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(["messages"], "readwrite");
        const store = transaction.objectStore("messages");
        store.delete(messageId);
        transaction.oncomplete = () => resolve("Deleted");
        transaction.onerror = (e) => reject(e.target.error);
    });
}


export async function clearDB() {
    const database = await getDB();
    database.close(); 
    
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.deleteDatabase("ChatApp");
        
        request.onsuccess = () => {
            console.log("Database cleared successfully");
            db = null; 
            resolve();
        };
        
        request.onerror = (e) => {
            console.error("Could not clear DB:", e);
            reject(e);
        };
    });
}