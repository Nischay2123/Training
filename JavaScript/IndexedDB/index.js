const DB_NAME = "TestDB";
const STORE_NAME = "peoples";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function savePerson(person) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(person);
    request.onsuccess = () => resolve("Person saved");
    request.onerror = (err) => reject(err.target.error);
  });
}

async function getAllPeople() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deletePerson(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve("Deleted");
    request.onerror = (err) => reject(err.target.error);
  });
}

const form = document.getElementById("myForm");
const getAllBtn = document.getElementById("getAll");
const peopleList = document.getElementById("peoples");

function renderPeople(people) {
  peopleList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  people.forEach((person) => {
    const li = document.createElement("li");
    li.textContent = `${person.id} - ${person.name} (${person.age})`;
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.marginLeft = "10px";
    delBtn.style.marginBottom = "5px";
    delBtn.addEventListener("click", async () => {
      await deletePerson(person.id);
      loadAllPeople();
    });
    li.appendChild(delBtn);
    fragment.appendChild(li);
  });
  peopleList.appendChild(fragment);
}

async function loadAllPeople() {
  try {
    const people = await getAllPeople();
    renderPeople(people);
  } catch (err) {
    console.error(err);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById("id").value);
  const name = document.getElementById("name").value;
  const age = parseInt(document.getElementById("age").value);
  const person = { id, name, age };
  try {
    await savePerson(person);
    form.reset();
    loadAllPeople();
  } catch (err) {
    console.error(err);
  }
});

getAllBtn.addEventListener("click", (e) => {
  e.preventDefault();
  loadAllPeople();
});

loadAllPeople();
