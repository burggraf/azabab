/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("fdqy49fsc4sfs6w");

  return dao.deleteCollection(collection);
}, (db) => {
  const collection = new Collection({
    "id": "fdqy49fsc4sfs6w",
    "created": "2023-12-02 15:48:19.407Z",
    "updated": "2023-12-03 14:49:33.821Z",
    "name": "lobby",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "pp0h5iu9",
        "name": "user",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "45xuvtin",
        "name": "state",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_ye7rxky` ON `lobby` (`user`)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "user = user.id",
    "updateRule": "user = user.id",
    "deleteRule": "user = user.id",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
})
