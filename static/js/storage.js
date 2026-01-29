export const getDB = () =>
  JSON.parse(localStorage.getItem('inv_db'))
  ||
  { stock: [], archived: [], wasted: [] };

export const saveDB = (data) => localStorage.setItem('inv_db', JSON.stringify(data));

export const saveDraft = (draft) => localStorage.setItem('inv_draft', JSON.stringify(draft));
export const getDraft = () => JSON.parse(localStorage.getItem('inv_draft')) || {};

export const mergeLogic = (local, imported) => {
    const mergeArray = (arr1 = [], arr2 = []) => {
        const map = new Map();
        [...arr1, ...arr2].forEach(item => {
            const key = item.barcode || item.id;
            // Priorité au plus récent (timestamp updatedAt)
            if (!map.has(key) || item.updatedAt > map.get(key).updatedAt) {
                map.set(key, item);
            }
        });
        return Array.from(map.values());
    };

    return {
        stock: mergeArray(local.stock, imported.stock),
        archived: mergeArray(local.archived, imported.archived),
        wasted: mergeArray(local.wasted, imported.wasted)
    };
};