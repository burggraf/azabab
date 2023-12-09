/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "7xtjicr41661oxr",
    "created": "2023-12-04 13:54:44.247Z",
    "updated": "2023-12-04 13:54:44.247Z",
    "name": "trivia_total",
    "type": "view",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "zawwbyk8",
        "name": "count",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {
      "query": "select 1 as id, count(*) as count from trivia;"
    }
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("7xtjicr41661oxr");

  return dao.deleteCollection(collection);
})
