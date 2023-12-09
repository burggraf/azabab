/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "sy1tel6mzli6fdu",
    "created": "2023-12-05 01:49:46.252Z",
    "updated": "2023-12-05 01:49:46.252Z",
    "name": "trivia_log_score",
    "type": "view",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "bpix38lm",
        "name": "correct",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "9zyaipjn",
        "name": "total",
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
      "query": "select user as id, sum(correct = 1) as correct,count(*) as total from trivia_log group by user;"
    }
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("sy1tel6mzli6fdu");

  return dao.deleteCollection(collection);
})
