import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const DB_FILE = new URL('../db.json', import.meta.url);
const DEFAULT_DATA = {
  usuarios: [],
  productos: [],
  carritos: [],
  pedidos: []
};

const ensureDataFile = async () => {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
  }
};

const loadData = async () => {
  await ensureDataFile();
  const json = await fs.readFile(DB_FILE, 'utf-8');
  return JSON.parse(json);
};

const saveData = async (data) => {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const matchesQuery = (item, query) => {
  return Object.entries(query).every(([key, value]) => {
    if (value === undefined) return true;
    if (key === 'id' || key === '_id') {
      return item.id === value || item._id === value;
    }
    return item[key] === value;
  });
};

const sanitize = (object) => {
  const result = {};
  for (const [key, value] of Object.entries(object)) {
    if (typeof value !== 'function') {
      result[key] = value;
    }
  }
  return result;
};

const assignIdAlias = (item) => {
  if (!item) return item;
  if (item.id && !item._id) item._id = item.id;
  if (item._id && !item.id) item.id = item._id;
  return item;
};

const attachSave = (collection, item) => {
  if (!item) return null;
  assignIdAlias(item);
  item.save = async function () {
    const data = await loadData();
    const index = data[collection].findIndex((entry) => entry.id === this.id);
    const sanitized = sanitize(this);
    assignIdAlias(sanitized);
    if (index === -1) {
      data[collection].push(sanitized);
    } else {
      data[collection][index] = sanitized;
    }
    await saveData(data);
    return attachSave(collection, sanitized);
  };
  return item;
};

const attachCollectionMethods = (collection) => ({
  async countDocuments(query = {}) {
    const data = await loadData();
    return data[collection].filter((item) => matchesQuery(item, query)).length;
  },

  async find(query = {}) {
    const data = await loadData();
    return data[collection]
      .filter((item) => matchesQuery(item, query))
      .map((item) => attachSave(collection, { ...item }));
  },

  async findOne(query = {}) {
    const data = await loadData();
    const item = data[collection].find((entry) => matchesQuery(entry, query));
    return attachSave(collection, item ? { ...item } : null);
  },

  async findById(id) {
    return this.findOne({ id });
  },

  async create(document) {
    const data = await loadData();
    const now = new Date().toISOString();
    const item = assignIdAlias({
      id: uuidv4(),
      ...document,
      createdAt: document.createdAt || now,
      updatedAt: document.updatedAt || now
    });
    data[collection].push(item);
    await saveData(data);
    return attachSave(collection, item);
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const data = await loadData();
    const index = data[collection].findIndex((item) => item.id === id);
    if (index === -1) return null;

    const current = data[collection][index];
    const next = { ...current };

    if (update.$inc) {
      Object.entries(update.$inc).forEach(([key, value]) => {
        next[key] = (next[key] || 0) + value;
      });
    }

    Object.entries(update).forEach(([key, value]) => {
      if (key === '$inc') return;
      next[key] = value;
    });

    if (options.new || update.updatedAt) {
      next.updatedAt = update.updatedAt || new Date().toISOString();
    }

    assignIdAlias(next);
    data[collection][index] = next;
    await saveData(data);
    return attachSave(collection, next);
  }
});

export const usuariosDB = attachCollectionMethods('usuarios');
export const productosDB = attachCollectionMethods('productos');
export const carritosDB = attachCollectionMethods('carritos');
export const pedidosDB = attachCollectionMethods('pedidos');
export const connectDB = async () => {
  await ensureDataFile();
};
