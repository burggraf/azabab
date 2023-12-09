/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "71ig7iys6y512y4",
    "created": "2023-12-04 02:21:59.069Z",
    "updated": "2023-12-04 02:21:59.069Z",
    "name": "userstate",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "z6eeimnc",
        "name": "user",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "h2lxikkv",
        "name": "state",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_OQMyCAt` ON `userstate` (`user`)"
    ],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("71ig7iys6y512y4");

  return dao.deleteCollection(collection);
})
