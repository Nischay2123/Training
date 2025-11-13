// // --- START OF INDEXEDDB SCRIPT ---

//         const DB_NAME = 'MyWebAppDB';
//         const DB_VERSION = 2;
//         let db;
//         const logElement = document.getElementById('log');

//         // Helper function for UI logging
//         function logMessage(message, type = 'log') {
//             const now = new Date().toLocaleTimeString();
//             const logEntry = document.createElement('p');
//             logEntry.textContent = `[${now}] ${message}`;
//             logEntry.style.color = type === 'error' ? 'red' : (type === 'warn' ? 'orange' : 'black');
//             logElement.prepend(logEntry);
//             console[type](message);
//         }

//         // --- 1. Database Connection and Initialization ---

//         function openDatabase() {
//             const request = indexedDB.open(DB_NAME, DB_VERSION);

//             // 1.1. onupgradeneeded (Schema setup and versioning)
//             request.onupgradeneeded = (event) => {
//                 db = event.target.result;
                
//                 logMessage(`Database upgrade/initialization started. Old version: ${event.oldVersion}, New version: ${event.newVersion}`, 'warn');

//                 if (!db.objectStoreNames.contains('products')) {
//                     const store = db.createObjectStore('products', {
//                         keyPath: 'sku',
//                         autoIncrement: false
//                     });
                    
//                     store.createIndex('nameIndex', 'name', { unique: false });
//                     logMessage("Object Store 'products' created.");
//                 } else {
//                     logMessage("Object Store 'products' already exists.");
//                 }
//             };

//             // 1.2. onsuccess (Successful connection)
//             request.onsuccess = (event) => {
//                 db = event.target.result;
//                 logMessage("Database connection successful. Ready for transactions.");

//                 // Set up the listener for external version changes
//                 db.onversionchange = (e) => {
//                     db.close();
//                     logMessage(`Database forced upgrade by another tab (new version: ${e.newVersion}). Connection closed.`, 'warn');
//                     alert("Application must be refreshed to apply database updates.");
//                 };
//             };

//             // 1.3. onerror (Connection failure)
//             request.onerror = (event) => {
//                 logMessage("IndexedDB connection failed!", 'error');
//                 console.error("Error details:", event.target.error);
//             };

//             // 1.4. onblocked (Upgrade blocked by old connection)
//             request.onblocked = () => {
//                 logMessage("Database upgrade is BLOCKED by another open tab.", 'error');
//                 alert("Cannot upgrade the database. Please close all other open tabs using this application.");
//             };
//         }

//         // --- 2. Data Manipulation Function (Add) ---

//         function addProduct(productData) {
//             if (!db) {
//                 logMessage("Database not initialized yet.", 'error');
//                 return;
//             }

//             // 'readwrite' transaction is required
//             const transaction = db.transaction(['products'], 'readwrite');
//             const store = transaction.objectStore('products');
            
//             const addRequest = store.add(productData);

//             addRequest.onsuccess = () => {
//                 logMessage(`Product added successfully. SKU: ${productData.sku}`);
//             };

//             addRequest.onerror = (event) => {
//                 logMessage(`Failed to add product: ${event.target.error.name}`, 'error');
//                 if (event.target.error.name === "ConstraintError") {
//                     logMessage("The SKU already exists. Use a unique key.", 'error');
//                 }
//             };

//             transaction.oncomplete = () => {
//                 logMessage("Add transaction completed.");
//             };
//         }

//         // --- 3. UI Function (Reads inputs and calls addProduct) ---
//         // ADDON: This function bridges the HTML button click to the DB logic.
//         function addProductFromForm() {
//             const sku = document.getElementById('sku').value;
//             const name = document.getElementById('productName').value;
//             const price = parseFloat(document.getElementById('price').value);

//             if (!sku || !name || isNaN(price)) {
//                 alert("Please fill in all fields correctly.");
//                 return;
//             }

//             const newProduct = {
//                 sku: sku,
//                 name: name,
//                 price: price,
//                 timestamp: Date.now()
//             };

//             addProduct(newProduct);
//         }

//         // ADDON: This is the starting call that runs when the script loads
//         openDatabase();
        
//         // --- END OF INDEXEDDB SCRIPT ---






let db;

init();

async function init() {
  db = await idb.openDb('booksDb', 1, db => {
    db.createObjectStore('books', {keyPath: 'name'});
  });

  list();
}

async function list() {
  let tx = db.transaction('books');
  let bookStore = tx.objectStore('books');

  let books = await bookStore.getAll();

  if (books.length) {
    listElem.innerHTML = books.map(book => `<li>
        name: ${book.name}, price: ${book.price}
      </li>`).join('');
  } else {
    listElem.innerHTML = '<li>No books yet. Please add books.</li>'
  }


}

async function clearBooks() {
  let tx = db.transaction('books', 'readwrite');
  await tx.objectStore('books').clear();
  await list();
}

async function addBook() {
  let name = prompt("Book name?");
  let price = +prompt("Book price?");

  let tx = db.transaction('books', 'readwrite');

  try {
    await tx.objectStore('books').add({name, price});
    await list();
  } catch(err) {
    if (err.name == 'ConstraintError') {
      alert("Such book exists already");
      await addBook();
    } else {
      throw err;
    }
  }
}

window.addEventListener('unhandledrejection', event => {
  alert("Error: " + event.reason.message);
});